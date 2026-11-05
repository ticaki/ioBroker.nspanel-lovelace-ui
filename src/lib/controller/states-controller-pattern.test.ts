import { expect } from 'chai';
import { StatesControler } from './states-controller';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';

describe('lib/controller/states-controller - subscriptions by pattern', () => {
    function setup(): { states: StatesControler; subscribed: string[]; unsubscribed: string[] } {
        const subscribed: string[] = [];
        const unsubscribed: string[] = [];
        const noop = (): void => undefined;
        const adapter = {
            namespace: 'nspanel-lovelace-ui.0',
            log: { debug: noop, info: noop, warn: noop, error: noop },
            library: {},
            config: {},
            setInterval: (): undefined => undefined,
            clearInterval: noop,
            subscribeForeignStatesAsync: async (p: string): Promise<void> => void subscribed.push(p),
            unsubscribeForeignStatesAsync: async (p: string): Promise<void> => void unsubscribed.push(p),
        } as unknown as NspanelLovelaceUi;
        return { states: new StatesControler(adapter), subscribed, unsubscribed };
    }

    const state = (val: unknown, ack = true): ioBroker.State => ({ val, ack }) as unknown as ioBroker.State;

    it('subscribes a pattern once and ends it with its last listener', async () => {
        const { states, subscribed, unsubscribed } = setup();
        const a = (): void => undefined;
        const b = (): void => undefined;
        await states.subscribePattern('x.0.*.aktiv', a);
        await states.subscribePattern('x.0.*.aktiv', b);
        await states.subscribePattern('x.0.*.aktiv', b);
        expect(subscribed).to.deep.equal(['x.0.*.aktiv']);
        await states.unsubscribePattern('x.0.*.aktiv', a);
        expect(unsubscribed).to.deep.equal([]);
        await states.unsubscribePattern('x.0.*.aktiv', b);
        expect(unsubscribed).to.deep.equal(['x.0.*.aktiv']);
        await states.unsubscribePattern('x.0.*.aktiv', b);
        expect(unsubscribed).to.have.length(1);
    });

    it('hands over matching states, also of slots that appear later, and deleted ones', async () => {
        const { states } = setup();
        const got: [string, unknown][] = [];
        await states.subscribePattern('x.0.*.aktiv', (id, s) => void got.push([id, s ? s.val : null]));
        await states.onStateChange('x.0.neu.aktiv', state(true));
        await states.onStateChange('x.0.neu.targetTs', state(5));
        await states.onStateChange('x.0.aktiv', state(true));
        await states.onStateChange('x.0.neu.aktiv', state(false, false));
        states.onStateDeleted('x.0.neu.aktiv');
        states.onStateDeleted('y.0.neu.aktiv');
        expect(got).to.deep.equal([
            ['x.0.neu.aktiv', true],
            ['x.0.neu.aktiv', null],
        ]);
    });

    it('takes the unconfirmed value of the states of the user and of aliases like the triggers', async () => {
        const { states } = setup();
        const got: string[] = [];
        await states.subscribePattern('0_userdata.0.*.aktiv', id => void got.push(id));
        await states.onStateChange('0_userdata.0.t.aktiv', state(true, false));
        expect(got).to.deep.equal(['0_userdata.0.t.aktiv']);
    });

    it('takes the special characters of a pattern literally', async () => {
        const { states } = setup();
        const got: string[] = [];
        await states.subscribePattern('x.0.(a).*', id => void got.push(id));
        await states.onStateChange('x.0.(a).1', state(1));
        await states.onStateChange('x.0.a.1', state(1));
        await states.onStateChange('x_0.(a).1', state(1));
        expect(got).to.deep.equal(['x.0.(a).1']);
    });
});
