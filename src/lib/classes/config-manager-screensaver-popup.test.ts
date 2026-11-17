/**
 * Long press of a screensaver indicator that opens a popup (ScreensaverEntityLongPressPopup): the config manager builds
 * the page item of the channel / device above the state like a page item of that channel, appends it behind all other
 * items without a place and gives the indicator its index (`longPressPopup`).
 */
import { expect } from 'chai';
import { StatesControler } from '../controller/states-controller';
import { ConfigManager } from './config-manager';
import { screensaverItemToScript } from '../configuration/admin-screensaver-item';
import { isScreensaverPopupChannelRole } from '../types/adminShareConfig';

type ObjectDB = Record<string, ioBroker.Object>;

const BLIND = 'alias.0.kueche.Rollladen';
const LIGHT = 'alias.0.kueche.Licht';
const INFO = 'alias.0.kueche.Info';

function state(id: string, common: Partial<ioBroker.StateCommon>): ioBroker.Object {
    return {
        _id: id,
        type: 'state',
        common: { name: id.split('.').pop() ?? id, read: true, write: true, type: 'number', role: 'state', ...common },
        native: {},
    };
}

function channel(id: string, role: string, name: string): ioBroker.Object {
    return { _id: id, type: 'channel', common: { name, role }, native: {} };
}

function database(): ObjectDB {
    return {
        [BLIND]: channel(BLIND, 'blind', 'Rollladen Küche'),
        [`${BLIND}.ACTUAL`]: state(`${BLIND}.ACTUAL`, { role: 'value.blind', unit: '%' }),
        [`${BLIND}.SET`]: state(`${BLIND}.SET`, { role: 'level.blind' }),
        [`${BLIND}.CLOSE`]: state(`${BLIND}.CLOSE`, { role: 'button.close.blind', type: 'boolean' }),
        [`${BLIND}.OPEN`]: state(`${BLIND}.OPEN`, { role: 'button.open.blind', type: 'boolean' }),
        [`${BLIND}.STOP`]: state(`${BLIND}.STOP`, { role: 'button.stop.blind', type: 'boolean' }),
        [`${BLIND}.TILT_OPEN`]: state(`${BLIND}.TILT_OPEN`, { role: 'button.open.tilt', type: 'boolean' }),
        [`${BLIND}.TILT_CLOSE`]: state(`${BLIND}.TILT_CLOSE`, { role: 'button.close.tilt', type: 'boolean' }),
        [`${BLIND}.TILT_STOP`]: state(`${BLIND}.TILT_STOP`, { role: 'button.stop.tilt', type: 'boolean' }),
        [LIGHT]: channel(LIGHT, 'light', 'Licht Küche'),
        [`${LIGHT}.SET`]: state(`${LIGHT}.SET`, { role: 'switch.light', type: 'boolean' }),
        [`${LIGHT}.ON_ACTUAL`]: state(`${LIGHT}.ON_ACTUAL`, { role: 'sensor.light', type: 'boolean', write: false }),
        [INFO]: channel(INFO, 'info', 'Info'),
        [`${INFO}.ACTUAL`]: state(`${INFO}.ACTUAL`, { role: 'state', type: 'string', write: false }),
        'alias.0.kueche.Taster': state('alias.0.kueche.Taster', { role: 'button', type: 'boolean' }),
    };
}

function fakeAdapter(warnings: string[]): any {
    const noop = (): void => undefined;
    const objects = database();
    return {
        namespace: 'nspanel-lovelace-ui.0',
        language: 'de',
        unload: false,
        library: { getLocalLanguage: (): string => 'de' },
        log: { silly: noop, debug: noop, info: noop, warn: (m: string): number => warnings.push(m), error: noop },
        config: { panels: [], testCase: false, shutterClosedIsZero: false },
        setInterval: (): number => 1,
        clearInterval: noop,
        setTimeout: (): number => 1,
        clearTimeout: noop,
        getForeignObjectAsync: async (id: string): Promise<ioBroker.Object | null> =>
            objects[id] ? structuredClone(objects[id]) : null,
        getForeignObjectsAsync: async (): Promise<ObjectDB> => structuredClone(objects),
        getEnumsAsync: async (): Promise<Record<string, Record<string, never>>> => ({
            'enum.rooms': {},
            'enum.functions': {},
        }),
        getForeignStateAsync: async (): Promise<null> => null,
        getForeignStatesAsync: async (): Promise<Record<string, never>> => ({}),
        getStateAsync: async (): Promise<null> => null,
        getObjectViewAsync: async (): Promise<{ rows: never[] }> => ({ rows: [] }),
        subscribeForeignStatesAsync: async (): Promise<void> => undefined,
        unsubscribeForeignStatesAsync: async (): Promise<void> => undefined,
    };
}

function manager(warnings: string[] = []): ConfigManager {
    StatesControler.TempObjectDB = { data: undefined, keys: [], enums: undefined };
    StatesControler.tempObjectDBTimeout = undefined;
    return new ConfigManager(fakeAdapter(warnings), true);
}

const script = (entity: Partial<ScriptConfig.ScreenSaverElement>): ScriptConfig.ScreenSaverElement =>
    ({ type: 'script', ScreensaverEntityText: '', ...entity }) as ScriptConfig.ScreenSaverElement;

describe('lib/classes/config-manager - popup on a long press of an indicator', () => {
    it('the page item of the light channel above the state', async () => {
        const item: any = await manager().getScreensaverIndicatorPopup(
            script({ ScreensaverEntity: `${LIGHT}.ON_ACTUAL`, ScreensaverEntityLongPressPopup: true }),
        );
        expect(item?.type).to.equal('light');
        expect(item?.modeScr).to.equal(undefined);
    });

    it('the blind channel itself as ScreensaverEntity: the popup of that channel', async () => {
        const item: any = await manager().getScreensaverIndicatorPopup(
            script({ ScreensaverEntity: BLIND, ScreensaverEntityLongPressPopup: true }),
        );
        expect(item?.type).to.equal('shutter2');
        expect(item?.role).to.equal('blind');
    });

    it('a channel as ScreensaverEntity or dpInit is the device itself, not the object above it', async () => {
        const fromScript: any = await manager().getScreensaverIndicatorPopup(
            script({ ScreensaverEntity: LIGHT, ScreensaverEntityLongPressPopup: true }),
        );
        expect(fromScript?.type).to.equal('light');
        const fromTemplate: any = await manager().getScreensaverIndicatorPopup({
            type: 'template',
            template: 'text.window.isOpen',
            dpInit: BLIND,
            modeScr: 'indicator',
            ScreensaverEntityLongPressPopup: true,
        });
        expect(fromTemplate?.type).to.equal('shutter2');
        const warnings: string[] = [];
        expect(
            await manager(warnings).getScreensaverIndicatorPopup(
                script({ ScreensaverEntity: INFO, ScreensaverEntityLongPressPopup: true }),
            ),
        ).to.equal(null);
        expect(warnings.some(w => w.includes(`the channel ${INFO} `))).to.equal(true);
    });

    it('a blind with tilt states: the new popup (shutter2) for the indicator, a page item stays shutter', async () => {
        const item: any = await manager().getScreensaverIndicatorPopup(
            script({ ScreensaverEntity: `${BLIND}.ACTUAL`, ScreensaverEntityLongPressPopup: true }),
        );
        expect(item?.type).to.equal('shutter2');
        expect(item?.role).to.equal('blind');
        const page: ScriptConfig.PageEntities = { type: 'cardEntities', uniqueName: '', heading: '', items: [] };
        const { itemConfig } = await manager().getPageItemConfig({ id: BLIND }, page);
        expect(itemConfig?.type).to.equal('shutter');
    });

    it('a template element takes the channel above dpInit', async () => {
        const item: any = await manager().getScreensaverIndicatorPopup({
            type: 'template',
            template: 'text.window.isOpen',
            dpInit: `${BLIND}.ACTUAL`,
            modeScr: 'indicator',
            ScreensaverEntityLongPressPopup: true,
        });
        expect(item?.type).to.equal('shutter2');
    });

    it('nothing without the field, with another long press or for a channel without popup', async () => {
        expect(
            await manager().getScreensaverIndicatorPopup(script({ ScreensaverEntity: `${LIGHT}.ON_ACTUAL` })),
        ).to.equal(null);
        expect(
            await manager().getScreensaverIndicatorPopup(
                script({
                    ScreensaverEntity: `${LIGHT}.ON_ACTUAL`,
                    ScreensaverEntityLongPressPopup: true,
                    ScreensaverEntityLongPressNaviToPage: 'kueche',
                }),
            ),
        ).to.equal(null);
        const warnings: string[] = [];
        expect(
            await manager(warnings).getScreensaverIndicatorPopup(
                script({ ScreensaverEntity: `${INFO}.ACTUAL`, ScreensaverEntityLongPressPopup: true }),
            ),
        ).to.equal(null);
        expect(warnings.some(w => w.includes('has no popup'))).to.equal(true);
    });

    it('a state without channel above it: a warning, no popup', async () => {
        const warnings: string[] = [];
        expect(
            await manager(warnings).getScreensaverIndicatorPopup(
                script({ ScreensaverEntity: 'alias.0.kueche.Taster', ScreensaverEntityLongPressPopup: true }),
            ),
        ).to.equal(null);
        expect(warnings.some(w => w.includes('no channel or device'))).to.equal(true);
    });

    it('getScreensaverConfig: the item comes behind all others without a place, the indicator knows its index', async () => {
        const { configArray } = await manager().getScreensaverConfig({
            indicatorScreensaverEntity: [
                script({ ScreensaverEntity: `${INFO}.ACTUAL` }),
                script({ ScreensaverEntity: `${LIGHT}.ON_ACTUAL`, ScreensaverEntityLongPressPopup: true }),
            ],
        } as unknown as ScriptConfig.Config);
        const items: any[] = configArray.pageItems ?? [];
        const indicators = items.filter(i => i.modeScr === 'indicator');
        expect(indicators).to.have.length(2);
        expect(indicators[0].longPressPopup).to.equal(undefined);
        const index = indicators[1].longPressPopup;
        expect(index).to.equal(items.length - 1);
        expect(items[index].type).to.equal('light');
        expect(items[index].modeScr).to.equal(undefined);
    });
});

describe('lib/configuration/admin-screensaver-item - long press popup', () => {
    it('kind popup becomes ScreensaverEntityLongPressPopup', () => {
        const e = screensaverItemToScript({ state: `${LIGHT}.ON_ACTUAL`, longPress: { kind: 'popup' } }, 'indicator');
        expect(e.type === 'script' && e.ScreensaverEntityLongPressPopup).to.equal(true);
        const bottom = screensaverItemToScript({ state: `${LIGHT}.ON_ACTUAL`, longPress: { kind: 'popup' } }, 'bottom');
        expect(bottom.type === 'script' && bottom.ScreensaverEntityLongPressPopup).to.equal(undefined);
    });

    it('the channel roles with a popup', () => {
        for (const role of ['light', 'dimmer', 'ct', 'rgb', 'rgbSingle', 'hue', 'blind', 'lock']) {
            expect(isScreensaverPopupChannelRole(role), role).to.equal(true);
        }
        for (const role of ['level.mode.fan', 'select', 'level.timer']) {
            expect(isScreensaverPopupChannelRole(role), role).to.equal(true);
        }
        for (const role of ['info', 'socket', 'button', 'gate', 'thermostat', '', undefined]) {
            expect(isScreensaverPopupChannelRole(role), String(role)).to.equal(false);
        }
    });
});
