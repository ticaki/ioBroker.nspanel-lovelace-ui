/**
 * A blind as screensaver element (ConfigManager.getEntityData): the position of a blind gets the icon by
 * position, is shown in % with the scaling of a blind page item and gets the role `blind`, so a tap never
 * moves it (PageItem.onCommand).
 */
import { expect } from 'chai';
import { StatesControler } from '../controller/states-controller';
import { ConfigManager } from './config-manager';
import { SHUTTER_POSITION_ICON, pageItemDefaults } from '../const/page-item-defaults';
import { Color } from '../const/Color';
import { screensaverItemToScript } from '../configuration/admin-screensaver-item';
import type { NSPanel } from '../types/NSPanel';

type ObjectDB = Record<string, ioBroker.Object>;

const CHANNEL = 'alias.0.zuhause.og.Kueche.Kueche_Rollladen';

function state(id: string, common: Partial<ioBroker.StateCommon>): ioBroker.Object {
    return {
        _id: id,
        type: 'state',
        common: { name: id.split('.').pop() ?? id, read: true, write: true, type: 'number', role: 'state', ...common },
        native: {},
    };
}

function database(): ObjectDB {
    return {
        [CHANNEL]: {
            _id: CHANNEL,
            type: 'channel',
            common: { name: 'Küche Rollladen', role: 'blind' },
            native: {},
        },
        [`${CHANNEL}.ACTUAL`]: state(`${CHANNEL}.ACTUAL`, { role: 'value.blind', unit: '%' }),
        [`${CHANNEL}.SET`]: state(`${CHANNEL}.SET`, { role: 'level.blind' }),
        [`${CHANNEL}.TILT_ACTUAL`]: state(`${CHANNEL}.TILT_ACTUAL`, { role: 'value.tilt' }),
        'alias.0.wetter.Temperatur': state('alias.0.wetter.Temperatur', { role: 'value.temperature', unit: '°C' }),
    };
}

function fakeAdapter(shutterClosedIsZero: boolean): any {
    const noop = (): void => undefined;
    const objects = database();
    return {
        namespace: 'nspanel-lovelace-ui.0',
        language: 'de',
        unload: false,
        library: { getLocalLanguage: (): string => 'de' },
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        config: { panels: [], testCase: false, shutterClosedIsZero },
        setInterval: (): number => 1,
        clearInterval: noop,
        setTimeout: (): number => 1,
        clearTimeout: noop,
        getForeignObjectAsync: async (id: string): Promise<ioBroker.Object | null> =>
            objects[id] ? structuredClone(objects[id]) : null,
        getForeignObjectsAsync: async (): Promise<ObjectDB> => structuredClone(objects),
        getForeignStateAsync: async (): Promise<null> => null,
        subscribeForeignStatesAsync: async (): Promise<void> => undefined,
        unsubscribeForeignStatesAsync: async (): Promise<void> => undefined,
    };
}

const colors = { defaultOnColor: { red: 1, green: 2, blue: 3 }, defaultOffColor: { red: 4, green: 5, blue: 6 } };

async function entityData(
    entity: Partial<ScriptConfig.ScreenSaverElement>,
    mode: NSPanel.ScreenSaverPlaces,
    shutterClosedIsZero = false,
): Promise<any> {
    StatesControler.TempObjectDB = { data: undefined, keys: [], enums: undefined };
    StatesControler.tempObjectDBTimeout = undefined;
    const manager = new ConfigManager(fakeAdapter(shutterClosedIsZero), true);
    return manager.getEntityData({ type: 'script', ...entity } as ScriptConfig.ScreenSaverElement, mode, colors);
}

describe('lib/classes/config-manager - blind as screensaver element', () => {
    it('bottom: icon by position, value in % inverted like a page item, role blind, blind colors', async () => {
        const r = await entityData({ ScreensaverEntity: `${CHANNEL}.ACTUAL` }, 'bottom');
        expect(r.type).to.equal('text');
        expect(r.role).to.equal('blind');
        expect(r.data.icon.true.value).to.deep.equal({ type: 'const', constVal: SHUTTER_POSITION_ICON });
        expect(r.data.icon.true.color).to.deep.equal({
            type: 'const',
            constVal: Color[pageItemDefaults.blind.colorOn],
        });
        expect(r.data.icon.false.color).to.deep.equal({
            type: 'const',
            constVal: Color[pageItemDefaults.blind.colorOff],
        });
        for (const e of [r.data.entity1, r.data.entity2]) {
            // shutterClosedIsZero off: the panel shows 100 - value
            expect(e.minScale).to.deep.equal({ type: 'const', constVal: 100 });
            expect(e.maxScale).to.deep.equal({ type: 'const', constVal: 0 });
            expect(e.unit).to.deep.equal({ type: 'const', constVal: '%' });
            expect(e.decimal).to.deep.equal({ type: 'const', constVal: 0 });
        }
        expect(r.data.entity1.value).to.deep.equal({ type: 'triggered', dp: `${CHANNEL}.ACTUAL` });
    });

    it('shutterClosedIsZero: the value is not inverted', async () => {
        const r = await entityData({ ScreensaverEntity: `${CHANNEL}.ACTUAL` }, 'left', true);
        expect(r.data.entity2.minScale).to.deep.equal({ type: 'const', constVal: 0 });
        expect(r.data.entity2.maxScale).to.deep.equal({ type: 'const', constVal: 100 });
    });

    it('the blind channel stands for its ACTUAL', async () => {
        const r = await entityData({ ScreensaverEntity: CHANNEL }, 'favorit');
        expect(r.role).to.equal('blind');
        expect(r.data.entity1.value).to.deep.equal({ type: 'triggered', dp: `${CHANNEL}.ACTUAL` });
        expect(r.data.entity2.value).to.deep.equal({ type: 'state', dp: `${CHANNEL}.ACTUAL` });
    });

    it('own icon, unit and colors win', async () => {
        const r = await entityData(
            {
                ScreensaverEntity: `${CHANNEL}.SET`,
                ScreensaverEntityIconOn: 'blinds',
                ScreensaverEntityUnitText: ' %',
                ScreensaverEntityOnColor: { red: 9, green: 9, blue: 9 },
            },
            'bottom',
        );
        expect(r.role).to.equal('blind');
        expect(r.data.icon.true.value).to.deep.equal({ type: 'const', constVal: 'blinds' });
        expect(r.data.icon.true.color).to.deep.equal({ type: 'const', constVal: { r: 9, g: 9, b: 9 } });
        expect(r.data.entity2.unit).to.deep.equal({ type: 'const', constVal: ' %' });
    });

    it('indicator without action: a button with role blind and nothing to write', async () => {
        const r = await entityData({ ScreensaverEntity: `${CHANNEL}.ACTUAL` }, 'indicator');
        expect(r.type).to.equal('button');
        expect(r.role).to.equal('blind');
        expect(r.data.setValue1).to.equal(undefined);
        expect(r.data.setValue2).to.equal(undefined);
        expect(r.data.setNavi).to.equal(undefined);
        expect(r.data.icon.true.value).to.deep.equal({ type: 'const', constVal: SHUTTER_POSITION_ICON });
    });

    it('indicator with navigation keeps its action', async () => {
        const r = await entityData(
            { ScreensaverEntity: `${CHANNEL}.ACTUAL`, ScreensaverEntityNaviToPage: 'kueche' },
            'indicator',
        );
        expect(r.data.setNavi).to.deep.equal({ type: 'const', constVal: 'kueche' });
    });

    it('the tilt and other states stay as they were', async () => {
        const tilt = await entityData({ ScreensaverEntity: `${CHANNEL}.TILT_ACTUAL` }, 'bottom');
        expect(tilt.role).to.equal(undefined);
        const temp = await entityData({ ScreensaverEntity: 'alias.0.wetter.Temperatur' }, 'bottom');
        expect(temp.role).to.equal(undefined);
        expect(temp.data.entity1.minScale).to.equal(undefined);
        expect(temp.data.icon?.true?.value).to.equal(undefined);
        expect(temp.data.entity2.unit).to.deep.equal({ type: 'const', constVal: '°C' });
    });
});

describe('lib/configuration/admin-screensaver-item - blind', () => {
    it('a blind without icons gets the icon by position', () => {
        const e = screensaverItemToScript({ state: `${CHANNEL}.ACTUAL` }, 'indicator', {
            role: 'value.blind',
            channelRole: 'blind',
            type: 'number',
        });
        expect(e.type === 'script' && e.ScreensaverEntityIconOn).to.equal(SHUTTER_POSITION_ICON);
    });

    it('an own icon stays, other states keep the role defaults', () => {
        const own = screensaverItemToScript({ state: `${CHANNEL}.ACTUAL`, iconOn: 'blinds' }, 'bottom', {
            role: 'value.blind',
            channelRole: 'blind',
            type: 'number',
        });
        expect(own.type === 'script' && own.ScreensaverEntityIconOn).to.equal('blinds');
        const tilt = screensaverItemToScript({ state: `${CHANNEL}.TILT_ACTUAL` }, 'bottom', {
            role: 'value.tilt',
            channelRole: 'blind',
            type: 'number',
        });
        expect(tilt.type === 'script' && tilt.ScreensaverEntityIconOn).to.equal(pageItemDefaults.blind.iconOn);
    });
});
