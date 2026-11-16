/**
 * Heading anchors of the user documentation, shared by the documentation build
 * (`script/build-doc-page.ts`) and the admin help links (`docTopics`), so a link from the admin
 * always lands on the id the build gives the heading.
 *
 * No dependencies: runs in the browser (admin) and in node (build, tests).
 */

/**
 * Resolves the entities markdown-it writes, so they do not end up inside an id.
 *
 * @param text Html text with entities.
 * @returns The text with the entities resolved.
 */
export function decodeEntities(text: string): string {
    return text
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;|&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_m, dec: string) => String.fromCodePoint(Number(dec)))
        .replace(/&amp;/g, '&');
}

/**
 * Header ids the way GitHub builds them, so the anchors of the wiki-style links keep working:
 * lower case, punctuation dropped, every single blank turned into a hyphen (two blanks around a
 * dash therefore give two hyphens), letters with diacritics and underscores kept.
 *
 * @param text Heading text, plain or as rendered html.
 * @returns The id of the heading (without the duplicate suffix).
 */
export function slug(text: string): string {
    return decodeEntities(text.replace(/<[^>]*>/g, ''))
        .trim()
        .toLowerCase()
        .replace(/[`*]/g, '')
        .replace(/[^\p{L}\p{N} _-]/gu, '')
        .replace(/ /g, '-');
}

/**
 * Makes an id unique within one page: the second heading with the same id gets `-1`, the third
 * `-2` and so on, like GitHub does it.
 *
 * @param used Ids seen so far on this page, with the count of repetitions; updated here.
 * @param id Id from {@link slug}.
 * @returns The id to use for this heading.
 */
export function uniqueAnchor(used: Map<string, number>, id: string): string {
    const seen = used.get(id);
    if (seen !== undefined) {
        used.set(id, seen + 1);
        return `${id}-${seen + 1}`;
    }
    used.set(id, 0);
    return id;
}

/**
 * Gives every `<h1>`…`<h6>` of a rendered page its unique id.
 *
 * @param html Rendered page.
 * @param wrap Builds the replacement of one heading from its level, unique id and inner html.
 * @returns The page with every heading replaced by `wrap`.
 */
export function replaceHeadings(html: string, wrap: (level: string, id: string, inner: string) => string): string {
    const used = new Map<string, number>();
    return html.replace(/<h([1-6])>(.*?)<\/h\1>/gs, (_all, level: string, inner: string) =>
        wrap(level, uniqueAnchor(used, slug(inner)), inner),
    );
}

/**
 * Visible text of a heading, the way it reads on the page: tags removed, entities resolved,
 * surrounding blanks trimmed. This is the text a help topic names (`DocTopic.de` / `.en`).
 *
 * @param inner Inner html of the heading.
 * @returns The plain text.
 */
export function headingText(inner: string): string {
    return decodeEntities(inner.replace(/<[^>]*>/g, '')).trim();
}
