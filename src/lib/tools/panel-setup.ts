/**
 * Assignment of a panel setup (admin, `nsPanelInitStep1`) to an entry of the adapter configuration.
 */

/** The fields of a configured panel that the assignment needs */
export interface PanelSetupEntry {
    /** id of the panel - for Tasmota panels the cleaned MAC address */
    id: string;
    /** MQTT topic */
    topic: string;
    /** missing = Tasmota panel */
    kind?: 'tasmota' | 'web';
}

/** Result of `matchPanelForSetup` */
export type PanelSetupMatch =
    /** the device is already configured at `index` and gets updated */
    | { isNew: false; index: number }
    /** the device is not configured yet */
    | { isNew: true; index: -1 }
    /** the requested topic belongs to another entry - nothing may be sent to the device */
    | { error: 'sendToTopicInUse'; conflictIndex: number };

/**
 * Finds the configured entry of the device being set up via its MAC address.
 *
 * Name, topic and IP of a found entry may change. The requested topic must not belong to another
 * entry (another id, or any web panel). With several Tasmota entries of the same MAC the first one wins.
 *
 * @param panels - the configured panels
 * @param macId - the cleaned MAC address of the device (`cleandp(StatusNET.Mac)`)
 * @param topic - the requested MQTT topic
 * @returns the entry to update, a new panel or the conflict
 */
export function matchPanelForSetup(panels: readonly PanelSetupEntry[], macId: string, topic: string): PanelSetupMatch {
    const isSameDevice = (p: PanelSetupEntry): boolean => p.kind !== 'web' && p.id === macId;
    const conflictIndex = panels.findIndex(p => p.topic === topic && !isSameDevice(p));
    if (conflictIndex !== -1) {
        return { error: 'sendToTopicInUse', conflictIndex };
    }
    const index = panels.findIndex(isSameDevice);
    return index === -1 ? { isNew: true, index: -1 } : { isNew: false, index };
}
