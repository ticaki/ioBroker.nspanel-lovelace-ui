import { isGlobalConfig } from '../const/config-manager-const';

/**
 * Panels with the option "panel uses no script" (`native.panels[].noScript`) are configured completely in
 * the admin (plus the global script). A local panel script is rejected for them, the script version is
 * not checked and no script update is offered.
 */

/** What this module reads of one panel entry of the admin table (`native.panels[]`). */
export interface NoScriptPanelEntry {
    name?: string;
    topic?: string;
    noScript?: boolean;
}

/**
 * The topic of a panel as the admin table stores it. Old scripts send the full command topic
 * (`<topic>.cmnd.CustomSend`) - the config manager strips that suffix as well.
 *
 * @param topic topic as sent by a script
 * @returns the topic without the `.cmnd.CustomSend` suffix
 */
export function normalizePanelTopic(topic: string): string {
    return topic.endsWith('.cmnd.CustomSend') ? topic.split('.').slice(0, -2).join('.') : topic;
}

/**
 * The panel entry of the admin table for a topic.
 *
 * @param panels panel table of the instance (`config.panels`)
 * @param topic topic of the panel, `.cmnd.CustomSend` is ignored
 * @returns the entry or undefined
 */
export function findPanelEntry<T extends NoScriptPanelEntry>(
    panels: readonly (T | null | undefined)[] | undefined,
    topic: string | undefined,
): T | undefined {
    if (!panels || typeof topic !== 'string' || !topic) {
        return undefined;
    }
    const wanted = normalizePanelTopic(topic);
    for (const panel of panels) {
        if (panel && panel.topic === wanted) {
            return panel;
        }
    }
    return undefined;
}

/**
 * Whether the panel with this topic is marked "panel uses no script" in the admin.
 *
 * @param panels panel table of the instance (`config.panels`)
 * @param topic topic of the panel, `.cmnd.CustomSend` is ignored
 * @returns true if the panel uses no script
 */
export function isNoScriptPanel(
    panels: readonly (NoScriptPanelEntry | null | undefined)[] | undefined,
    topic: string | undefined,
): boolean {
    return findPanelEntry(panels, topic)?.noScript === true;
}

/**
 * Text of the error for a local script sent for a panel without a script.
 *
 * @param panel panel entry of the admin table
 * @param topic topic as sent by the script
 * @param scriptId id of the sending script (`scriptName` of the message), if known
 * @returns the message for the log and for the sender
 */
export function noScriptRejectionMessage(
    panel: NoScriptPanelEntry | undefined,
    topic: string,
    scriptId?: string,
): string {
    const name = panel?.name ? `"${panel.name}" (topic ${topic})` : `with topic ${topic}`;
    const script = scriptId ? `the panel script ${scriptId}` : 'this panel script';
    return (
        `❌ Panel ${name} is set to "Panel uses no script" in the panel settings of the adapter - the configuration ` +
        `of ${script} was rejected and not stored. Disable or delete ${script} in the JavaScript adapter, ` +
        `otherwise it sends its configuration again on every start. To use a panel script again, remove the ` +
        `check mark in the panel settings. The global script is not affected.`
    );
}

/** Result of {@link checkScriptConfigTopics}. */
export interface ScriptConfigTopicCheck {
    /** the message is a global script configuration - it is always accepted */
    global: boolean;
    /** topics the configuration may be applied to (in the order of the message) */
    accepted: string[];
    /** one error message per rejected topic */
    rejected: string[];
}

/**
 * Splits the topics of a `ScriptConfig` message into the ones that may receive the configuration and
 * the ones of panels marked "panel uses no script". A global script configuration is never rejected.
 *
 * @param panels panel table of the instance (`config.panels`)
 * @param message message of the script (`obj.message`)
 * @returns accepted topics and error messages for the rejected ones
 */
export function checkScriptConfigTopics(
    panels: readonly (NoScriptPanelEntry | null | undefined)[] | undefined,
    message: unknown,
): ScriptConfigTopicCheck {
    const result: ScriptConfigTopicCheck = { global: false, accepted: [], rejected: [] };
    if (!message || typeof message !== 'object') {
        return result;
    }
    if (isGlobalConfig(message)) {
        result.global = true;
        return result;
    }
    const panelTopic: unknown = 'panelTopic' in message ? message.panelTopic : undefined;
    const scriptName: unknown = 'scriptName' in message ? message.scriptName : undefined;
    const scriptId = typeof scriptName === 'string' ? scriptName : undefined;
    const topics: unknown[] = Array.isArray(panelTopic) ? panelTopic : [panelTopic];
    for (const topic of topics) {
        if (typeof topic !== 'string') {
            continue;
        }
        const panel = findPanelEntry(panels, topic);
        if (panel?.noScript === true) {
            result.rejected.push(noScriptRejectionMessage(panel, topic, scriptId));
        } else {
            result.accepted.push(topic);
        }
    }
    return result;
}
