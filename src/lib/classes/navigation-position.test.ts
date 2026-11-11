/**
 * `currentItem` writes `panels.<name>.cmd.goToNavigationPoint` without waiting. Two startups of a new web
 * panel set it twice in a row while the state does not exist yet - the second write must not throw
 * (it did: writedp without object definition, an unhandled rejection stopped the adapter).
 */
import { expect } from 'chai';
import { Navigation } from './navigation';
import { Library } from '../controller/library';
import { genericStateObjects } from '../const/definition';

const noop = (): void => undefined;

function setup(): {
    nav: Navigation;
    lib: Library;
    created: { id: string; states: unknown }[];
    written: unknown[];
    errors: string[];
} {
    const created: { id: string; states: unknown }[] = [];
    const written: unknown[] = [];
    const errors: string[] = [];
    const log = { silly: noop, debug: noop, info: noop, warn: noop, error: (m: string) => void errors.push(m) };
    const adapter: any = {
        name: 'nspanel-lovelace-ui',
        instance: 0,
        FORBIDDEN_CHARS: /[\][*,;'"`<>\\?]/g,
        log,
        config: {},
        // creating the object takes a moment, like the real database
        extendObject: async (id: string, obj: ioBroker.StateObject): Promise<void> => {
            await new Promise(resolve => setTimeout(resolve, 5));
            created.push({ id, states: obj.common.states });
        },
        setState: async (_id: string, state: { val: unknown }): Promise<void> => {
            written.push(state.val);
            return Promise.resolve();
        },
    };
    const lib = Object.create(Library.prototype) as Library;
    Object.assign(lib, {
        adapter,
        log,
        stateDataBase: {},
        forbiddenDirs: [],
        defaults: { updateStateOnChangeOnly: false },
        getTranslationObj: async (key: string): Promise<string> => Promise.resolve(key),
        getTranslationStatesObj: async (states: unknown): Promise<unknown> => Promise.resolve(states),
    });
    adapter.library = lib;
    const panel: any = { name: 'web1', friendlyName: 'web1' };
    const nav = new Navigation({
        adapter,
        panel,
        navigationConfig: [
            { name: 'main', page: 'main', left: {}, right: { single: 'b' } },
            { name: 'b', page: 'b', left: { single: 'main' }, right: {} },
        ],
    });
    (nav as any).log = log;
    (nav as any).library = lib;
    return { nav, lib, created, written, errors };
}

describe('lib/classes/navigation - position datapoint', () => {
    it('two quick writes on a fresh database create the state with its states and do not fail', async () => {
        const f = setup();
        const rejections: unknown[] = [];
        const onRejection = (reason: unknown): void => void rejections.push(reason);
        process.on('unhandledRejection', onRejection);
        try {
            f.nav.currentItem = 0;
            f.nav.currentItem = 1;
            await new Promise(resolve => setTimeout(resolve, 30));
        } finally {
            process.off('unhandledRejection', onRejection);
        }
        expect(rejections).to.deep.equal([]);
        expect(f.errors).to.deep.equal([]);
        expect(f.created.length).to.be.greaterThan(0);
        for (const c of f.created) {
            expect(c.id).to.equal('panels.web1.cmd.goToNavigationPoint');
            expect(c.states).to.be.an('object').that.includes.keys('main', 'b');
        }
        expect(f.lib.readdb('panels.web1.cmd.goToNavigationPoint')?.val).to.equal('b');
    });

    it('a failing write is logged instead of rejecting unhandled', async () => {
        const f = setup();
        (f.lib as any).writedp = async (): Promise<void> => Promise.reject(new Error('boom'));
        const rejections: unknown[] = [];
        const onRejection = (reason: unknown): void => void rejections.push(reason);
        process.on('unhandledRejection', onRejection);
        try {
            f.nav.currentItem = 0;
            await new Promise(resolve => setTimeout(resolve, 10));
        } finally {
            process.off('unhandledRejection', onRejection);
        }
        expect(rejections).to.deep.equal([]);
        expect(f.errors).to.have.length(1);
        expect(f.errors[0]).to.contain('boom');
    });

    it('does not change the shared definition', () => {
        const f = setup();
        f.nav.currentItem = 0;
        expect((f.nav as any).navigationPointObject.common.states).to.include.keys('main', 'b');
        expect(genericStateObjects.panel.panels.cmd.goToNavigationPoint.common.states ?? {}).to.not.have.property('b');
    });
});
