/**
 * Selection of an alias channel in the object browser (EntitySelector): which channels are offered and how a picked
 * id becomes the id of its channel. Shared by the page item dialog (ChannelConfigDialog) and the slots of the device
 * page (DevicePageSection). Pure functions.
 */

/** id of a channel -> its common.role, only channels with a role the adapter knows */
export type ChannelRoleMap = Record<string, string>;

/**
 * @param obj an object
 * @returns its common.role, undefined without one
 */
export function roleOfObject(obj: unknown): string | undefined {
    if (!obj || typeof obj !== 'object' || !('common' in obj)) {
        return undefined;
    }
    const common: unknown = obj.common;
    if (!common || typeof common !== 'object' || !('role' in common)) {
        return undefined;
    }
    return typeof common.role === 'string' ? common.role : undefined;
}

/**
 * The channels with a role of the list.
 *
 * @param objects the channel objects (object view `channel`)
 * @param roles the roles that count
 * @returns id -> role
 */
export function channelRolesOf(
    objects: Record<string, unknown> | null | undefined,
    roles: readonly string[],
): ChannelRoleMap {
    const out: ChannelRoleMap = {};
    for (const [id, obj] of Object.entries(objects ?? {})) {
        const role = roleOfObject(obj);
        if (role !== undefined && roles.includes(role)) {
            out[id] = role;
        }
    }
    return out;
}

/**
 * @param channelIds the channels offered
 * @param id an id
 * @returns true for one of the channels and everything below it
 */
export function isInChannels(channelIds: readonly string[], id: string): boolean {
    return channelIds.some(chId => id === chId || id.startsWith(`${chId}.`));
}

/**
 * Reduces a picked id to the longest channel it lies in.
 *
 * @param channelIds the channels offered
 * @param id the picked id
 * @returns the id of the channel, the id itself when it lies in none
 */
export function channelIdOf(channelIds: readonly string[], id: string): string {
    let best = '';
    for (const chId of channelIds) {
        if ((id === chId || id.startsWith(`${chId}.`)) && chId.length > best.length) {
            best = chId;
        }
    }
    return best || id;
}
