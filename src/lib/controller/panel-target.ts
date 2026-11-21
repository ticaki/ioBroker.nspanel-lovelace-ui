/** what a panel needs to be found by a sendTo */
export interface PanelTargetCandidate {
    name: string;
    friendlyName?: string;
    topic: string;
}

/**
 * The panels a sendTo addresses with its field `panel`: a name, a friendlyName or an MQTT topic, or an array of them.
 * Without `panel` (empty) all panels.
 *
 * @param panels all panels
 * @param target the field `panel` of the message
 * @returns the panels found (in the order of `target`) and the entries that matched no panel
 */
export function resolvePanelTargets<P extends PanelTargetCandidate>(
    panels: readonly P[],
    target: unknown,
): { panels: P[]; missing: string[] } {
    if (!target) {
        return { panels: [...panels], missing: [] };
    }
    const found: P[] = [];
    const missing: string[] = [];
    for (const t of Array.isArray(target) ? target : [target]) {
        const panel = panels.find(p => p.name === t || p.friendlyName === t || p.topic === t);
        if (panel) {
            found.push(panel);
        } else {
            missing.push(String(t));
        }
    }
    return { panels: found, missing };
}

/**
 * A web clone shares name and internal states with its hardware panel - a message goes out once per name.
 *
 * @param panels the panels
 * @returns their names without duplicates
 */
export function uniquePanelNames(panels: readonly PanelTargetCandidate[]): string[] {
    return [...new Set(panels.map(p => p.name))];
}
