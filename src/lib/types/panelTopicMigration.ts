/**
 * Move the admin configuration of a panel from its old to its new MQTT topic (#899).
 *
 * The admin tables address a panel by its topic: the page assignments (`pageConfig[].navigationAssignment[].topic`),
 * the screensavers (`screensaverConfig[].panels`) and the navigation overrides (`navigationOverrides[].panelTopic`).
 * When the topic of a panel changes (setup of an existing Tasmota panel, web panel dialog) these references follow.
 *
 * Pure helper shared between the adapter (tests) and the admin bundle, therefore no adapter imports here.
 */
import type { NavigationOverride, PageConfigEntry, ScreensaverEntry } from './adminShareConfig';

/** the admin tables that hold panel topics */
export type PanelTopicMigrationNative = {
    pageConfig?: PageConfigEntry[];
    screensaverConfig?: ScreensaverEntry[];
    navigationOverrides?: NavigationOverride[];
};

/** the tables that changed - a table that needs no change is missing */
export type PanelTopicMigrationResult = PanelTopicMigrationNative;

/**
 * Moves the page assignments of one page. When the page already has an assignment for the new topic, the one of
 * the old topic is only removed.
 *
 * @param page page entry
 * @param oldTopic previous topic of the panel
 * @param newTopic new topic of the panel
 * @returns the changed page, undefined when the page has no assignment for the old topic
 */
function migratePage(page: PageConfigEntry, oldTopic: string, newTopic: string): PageConfigEntry | undefined {
    const list = page?.navigationAssignment;
    if (!Array.isArray(list) || !list.some(a => a && a.topic === oldTopic)) {
        return undefined;
    }
    const hasNew = list.some(a => a && a.topic === newTopic);
    const navigationAssignment = hasNew
        ? list.filter(a => !a || a.topic !== oldTopic)
        : list.map(a => (a && a.topic === oldTopic ? { ...a, topic: newTopic } : a));
    return { ...page, navigationAssignment };
}

/**
 * Moves the screensaver assignments. A screensaver that holds the new topic already only loses the old one.
 *
 * @param entry screensaver entry
 * @param oldTopic previous topic of the panel
 * @param newTopic new topic of the panel
 * @returns the changed entry, undefined when the entry does not use the old topic
 */
function migrateScreensaver(entry: ScreensaverEntry, oldTopic: string, newTopic: string): ScreensaverEntry | undefined {
    const panels = entry?.panels;
    if (!Array.isArray(panels) || !panels.includes(oldTopic)) {
        return undefined;
    }
    const next = panels.includes(newTopic)
        ? panels.filter(t => t !== oldTopic)
        : panels.map(t => (t === oldTopic ? newTopic : t));
    return { ...entry, panels: next };
}

/**
 * Moves the admin configuration of a panel from `oldTopic` to `newTopic` without creating duplicates: where the
 * new topic is already present (page assignment, screensaver, navigation override of the same page) the entry of
 * the old topic is only removed. The input is not changed.
 *
 * @param native the admin tables (`props.data` of the admin or the instance native)
 * @param oldTopic previous topic of the panel
 * @param newTopic new topic of the panel
 * @returns the changed tables only - empty when nothing refers to the old topic or the topics are equal
 */
export function migratePanelTopic(
    native: PanelTopicMigrationNative,
    oldTopic: string,
    newTopic: string,
): PanelTopicMigrationResult {
    const result: PanelTopicMigrationResult = {};
    if (!oldTopic || !newTopic || oldTopic === newTopic) {
        return result;
    }

    if (Array.isArray(native.pageConfig)) {
        let changed = false;
        const pages = native.pageConfig.map(page => {
            const moved = migratePage(page, oldTopic, newTopic);
            if (moved) {
                changed = true;
                return moved;
            }
            return page;
        });
        if (changed) {
            result.pageConfig = pages;
        }
    }

    if (Array.isArray(native.screensaverConfig)) {
        let changed = false;
        const entries = native.screensaverConfig.map(entry => {
            const moved = migrateScreensaver(entry, oldTopic, newTopic);
            if (moved) {
                changed = true;
                return moved;
            }
            return entry;
        });
        if (changed) {
            result.screensaverConfig = entries;
        }
    }

    if (Array.isArray(native.navigationOverrides)) {
        const list = native.navigationOverrides;
        if (list.some(o => o && o.panelTopic === oldTopic)) {
            const pagesOfNew = new Set(list.filter(o => o && o.panelTopic === newTopic).map(o => o.page));
            result.navigationOverrides = list
                .filter(o => !o || o.panelTopic !== oldTopic || !pagesOfNew.has(o.page))
                .map(o => (o && o.panelTopic === oldTopic ? { ...o, panelTopic: newTopic } : o));
        }
    }

    return result;
}
