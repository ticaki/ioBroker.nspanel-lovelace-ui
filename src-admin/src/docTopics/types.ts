/**
 * One place in the user documentation a help link points to.
 *
 * `de` / `en` are the heading texts of the section exactly as they read on the page
 * (`doc/de/<page>.md` / `doc/en/<page>.md`, without the leading `#`s and without markdown marks
 * like `*` or backticks). Without them the link opens the whole page. Give both or none.
 * `docTopics.test.ts` checks every topic against the documentation, so a dead link fails the tests.
 */
export interface DocTopic {
    /** File name in `doc/de` and `doc/en` without `.md`, e.g. `screensaver`. */
    page: string;
    /** Heading of the section in the German page. */
    de?: string;
    /** Heading of the section in the English page. */
    en?: string;
}
