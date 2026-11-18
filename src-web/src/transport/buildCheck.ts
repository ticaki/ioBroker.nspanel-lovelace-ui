/** name of the meta tag the build writes into index.html (see `webBuildId` in vite.config.ts) */
export const WEB_BUILD_META = 'nspanel-web-build';
/** sessionStorage key: build id of the adapter a reload was already tried for */
export const BUILD_RELOAD_KEY = 'nspanel-web-build-reload';

/** The parts of `sessionStorage` the reload guard needs */
export type BuildStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Build id of the bundle this page runs, from its index.html.
 *
 * @param doc the document, defaults to the global one
 * @returns the id, undefined without the meta tag (vite dev server, tests)
 */
export function pageBuildId(doc: Pick<Document, 'querySelector'> | undefined = globalDocument()): string | undefined {
    const content = doc?.querySelector(`meta[name="${WEB_BUILD_META}"]`)?.getAttribute('content');
    return content ? content : undefined;
}

function globalDocument(): Document | undefined {
    return typeof document === 'undefined' ? undefined : document;
}

/** `sessionStorage`, undefined when the browser blocks it */
export function sessionStore(): BuildStorage | undefined {
    try {
        return typeof sessionStorage === 'undefined' ? undefined : sessionStorage;
    } catch {
        return undefined;
    }
}

/**
 * Has the page to be reloaded because the adapter serves another build than the one running here
 * (a browser that kept the page open over an adapter update only reconnects its websocket)?
 *
 * Reloads at most once per adapter build: the id is noted in the session storage before the reload,
 * a page that still differs afterwards (cache, proxy) keeps running instead of reloading in a loop.
 * Without a usable storage there is no such guard - then nothing is reloaded.
 *
 * @param serverBuild build id from the `hello`, undefined from an adapter that does not send one
 * @param ownBuild build id of this page, undefined when unknown
 * @param storage session storage, undefined when blocked
 * @returns true if the page should reload now
 */
export function shouldReloadForBuild(
    serverBuild: string | undefined,
    ownBuild: string | undefined,
    storage: BuildStorage | undefined,
): boolean {
    if (!serverBuild || !ownBuild || !storage) {
        return false;
    }
    try {
        if (serverBuild === ownBuild) {
            // up to date - a later update may reload again
            storage.removeItem(BUILD_RELOAD_KEY);
            return false;
        }
        if (storage.getItem(BUILD_RELOAD_KEY) === serverBuild) {
            // already reloaded for this build and still old - no loop
            return false;
        }
        storage.setItem(BUILD_RELOAD_KEY, serverBuild);
        return true;
    } catch {
        return false;
    }
}
