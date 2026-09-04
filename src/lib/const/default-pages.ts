import type { PageBase } from '../types/pages';

/**
 * uniqueID and navigation node name of the panel start page.
 *
 * Every navigation link that points to "the start page" uses this name. The adapter guarantees
 * that a node with this name exists: it comes either from the configuration script, from the
 * admin configuration or - if neither provides one - from {@link getDefaultMainPage}.
 */
export const mainPageName = 'main';

/**
 * Builds an empty start page used when neither the configuration script nor the admin
 * configuration provides a page with the uniqueID {@link mainPageName}.
 *
 * The page is intentionally empty: it only exists so that navigation, service access and the
 * panel start sequence have a valid target. Users fill it via the admin page configuration.
 *
 * @param headline Headline shown on the page, usually the friendly panel name.
 * @returns An empty cardGrid page with uniqueID {@link mainPageName}.
 */
export function getDefaultMainPage(headline: string): PageBase {
    return {
        uniqueID: mainPageName,
        dpInit: '',
        alwaysOn: 'none',
        hidden: false,
        config: {
            card: 'cardGrid',
            scrollPresentation: 'classic',
            data: {
                headline: { type: 'const', constVal: headline },
            },
        },
        pageItems: [],
    };
}
