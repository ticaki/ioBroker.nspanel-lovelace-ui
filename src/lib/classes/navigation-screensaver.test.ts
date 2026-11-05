import { expect } from 'chai';
import { Navigation, SCREENSAVER_NAV_INDEX } from './navigation';
import { Panel } from '../controller/panel';
import { Icons } from '../const/icon_mapping';
import { genericStateObjects } from '../const/definition';
import { collectNavigationTargets } from '../configuration/page-targets';
import { screensaverTargetPage } from '../types/adminShareConfig';

const noop = (): void => undefined;

function setup(nodes: Record<string, unknown>[]): {
    nav: any;
    warnings: string[];
    activated: () => number;
    shown: string[];
} {
    const warnings: string[] = [];
    let activated = 0;
    const shown: string[] = [];
    const pages: Record<string, unknown> = {};
    const panel: any = {
        name: 'p',
        friendlyName: 'p',
        hideCards: false,
        getPagebyUniqueID: (id: string): unknown => {
            pages[id] ??= { name: id, id, hidden: false };
            return pages[id];
        },
        activateScreensaver: async (): Promise<void> => {
            activated++;
            return Promise.resolve();
        },
        setActivePage: async (page: { name: string }): Promise<void> => {
            shown.push(page.name);
            return Promise.resolve();
        },
    };
    const adapter: any = {
        log: { silly: noop, debug: noop, info: noop, warn: (m: string) => warnings.push(m), error: noop },
        library: { writedp: async (): Promise<void> => Promise.resolve() },
        config: {},
        getObjectAsync: async (): Promise<unknown> => Promise.resolve({ native: {} }),
        setObject: async (): Promise<void> => Promise.resolve(),
    };
    const nav: any = new Navigation({ adapter, panel, navigationConfig: nodes as any });
    nav.log = adapter.log;
    nav.library = adapter.library;
    return { nav, warnings, activated: () => activated, shown };
}

describe('lib/classes/navigation - screensaver as target', () => {
    const chain = (): Record<string, unknown>[] => [
        { name: 'main', page: 'main', left: { single: 'b' }, right: { single: screensaverTargetPage } },
        { name: 'b', page: 'b', left: { single: screensaverTargetPage }, right: { single: 'main' } },
    ];

    it('is no node: no warning, the chain stays', async () => {
        const f = setup(chain());
        await f.nav.init();
        expect(f.warnings).to.deep.equal([]);
        const db = f.nav.getDatabase();
        expect(db[0].right.single).to.equal(SCREENSAVER_NAV_INDEX);
        expect(db[0].left.single).to.equal(1);
        expect(db[1].right.single).to.equal(0);
        expect(db.filter(Boolean)).to.have.length(2);
    });

    it('the arrow jumps through the same way, the position is not changed by the jump', async () => {
        const f = setup(chain());
        await f.nav.init();
        f.nav.goRight(true);
        await new Promise(resolve => setImmediate(resolve));
        expect(f.activated()).to.equal(1);
        expect(f.nav.currentItem).to.equal(0);
        expect(f.shown).to.deep.equal([]);
    });

    it('by name as well, an unknown name still warns', async () => {
        const f = setup(chain());
        await f.nav.init();
        await f.nav.setTargetPageByName(screensaverTargetPage);
        expect(f.activated()).to.equal(1);
        expect(f.warnings).to.deep.equal([]);
        await f.nav.setTargetPageByName('nope');
        expect(f.warnings).to.have.length(1);
    });

    it('a hidden page before it does not count as a loop', async () => {
        const f = setup([
            { name: 'main', page: 'main', right: { single: 'h' } },
            { name: 'h', page: 'h', right: { single: screensaverTargetPage } },
        ]);
        await f.nav.init();
        f.nav.panel.hideCards = true;
        f.nav.getDatabase()[1].page.hidden = true;
        f.nav.goRight(true);
        await new Promise(resolve => setImmediate(resolve));
        expect(f.activated()).to.equal(1);
        expect(f.nav.infityCounter).to.equal(0);
    });

    it('the arrows show the icon, parent and home too', async () => {
        const f = setup([
            { name: 'main', page: 'main', right: { single: screensaverTargetPage } },
            {
                name: 'b',
                page: 'b',
                left: { double: screensaverTargetPage },
                right: { double: screensaverTargetPage },
            },
        ]);
        await f.nav.init();
        const icon = Icons.GetIcon('power-sleep');
        expect(icon).to.not.equal('');
        expect(f.nav.buildNavigationString('right').split('~')[2]).to.equal(icon);
        f.nav.currentItem = 1;
        expect(f.nav.buildNavigationString('left').split('~')[1]).to.equal('bUp');
        expect(f.nav.buildNavigationString('left').split('~')[2]).to.equal(icon);
        expect(f.nav.buildNavigationString('right').split('~')[2]).to.equal(icon);
    });

    it('other arrows stay what they are', async () => {
        const f = setup(chain());
        await f.nav.init();
        expect(f.nav.buildNavigationString('left').split('~')[2]).to.equal(Icons.GetIcon('arrow-left-bold'));
    });

    it('a target of an item goes on to the flow, where it gets a node', () => {
        const targets = collectNavigationTargets(
            [{ setNavi: { type: 'const', constVal: screensaverTargetPage } }],
            'setNavi',
        );
        expect(targets.pages).to.deep.equal([screensaverTargetPage]);
    });
});

describe('lib/controller/panel - screensaver at once', () => {
    function panelWith(online = true): any {
        const calls: string[] = [];
        const saver: any = { sleep: false };
        const other: any = { sleep: false, reset: () => calls.push('reset') };
        const panel: any = Object.create(Panel.prototype);
        Object.defineProperty(panel, 'isOnline', { value: online, writable: true });
        Object.assign(panel, {
            name: 'p',
            calls,
            saver,
            other,
            screenSaver: saver,
            _activePage: other,
            pages: [other, undefined],
            navigation: { resetPosition: () => calls.push('resetPosition') },
            library: {
                writedp: async (id: string, val: unknown): Promise<void> => {
                    calls.push(`write ${id} ${String(val)}`);
                    return Promise.resolve();
                },
            },
            setActivePage: async (page: unknown): Promise<void> => {
                calls.push(page === saver ? 'show' : 'other');
                return Promise.resolve();
            },
        });
        return panel;
    }

    it('the core does what the end of the timeout does', async () => {
        const p = panelWith();
        await p.showScreensaverNow();
        expect(p.calls).to.deep.equal(['show', 'resetPosition', 'reset']);
    });

    it('on request: nothing offline, nothing when it is on the display, again after a popup on it', async () => {
        const off = panelWith(false);
        await off.activateScreensaver();
        expect(off.calls).to.deep.equal([]);

        const on = panelWith();
        on._activePage = on.saver;
        await on.activateScreensaver();
        expect(on.calls).to.deep.equal([]);
        on.saver.sleep = true;
        await on.activateScreensaver();
        expect(on.calls[0]).to.equal('show');
    });

    it('the state: true shows it and is confirmed, false only confirms', async () => {
        const id = 'panels.p.cmd.screenSaver.activate';
        const p = panelWith();
        await p.onStateChange(id, { val: true, ack: false });
        expect(p.calls).to.deep.equal(['show', 'resetPosition', 'reset', `write ${id} false`]);
        const q = panelWith();
        await q.onStateChange(id, { val: false, ack: false });
        expect(q.calls).to.deep.equal([`write ${id} false`]);
        const r = panelWith();
        await r.onStateChange(id, { val: true, ack: true });
        expect(r.calls).to.deep.equal([]);
    });

    it('the state is a writeable button', () => {
        expect(genericStateObjects.panel.panels.cmd.screenSaver.activate.common).to.include({
            role: 'button',
            type: 'boolean',
            write: true,
        });
    });
});
