/** The part of a datapoint definition of `requiredScriptDataPoints` this check reads */
export interface DatapointRequirement {
    /** true: the channel role does not work without this datapoint */
    required: boolean;
}

/**
 * Decides whether the channel of a page item is a problem before its single datapoints are checked.
 *
 * - no definition for the role: problem, the adapter does not know the role
 * - channel without any state: problem only if the role needs at least one datapoint. A role whose
 *   datapoints are all optional works without states, e.g. `level.timer` is then the internal timer.
 *
 * @param dpDef datapoint definitions of the channel role (`requiredScriptDataPoints[role].data`)
 * @param stateCount number of states directly below the channel
 * @returns true if the channel can not be used as it is
 */
export function isChannelStatesProblem(
    dpDef: Readonly<Record<string, DatapointRequirement>> | undefined,
    stateCount: number,
): boolean {
    if (!dpDef) {
        return true;
    }
    if (stateCount > 0) {
        return false;
    }
    return Object.values(dpDef).some(dp => dp.required);
}
