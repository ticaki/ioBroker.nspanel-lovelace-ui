/**
 * Assignment of a panel setup (admin, `nsPanelInitStep1`) to an entry of the adapter configuration.
 */

/** The fields of a configured panel that the assignment needs */
export interface PanelSetupEntry {
    /** id of the panel - for Tasmota panels the cleaned MAC address */
    id: string;
    /** MQTT topic */
    topic: string;
    /** name of the panel - its configuration script is named after it */
    name?: string;
    /** missing = Tasmota panel */
    kind?: 'tasmota' | 'web';
}

/** Result of `matchPanelForSetup` */
export type PanelSetupMatch =
    /** the device is already configured at `index` and gets updated */
    | { isNew: false; index: number }
    /** the device is not configured yet */
    | { isNew: true; index: -1 }
    /** the requested topic or name belongs to another entry - nothing may be sent to the device */
    | { error: 'sendToTopicInUse' | 'sendToNameInUse'; conflictIndex: number };

/**
 * Finds the configured entry of the device being set up via its MAC address.
 *
 * Name, topic and IP of a found entry may change. The requested topic and the requested name must not belong to
 * another entry (another id, or any web panel). Names are compared after `normalizeName` - two names that give the
 * same configuration script collide. With several Tasmota entries of the same MAC the first one wins.
 *
 * @param panels - the configured panels
 * @param macId - the cleaned MAC address of the device (`cleandp(StatusNET.Mac)`)
 * @param topic - the requested MQTT topic
 * @param name - the requested name of the panel
 * @param normalizeName - maps a name to the value that has to be unique (e.g. the id of the configuration script)
 * @returns the entry to update, a new panel or the conflict (topic before name)
 */
export function matchPanelForSetup(
    panels: readonly PanelSetupEntry[],
    macId: string,
    topic: string,
    name: string,
    normalizeName: (name: string) => string,
): PanelSetupMatch {
    const isSameDevice = (p: PanelSetupEntry): boolean => p.kind !== 'web' && p.id === macId;
    const conflictIndex = panels.findIndex(p => p.topic === topic && !isSameDevice(p));
    if (conflictIndex !== -1) {
        return { error: 'sendToTopicInUse', conflictIndex };
    }
    const wanted = normalizeName(name);
    const nameConflictIndex = panels.findIndex(p => !!p.name && !isSameDevice(p) && normalizeName(p.name) === wanted);
    if (nameConflictIndex !== -1) {
        return { error: 'sendToNameInUse', conflictIndex: nameConflictIndex };
    }
    const index = panels.findIndex(isSameDevice);
    return index === -1 ? { isNew: true, index: -1 } : { isNew: false, index };
}

/**
 * Indexes of the entries whose id is already used by an earlier entry - only the first entry of an id may run.
 *
 * @param panels - the configured panels
 * @returns indexes of the later entries with an id seen before, in order
 */
export function duplicatePanelIdIndexes(panels: readonly (Pick<PanelSetupEntry, 'id'> | undefined)[]): number[] {
    const seen = new Set<string>();
    const duplicates: number[] = [];
    panels.forEach((p, i) => {
        if (!p?.id) {
            return;
        }
        if (seen.has(p.id)) {
            duplicates.push(i);
        } else {
            seen.add(p.id);
        }
    });
    return duplicates;
}

/** Marks the end of the user part of a configuration script - everything below comes from the template */
export const SCRIPT_END_STOP_TOKEN = '*  END STOP END STOP END - No more configuration - END STOP END STOP END       *';

/** Result of `replacePanelTopicInScript` */
export interface ScriptTopicReplacement {
    /** the source with the new topic, unchanged when nothing was found */
    source: string;
    /** number of replaced `panelTopic` values */
    count: number;
}

/**
 * Sets the new topic in the user part of a configuration script (above {@link SCRIPT_END_STOP_TOKEN}, the whole
 * source when the token is missing): every `panelTopic: '<oldTopic>'` outside of line comments - single, double or
 * back quotes, any spaces around the colon, a quoted key - gets `newTopic` in the same quotes.
 *
 * @param source source of the script
 * @param oldTopic previous topic of the panel
 * @param newTopic new topic of the panel
 * @returns the new source and the number of replacements
 */
export function replacePanelTopicInScript(source: string, oldTopic: string, newTopic: string): ScriptTopicReplacement {
    if (!oldTopic || oldTopic === newTopic) {
        return { source, count: 0 };
    }
    const end = source.indexOf(SCRIPT_END_STOP_TOKEN);
    const head = end === -1 ? source : source.substring(0, end);
    const tail = end === -1 ? '' : source.substring(end);
    const pattern = /(?<![\w$])(["']?)panelTopic\1(\s*:\s*)(["'`])((?:(?!\3)[^\\\n])*)\3/g;
    let count = 0;
    const lines = head.split('\n').map(line => {
        if (line.trimStart().startsWith('//')) {
            return line;
        }
        return line.replace(pattern, (match: string, keyQuote: string, colon: string, quote: string, value: string) => {
            if (value.trim() !== oldTopic) {
                return match;
            }
            count++;
            const escaped = newTopic.replaceAll('\\', '\\\\').replaceAll(quote, `\\${quote}`);
            return `${keyQuote}panelTopic${keyQuote}${colon}${quote}${escaped}${quote}`;
        });
    });
    return count === 0 ? { source, count } : { source: lines.join('\n') + tail, count };
}

/** An entry of the script configuration in the meta object - only the fields the migration needs */
type ScriptConfigEntry = Record<string, unknown>;

/** Result of `migrateScriptConfigTopic` */
export interface ScriptConfigTopicMigration {
    /** `scriptConfigRaw` with the new topic, undefined = unchanged */
    scriptConfigRaw?: unknown[];
    /** `scriptConfig` with the new topic, undefined = unchanged */
    scriptConfig?: unknown[];
    /** number of entries of the panel that were changed (new topic and/or new script name) */
    moved: number;
    /** number of entries of the new topic that were dropped because the moved entry replaces them */
    dropped: number;
}

/**
 * Moves the script configuration of a panel in the meta object (`native.scriptConfigRaw` by `panelTopic`,
 * `native.scriptConfig` by `topic`) to the new topic. An entry that already exists for the new topic in the same
 * list is dropped - the moved entry belongs to the panel. When the configuration script was renamed, `scriptName`
 * of the panel's entries follows (only where it still names the old script) - also when the topic stays.
 *
 * @param native native of the meta object
 * @param oldTopic previous topic of the panel
 * @param newTopic new topic of the panel
 * @param script old and new id of the configuration script when it was renamed
 * @param script.from old id of the configuration script
 * @param script.to new id of the configuration script
 * @returns the changed lists and counters
 */
export function migrateScriptConfigTopic(
    native: Record<string, unknown>,
    oldTopic: string,
    newTopic: string,
    script?: { from: string; to: string },
): ScriptConfigTopicMigration {
    const result: ScriptConfigTopicMigration = { moved: 0, dropped: 0 };
    const isEntry = (value: unknown): value is ScriptConfigEntry =>
        !!value && typeof value === 'object' && !Array.isArray(value);
    const sameTopic = oldTopic === newTopic;
    const renames = (entry: ScriptConfigEntry): boolean => !!script && entry.scriptName === script.from;
    const moveList = (list: unknown, key: 'panelTopic' | 'topic'): unknown[] | undefined => {
        if (!Array.isArray(list) || !list.some(e => isEntry(e) && e[key] === oldTopic && (!sameTopic || renames(e)))) {
            return undefined;
        }
        const out: unknown[] = [];
        for (const entry of list) {
            if (!sameTopic && isEntry(entry) && entry[key] === newTopic) {
                result.dropped++;
                continue;
            }
            if (isEntry(entry) && entry[key] === oldTopic) {
                result.moved++;
                const moved: ScriptConfigEntry = { ...entry, [key]: newTopic };
                if (script && renames(entry)) {
                    moved.scriptName = script.to;
                }
                out.push(moved);
                continue;
            }
            out.push(entry);
        }
        return out;
    };
    if (!oldTopic || !newTopic || (sameTopic && !script)) {
        return result;
    }
    result.scriptConfigRaw = moveList(native.scriptConfigRaw, 'panelTopic');
    result.scriptConfig = moveList(native.scriptConfig, 'topic');
    return result;
}

/** What `panelIndexForMqttClient` needs to know about a running panel */
export interface MqttClientPanelCandidate {
    /** `cleandp(friendlyName)` - the first part of the MQTT client id the setup writes to Tasmota */
    clientName: string;
    /** panel id, `cleandp` of the MAC, e.g. `A0_B7_65_54_C0_70` */
    macId: string;
    /** virtual (web) panels never connect to the MQTT server themselves */
    isVirtual: boolean;
}

/**
 * Which panel belongs to the MQTT client that just connected?
 *
 * The setup writes `MqttClient <cleandp(name)>-<last 6 hex digits of the MAC>` to Tasmota. A client id of
 * exactly that form is matched first, so `Küche2-ABCDEF` is never taken for the panel `Küche`; if several
 * panels fit, the one whose MAC ends with these digits wins. Only if no panel fits exactly, the first panel
 * whose name is a prefix of the client id is taken (older or hand-made client ids).
 *
 * @param clientId - the id of the connected MQTT client
 * @param panels - the running panels
 * @returns index into `panels`, or -1
 */
export function panelIndexForMqttClient(clientId: string, panels: readonly MqttClientPanelCandidate[]): number {
    const exact: number[] = [];
    panels.forEach((p, i) => {
        if (p.isVirtual || !p.clientName || clientId.length !== p.clientName.length + 7) {
            return;
        }
        if (clientId.startsWith(`${p.clientName}-`) && /^[0-9a-f]{6}$/i.test(clientId.slice(-6))) {
            exact.push(i);
        }
    });
    if (exact.length > 0) {
        const hex = clientId.slice(-6).toLowerCase();
        const byMac = exact.find(i =>
            panels[i].macId
                .replace(/[^0-9a-f]/gi, '')
                .toLowerCase()
                .endsWith(hex),
        );
        return byMac ?? exact[0];
    }
    return panels.findIndex(p => !p.isVirtual && clientId.startsWith(p.clientName));
}
