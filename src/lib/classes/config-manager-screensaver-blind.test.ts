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
import { Page } from './Page';
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
        'alias.0.nurLesen': state('alias.0.nurLesen', { role: 'value', write: false }),
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

describe('lib/classes/config-manager - template element', () => {
    const element = {
        type: 'template',
        template: 'text.battery.bydhvs',
        dpInit: 'bydhvs.0',
        readOptions: { min: 5 },
    } as const;
    const WRITABLE = 'alias.0.wetter.Temperatur';

    it('without action nothing changes: no type, no data', async () => {
        const r = await entityData({ ...element, modeScr: 'indicator' }, 'indicator');
        expect(r).to.deep.equal({
            template: 'text.battery.bydhvs',
            dpInit: 'bydhvs.0',
            readOptions: { min: 5 },
            modeScr: 'indicator',
        });
    });

    it('page on an indicator: a button with setNavi, the action field does not reach the runtime item', async () => {
        const r = await entityData(
            { ...element, modeScr: 'indicator', ScreensaverEntityNaviToPage: 'power' },
            'indicator',
        );
        expect(r.type).to.equal('button');
        expect(r.data.setNavi).to.deep.equal({ type: 'const', constVal: 'power' });
        expect(r).to.not.have.property('ScreensaverEntityNaviToPage');
        expect(r.readOptions).to.deep.equal({ min: 5 });
    });

    it('button and switch on an indicator: the first one counts, a state that cannot be written is left out', async () => {
        const both = await entityData(
            { ...element, modeScr: 'indicator', ScreensaverEntityButton: WRITABLE, ScreensaverEntitySwitch: WRITABLE },
            'indicator',
        );
        expect(both.type).to.equal('button');
        expect(both.data.setValue2).to.deep.equal({ type: 'state', dp: WRITABLE });
        expect(both.data.setValue1).to.equal(undefined);
        const sw = await entityData(
            { ...element, modeScr: 'indicator', ScreensaverEntitySwitch: WRITABLE },
            'indicator',
        );
        expect(sw.data.setValue1).to.deep.equal({ type: 'state', dp: WRITABLE });
        const readOnly = await entityData(
            { ...element, modeScr: 'indicator', ScreensaverEntityButton: 'alias.0.nurLesen' },
            'indicator',
        );
        expect(readOnly.type).to.equal('button');
        expect(readOnly.data.setValue2).to.equal(undefined);
    });

    it('cycle on an indicator: state and values as data items, the action fields do not reach the runtime item', async () => {
        const r = await entityData(
            {
                ...element,
                modeScr: 'indicator',
                ScreensaverEntityCycle: WRITABLE,
                ScreensaverEntityCycleValues: [-1, ' 0 ', '', true],
            },
            'indicator',
        );
        expect(r.type).to.equal('button');
        expect(r.data.setValue3).to.deep.equal({ type: 'state', dp: WRITABLE });
        expect(r.data.valueList).to.deep.equal({ type: 'const', constVal: '["-1","0","true"]' });
        expect(r).to.not.have.property('ScreensaverEntityCycle');
        expect(r).to.not.have.property('ScreensaverEntityCycleValues');
        // the template system keeps them
        const page: any = {
            log: { error: (): void => undefined, warn: (): void => undefined },
            getItemFromTemplate: Page.prototype.getItemFromTemplate,
        };
        const item: any = await page.getItemFromTemplate(r);
        expect(item.data.setValue3).to.deep.equal({ type: 'state', dp: WRITABLE });
        expect(item.data.valueList).to.deep.equal({ type: 'const', constVal: '["-1","0","true"]' });
    });

    it('cycle: a state that cannot be written is left out, button and switch come first, no values = no cycle', async () => {
        const readOnly = await entityData(
            {
                ...element,
                modeScr: 'indicator',
                ScreensaverEntityCycle: 'alias.0.nurLesen',
                ScreensaverEntityCycleValues: ['1'],
            },
            'indicator',
        );
        expect(readOnly.data.setValue3).to.equal(undefined);
        expect(readOnly.data.valueList).to.deep.equal({ type: 'const', constVal: '["1"]' });
        const cycle = { ScreensaverEntityCycle: WRITABLE, ScreensaverEntityCycleValues: ['1'] };
        const sw = await entityData(
            { ...element, modeScr: 'indicator', ...cycle, ScreensaverEntitySwitch: WRITABLE },
            'indicator',
        );
        expect(sw.data.setValue1).to.deep.equal({ type: 'state', dp: WRITABLE });
        expect(sw.data.setValue3).to.equal(undefined);
        const navi = await entityData(
            { ...element, modeScr: 'indicator', ...cycle, ScreensaverEntityNaviToPage: 'power' },
            'indicator',
        );
        expect(navi.data.setValue3).to.deep.equal({ type: 'state', dp: WRITABLE });
        expect(navi.data.setNavi).to.equal(undefined);
        const empty = await entityData(
            {
                ...element,
                modeScr: 'indicator',
                ScreensaverEntityCycle: WRITABLE,
                ScreensaverEntityCycleValues: [' '],
                ScreensaverEntityNaviToPage: 'power',
            },
            'indicator',
        );
        expect(empty.data.setValue3).to.equal(undefined);
        expect(empty.data.valueList).to.equal(undefined);
        expect(empty.data.setNavi).to.deep.equal({ type: 'const', constVal: 'power' });
    });

    it('cycle on a script element of the indicator', async () => {
        const r = await entityData(
            {
                ScreensaverEntity: 'alias.0.wetter.Temperatur',
                ScreensaverEntityCycle: WRITABLE,
                ScreensaverEntityCycleValues: [-1, 1],
            },
            'indicator',
        );
        expect(r.type).to.equal('button');
        expect(r.data.setValue3).to.deep.equal({ type: 'state', dp: WRITABLE });
        expect(r.data.valueList).to.deep.equal({ type: 'const', constVal: '["-1","1"]' });
    });

    it('outside the indicator the action is ignored', async () => {
        const r = await entityData({ ...element, modeScr: 'bottom', ScreensaverEntityNaviToPage: 'power' }, 'bottom');
        expect(r).to.deep.equal({
            template: 'text.battery.bydhvs',
            dpInit: 'bydhvs.0',
            readOptions: { min: 5 },
            modeScr: 'bottom',
        });
    });

    it('the template system takes the button: its data stay, setNavi comes along, admin fields are left out', async () => {
        const r = await entityData(
            { ...element, modeScr: 'indicator', ScreensaverEntityNaviToPage: 'power' },
            'indicator',
        );
        const page: any = {
            log: { error: (): void => undefined, warn: (): void => undefined },
            getItemFromTemplate: Page.prototype.getItemFromTemplate,
        };
        const item: any = await page.getItemFromTemplate(r);
        expect(item.type).to.equal('button');
        expect(item.role).to.equal('battery');
        expect(item.data.setNavi).to.deep.equal({ type: 'const', constVal: 'power' });
        expect(item.data.icon.true.value.regexp.source).to.equal('\\.State\\.SOC$');
        expect(item.readOptions).to.deep.equal({ min: 5 });
        expect(item).to.not.have.property('adminOptions');
        expect(item).to.not.have.property('adminLabel');
        expect(item).to.not.have.property('screensaverAreas');
    });
});

describe('lib/classes/config-manager - long press of an indicator', () => {
    const template = {
        type: 'template',
        template: 'text.battery.bydhvs',
        dpInit: 'bydhvs.0',
        modeScr: 'indicator',
    } as const;
    const WRITABLE = 'alias.0.wetter.Temperatur';
    const SCRIPT = { ScreensaverEntity: 'alias.0.wetter.Temperatur' };

    it('button: longPress with mode push, besides the short action', async () => {
        const r = await entityData(
            { ...SCRIPT, ScreensaverEntityNaviToPage: 'power', ScreensaverEntityLongPressButton: WRITABLE },
            'indicator',
        );
        expect(r.type).to.equal('button');
        expect(r.data.setNavi).to.deep.equal({ type: 'const', constVal: 'power' });
        expect(r.data.longPress).to.deep.equal({ type: 'state', dp: WRITABLE });
        expect(r.data.longPressMode).to.deep.equal({ type: 'const', constVal: 'push' });
        expect(r.data.setNaviLongPress).to.equal(undefined);
    });

    it('switch: longPress with mode toggle; button comes first, then switch, then page', async () => {
        const sw = await entityData(
            { ...SCRIPT, ScreensaverEntityLongPressSwitch: WRITABLE, ScreensaverEntityLongPressNaviToPage: 'power' },
            'indicator',
        );
        expect(sw.data.longPress).to.deep.equal({ type: 'state', dp: WRITABLE });
        expect(sw.data.longPressMode).to.deep.equal({ type: 'const', constVal: 'toggle' });
        expect(sw.data.setNaviLongPress).to.equal(undefined);
        const both = await entityData(
            { ...SCRIPT, ScreensaverEntityLongPressButton: WRITABLE, ScreensaverEntityLongPressSwitch: WRITABLE },
            'indicator',
        );
        expect(both.data.longPressMode).to.deep.equal({ type: 'const', constVal: 'push' });
    });

    it('page: setNaviLongPress; a state that cannot be written gives no long press', async () => {
        const navi = await entityData({ ...SCRIPT, ScreensaverEntityLongPressNaviToPage: 'power' }, 'indicator');
        expect(navi.data.setNaviLongPress).to.deep.equal({ type: 'const', constVal: 'power' });
        expect(navi.data.longPress).to.equal(undefined);
        const readOnly = await entityData(
            { ...SCRIPT, ScreensaverEntityLongPressButton: 'alias.0.nurLesen' },
            'indicator',
        );
        expect(readOnly.data.longPress).to.equal(undefined);
        expect(readOnly.data.longPressMode).to.equal(undefined);
    });

    it('outside the indicator the long press is ignored', async () => {
        const r = await entityData({ ...SCRIPT, ScreensaverEntityLongPressNaviToPage: 'power' }, 'bottom');
        expect(r.data.setNaviLongPress).to.equal(undefined);
    });

    it('template: a long press alone makes it a button, the fields do not reach the runtime item', async () => {
        const r = await entityData({ ...template, ScreensaverEntityLongPressSwitch: WRITABLE }, 'indicator');
        expect(r.type).to.equal('button');
        expect(r.data.longPress).to.deep.equal({ type: 'state', dp: WRITABLE });
        expect(r.data.longPressMode).to.deep.equal({ type: 'const', constVal: 'toggle' });
        expect(r).to.not.have.property('ScreensaverEntityLongPressSwitch');
        const page: any = {
            log: { error: (): void => undefined, warn: (): void => undefined },
            getItemFromTemplate: Page.prototype.getItemFromTemplate,
        };
        const item: any = await page.getItemFromTemplate(r);
        expect(item.type).to.equal('button');
        expect(item.data.longPress).to.deep.equal({ type: 'state', dp: WRITABLE });
        expect(item.data.longPressMode).to.deep.equal({ type: 'const', constVal: 'toggle' });
        const navi = await entityData({ ...template, ScreensaverEntityLongPressNaviToPage: 'power' }, 'indicator');
        expect(navi.data.setNaviLongPress).to.deep.equal({ type: 'const', constVal: 'power' });
        expect(navi).to.not.have.property('ScreensaverEntityLongPressNaviToPage');
    });
});

describe('lib/classes/config-manager - font of the icon field (tiles)', () => {
    const size3 = { type: 'const', constVal: 3 };

    it('indicator: the font goes to icon.textSize, the icon stays', async () => {
        for (const mode of ['indicator'] as const) {
            const r = await entityData(
                {
                    ScreensaverEntity: 'alias.0.wetter.Temperatur',
                    ScreensaverEntityIconOn: 'sun',
                    ScreensaverEntityIconTextSize: 3,
                },
                mode,
            );
            expect(r.data.icon.textSize, mode).to.deep.equal(size3);
            expect(r.data.icon.true.value, mode).to.deep.equal({ type: 'const', constVal: 'sun' });
            expect(r.data.icon.true.color, mode).to.not.equal(undefined);
        }
    });

    it('a blind keeps its icon by position and gets the font', async () => {
        const r = await entityData(
            { ScreensaverEntity: `${CHANNEL}.ACTUAL`, ScreensaverEntityIconTextSize: 4 },
            'indicator',
        );
        expect(r.role).to.equal('blind');
        expect(r.data.icon.true.value).to.deep.equal({ type: 'const', constVal: SHUTTER_POSITION_ICON });
        expect(r.data.icon.textSize).to.deep.equal({ type: 'const', constVal: 4 });
    });

    it('other places (bottom too), no font and an invalid font id give no textSize', async () => {
        for (const mode of ['left', 'bottom'] as const) {
            const other = await entityData(
                { ScreensaverEntity: 'alias.0.wetter.Temperatur', ScreensaverEntityIconTextSize: 3 },
                mode,
            );
            expect(other.data.icon, mode).to.not.have.property('textSize');
        }
        const none = await entityData({ ScreensaverEntity: 'alias.0.wetter.Temperatur' }, 'indicator');
        expect(none.data.icon).to.not.have.property('textSize');
        const invalid = await entityData(
            { ScreensaverEntity: 'alias.0.wetter.Temperatur', ScreensaverEntityIconTextSize: 7 },
            'indicator',
        );
        expect(invalid.data.icon).to.not.have.property('textSize');
    });

    it('template element: the font joins the icon of the template, the field does not reach the runtime item', async () => {
        const r = await entityData(
            {
                type: 'template',
                template: 'text.battery.bydhvs',
                dpInit: 'bydhvs.0',
                modeScr: 'indicator',
                ScreensaverEntityIconTextSize: 1,
            },
            'indicator',
        );
        expect(r).to.not.have.property('ScreensaverEntityIconTextSize');
        expect(r.data.icon).to.deep.equal({ textSize: { type: 'const', constVal: 1 } });
        const page: any = {
            log: { error: (): void => undefined, warn: (): void => undefined },
            getItemFromTemplate: Page.prototype.getItemFromTemplate,
        };
        const item: any = await page.getItemFromTemplate(r);
        expect(item.data.icon.textSize).to.deep.equal({ type: 'const', constVal: 1 });
        expect(item.data.icon.true.value.regexp.source).to.equal('\\.State\\.SOC$');
    });
});

describe('lib/configuration/admin-screensaver-item - font of the icon field', () => {
    it('state and template items of the indicator take the font, the other areas (bottom too) not', () => {
        const state = { state: 'alias.0.wetter.Temperatur', iconOn: 'sun', iconTextSize: 3 } as const;
        expect(screensaverItemToScript(state, 'bottom')).to.not.have.property('ScreensaverEntityIconTextSize');
        expect(screensaverItemToScript(state, 'indicator')).to.have.property('ScreensaverEntityIconTextSize', 3);
        expect(screensaverItemToScript(state, 'left')).to.not.have.property('ScreensaverEntityIconTextSize');
        expect(screensaverItemToScript(state, 'favorit')).to.not.have.property('ScreensaverEntityIconTextSize');
        const template = { state: 'bydhvs.0', template: 'text.battery.bydhvs', iconTextSize: 4 } as const;
        expect(screensaverItemToScript(template, 'indicator')).to.have.property('ScreensaverEntityIconTextSize', 4);
        expect(screensaverItemToScript({ state: 'alias.0.x', iconOn: 'sun' }, 'indicator')).to.not.have.property(
            'ScreensaverEntityIconTextSize',
        );
    });
});
