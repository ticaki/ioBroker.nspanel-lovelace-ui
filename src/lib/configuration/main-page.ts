import type { NavigationItemConfig } from '../classes/navigation';
import { getDefaultMainPage, mainPageName } from '../const/default-pages';
import { serviceNodeName } from '../types/adminShareConfig';
import type { PageBase } from '../types/pages';

/** Result of {@link ensureMainPage}, used for logging by the caller. */
export type EnsureMainPageResult = {
    /** True if a default start page was added. */
    pageAdded: boolean;
    /** True if a navigation node for the start page was added. */
    navigationAdded: boolean;
};

/** Subset of `panelConfigPartial` needed to inject the default start page. */
type MainPageTarget = {
    pages: PageBase[];
    navigation: NavigationItemConfig[];
};

/**
 * Makes sure the panel configuration contains a start page named {@link mainPageName}.
 *
 * Called before the admin configuration is merged, so the resulting precedence is:
 * script `main` -> otherwise this default `main` -> optionally overridden by an admin `main`.
 *
 * The default node takes over the position and the service anchor of the previous first
 * navigation node, so the ring built by the config manager stays intact and the service pages
 * remain reachable.
 *
 * @param option Panel configuration containing `pages` and `navigation`.
 * @param headline Headline for the generated page, usually the friendly panel name.
 * @returns What had to be added.
 */
export function ensureMainPage(option: MainPageTarget, headline: string): EnsureMainPageResult {
    const result: EnsureMainPageResult = { pageAdded: false, navigationAdded: false };
    const hasNode = option.navigation.some(a => a && a.name === mainPageName);

    if (hasNode) {
        // The panel has its own start page node - only the page may be missing.
        if (!option.pages.some(a => a && a.uniqueID === mainPageName)) {
            option.pages.push(getDefaultMainPage(headline));
            result.pageAdded = true;
        }
        return result;
    }

    // No node: a page with that id can only come from another panel, merged in by
    // ConfigManager.getConfig(). Do not adopt it as start page - and never end up with two.
    option.pages = option.pages.filter(a => !a || a.uniqueID !== mainPageName);
    option.pages.push(getDefaultMainPage(headline));
    result.pageAdded = true;

    const mainNode: NavigationItemConfig = { name: mainPageName, page: mainPageName };
    const first = option.navigation.find(a => a != null);

    if (!first) {
        // Only the start page exists - mirror what the config manager does for a single node.
        mainNode.left = { single: serviceNodeName };
        mainNode.right = { single: serviceNodeName };
    } else {
        mainNode.right = { single: first.name };
        if (first.left?.single === serviceNodeName) {
            // Take over the service anchor from the node that used to be first.
            mainNode.left = { single: serviceNodeName };
            first.left = { single: mainPageName };
        } else {
            if (!first.left?.single) {
                first.left = { ...(first.left ?? {}), single: mainPageName };
            }
            // The start page becomes the service entry point if no other node offers one.
            if (!option.navigation.some(a => a && a.left?.single === serviceNodeName)) {
                mainNode.left = { single: serviceNodeName };
            }
        }
    }

    option.navigation.unshift(mainNode);
    result.navigationAdded = true;
    return result;
}
