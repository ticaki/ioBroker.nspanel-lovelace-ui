/**
 * Thinning of the line chart points so that the entityUpd fits the display (issue #925).
 *
 * The points travel as `~x:y` in the message. If there are too many of them (24 h on a 5-minute grid = 289 points),
 * the message exceeds what the display can receive and is dropped. We then remove points one by one,
 * always the one that changes the drawn line least (Visvalingam-like, vertical distance only):
 * the vertical distance of the point to the straight line between its two neighbours at its x position.
 * x (minutes) and y (scaled value) have different units, so no Euclidean distance.
 *
 * Never removed: the first and the last point (the panel takes the x range from the points) and the global
 * minimum and maximum of y (the y ticks were computed from all values).
 */

/** one point of the line chart: x in minutes, y as sent (scaled integer) */
export type LinePoint = {
    x: number;
    y: number;
};

/**
 * Bytes of the points in the message: every point is sent as `~x:y`.
 *
 * @param points the points
 */
export function linePointsBytes(points: LinePoint[]): number {
    let bytes = 0;
    for (const p of points) {
        bytes += pointBytes(p);
    }
    return bytes;
}

/**
 * Bytes of one point as `~x:y`.
 *
 * @param p the point
 */
function pointBytes(p: LinePoint): number {
    return Buffer.byteLength(`~${p.x}:${p.y}`, 'utf8');
}

/**
 * Vertical distance of `p` to the straight line from `left` to `right` at the x position of `p`.
 *
 * @param left left neighbour
 * @param p the point
 * @param right right neighbour
 */
function verticalDistance(left: LinePoint, p: LinePoint, right: LinePoint): number {
    const dx = right.x - left.x;
    const lineY = dx === 0 ? (left.y + right.y) / 2 : left.y + ((right.y - left.y) * (p.x - left.x)) / dx;
    return Math.abs(p.y - lineY);
}

/**
 * Removes points until their bytes (as `~x:y` each) fit the budget. Below the budget the input is returned
 * unchanged (same array). Pure, the input is not modified.
 * If the protected points alone exceed the budget, only they remain.
 *
 * @param points points in x order
 * @param budgetBytes maximum bytes of all points together
 */
export function thinLinePoints(points: LinePoint[], budgetBytes: number): LinePoint[] {
    let bytes = linePointsBytes(points);
    if (bytes <= budgetBytes || points.length <= 2) {
        return points;
    }
    let minIndex = 0;
    let maxIndex = 0;
    for (let i = 1; i < points.length; i++) {
        if (points[i].y < points[minIndex].y) {
            minIndex = i;
        }
        if (points[i].y > points[maxIndex].y) {
            maxIndex = i;
        }
    }
    const lastIndex = points.length - 1;
    const result: LinePoint[] = points.slice();
    const fixed: boolean[] = points.map((_p, i) => i === 0 || i === lastIndex || i === minIndex || i === maxIndex);
    const distances: number[] = result.map((p, i) =>
        fixed[i] ? Infinity : verticalDistance(result[i - 1], p, result[i + 1]),
    );

    while (bytes > budgetBytes) {
        let best = -1;
        for (let i = 1; i < result.length - 1; i++) {
            if (distances[i] !== Infinity && (best === -1 || distances[i] < distances[best])) {
                best = i;
            }
        }
        if (best === -1) {
            break;
        }
        bytes -= pointBytes(result[best]);
        result.splice(best, 1);
        distances.splice(best, 1);
        fixed.splice(best, 1);
        // the former neighbours are now at best - 1 and best
        for (const i of [best - 1, best]) {
            if (!fixed[i]) {
                distances[i] = verticalDistance(result[i - 1], result[i], result[i + 1]);
            }
        }
    }
    return result;
}
