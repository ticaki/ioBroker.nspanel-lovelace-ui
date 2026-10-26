import glyphMapJson from './glyph-map.json';
import { customPaths } from './custom-paths';

const glyphMap: Record<string, string> = glyphMapJson;
let mdiPaths: Record<string, string> = {};
let loading: Promise<void> | undefined;

/** MDI name of a HMI font glyph, undefined when unknown */
export function glyphToName(glyph: string): string | undefined {
    return glyphMap[glyph];
}

/** svg path of a MDI icon name, undefined when unknown */
export function iconPath(name: string): string | undefined {
    return customPaths[name] ?? mdiPaths[name];
}

/** Injects paths directly (tests, or a later inline variant) */
export function setIconPaths(paths: Record<string, string>): void {
    mdiPaths = paths;
}

/**
 * Loads `/icons/mdi-paths.json` once. The App awaits it before the first render, so the
 * `Icon` component can stay synchronous.
 *
 * @param url location of the json, `/icons/mdi-paths.json` by default
 */
export function loadIconPaths(url = '/icons/mdi-paths.json'): Promise<void> {
    if (!loading) {
        loading = fetch(url)
            .then(res => (res.ok ? res.json() : Promise.reject(new Error(`${res.status} ${res.statusText}`))))
            .then((json: unknown) => {
                if (json && typeof json === 'object') {
                    mdiPaths = json as Record<string, string>;
                }
            })
            .catch((e: unknown) => {
                console.error(`icon paths not loaded: ${String(e)}`);
                loading = undefined;
            });
    }
    return loading;
}
