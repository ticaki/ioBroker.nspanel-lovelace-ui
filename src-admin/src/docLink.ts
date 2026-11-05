/**
 * Where the user documentation lives. The pages below the base are language-neutral: the
 * documentation site forwards `…/screensaver` to `de/screensaver.html` or `en/screensaver.html`,
 * depending on the browser language. So the admin never has to pick a language itself.
 */
export const DOC_BASE = 'https://ticaki.github.io/ioBroker.nspanel-lovelace-ui';

/**
 * Builds the link to a documentation page.
 *
 * @param page Name of the page, identical to the file name in `doc/de` and `doc/en`
 *             without the extension, e.g. `cardChart` or `Adapter-Installation`.
 * @returns Absolute url of that page on the documentation site.
 */
export function docUrl(page: string): string {
    return `${DOC_BASE}/${encodeURIComponent(page)}`;
}
