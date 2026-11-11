/**
 * Every panel appends the system navigation (`systemNavigation`) to its own nodes. The node objects are
 * module-level and shared by all panels; Navigation.init() patches the `///service` node with the node
 * that points to it. That patch must stay inside the panel - otherwise a later panel without its own
 * link to `///service` took over the arrows of another panel ("Didn't find a navigation node ...").
 */
import { expect } from 'chai';
import { Navigation, type NavigationItemConfig } from './navigation';
import { systemNavigation } from '../templates/system-templates';
import { serviceNodeName } from '../types/adminShareConfig';

const noop = (): void => undefined;

interface Fixture {
    nav: any;
    warnings: string[];
}

function setup(name: string, nodes: NavigationItemConfig[]): Fixture {
    const warnings: string[] = [];
    const pages: Record<string, unknown> = {};
    const panel: any = {
        name,
        friendlyName: name,
        getPagebyUniqueID: (id: string): unknown => {
            pages[id] ??= { name: id, id, hidden: false };
            return pages[id];
        },
    };
    const adapter: any = {
        log: { silly: noop, debug: noop, info: noop, warn: (m: string) => warnings.push(m), error: noop },
        library: { writedp: async (): Promise<void> => Promise.resolve() },
        config: {},
        getObjectAsync: async (): Promise<unknown> => Promise.resolve({ native: {} }),
        setObject: async (): Promise<void> => Promise.resolve(),
    };
    // like Panel: own nodes plus the shared system nodes, the array is copied, the nodes are not
    const nav: any = new Navigation({ adapter, panel, navigationConfig: nodes.concat(systemNavigation) });
    nav.log = adapter.log;
    nav.library = adapter.library;
    return { nav, warnings };
}

/** panel A: two own nodes lead to the service page from both sides */
const panelA = (): NavigationItemConfig[] => [
    { name: 'main', page: 'main', right: { single: 'a1' } },
    { name: 'a1', page: 'a1', left: { single: 'main' }, right: { single: serviceNodeName } },
    { name: 'a2', page: 'a2', left: { single: serviceNodeName } },
];
/** panel B: only the start page leads to the service page */
const panelB = (): NavigationItemConfig[] => [{ name: 'main', page: 'main', right: { single: serviceNodeName } }];
/** panel C: nothing leads to the service page */
const panelC = (): NavigationItemConfig[] => [{ name: 'main', page: 'main' }];

/**
 * names the arrows of the service node resolve to
 *
 * @param nav navigation of the panel, after init()
 */
function serviceArrows(nav: any): { left?: string; right?: string } {
    const config: { name: string }[] = nav.navigationConfig;
    const index = config.findIndex(n => n.name === serviceNodeName);
    const entry = nav.getDatabase()[index];
    const name = (i: number | undefined): string | undefined => (i === undefined ? undefined : config[i].name);
    return { left: name(entry.left.single), right: name(entry.right.single) };
}

function expectNoForeignNames(warnings: string[]): void {
    for (const w of warnings) {
        expect(w).to.not.match(/"a1"|"a2"/);
    }
    expect(warnings).to.deep.equal([]);
}

describe('lib/classes/navigation - shared system nodes', () => {
    let template: NavigationItemConfig[];
    beforeEach(() => {
        template = structuredClone(systemNavigation);
    });
    afterEach(() => {
        expect(systemNavigation).to.deep.equal(template);
    });

    it('panels built one after another keep their own service arrows', async () => {
        const a = setup('A', panelA());
        await a.nav.init();
        const b = setup('B', panelB());
        await b.nav.init();
        const c = setup('C', panelC());
        await c.nav.init();

        expect(serviceArrows(a.nav)).to.deep.equal({ left: 'a1', right: 'a2' });
        expect(serviceArrows(b.nav)).to.deep.equal({ left: 'main', right: undefined });
        expect(serviceArrows(c.nav)).to.deep.equal({ left: 'main', right: undefined });
        expectNoForeignNames(a.warnings);
        expectNoForeignNames(b.warnings);
        expectNoForeignNames(c.warnings);
    });

    it('panels built in parallel keep their own service arrows', async () => {
        const a = setup('A', panelA());
        const b = setup('B', panelB());
        const c = setup('C', panelC());
        await Promise.all([a.nav.init(), b.nav.init(), c.nav.init()]);

        expect(serviceArrows(a.nav)).to.deep.equal({ left: 'a1', right: 'a2' });
        expect(serviceArrows(b.nav)).to.deep.equal({ left: 'main', right: undefined });
        expect(serviceArrows(c.nav)).to.deep.equal({ left: 'main', right: undefined });
        expectNoForeignNames(b.warnings);
        expectNoForeignNames(c.warnings);
    });

    it('the system navigation template is not changed', async () => {
        const a = setup('A', panelA());
        await a.nav.init();
        expect(systemNavigation).to.deep.equal(template);
    });
});
