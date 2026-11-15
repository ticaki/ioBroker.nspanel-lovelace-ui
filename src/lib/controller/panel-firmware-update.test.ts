/**
 * The adapter sets `info.nspanel.firmwareUpdate` to 0 before it sends a TFT flash (onMqttConnect then
 * restarts no panel in the middle of a flash). A startup event of the display means its normal firmware
 * runs again, so a flash that never started must not leave the value below 100.
 * Panel.HandleIncomingMessage with a bare Panel prototype, ended by the model check (clone: missing start page).
 */
import { expect } from 'chai';
import { Panel } from './panel';
import type * as Types from '../types/types';

const FW_DP = 'panels.A0.info.nspanel.firmwareUpdate';

function setup(
    firmwareUpdate: number | undefined,
    clone = false,
): { panel: Panel; writes: Array<[string, unknown]>; removed: string[] } {
    const writes: Array<[string, unknown]> = [];
    const removed: string[] = [];
    const noop = (): void => undefined;
    const panel = Object.create(Panel.prototype) as Panel;
    Object.assign(panel, {
        name: 'A0',
        topic: 'nspanel/A0',
        _isOnline: true,
        initDone: true,
        blockStartup: null,
        screenSaver: {},
        panelSend: {},
        options: clone ? { kind: 'web', sourceTopic: 'nspanel/A0' } : { kind: 'nspanel' },
        info: { nspanel: { model: 'eu' }, tasmota: { safeboot: false } },
        resetDisplayDiagnosis: noop,
        setSafeboot: (): boolean => false,
        setStatus: async (): Promise<void> => Promise.resolve(),
        // a web clone passes the model check and stops at the missing start page
        writeInfo: async (): Promise<void> => Promise.resolve(),
        sendDimmode: noop,
        navigation: { resetPosition: noop, getCurrentMainPage: (): undefined => undefined },
        controller: {
            removePanel: async (): Promise<void> => {
                removed.push('A0');
                return Promise.resolve();
            },
        },
        library: {
            readdb: (dp: string): { val: number } | undefined =>
                dp === FW_DP && firmwareUpdate !== undefined ? { val: firmwareUpdate } : undefined,
            writedp: async (dp: string, val: unknown): Promise<void> => {
                writes.push([dp, val]);
                return Promise.resolve();
            },
        },
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        adapter: {
            config: { debugLogMqtt: false },
            unload: false,
            setTimeout: (): number => 1,
            clearTimeout: noop,
        },
    });
    return { panel, writes, removed };
}

/**
 * A startup event with another model than configured, so the handler stops after the model check.
 *
 * @param panel the panel
 * @returns the event
 */
function startup(panel: Panel): Types.IncomingEvent {
    const result = (panel as any).convertToEvent(
        JSON.stringify({ CustomRecv: 'event,startup,61,us-p' }),
    ) as Types.IncomingEvent | null;
    expect(result).to.not.equal(null);
    return result!;
}

describe('lib/controller/panel - firmwareUpdate after startup', () => {
    it('sets a value below 100 back to 100 (flash never started)', async () => {
        const { panel, writes, removed } = setup(0);
        await panel.HandleIncomingMessage(startup(panel));
        expect(removed).to.deep.equal(['A0']);
        expect(writes).to.deep.equal([[FW_DP, 100]]);
    });

    it('leaves 100 and a missing state alone', async () => {
        for (const value of [100, undefined]) {
            const { panel, writes } = setup(value);
            await panel.HandleIncomingMessage(startup(panel));
            expect(writes, String(value)).to.deep.equal([]);
        }
    });

    it('a web clone does not touch the state of its hardware panel', async () => {
        const { panel, writes } = setup(0, true);
        await panel.HandleIncomingMessage(startup(panel));
        expect(writes).to.deep.equal([]);
    });
});
