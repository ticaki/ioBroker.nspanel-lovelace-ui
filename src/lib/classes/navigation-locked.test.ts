import { expect } from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Navigation } from './navigation';
import { LOCKED_PAGE_ICON, LOCKED_PAGE_TEXT_KEY, lockedPageFont, lockedPageNotification } from './navigation-locked';
import { systemNavigation } from '../templates/system-templates';
import { POPUP_NOTIFY3_ICONS, notify3Text } from '../pages/popupNotify3';
import type { NSpanelModel } from '../types/types';

const noop = (): void => undefined;
const POPUP_STATE = 'p/cmd/popupNotificationCustom';

/**
 * Navigation with a mocked panel; the pages named in `hidden` have `hidden: true`.
 *
 * @param nodes Navigation nodes.
 * @param hidden Names of the hidden pages.
 * @param hideCards Panel setting "hide pages".
 */
function setup(
    nodes: Record<string, unknown>[],
    hidden: string[],
    hideCards: boolean,
): { nav: any; shown: string[]; popups: unknown[]; debug: string[] } {
    const shown: string[] = [];
    const popups: unknown[] = [];
    const debug: string[] = [];
    const pages: Record<string, unknown> = {};
    const panel: any = {
        name: 'p',
        friendlyName: 'p',
        hideCards,
        info: { nspanel: { model: 'eu' } },
        getPagebyUniqueID: (id: string): unknown => {
            pages[id] ??= { name: id, id, hidden: hidden.includes(id) };
            return pages[id];
        },
        activateScreensaver: async (): Promise<void> => Promise.resolve(),
        setActivePage: async (page: { name: string }): Promise<void> => {
            shown.push(page.name);
            return Promise.resolve();
        },
        statesControler: {
            setInternalState: async (id: string, val: unknown): Promise<boolean> => {
                if (id === POPUP_STATE) {
                    popups.push(JSON.parse(String(val)));
                }
                return Promise.resolve(true);
            },
        },
    };
    const log = {
        silly: noop,
        debug: (m: string) => debug.push(m),
        info: noop,
        warn: noop,
        error: noop,
    };
    const library = {
        writedp: async (): Promise<void> => Promise.resolve(),
        getTranslation: (key: string): string => (key === LOCKED_PAGE_TEXT_KEY ? 'Seite gesperrt' : key),
    };
    const adapter: any = {
        log,
        library,
        config: {},
        getObjectAsync: async (): Promise<unknown> => Promise.resolve({ native: {} }),
        setObject: async (): Promise<void> => Promise.resolve(),
    };
    const nav: any = new Navigation({
        adapter,
        panel,
        navigationConfig: structuredClone(nodes.concat(systemNavigation as any)) as any,
    });
    nav.log = log;
    nav.library = library;
    return { nav, shown, popups, debug };
}

const tick = async (): Promise<void> => new Promise(resolve => setImmediate(resolve));

const indexOf = (nav: any, name: string): number =>
    nav.navigationConfig.findIndex((a: { name: string }) => a.name === name);

describe('lib/classes/navigation - locked (hidden) page', () => {
    const chain = (): Record<string, unknown>[] => [
        { name: 'main', page: 'main', left: { single: 'wecker' }, right: { single: 'geheim' } },
        { name: 'geheim', page: 'geheim', left: { single: 'main' }, right: { single: 'wecker' } },
        { name: 'wecker', page: 'wecker', left: { single: 'geheim' }, right: { single: 'main' } },
    ];

    it('a targeted navigation to a locked page shows the popup and not the page', async () => {
        const f = setup(chain(), ['geheim'], true);
        await f.nav.init();
        await f.nav.setTargetPageByName('geheim');
        expect(f.shown).to.deep.equal([]);
        expect(f.popups).to.have.length(1);
        expect(f.popups[0]).to.deep.include({
            id: 'navigationPageLocked',
            type: 'information',
            text: 'Seite gesperrt',
            icon: 'cancel',
            largeIcon: true,
            global: false,
            alwaysOn: false,
        });
        expect(f.debug).to.include('Navigation to "geheim" is locked (hidden + hideCards).');
    });

    it('swiping skips the locked page without a popup', async () => {
        const f = setup(chain(), ['geheim'], true);
        await f.nav.init();
        f.nav.currentItem = indexOf(f.nav, 'main');
        f.nav.goRight(true);
        await tick();
        await tick();
        expect(f.shown).to.deep.equal(['wecker']);
        expect(f.popups).to.have.length(0);
    });

    it('without hideCards hidden has no effect', async () => {
        const f = setup(chain(), ['geheim'], false);
        await f.nav.init();
        await f.nav.setTargetPageByName('geheim');
        expect(f.shown).to.deep.equal(['geheim']);
        expect(f.popups).to.have.length(0);
    });
});

describe('lib/classes/navigation-locked - notification', () => {
    it('the icon is in the big icon font', () => {
        expect(POPUP_NOTIFY3_ICONS).to.include(LOCKED_PAGE_ICON);
    });

    it('picks the largest font that has all characters', () => {
        expect(lockedPageFont('Seite gesperrt', 'eu')).to.equal(3);
        // 48 px has no Cyrillic
        expect(lockedPageFont('Страница заблокирована', 'eu')).to.equal(2);
        expect(lockedPageNotification('Page locked', 'eu').textSize).to.equal('3');
    });

    it('the text fits the visible area in every language without being cut', () => {
        const dir = path.join(__dirname, '../../../admin/i18n');
        const models: NSpanelModel[] = ['eu', 'us-l', 'us-p', 'web-l', 'web-p'];
        for (const lang of fs.readdirSync(dir)) {
            const t = JSON.parse(fs.readFileSync(path.join(dir, lang, 'translations.json'), 'utf8')) as Record<
                string,
                string
            >;
            const text = t[LOCKED_PAGE_TEXT_KEY];
            expect(text, lang).to.be.a('string').and.not.equal('');
            for (const model of models) {
                const font = lockedPageFont(text, model);
                const shown = notify3Text(text, font, model).replace(/\r\n/g, ' ');
                expect(shown, `${lang} ${model}`).to.equal(text);
            }
        }
    });
});
