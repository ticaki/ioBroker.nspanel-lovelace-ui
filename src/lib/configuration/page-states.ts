import type { StateNodeInfo } from '../types/adminShareConfig';

/** A state or channel a page reads its values from. */
export interface PageStateNode {
    /** Channel path, or the state id itself when the item uses a single state. */
    id: string;
    /** True when the id is a channel several states live under. */
    isChannel: boolean;
    /** Roles of the page items working with it, e.g. `button` or `shutter`. */
    roles: string[];
    /** Types of those page items, e.g. `button` or `switch`. */
    types: string[];
    /** States used below a channel, relative to it - empty for a single state. */
    states: string[];
    /** Captions the page items give it. */
    headlines: string[];
    /** Icons shown while the value is true. */
    iconsTrue: string[];
    /** Icons shown while the value is false. */
    iconsFalse: string[];
}

/** Shortest path that still names something specific: adapter, instance and one segment. */
const minChannelSegments = 3;

/**
 * All state ids below a configuration object.
 *
 * @param node Object to walk.
 * @param found Set the ids are added to.
 */
function collectStateIds(node: unknown, found: Set<string>): void {
    if (node === null || typeof node !== 'object') {
        return;
    }
    for (const [key, value] of Object.entries(node)) {
        if (key === 'dp' && typeof value === 'string' && value) {
            found.add(value);
        } else {
            collectStateIds(value, found);
        }
    }
}

/**
 * Constant value of a configuration field, `undefined` when it is read from a state.
 *
 * @param field Field of a page item configuration.
 * @returns The constant, if the field carries one.
 */
function constOf(field: unknown): string | undefined {
    if (!field || typeof field !== 'object') {
        return undefined;
    }
    const item = field as { type?: unknown; constVal?: unknown };
    return item.type === 'const' && typeof item.constVal === 'string' ? item.constVal : undefined;
}

/**
 * Longest path all ids share, cut at a segment boundary.
 *
 * @param ids State ids, at least one.
 * @returns The shared path, empty when the ids have less than {@link minChannelSegments} in common.
 */
function commonChannel(ids: string[]): string {
    const segments = ids[0].split('.');
    let shared = segments.length;
    for (const id of ids.slice(1)) {
        const other = id.split('.');
        let i = 0;
        while (i < shared && i < other.length && segments[i] === other[i]) {
            i++;
        }
        shared = i;
    }
    return shared >= minChannelSegments ? segments.slice(0, shared).join('.') : '';
}

/**
 * An empty node for a state nothing further is known about.
 *
 * @param id State or channel id.
 * @param isChannel Whether the id names a channel.
 * @returns The node.
 */
export function emptyStateNode(id: string, isChannel: boolean): PageStateNode {
    return { id, isChannel, roles: [], types: [], states: [], headlines: [], iconsTrue: [], iconsFalse: [] };
}

/** A page item as far as this module cares: its data plus how the panel uses it. */
export interface PageStateSource {
    data?: Record<string, any> | null;
    /** Role and type as the configuration carries them - anything but a string is ignored. */
    role?: unknown;
    type?: unknown;
}

/**
 * The states and channels a page works with, one entry per page item.
 *
 * An item that reads a whole channel - either through `dpInit` or because its fields point into the
 * same folder - is reported as that channel; an item using a single state is reported as that state.
 * Items whose states have nothing in common are reported state by state. Entries are deduplicated:
 * two items on the same channel share one node.
 *
 * Runs on the configuration after `Page.init()`, where the `dpInit` and enum lookups have been
 * resolved into concrete state ids.
 *
 * @param sources `data` objects of the page items, and of the page itself; missing entries are skipped.
 * @returns One entry per distinct channel or state, in the order they were found.
 */
export function collectPageStates(sources: readonly (PageStateSource | undefined | null)[]): PageStateNode[] {
    const nodes = new Map<string, PageStateNode>();
    const addTo = (list: string[], value: unknown): void => {
        if (typeof value === 'string' && value && !list.includes(value)) {
            list.push(value);
        }
    };
    const add = (id: string, isChannel: boolean, source: PageStateSource, used: string[]): void => {
        let node = nodes.get(id);
        if (!node) {
            node = emptyStateNode(id, isChannel);
            nodes.set(id, node);
        }
        // A channel stays a channel even when another item uses only one of its states
        node.isChannel = node.isChannel || isChannel;
        addTo(node.roles, source.role);
        addTo(node.types, source.type);
        addTo(node.headlines, constOf(source.data?.headline));
        addTo(node.iconsTrue, constOf(source.data?.icon?.true?.value));
        addTo(node.iconsFalse, constOf(source.data?.icon?.false?.value));
        for (const state of used) {
            addTo(node.states, state);
        }
    };

    for (const source of sources) {
        if (!source?.data) {
            continue;
        }
        const found = new Set<string>();
        collectStateIds(source.data, found);
        const ids = [...found];
        if (ids.length === 0) {
            continue;
        }
        if (ids.length === 1) {
            add(ids[0], false, source, []);
            continue;
        }
        const channel = commonChannel(ids);
        if (channel) {
            add(
                channel,
                true,
                source,
                ids.map(id => id.slice(channel.length + 1)),
            );
        } else {
            for (const id of ids) {
                add(id, false, source, []);
            }
        }
    }
    return [...nodes.values()];
}

/**
 * Merges what is known about a state node with another item using it.
 *
 * A channel can be used by several page items and by several pages; each of them contributes its
 * role, its type and the states it touches.
 *
 * @param known What was collected so far, if anything.
 * @param state Node data of the item being added.
 * @returns The merged information.
 */
export function mergeStateInfo(known: StateNodeInfo | undefined, state: PageStateNode): StateNodeInfo {
    const merged: StateNodeInfo = {
        roles: [...(known?.roles ?? [])],
        types: [...(known?.types ?? [])],
        states: [...(known?.states ?? [])],
        headlines: [...(known?.headlines ?? [])],
        iconsTrue: [...(known?.iconsTrue ?? [])],
        iconsFalse: [...(known?.iconsFalse ?? [])],
    };
    for (const [target, values] of [
        [merged.roles, state.roles],
        [merged.types, state.types],
        [merged.states, state.states],
        [merged.headlines, state.headlines],
        [merged.iconsTrue, state.iconsTrue],
        [merged.iconsFalse, state.iconsFalse],
    ] as [string[], string[]][]) {
        for (const value of values) {
            if (value && !target.includes(value)) {
                target.push(value);
            }
        }
    }
    return merged;
}
