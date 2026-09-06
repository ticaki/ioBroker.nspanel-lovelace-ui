import { ADAPTER_NAME } from '../../src/lib/types/adminShareConfig';

/**
 * Key of the admin page list in `admin/jsonConfig.json5`. The json-config tabs read the active tab
 * from the hash, so writing it there switches the tab.
 */
const PAGE_CONFIG_TAB = '_pageConfig';

/** Where the requested page is parked while the tab is switched */
const STORAGE_KEY = `${ADAPTER_NAME}.openPageConfig`;

/**
 * Opens the page configuration for an admin page.
 *
 * The page name is stored first, then the tab is switched via the hash. If the hash does not have
 * the expected instance-config shape, only the name is stored: the page is then selected as soon
 * as the page list is opened by hand.
 *
 * @param uniqueName `uniqueName` of the admin entry to select
 * @returns Whether the tab switch could be triggered
 */
export function openPageConfig(uniqueName: string): boolean {
    try {
        window.sessionStorage.setItem(STORAGE_KEY, uniqueName);
    } catch {
        // Private mode or blocked storage - the tab switch below still works
    }
    // #tab-instances/config/system.adapter.<adapter>.<instance>/<tab>
    const hash = (window.location.hash || '').replace(/^#/, '').split('/');
    if (hash.length < 3 || hash[1] !== 'config') {
        return false;
    }
    hash[3] = PAGE_CONFIG_TAB;
    window.location.hash = hash.join('/');
    return true;
}

/**
 * Reads and clears a page requested by {@link openPageConfig}. Cleared on read so a later visit of
 * the page list does not jump again.
 *
 * @returns The requested `uniqueName`, if any
 */
export function takeRequestedPageConfig(): string | undefined {
    try {
        const requested = window.sessionStorage.getItem(STORAGE_KEY);
        if (requested) {
            window.sessionStorage.removeItem(STORAGE_KEY);
            return requested;
        }
    } catch {
        // Storage not available - nothing was requested then
    }
    return undefined;
}
