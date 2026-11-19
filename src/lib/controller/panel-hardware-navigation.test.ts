/**
 * Hardware button mode 'navigation' (`Panel.navigateByButton`): one press acts like a navigation arrow of the page
 * shown. The tests drive a prototype-based Panel with a real `Page.goLeft/goRight` and a real `Navigation.go` -
 * only the page change itself (`setActivePage`, `Navigation.setPageByIndex`) is recorded instead of executed.
 */
import { expect } from 'chai';
import { Panel } from './panel';
import { Navigation } from '../classes/navigation';
import { Page } from '../classes/Page';
import { PagePopup } from '../pages/pagePopup';
import type { ButtonNavigationTarget } from '../types/adminShareConfig';
import type * as Types from '../types/types';

const noop = (): void => undefined;
const log = { silly: noop, debug: noop, info: noop, warn: noop, error: noop };

type Links = { single?: number; double?: number };

interface Setup {
    panel: Panel;
    /** what happened, in order: `nav:<index>` for a navigation target, `active:<name>`, `wake` ... */
    calls: string[];
    /** the panel's written states (`panels.<name>.buttons.<side>`) */
    written: string[];
    screensaver: Page;
    page: (name: string, extra?: Record<string, unknown>) => Page;
}

/**
 * @param left links of the left arrow of the current navigation item
 * @param right links of the right arrow of the current navigation item
 * @returns the panel and its recorders
 */
function setup(left: Links, right: Links): Setup {
    const calls: string[] = [];
    const written: string[] = [];
    const panel = Object.create(Panel.prototype) as Panel;
    const nav = Object.create(Navigation.prototype) as Navigation;
    Object.assign(nav, {
        log,
        database: [{ left, right, page: {}, index: 0 }],
        _currentItem: 0,
        setPageByIndex: async (index: number): Promise<void> => {
            calls.push(`nav:${index}`);
            return Promise.resolve();
        },
    });
    const page = (name: string, extra: Record<string, unknown> = {}): Page => {
        const p = Object.create(Page.prototype) as Page;
        Object.assign(p, { name, basePanel: panel, sleep: false, directParentPage: undefined, ...extra });
        return p;
    };
    const screensaver = page('screensaver');
    Object.assign(panel, {
        name: 'A0',
        log,
        navigation: nav,
        screenSaver: screensaver,
        _activePage: undefined,
        library: {
            writedp: async (id: string): Promise<void> => {
                written.push(id);
                return Promise.resolve();
            },
        },
        setActivePage: async (target: Page | boolean, notSleep?: boolean): Promise<void> => {
            const active: Page | undefined = Reflect.get(panel, '_activePage');
            if (target === true) {
                calls.push('wake');
                if (active) {
                    active.sleep = false;
                }
            } else if (typeof target !== 'boolean') {
                calls.push(`active:${target.name}${notSleep === false ? ',false' : ''}`);
                Reflect.set(panel, '_activePage', target);
            }
            return Promise.resolve();
        },
    });
    return { panel, calls, written, screensaver, page };
}

/** links of an item with both targets on both arrows: prev 1, parent 2, next 3, home 4 */
const full: [Links, Links] = [
    { single: 1, double: 2 },
    { single: 3, double: 4 },
];

/**
 * @param s the setup
 * @param active the page shown
 */
function show(s: Setup, active: Page): void {
    Reflect.set(s.panel, '_activePage', active);
}

describe('lib/controller/panel - hardware button mode navigation', () => {
    it('presses the matching arrow: next/prev short, home/parent long', async () => {
        const expected: Record<ButtonNavigationTarget, string> = {
            next: 'nav:3',
            prev: 'nav:1',
            home: 'nav:4',
            parent: 'nav:2',
        };
        for (const target of ['next', 'prev', 'home', 'parent'] as const) {
            const s = setup(...full);
            show(s, s.page('grid'));
            await s.panel.navigateByButton(target);
            expect(s.calls, target).to.deep.equal([expected[target]]);
        }
    });

    it('keeps the rule of the arrow: only one target set - short and long press both lead there', async () => {
        const cases: [Links, Links, ButtonNavigationTarget, string][] = [
            // only home on the right: next goes home as well
            [{}, { double: 4 }, 'next', 'nav:4'],
            [{}, { double: 4 }, 'home', 'nav:4'],
            // only parent on the left: prev goes up as well
            [{ double: 2 }, {}, 'prev', 'nav:2'],
            // only prev on the left: parent goes back as well
            [{ single: 1 }, {}, 'parent', 'nav:1'],
            // only next on the right: home goes on as well
            [{}, { single: 3 }, 'home', 'nav:3'],
        ];
        for (const [left, right, target, call] of cases) {
            const s = setup(left, right);
            show(s, s.page('grid'));
            await s.panel.navigateByButton(target);
            expect(s.calls, `${target} ${JSON.stringify([left, right])}`).to.deep.equal([call]);
        }
    });

    it('does nothing when the arrow has no target', async () => {
        for (const target of ['next', 'prev', 'home', 'parent'] as const) {
            const s = setup({}, {});
            show(s, s.page('grid'));
            await s.panel.navigateByButton(target);
            expect(s.calls, target).to.deep.equal([]);
        }
    });

    it('closes the detail popup of a card page and navigates from the page below in one press', async () => {
        const s = setup(...full);
        const grid = s.page('grid', { sleep: true });
        show(s, grid);
        await s.panel.navigateByButton('next');
        expect(s.calls).to.deep.equal(['wake', 'nav:3']);
        expect(grid.sleep).to.equal(false);
    });

    it('closes a notification popup like its exit button and navigates from the page it came from', async () => {
        const s = setup(...full);
        const grid = s.page('grid');
        const popup = Object.create(PagePopup.prototype) as PagePopup;
        Object.assign(popup, {
            name: 'popupNotify',
            basePanel: s.panel,
            sleep: false,
            startReminder: (): number => s.calls.push('reminder'),
            getLastPage: (): Page => grid,
            removeLastPage: (p: Page | undefined): number => s.calls.push(`remove:${p?.name}`),
        });
        show(s, popup);
        await s.panel.navigateByButton('parent');
        expect(s.calls).to.deep.equal(['reminder', 'remove:grid', 'active:grid', 'nav:2']);
    });

    it('leaves a child page to its parent page and navigates from there', async () => {
        const s = setup(...full);
        const parent = s.page('media');
        show(s, s.page('speakers', { directParentPage: parent }));
        await s.panel.navigateByButton('home');
        expect(s.calls).to.deep.equal(['active:media,false', 'nav:4']);
    });

    it('does nothing on the screensaver, also with a popup of an indicator open', async () => {
        for (const sleep of [false, true]) {
            const s = setup(...full);
            s.screensaver.sleep = sleep;
            show(s, s.screensaver);
            await s.panel.navigateByButton('next');
            expect(s.calls, `sleep ${sleep}`).to.deep.equal([]);
            expect(s.screensaver.sleep).to.equal(sleep);
        }
    });

    it('runs from the button event and still writes buttons.<side> on the screensaver', async () => {
        const s = setup(...full);
        const buttons: { left: Types.ConfigButtonFunction; right: Types.ConfigButtonFunction } = {
            left: { mode: 'navigation', target: 'prev' },
            right: { mode: 'navigation', target: 'next' },
        };
        Reflect.set(s.panel, 'buttons', buttons);
        show(s, s.page('grid'));
        await s.panel.onDetachButtonEvent('left');
        await s.panel.onDetachButtonEvent('right');
        expect(s.calls).to.deep.equal(['nav:1', 'nav:3']);
        show(s, s.screensaver);
        await s.panel.onDetachButtonEvent('right');
        expect(s.calls).to.deep.equal(['nav:1', 'nav:3']);
        expect(s.written).to.deep.equal([
            'panels.A0.buttons.left',
            'panels.A0.buttons.right',
            'panels.A0.buttons.right',
        ]);
    });
});
