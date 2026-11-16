/** Where the user documentation lives: `<base>/<de|en>/<page>.html#<anchor>`. */
export const DOC_BASE = 'https://ticaki.github.io/ioBroker.nspanel-lovelace-ui';

/** The documentation exists in German and English only. */
export type DocLanguage = 'de' | 'en';

/** Language of the ioBroker system configuration, set once a custom component is mounted. */
let systemLanguage: string | undefined;

/**
 * Remembers the language of the ioBroker system configuration (`systemConfig.language`). The custom
 * components call this through `withDocLanguage` in `Components.tsx`, so every help link follows the
 * system language without passing it through the props.
 *
 * @param language `systemConfig.language`; empty values are ignored.
 */
export function setDocSystemLanguage(language: string | null | undefined): void {
    if (language) {
        systemLanguage = language;
    }
}

/**
 * Language of the ioBroker system configuration as remembered by {@link setDocSystemLanguage}.
 *
 * @returns The language or `undefined` before any custom component was mounted.
 */
export function getDocSystemLanguage(): string | undefined {
    return systemLanguage;
}

/**
 * Picks the documentation language: German only for a German system, English for everything else.
 *
 * @param system Language of the ioBroker system configuration, if known.
 * @param fallback Language of the admin interface, used when the system language is unknown.
 * @returns `de` or `en`.
 */
export function resolveDocLanguage(system: string | undefined, fallback?: string): DocLanguage {
    return (system ?? fallback) === 'de' ? 'de' : 'en';
}

/**
 * Builds the link to a documentation page.
 *
 * @param language Documentation language.
 * @param page Name of the page, identical to the file name in `doc/de` and `doc/en` without the
 *             extension, e.g. `cardChart` or `Adapter-Installation`.
 * @param anchor Id of a heading on that page, without `#`.
 * @returns Absolute url of the page (and section) on the documentation site.
 */
export function docPageUrl(language: DocLanguage, page: string, anchor?: string): string {
    const base = `${DOC_BASE}/${language}/${encodeURIComponent(page)}.html`;
    return anchor ? `${base}#${encodeURIComponent(anchor)}` : base;
}
