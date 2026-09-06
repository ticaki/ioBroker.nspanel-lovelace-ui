import type { PageOrigin } from '../types/adminShareConfig';
import type { PageBase } from '../types/pages';

/**
 * Records where the pages of a panel come from while `Panel.preInit()` merges them together.
 *
 * The panel configuration is built in phases - script pages first, then the generated start page,
 * then the admin pages, finally the service pages - and each phase appends to the same array.
 * {@link PageOriginTracker.classify} is called after every phase and marks everything that has not
 * been seen before with the origin of that phase.
 *
 * Pages are recognised by identity, not by id: replacing a page pushes a new object, so a script
 * page taken over by the admin is re-classified instead of keeping its former origin.
 */
export class PageOriginTracker {
    private readonly classified = new WeakSet<PageBase>();
    private readonly origins = new Map<string, PageOrigin>();

    /**
     * Assigns `origin` to every page that has not been classified yet.
     *
     * @param pages Current page list of the panel configuration
     * @param origin Origin of the phase that just ran
     */
    classify(pages: readonly (PageBase | undefined | null)[], origin: PageOrigin): void {
        for (const page of pages) {
            if (!page || this.classified.has(page)) {
                continue;
            }
            this.classified.add(page);
            if (page.uniqueID) {
                this.origins.set(page.uniqueID, origin);
            }
        }
    }

    /**
     * Origin of a page.
     *
     * @param pageId Page id as used in the navigation
     * @returns The recorded origin, `undefined` for a page that was never classified
     */
    get(pageId: string): PageOrigin | undefined {
        return this.origins.get(pageId);
    }
}
