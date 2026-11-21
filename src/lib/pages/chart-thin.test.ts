import { expect } from 'chai';
import { linePointsBytes, thinLinePoints, type LinePoint } from './chart-thin';

const toPoints = (ys: number[]): LinePoint[] => ys.map((y, i) => ({ x: i * 10, y }));

describe('lib/pages - chart-thin', () => {
    it('removes the point closest to the line of its neighbours first: the 5s, then the 1s', () => {
        const points = toPoints([0, 1, 5, 10, 5, 1, 0]);
        const bytes = linePointsBytes(points);

        // one point less: the left 5 (distance 0.5 to the line 1 -> 10)
        const one = thinLinePoints(points, bytes - 1);
        expect(one.map(p => p.y)).to.deep.equal([0, 1, 10, 5, 1, 0]);

        // two points less: the other 5, the 1s stay
        const two = thinLinePoints(points, linePointsBytes(one) - 1);
        expect(two.map(p => p.y)).to.deep.equal([0, 1, 10, 1, 0]);

        // three points less: now one of the 1s falls (both have the same distance)
        const three = thinLinePoints(points, linePointsBytes(two) - 1);
        expect(three.map(p => p.y).sort((a, b) => a - b)).to.deep.equal([0, 0, 1, 10]);
    });

    it('removes equal neighbours (distance 0) first', () => {
        const points = toPoints([3, 7, 7, 7, 1, 9, 2]);
        const thinned = thinLinePoints(points, linePointsBytes(points) - 1);
        expect(thinned.map(p => p.y)).to.deep.equal([3, 7, 7, 1, 9, 2]);
    });

    it('keeps first, last, minimum and maximum even with a budget of zero', () => {
        const points = toPoints([5, 6, 2, 8, 12, 7, 4, 6]);
        const thinned = thinLinePoints(points, 0);
        expect(thinned).to.deep.equal([
            { x: 0, y: 5 },
            { x: 20, y: 2 },
            { x: 40, y: 12 },
            { x: 70, y: 6 },
        ]);
    });

    it('changes nothing within the budget and does not modify the input', () => {
        const points = toPoints([0, 1, 5, 10, 5, 1, 0]);
        const copy = structuredClone(points);
        expect(thinLinePoints(points, linePointsBytes(points))).to.equal(points);
        thinLinePoints(points, 0);
        expect(points).to.deep.equal(copy);
    });

    it('keeps a local peak as long as points that are no local extremum can be removed', () => {
        const points = toPoints([0, 0, 1, 9, 10, 9, 1, 20, 0]);
        const steps: number[][] = [];
        let current = points;
        for (;;) {
            const next = thinLinePoints(points, linePointsBytes(current) - 1);
            if (next.length === current.length) {
                break;
            }
            current = next;
            steps.push(current.map(p => p.y));
        }
        expect(steps).to.deep.equal([
            [0, 1, 9, 10, 9, 1, 20, 0],
            [0, 1, 10, 9, 1, 20, 0],
            [0, 1, 10, 1, 20, 0],
            // only local extrema left besides the protected points: the 10 and the valley 1
            [0, 10, 1, 20, 0],
            [0, 1, 20, 0],
            [0, 20, 0],
        ]);
    });

    it('keeps the peak of 1,9,10,9,1', () => {
        const points = toPoints([1, 9, 10, 9, 1]);
        const one = thinLinePoints(points, linePointsBytes(points) - 1);
        expect(one.map(p => p.y)).to.deep.equal([1, 10, 9, 1]);
        const two = thinLinePoints(points, linePointsBytes(one) - 1);
        expect(two.map(p => p.y)).to.deep.equal([1, 10, 1]);
    });

    it('removes one value of a plateau first, the remaining one is then a peak', () => {
        const points = toPoints([0, 9, 10, 10, 9, 3, 20, 0]);
        const one = thinLinePoints(points, linePointsBytes(points) - 1);
        expect(one.filter(p => p.y === 10)).to.have.length(1);
        // the remaining 10 is a peak now: the non-extrema 9s fall before it
        const two = thinLinePoints(points, linePointsBytes(one) - 1);
        const three = thinLinePoints(points, linePointsBytes(two) - 1);
        expect(three.map(p => p.y)).to.deep.equal([0, 10, 3, 20, 0]);
    });

    it('still reaches the budget with noise where every inner point is a local extremum', () => {
        const ys: number[] = [];
        for (let i = 0; i < 60; i++) {
            ys.push(i % 2 === 0 ? 212 : 213);
        }
        const points = toPoints(ys);
        const budget = Math.floor(linePointsBytes(points) / 3);
        const thinned = thinLinePoints(points, budget);
        expect(linePointsBytes(thinned)).to.be.at.most(budget);
        expect(thinned[0]).to.deep.equal(points[0]);
        expect(thinned[thinned.length - 1]).to.deep.equal(points[59]);
    });

    it('brings the 24 h temperature chart of #925 (289 points, 20.0 … 21.7 °C) to at most 1000 bytes', () => {
        const ys: number[] = [];
        for (let i = 0; i <= 288; i++) {
            // slow daily curve plus a little noise, deterministic
            ys.push(Math.round(208 + 8 * Math.sin((i / 288) * 2 * Math.PI) + ((i * 7919) % 5) - 2));
        }
        const points: LinePoint[] = ys.map((y, i) => ({ x: i * 5, y }));
        const ticks = '0^01:06+120+240^05:06+360+480^09:06+600+720^13:06+840+960^17:06+1080+1200^21:06+1320+1390^00:16';
        const head = `entityUpd~Schlafzimmer~button~bPrev~~65535~~~button~bNext~~65535~~~43023~°C~190:200:210:220~${ticks}`;
        const full = head + points.map(p => `~${p.x}:${p.y}`).join('');
        expect(Buffer.byteLength(full, 'utf8')).to.be.greaterThan(2000);

        const thinned = thinLinePoints(points, 1000 - Buffer.byteLength(head, 'utf8'));
        const message = head + thinned.map(p => `~${p.x}:${p.y}`).join('');

        expect(Buffer.byteLength(message, 'utf8')).to.be.at.most(1000);
        expect(Buffer.byteLength(message, 'utf8')).to.be.greaterThan(980);
        expect(thinned[0]).to.deep.equal(points[0]);
        expect(thinned[thinned.length - 1]).to.deep.equal(points[288]);
        expect(Math.min(...thinned.map(p => p.y))).to.equal(Math.min(...ys));
        expect(Math.max(...thinned.map(p => p.y))).to.equal(Math.max(...ys));
    });
});
