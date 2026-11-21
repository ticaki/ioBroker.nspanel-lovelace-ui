import { expect } from 'chai';
import { Panel } from './panel';
import type * as Types from '../types/types';

/**
 * `cmd.pagePopup.activate` collects the popup details from the state database. The test drives the
 * handler on a prototype-based Panel with a stubbed readdb and catches the details on their way to the
 * internal state `cmd/popupNotificationCustom` - no adapter, no constructor side effects.
 *
 * @param db state values by id, a missing key stands for a state readdb does not know yet
 * @returns the panel and the details handed to the internal state
 */
function withDb(db: Record<string, { val: unknown } | undefined>): {
    panel: Panel;
    details: Record<string, unknown>[];
    writes: string[];
} {
    const details: Record<string, unknown>[] = [];
    const writes: string[] = [];
    const panel = Object.create(Panel.prototype) as Panel;
    Object.assign(panel, {
        name: 'NSPanel1',
        library: {
            readdb: (id: string): { val: unknown } | undefined => db[id],
            writedp: async (id: string, val: unknown, _obj: unknown, ack = true): Promise<void> => {
                writes.push(`${id} ${String(val)} ${String(ack)}`);
                return Promise.resolve();
            },
        },
        statesControler: {
            setInternalState: async (_id: string, val: string): Promise<void> => {
                details.push(JSON.parse(val));
                return Promise.resolve();
            },
        },
        controller: { panels: [] },
    });
    return { panel, details, writes };
}

describe('Panel.onStateChange - cmd.pagePopup.activate', () => {
    const activate = (panel: Panel, val: boolean = true): Promise<void> => {
        const state: Types.nsPanelState = { val, ack: false, ts: 0, lc: 0, from: '', q: 0 };
        return panel.onStateChange('panels.NSPanel1.cmd.pagePopup.activate', state);
    };

    it('falls back to text size 3 when the textSize state is not known yet', async () => {
        const { panel, details } = withDb({});
        await activate(panel);
        expect(details).to.have.length(1);
        expect(details[0].textSize).to.equal('3');
    });

    it('keeps the configured text size', async () => {
        const { panel, details } = withDb({ 'panels.NSPanel1.cmd.pagePopup.textSize': { val: 5 } });
        await activate(panel);
        expect(details[0].textSize).to.equal('5');
    });

    it('fires on every write without ack and resets the button to false with ack', async () => {
        for (const val of [true, false]) {
            const { panel, details, writes } = withDb({});
            await activate(panel, val);
            expect(details).to.have.length(1);
            expect(writes).to.deep.equal(['panels.NSPanel1.cmd.pagePopup.activate false true']);
        }
    });
});

describe('Panel.onStateChange - cmd.buttons.left/right', () => {
    for (const side of ['left', 'right'] as const) {
        it(`${side}: fires on every write without ack and resets the button to false with ack`, async () => {
            for (const val of [true, false]) {
                const { panel, writes } = withDb({});
                const state: Types.nsPanelState = { val, ack: false, ts: 0, lc: 0, from: '', q: 0 };
                await panel.onStateChange(`panels.NSPanel1.cmd.buttons.${side}`, state);
                expect(writes).to.deep.equal([
                    `panels.NSPanel1.buttons.${side} true true`,
                    `panels.NSPanel1.cmd.buttons.${side} false true`,
                ]);
            }
        });
    }
});
