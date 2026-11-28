import { expect } from 'chai';
import {
    DEVICE_PAGE_CUSTOM_STATUS,
    PREVIEW_INFO,
    PREVIEW_MAIN,
    PREVIEW_STATUS_CELL,
    PREVIEW_STATUS_LINE,
    devicePageShownStage,
    devicePageStatusPlaceCount,
    devicePageStatusStages,
    devicePageVisibleSlotIndexes,
    withDevicePageStatusSlot,
    withDevicePageStatusSlotLook,
    withDevicePageStatusSlotNavigation,
    withDevicePageStatusStage,
    devicePagePreviewAreas,
    devicePageRefOf,
    devicePageStateOptions,
    devicePageStatusOf,
    devicePageStatusSelectValue,
    customDevicePageStatus,
    isCustomDevicePageStatus,
    devicePageToSave,
    isLongPressTarget,
    longPressTargetOf,
    switchLongPressTarget,
    withDevicePageIcon,
    withDevicePageLayout,
    withDevicePageSlot,
    withDevicePageSlotLook,
    withDevicePageStatus,
    DEVICE_PAGE_CUSTOM,
    customDevicePageSlot,
    devicePageCustomProblem,
    devicePageExtraSlots,
    withDevicePageWebExtras,
    devicePageSlotDialogItem,
    devicePageSlotDialogValue,
    devicePageSlotItemOptions,
    devicePageSlotLookOfItem,
    devicePageSlotOf,
    devicePageSlotSelectValue,
    shortPressToSave,
    devicePageCustomSources,
    devicePageTargetProblem,
    isDevicePageCustomSource,
    withDevicePageSlotNavigation,
    type LongPressStash,
} from './devicePageConfig';
import { screensaverTargetPage, type AdminPageItemConfig } from '../../src/lib/types/adminShareConfig';
import {
    DEVICE_PAGE_EXTRA_SLOTS,
    DEVICE_PAGE_LAYOUTS,
    devicePageConfigOf,
    devicePageSlotHasLook,
    type DeviceDetailsConfig,
    type DevicePageConfig,
    type DeviceStateInfo,
} from '../../src/lib/types/deviceDetails';
import { channelIdOf, channelRolesOf, isInChannels, roleOfObject } from './channelSelection';

const DEV = 'shelly.0.dev1';

function state(rest: string, extra: Partial<DeviceStateInfo> = {}): DeviceStateInfo {
    return { id: `${DEV}.${rest}`, name: rest, role: 'state', type: 'number', read: true, write: false, ...extra };
}

const STATES: DeviceStateInfo[] = [
    state('Relay0.Power', { role: 'value.power', name: 'Leistung' }),
    state('Relay0.Switch', { role: 'switch', type: 'boolean', write: true }),
    state('Sys.reboot', { role: 'button', type: 'boolean', read: false, write: true }),
    state('Sys.version', { role: 'state', type: 'string', name: 'Version' }),
];

function device(extra: Partial<DeviceDetailsConfig> = {}): DeviceDetailsConfig {
    return {
        deviceId: DEV,
        shortPress: 'state',
        entries: [
            { key: 'power', id: `${DEV}.Relay0.Power` },
            { key: 'firmware', id: `${DEV}.Sys.version`, subName: 'FW' },
        ],
        ...extra,
    };
}

describe('devicePageConfig - device page of the page item dialog', () => {
    it('isLongPressTarget / longPressTargetOf', () => {
        expect(isLongPressTarget('details')).to.equal(true);
        expect(isLongPressTarget('devicePage')).to.equal(true);
        expect(isLongPressTarget('other')).to.equal(false);
        expect(longPressTargetOf(device())).to.equal('details');
        expect(longPressTargetOf(device({ devicePage: { layout: 1, slots: [], showInfo: true } }))).to.equal(
            'devicePage',
        );
    });

    it('a device page chosen for the first time is the suggestion from the ticked rows', () => {
        const r = switchLongPressTarget(device(), {}, 'devicePage');
        expect(r.device.devicePage).to.deep.equal({
            layout: 1,
            slots: [
                { key: 'power', id: `${DEV}.Relay0.Power` },
                { key: 'firmware', id: `${DEV}.Sys.version`, subName: 'FW' },
                null,
                null,
                null,
                null,
            ],
            showInfo: true,
        });
        expect(r.stash).to.deep.equal({ details: undefined });
    });

    it('switching back to the detail page removes devicePage and brings the kept one back', () => {
        const page: DevicePageConfig = {
            layout: 3,
            slots: [null, null, null, null, null, null, { key: '', id: `${DEV}.Relay0.Switch` }, null],
            showInfo: false,
            icon: 'washing-machine',
        };
        let stash: LongPressStash = {};
        let r = switchLongPressTarget(device({ devicePage: page }), stash, 'details');
        expect(r.device).to.not.have.property('devicePage');
        expect(r.device.entries).to.have.length(2);
        stash = r.stash;
        r = switchLongPressTarget(r.device, stash, 'devicePage');
        expect(r.device.devicePage).to.deep.equal(page);
    });

    it('the same target changes nothing', () => {
        const d = device();
        const r = switchLongPressTarget(d, {}, 'details');
        expect(r.device).to.equal(d);
    });

    it('devicePageToSave normalizes and is undefined for the detail page', () => {
        expect(devicePageToSave(device())).to.equal(undefined);
        expect(
            devicePageToSave({
                devicePage: { layout: 2, slots: [{ key: '', id: '' }], showInfo: true, icon: ' ' },
            }),
        ).to.deep.equal({ layout: 2, slots: [null, null, null, null, null, null], showInfo: true });
    });

    it('withDevicePageLayout keeps the slots by position', () => {
        const page: DevicePageConfig = {
            layout: 3,
            slots: [
                { key: 'a', id: 'x.1' },
                null,
                null,
                null,
                null,
                null,
                { key: 'b', id: 'x.7' },
                { key: 'c', id: 'x.8' },
            ],
            showInfo: true,
        };
        const one = withDevicePageLayout(page, 1);
        expect(one.layout).to.equal(1);
        // slots 7/8 (switch) have no place in layout 1 (6 slots, the status icons are no slots)
        expect(one.slots).to.deep.equal([{ key: 'a', id: 'x.1' }, null, null, null, null, null]);
        expect(withDevicePageLayout(page, 3)).to.equal(page);
        expect(withDevicePageLayout(one, 3).slots).to.have.length(8);
    });

    it('withDevicePageSlot / withDevicePageStatus / withDevicePageIcon', () => {
        const page: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
        const withSlot = withDevicePageSlot(page, 2, { key: '', id: 'x.3' });
        expect(withSlot.slots).to.deep.equal([null, null, { key: '', id: 'x.3' }, null, null, null]);
        expect(withDevicePageSlot(withSlot, 2, null).slots[2]).to.equal(null);
        // behind the slots of the layout come its extra slots, behind them nothing
        const beyond = DEVICE_PAGE_LAYOUTS[1].length + DEVICE_PAGE_EXTRA_SLOTS[1].length;
        expect(withDevicePageSlot(page, beyond, { key: '', id: 'x' })).to.equal(page);
        expect(withDevicePageSlot(page, -1, { key: '', id: 'x' })).to.equal(page);

        const withStatus = withDevicePageStatus(page, { key: '', id: 'x.s' });
        expect(withStatus.status).to.deep.equal({ key: '', id: 'x.s' });
        expect(withDevicePageStatus(withStatus, null)).to.not.have.property('status');

        expect(withDevicePageIcon(page, ' robot ').icon).to.equal('robot');
        expect(withDevicePageIcon({ ...page, icon: 'robot' }, '')).to.not.have.property('icon');
    });

    it('status line: own data point - the choice stays without id, never an option of the device', () => {
        const page: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
        const states: DeviceStateInfo[] = [
            { id: `${DEV}.phase`, name: 'Phase', type: 'string', role: 'text', read: true, write: false },
        ];
        expect(devicePageStatusSelectValue(undefined)).to.equal('');
        expect(devicePageStatusSelectValue({ key: '', id: `${DEV}.phase` })).to.equal(`${DEV}.phase`);
        expect(isCustomDevicePageStatus({ key: '', id: `${DEV}.phase` })).to.equal(false);

        // chosen, nothing entered yet: stays "own data point", also through the save
        const options = devicePageStateOptions(DEV, states, null, null);
        const pending = withDevicePageStatus(page, devicePageStatusOf(DEVICE_PAGE_CUSTOM_STATUS, options, [], null));
        expect(pending.status).to.deep.equal({ key: '', id: '', custom: true });
        expect(devicePageStatusSelectValue(pending.status)).to.equal(DEVICE_PAGE_CUSTOM_STATUS);
        expect(devicePageToSave({ devicePage: pending })?.status).to.deep.equal({ key: '', id: '', custom: true });

        // an id outside the device
        const own = withDevicePageStatus(pending, customDevicePageStatus('0_userdata.0.msg'));
        expect(own.status).to.deep.equal({ key: '', id: '0_userdata.0.msg', custom: true });
        expect(devicePageStatusSelectValue(own.status)).to.equal(DEVICE_PAGE_CUSTOM_STATUS);
        expect(isCustomDevicePageStatus(own.status)).to.equal(true);
        expect(devicePageToSave({ devicePage: own })?.status).to.deep.equal(own.status);
        // choosing "own data point" again keeps the id
        expect(devicePageStatusOf(DEVICE_PAGE_CUSTOM_STATUS, options, [], own.status)).to.deep.equal(own.status);

        // the section offers the states of the device without the own data point: nothing marked as missing
        const offered = devicePageStateOptions(
            DEV,
            states,
            null,
            isCustomDevicePageStatus(own.status) ? null : own.status,
        );
        expect(offered.map(o => o.id)).to.deep.equal([`${DEV}.phase`]);
        expect(offered.some(o => o.problem)).to.equal(false);

        // back to a state of the device (no flag, the own id is not taken over) or to empty
        expect(devicePageStatusOf(`${DEV}.phase`, offered, [], own.status)).to.deep.equal({
            key: '',
            id: `${DEV}.phase`,
        });
        expect(devicePageStatusOf('', offered, [], own.status)).to.equal(null);
        // a state of the device chosen before keeps its reference
        const saved = { key: 'k', id: `${DEV}.phase`, subName: 'x' };
        expect(devicePageStatusOf(`${DEV}.phase`, offered, [], saved)).to.deep.equal(saved);
    });

    it('settings of a slot: stay when something else is chosen, the dialog replaces all of them', () => {
        const page: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
        // a button slot (the status icons are no slots of layout 1 any more - the older icon lives on in statusSlots)
        const s = DEVICE_PAGE_LAYOUTS[1].indexOf('button');
        expect(withDevicePageSlotLook(page, s, { trueIcon: 'filter' })).to.equal(page);
        // the older own icon only on a status slot: dropped here
        const old = withDevicePageSlot(page, s, { key: '', id: 'x.door', icon: 'filter' });
        expect(old.slots[s]).to.deep.equal({ key: '', id: 'x.door' });
        const look = { trueIcon: ' play ', falseIcon: 'pause', trueColor: '#00ff00', falseColor: '', longPress: 'a.b' };
        const withLook = withDevicePageSlotLook(old, s, look);
        expect(withLook.slots[s]).to.deep.equal({
            key: '',
            id: 'x.door',
            trueIcon: 'play',
            falseIcon: 'pause',
            trueColor: '#00ff00',
            longPress: 'a.b',
        });
        // another state keeps the settings, removing the state removes them
        expect(withDevicePageSlot(withLook, s, { key: 'k', id: 'x.bin' }).slots[s]).to.deep.include({
            key: 'k',
            id: 'x.bin',
            trueIcon: 'play',
            longPress: 'a.b',
        });
        expect(withDevicePageSlot(withLook, s, null).slots[s]).to.equal(null);
        expect(withDevicePageSlotLook(withLook, s, {}).slots[s]).to.deep.equal({ key: '', id: 'x.door' });
        // every kind of slot takes them, a custom slot keeps its source, the save keeps them
        const scale = { val_min: 0, val_max: 10 };
        const info = withDevicePageSlotLook(
            withDevicePageSlot(page, 0, customDevicePageSlot('channel', 'alias.0.l')),
            0,
            { trueColor: '#010203', scale },
        );
        expect(info.slots[0]).to.deep.equal({
            key: '',
            id: 'alias.0.l',
            custom: 'channel',
            trueColor: '#010203',
            scale,
        });
        expect(devicePageToSave({ devicePage: info })?.slots[0]).to.deep.equal(info.slots[0]);
        // the older icon never on another kind
        expect(withDevicePageSlot(page, 0, { key: '', id: 'x.p', icon: 'filter' }).slots[0]).to.deep.equal({
            key: '',
            id: 'x.p',
        });
    });

    it('own name of a slot: set by the dialog (trimmed), empty = automatic, kept by the save', () => {
        const page: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
        const withState = withDevicePageSlot(page, 0, { key: 'temperature', id: 'x.t' });
        const named = withDevicePageSlotLook(withState, 0, { name: '  Kühlschrank  ' });
        expect(named.slots[0]).to.deep.equal({ key: 'temperature', id: 'x.t', name: 'Kühlschrank' });
        expect(devicePageSlotHasLook(named.slots[0])).to.equal(true);
        expect(devicePageSlotDialogValue(named.slots[0] ?? { key: '', id: '' })).to.deep.equal({ name: 'Kühlschrank' });
        expect(devicePageToSave({ devicePage: named })?.slots[0]).to.deep.equal(named.slots[0]);
        // empty: the automatic name again
        expect(withDevicePageSlotLook(named, 0, { name: '   ' }).slots[0]).to.deep.equal({
            key: 'temperature',
            id: 'x.t',
        });
        // an own data point and an alias channel take it as well
        const state = withDevicePageSlotLook(withDevicePageSlot(page, 1, customDevicePageSlot('state', 'x.y')), 1, {
            name: 'Mine',
        });
        expect(state.slots[1]).to.deep.equal({ key: '', id: 'x.y', custom: 'state', name: 'Mine' });
        const channel = withDevicePageSlotLook(
            withDevicePageSlot(page, 1, customDevicePageSlot('channel', 'alias.0.l')),
            1,
            { name: 'Lamp' },
        );
        expect(devicePageToSave({ devicePage: channel })?.slots[1]).to.deep.equal({
            key: '',
            id: 'alias.0.l',
            custom: 'channel',
            name: 'Lamp',
        });
    });

    it('page item dialog of a slot: what it offers by source and kind', () => {
        const state = { key: '', id: 'x.t' };
        expect(devicePageSlotItemOptions('button', state, undefined, '3 Button')).to.deep.equal({
            title: '3 Button',
            source: 'state',
            tap: true,
            longPress: true,
            textSize: true,
            iconText: false,
        });
        expect(devicePageSlotItemOptions('info', state, undefined, 't')).to.include({ longPress: false, tap: true });
        // the bar has no icon
        expect(devicePageSlotItemOptions('progress', state, undefined, 't').textSize).to.equal(false);
        const channel = customDevicePageSlot('channel', 'alias.0.s');
        expect(devicePageSlotItemOptions('button', channel, 'socket', 't')).to.include({
            source: 'channel',
            tap: true,
            longPress: true,
            iconText: true,
        });
        // value text in the icon only where the device page keeps it; the popup of a blind comes before the tap
        expect(devicePageSlotItemOptions('info', channel, 'blind', 't')).to.include({ iconText: false, tap: false });
        const navigation = { ...customDevicePageSlot('navigation', ''), targetPage: 'rooms' };
        expect(devicePageSlotItemOptions('info', navigation, undefined, 't')).to.include({
            source: 'navigation',
            tap: false,
            longPress: false,
            textSize: true,
        });
    });

    it('page item dialog of a slot: opened with the settings of the slot, its result stored as settings', () => {
        const page: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
        const channel = withDevicePageSlot(page, 2, customDevicePageSlot('channel', 'alias.0.l'));
        const item = devicePageSlotDialogItem(channel.slots[2] ?? { key: '', id: '' });
        expect(item.channelId.valueStateId).to.equal('alias.0.l');
        // the dialog saves a whole page item - only the fields of a slot stay
        const saved: AdminPageItemConfig = {
            ...item,
            role: 'dimmer',
            name: ' Licht ',
            trueIcon: 'lightbulb',
            falseIcon: '',
            trueColor: '',
            falseColor: '#000000',
            textSize: 3,
            useValue: false,
            minValueBrightness: 10,
            maxValueBrightness: undefined,
            colormode: true,
            modeList: ['a', 'b'],
            longPress: null,
            targetPageLongPress: null,
            isNavigation: true,
            targetPage: 'rooms',
        };
        const stored = withDevicePageSlotLook(channel, 2, devicePageSlotLookOfItem(saved));
        expect(stored.slots[2]).to.deep.equal({
            key: '',
            id: 'alias.0.l',
            custom: 'channel',
            name: 'Licht',
            trueIcon: 'lightbulb',
            falseColor: '#000000',
            textSize: 3,
            minValueBrightness: 10,
            colormode: true,
            modeList: ['a', 'b'],
            isNavigation: true,
            targetPage: 'rooms',
        });
        expect(devicePageToSave({ devicePage: stored })?.slots[2]).to.deep.equal(stored.slots[2]);
        // opened again: the same fields
        expect(devicePageSlotDialogItem(stored.slots[2] ?? { key: '', id: '' })).to.deep.include({
            name: 'Licht',
            textSize: 3,
            minValueBrightness: 10,
            colormode: true,
            modeList: ['a', 'b'],
        });
        // a state slot keeps no field of a channel item
        const state = withDevicePageSlot(page, 2, { key: '', id: 'x.t' });
        expect(withDevicePageSlotLook(state, 2, devicePageSlotLookOfItem(saved)).slots[2]).to.deep.equal({
            key: '',
            id: 'x.t',
            name: 'Licht',
            trueIcon: 'lightbulb',
            falseColor: '#000000',
            textSize: 3,
            isNavigation: true,
            targetPage: 'rooms',
        });
        expect(devicePageSlotDialogItem({ key: '', id: 'x.t' }).channelId.valueStateId).to.equal('');
    });

    it('user defined slot: own data point or alias channel, the choice stays without id', () => {
        const page: DevicePageConfig = { layout: 3, slots: [], showInfo: true };
        const options = devicePageStateOptions(DEV, STATES, 'info', null);
        expect(devicePageSlotSelectValue(null)).to.equal('');
        expect(devicePageSlotSelectValue({ key: '', id: `${DEV}.Relay0.Power` })).to.equal(`${DEV}.Relay0.Power`);
        const pending = devicePageSlotOf(DEVICE_PAGE_CUSTOM, options, [], null);
        expect(pending).to.deep.equal({ key: '', id: '', custom: 'state' });
        expect(devicePageSlotSelectValue(pending)).to.equal(DEVICE_PAGE_CUSTOM);
        const saved = devicePageToSave({ devicePage: withDevicePageSlot(page, 0, pending) });
        expect(saved?.slots[0]).to.deep.equal({ key: '', id: '', custom: 'state' });
        // a channel, chosen again: kept
        const channel = customDevicePageSlot('channel', 'alias.0.light');
        expect(devicePageSlotOf(DEVICE_PAGE_CUSTOM, options, [], channel)).to.deep.equal(channel);
        expect(devicePageSlotSelectValue(channel)).to.equal(DEVICE_PAGE_CUSTOM);
        // a user defined slot is never an option of the device, nothing marked there
        const offered = devicePageStateOptions(DEV, STATES, 'info', null);
        expect(offered.some(o => o.id === 'alias.0.light' || o.problem)).to.equal(false);
        // back to a state of the device (the own id is not taken over) or to empty
        expect(devicePageSlotOf(`${DEV}.Relay0.Power`, offered, device().entries, channel)).to.deep.equal({
            key: 'power',
            id: `${DEV}.Relay0.Power`,
        });
        expect(devicePageSlotOf('', offered, [], channel)).to.equal(null);
    });

    it('short tap navigation of a slot: set and removed by the dialog, kept when another state is chosen', () => {
        const s = 0;
        const page: DevicePageConfig = { layout: 3, slots: [{ key: 'power', id: 'x.p' }], showInfo: true };
        const nav = withDevicePageSlotLook(page, s, { isNavigation: true, targetPage: ' rooms ', trueIcon: 'map' });
        expect(nav.slots[s]).to.deep.equal({
            key: 'power',
            id: 'x.p',
            isNavigation: true,
            targetPage: 'rooms',
            trueIcon: 'map',
        });
        // the dialog starts with what is saved
        expect(devicePageSlotDialogValue(nav.slots[s] ?? { key: '', id: '' })).to.deep.equal({
            isNavigation: true,
            targetPage: 'rooms',
            trueIcon: 'map',
        });
        // navigation chosen, no page yet: the choice stays
        expect(withDevicePageSlotLook(page, s, { isNavigation: true }).slots[s]).to.deep.equal({
            key: 'power',
            id: 'x.p',
            isNavigation: true,
        });
        // a target without the choice is dropped, "standard" removes both
        expect(withDevicePageSlotLook(nav, s, { targetPage: 'rooms' }).slots[s]).to.deep.equal({
            key: 'power',
            id: 'x.p',
        });
        expect(withDevicePageSlotLook(nav, s, {}).slots[s]).to.deep.equal({ key: 'power', id: 'x.p' });
        // another state: the settings of the slot stay
        expect(withDevicePageSlot(nav, s, { key: '', id: 'x.q' }).slots[s]).to.deep.equal({
            key: '',
            id: 'x.q',
            isNavigation: true,
            targetPage: 'rooms',
            trueIcon: 'map',
        });
        expect(devicePageToSave({ devicePage: nav })?.slots[s]).to.deep.equal(nav.slots[s]);
    });

    it('navigation slot: offered where icon and name are enough, target at the slot, text in the dialog', () => {
        expect(devicePageCustomSources('button', null)).to.deep.equal(['state', 'channel', 'navigation']);
        expect(devicePageCustomSources('info', null)).to.deep.equal(['state', 'channel', 'navigation']);
        expect(devicePageCustomSources('status', null)).to.deep.equal(['state', 'channel', 'navigation']);
        for (const kind of ['value', 'progress', 'switch'] as const) {
            expect(devicePageCustomSources(kind, null), kind).to.deep.equal(['state', 'channel']);
        }
        expect(isDevicePageCustomSource('navigation')).to.equal(true);
        expect(isDevicePageCustomSource('other')).to.equal(false);
        // never an id
        const fresh = customDevicePageSlot('navigation', 'ignored');
        expect(fresh).to.deep.equal({ key: '', id: '', custom: 'navigation' });
        expect(devicePageSlotSelectValue(fresh)).to.equal(DEVICE_PAGE_CUSTOM);

        const b = DEVICE_PAGE_LAYOUTS[1].indexOf('button');
        let page: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
        page = withDevicePageSlot(page, b, fresh);
        page = withDevicePageSlotNavigation(page, b, 'rooms');
        expect(page.slots[b]).to.deep.equal({
            key: '',
            id: '',
            custom: 'navigation',
            targetPage: 'rooms',
        });
        // icon, color and text come from the dialog - the target stays
        const look = withDevicePageSlotLook(page, b, { trueIcon: 'floor-plan', trueColor: '#00ff00', name: ' Räume ' });
        expect(look.slots[b]).to.deep.equal({
            key: '',
            id: '',
            custom: 'navigation',
            targetPage: 'rooms',
            name: 'Räume',
            trueIcon: 'floor-plan',
            trueColor: '#00ff00',
        });
        expect(devicePageToSave({ devicePage: look })?.slots[b]).to.deep.equal(look.slots[b]);
        // "user defined" chosen again: nothing is lost
        expect(devicePageSlotOf(DEVICE_PAGE_CUSTOM, [], [], look.slots[b])).to.deep.equal(look.slots[b]);
        // the dialog starts with the text
        expect(devicePageSlotDialogValue(look.slots[b]!).name).to.equal('Räume');
        // emptied text and target
        const cleared = withDevicePageSlotNavigation(
            withDevicePageSlotLook(look, b, { trueIcon: 'floor-plan', trueColor: '#00ff00', name: '' }),
            b,
            '',
        );
        expect(cleared.slots[b]).to.deep.equal({
            key: '',
            id: '',
            custom: 'navigation',
            trueIcon: 'floor-plan',
            trueColor: '#00ff00',
        });
        // another slot is not touched
        const other = withDevicePageSlot(page, 0, { key: '', id: 'x.p' });
        expect(withDevicePageSlotNavigation(other, 0, 'rooms')).to.equal(other);
        // a state slot with the short tap navigation that becomes a navigation slot keeps its target, not the choice
        const state: DevicePageConfig = {
            layout: 1,
            slots: [{ key: '', id: 'x.p', isNavigation: true, targetPage: 'rooms' }],
            showInfo: true,
        };
        expect(withDevicePageSlot(state, 0, customDevicePageSlot('navigation', '')).slots[0]).to.deep.equal({
            key: '',
            id: '',
            custom: 'navigation',
            targetPage: 'rooms',
        });
        // a saved navigation slot in a slot that needs a value stays offered and is marked
        const nav = { key: '', id: '', custom: 'navigation' as const, targetPage: 'rooms' };
        expect(devicePageCustomSources('switch', nav)).to.include('navigation');
        expect(devicePageCustomProblem('switch', nav, undefined)).to.equal('unfit');
        expect(devicePageCustomProblem('button', nav, undefined)).to.equal(undefined);
    });

    it('target page of a slot: marked when it cannot be chosen', () => {
        const pages = ['main', 'rooms'];
        const tap = (targetPage: string): { key: string; id: string; isNavigation: true; targetPage: string } => ({
            key: '',
            id: 'x.p',
            isNavigation: true,
            targetPage,
        });
        expect(devicePageTargetProblem(tap('rooms'), pages)).to.equal(false);
        expect(devicePageTargetProblem(tap('gone'), pages)).to.equal(true);
        expect(devicePageTargetProblem({ key: '', id: '', custom: 'navigation', targetPage: 'gone' }, pages)).to.equal(
            true,
        );
        // the screensaver, the page of the item, no target, no navigation, pages unknown
        expect(devicePageTargetProblem(tap(screensaverTargetPage), pages)).to.equal(false);
        expect(devicePageTargetProblem(tap('here'), pages, 'here')).to.equal(false);
        expect(devicePageTargetProblem({ key: '', id: 'x.p', isNavigation: true }, pages)).to.equal(false);
        expect(devicePageTargetProblem({ key: '', id: 'x.p', targetPage: 'gone' }, pages)).to.equal(false);
        expect(devicePageTargetProblem(tap('gone'), null)).to.equal(false);
        expect(devicePageTargetProblem(tap('gone'), [])).to.equal(false);
        expect(devicePageTargetProblem(null, pages)).to.equal(false);
    });

    it('user defined slot: marked when the object is missing or does not fit the kind of the slot', () => {
        const own = customDevicePageSlot('state', '0_userdata.0.x');
        const number = { type: 'state', valueType: 'number', read: true, write: true };
        const bool = { type: 'state', valueType: 'boolean', read: true, write: true };
        expect(devicePageCustomProblem('info', own, undefined)).to.equal(undefined);
        expect(devicePageCustomProblem('info', customDevicePageSlot('state', ''), null)).to.equal(undefined);
        expect(devicePageCustomProblem('info', { key: '', id: 'x' }, null)).to.equal(undefined);
        expect(devicePageCustomProblem('info', own, null)).to.equal('missing');
        expect(devicePageCustomProblem('info', own, { type: 'channel' })).to.equal('missing');
        expect(devicePageCustomProblem('info', own, number)).to.equal(undefined);
        expect(devicePageCustomProblem('progress', own, number)).to.equal(undefined);
        expect(devicePageCustomProblem('progress', own, bool)).to.equal('unfit');
        expect(devicePageCustomProblem('switch', own, number)).to.equal('unfit');
        expect(devicePageCustomProblem('button', own, bool)).to.equal(undefined);
        const channel = customDevicePageSlot('channel', 'alias.0.x');
        expect(devicePageCustomProblem('switch', channel, null)).to.equal('missing');
        expect(devicePageCustomProblem('switch', channel, { type: 'channel', role: 'socket' })).to.equal(undefined);
        expect(devicePageCustomProblem('switch', channel, { type: 'channel', role: 'blind' })).to.equal('unfit');
        expect(devicePageCustomProblem('info', channel, { type: 'channel', role: 'blind' })).to.equal(undefined);
        expect(devicePageCustomProblem('info', channel, { type: 'channel' })).to.equal('unfit');
        expect(devicePageCustomProblem('info', channel, { type: 'channel', role: 'media' })).to.equal('unfit');
    });

    it('short tap devicePage is saved only with a device page', () => {
        const devicePage: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
        expect(shortPressToSave({ shortPress: 'devicePage', devicePage })).to.equal('devicePage');
        expect(shortPressToSave({ shortPress: 'devicePage' })).to.equal('none');
        expect(shortPressToSave({ shortPress: 'popup' })).to.equal('popup');
        expect(shortPressToSave({})).to.equal('state');
    });

    it('preview: the layout of the stage - grid columns, info rows of layout 1, replaced tiles of layout 3', () => {
        const cells = (layout: 1 | 2 | 3, stage: unknown): { x: number; y: number }[] =>
            devicePagePreviewAreas(layout, stage)
                .filter(a => a.slot === PREVIEW_STATUS_CELL)
                .map(a => ({ x: a.x, y: a.y }));
        const slotsOf = (layout: 1 | 2 | 3, stage: unknown): number[] =>
            devicePagePreviewAreas(layout, stage)
                .filter(a => a.slot > 0)
                .map(a => a.slot)
                .sort((a, b) => a - b);
        // layout 1: the info rows wide / set B / set C / none, the grid 0 / 3 / 5 / 8 columns of 2 cells
        expect(devicePagePreviewAreas(1, 0).find(a => a.slot === 1)).to.deep.include({ x: 126, w: 314 });
        expect(devicePagePreviewAreas(1, 1).find(a => a.slot === 1)).to.deep.include({ x: 247, w: 193 });
        expect(devicePagePreviewAreas(1, 2).find(a => a.slot === 2)).to.deep.include({ x: 321, y: 120, w: 119 });
        expect(slotsOf(1, 3)).to.deep.equal([3, 4, 5, 6]);
        expect(cells(1, 0)).to.have.length(0);
        expect(cells(1, 1)).to.have.length(6);
        expect(cells(1, 2)).to.have.length(10);
        expect(cells(1, 3)).to.have.length(16);
        expect(cells(1, 3).slice(0, 3)).to.deep.equal([
            { x: 124, y: 71 },
            { x: 124, y: 115 },
            { x: 161, y: 71 },
        ]);
        expect(cells(1, 3)[15]).to.deep.equal({ x: 383, y: 115 });
        // layout 3: tile 1 / tiles 1 and 2 replaced by one row of 4 / 8 cells
        expect(slotsOf(3, 0)).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8]);
        expect(slotsOf(3, 1)).to.deep.equal([2, 3, 4, 5, 6, 7, 8]);
        expect(slotsOf(3, 2)).to.deep.equal([3, 4, 5, 6, 7, 8]);
        expect(cells(3, 1)).to.deep.equal([0, 1, 2, 3].map(c => ({ x: 114 + 37 * c, y: 67 })));
        expect(cells(3, 2)).to.have.length(8);
        // a stage too large for the layout is shown as its largest one, layout 2 has none
        expect(cells(3, 3)).to.have.length(8);
        expect(cells(2, 3)).to.have.length(0);
        expect(slotsOf(2, 3)).to.deep.equal([1, 2, 3, 4, 5, 6]);
        for (const layout of [1, 2, 3] as const) {
            const areas = devicePagePreviewAreas(layout, undefined);
            expect(slotsOf(layout, undefined)).to.deep.equal(DEVICE_PAGE_LAYOUTS[layout].map((_, i) => i + 1));
            expect(areas.some(a => a.slot === PREVIEW_MAIN)).to.equal(true);
            expect(areas.some(a => a.slot === PREVIEW_INFO)).to.equal(true);
            expect(areas.some(a => a.slot === PREVIEW_STATUS_LINE)).to.equal(true);
        }
    });

    describe('stage of the status icon grid', () => {
        const ref = (id: string): { key: string; id: string } => ({ key: '', id: `${DEV}.${id}` });

        it('offers the stages of the layout, layout 2 none', () => {
            expect(devicePageStatusStages(1)).to.deep.equal([0, 1, 2, 3]);
            expect(devicePageStatusStages(2)).to.deep.equal([0]);
            expect(devicePageStatusStages(3)).to.deep.equal([0, 1, 2]);
        });

        it('stores the chosen stage, 0 left out, the places stay', () => {
            const page: DevicePageConfig = { layout: 1, slots: [], showInfo: true, statusSlots: [ref('a')] };
            const three = withDevicePageStatusStage(page, 3);
            expect(three.statusStage).to.equal(3);
            expect(three.statusSlots).to.deep.equal(page.statusSlots);
            expect(withDevicePageStatusStage(three, 0)).to.not.have.property('statusStage');
        });

        it('shows as many places as the stage holds and hides the covered slots without deleting them', () => {
            const base: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
            expect([0, 1, 2, 3].map(s => devicePageStatusPlaceCount({ ...base, statusStage: s as 0 }))).to.deep.equal([
                0, 6, 10, 16,
            ]);
            expect(devicePageVisibleSlotIndexes({ layout: 1, statusStage: 2 })).to.deep.equal([0, 1, 2, 3, 4, 5]);
            expect(devicePageVisibleSlotIndexes({ layout: 1, statusStage: 3 })).to.deep.equal([2, 3, 4, 5]);
            expect(devicePageVisibleSlotIndexes({ layout: 3, statusStage: 1 })).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
            expect(devicePageVisibleSlotIndexes({ layout: 3, statusStage: 2 })).to.deep.equal([2, 3, 4, 5, 6, 7]);
            expect(devicePageVisibleSlotIndexes({ layout: 2, statusStage: 3 })).to.deep.equal([0, 1, 2, 3, 4, 5]);
        });

        it('a layout change keeps the stage, the admin shows the largest the layout has', () => {
            const page: DevicePageConfig = {
                layout: 1,
                slots: [ref('i1'), ref('i2'), null, null, null, null],
                showInfo: true,
                statusStage: 3,
                statusSlots: Array.from({ length: 16 }, (_v, i) => ref(`s${i}`)),
            };
            const three = withDevicePageLayout(page, 3);
            expect(three.statusStage).to.equal(3);
            expect(three.statusSlots).to.have.length(16);
            expect(devicePageShownStage(three)).to.equal(2);
            expect(devicePageStatusPlaceCount(three)).to.equal(8);
            expect(devicePageShownStage(withDevicePageLayout(page, 2))).to.equal(0);
            expect(withDevicePageLayout(three, 1)).to.deep.equal(page);
        });

        it('a smaller stage keeps the places beyond it and the covered slots, a larger one shows them again', () => {
            const page: DevicePageConfig = {
                layout: 1,
                slots: [ref('i1'), ref('i2'), null, null, null, null],
                showInfo: true,
                statusStage: 3,
                statusSlots: Array.from({ length: 16 }, (_v, i) => ref(`s${i}`)),
            };
            const small = withDevicePageStatusStage(page, 1);
            expect(devicePageStatusPlaceCount(small)).to.equal(6);
            const saved = devicePageConfigOf(small);
            expect(saved?.statusSlots).to.have.length(16);
            expect(saved?.slots.slice(0, 2)).to.deep.equal([ref('i1'), ref('i2')]);
            expect(devicePageConfigOf(withDevicePageStatusStage(small, 3))).to.deep.equal(devicePageConfigOf(page));
        });

        it('sets a place, keeps its settings, trims empty places at the end', () => {
            const page: DevicePageConfig = { layout: 3, slots: [], showInfo: true, statusStage: 2 };
            const one = withDevicePageStatusSlot(page, 2, ref('door'));
            expect(one.statusSlots).to.deep.equal([null, null, ref('door')]);
            const look = withDevicePageStatusSlotLook(one, 2, { trueIcon: 'door-open', trueColor: '#ff0000' });
            expect(look.statusSlots?.[2]).to.deep.include({ trueIcon: 'door-open', trueColor: '#ff0000' });
            const other = withDevicePageStatusSlot(look, 2, ref('window'));
            expect(other.statusSlots?.[2]).to.deep.include({ id: `${DEV}.window`, trueIcon: 'door-open' });
            expect(withDevicePageStatusSlot(other, 2, null)).to.not.have.property('statusSlots');
            expect(withDevicePageStatusSlot(page, 16, ref('x'))).to.equal(page);
            expect(withDevicePageStatusSlotLook(page, 0, {})).to.equal(page);
        });

        it('sets the target page of a navigation place', () => {
            const page = withDevicePageStatusSlot(
                { layout: 1, slots: [], showInfo: true, statusStage: 1 },
                1,
                customDevicePageSlot('navigation', ''),
            );
            const nav = withDevicePageStatusSlotNavigation(page, 1, 'kitchen');
            expect(nav.statusSlots?.[1]).to.deep.include({ custom: 'navigation', targetPage: 'kitchen' });
            expect(withDevicePageStatusSlotNavigation(nav, 1, 'kitchen')).to.equal(nav);
            expect(withDevicePageStatusSlotNavigation(nav, 0, 'kitchen')).to.equal(nav);
        });
    });

    describe('devicePageStateOptions', () => {
        it('filters the states by the kind of the slot, the status line takes all', () => {
            const ids = (kind: Parameters<typeof devicePageStateOptions>[2]): string[] =>
                devicePageStateOptions(DEV, STATES, kind, null).map(o => o.rest);
            expect(ids(null)).to.deep.equal(['Relay0.Power', 'Relay0.Switch', 'Sys.reboot', 'Sys.version']);
            expect(ids('info')).to.deep.equal(['Relay0.Power', 'Relay0.Switch', 'Sys.reboot', 'Sys.version']);
            expect(ids('button')).to.deep.equal(['Relay0.Switch', 'Sys.reboot']);
            expect(ids('switch')).to.deep.equal(['Relay0.Switch']);
            expect(ids('progress')).to.deep.equal(['Relay0.Power']);
        });

        it('names a state by the entry of the mask', () => {
            const [power] = devicePageStateOptions(DEV, STATES, 'progress', null);
            expect(power).to.deep.equal({
                id: `${DEV}.Relay0.Power`,
                rest: 'Relay0.Power',
                key: 'power',
                stateName: 'Leistung',
            });
        });

        it('keeps a saved state the device does not have, marked', () => {
            const options = devicePageStateOptions(DEV, STATES, 'info', { key: 'rssi', id: `${DEV}.gone` });
            expect(options[0]).to.deep.equal({
                id: `${DEV}.gone`,
                rest: 'gone',
                key: 'rssi',
                stateName: '',
                problem: 'missing',
            });
            expect(options).to.have.length(5);
        });

        it('keeps a saved state that does not fit the slot, marked', () => {
            const options = devicePageStateOptions(DEV, STATES, 'switch', { key: '', id: `${DEV}.Sys.version` });
            expect(options[0].problem).to.equal('unfit');
            expect(options[0].stateName).to.equal('Version');
        });

        it('without an answer of the adapter only the saved state, unmarked', () => {
            expect(devicePageStateOptions(DEV, null, 'button', { key: '', id: `${DEV}.x` })).to.deep.equal([
                { id: `${DEV}.x`, rest: 'x', key: '', stateName: '' },
            ]);
            expect(devicePageStateOptions(DEV, null, 'button', null)).to.deep.equal([]);
        });
    });

    describe('devicePageRefOf', () => {
        const options = devicePageStateOptions(DEV, STATES, null, null);
        const entries = device().entries;

        it('empty is null', () => {
            expect(devicePageRefOf('', options, entries, null)).to.equal(null);
        });

        it('the same state keeps the saved reference', () => {
            const current = { key: 'x', id: `${DEV}.Relay0.Power`, subName: 'own' };
            expect(devicePageRefOf(`${DEV}.Relay0.Power`, options, entries, current)).to.deep.equal(current);
        });

        it('a ticked row gives its entry and own text', () => {
            expect(devicePageRefOf(`${DEV}.Sys.version`, options, entries, null)).to.deep.equal({
                key: 'firmware',
                id: `${DEV}.Sys.version`,
                subName: 'FW',
            });
        });

        it('another state gets the entry of the mask', () => {
            expect(devicePageRefOf(`${DEV}.Relay0.Switch`, options, entries, null)).to.deep.equal({
                key: 'switch',
                id: `${DEV}.Relay0.Switch`,
            });
            expect(devicePageRefOf(`${DEV}.Sys.reboot`, options, entries, null)).to.deep.equal({
                key: '',
                id: `${DEV}.Sys.reboot`,
            });
        });
    });
});

describe('devicePageConfig - extra slots of the web panels (web-l / web-p)', () => {
    const N = DEVICE_PAGE_LAYOUTS[2].length;
    const E = DEVICE_PAGE_EXTRA_SLOTS[2].length;
    const page: DevicePageConfig = { layout: 2, slots: new Array<null>(N).fill(null), showInfo: true };

    it('the option: off by default, ticking stores it, unticking removes it and keeps the slots', () => {
        expect(devicePageExtraSlots(page)).to.deep.equal([]);
        const on = withDevicePageWebExtras(page, true);
        expect(on).to.deep.equal({ ...page, webExtras: true });
        expect(on.slots).to.equal(page.slots);
        // layout 2: info, button, button behind its 6 slots
        expect(devicePageExtraSlots(on)).to.deep.equal([
            { index: N, kind: 'info' },
            { index: N + 1, kind: 'button' },
            { index: N + 2, kind: 'button' },
        ]);
        for (const layout of [1, 2, 3] as const) {
            expect(devicePageExtraSlots({ layout, webExtras: true }).map(e => e.kind)).to.deep.equal(
                DEVICE_PAGE_EXTRA_SLOTS[layout],
            );
            expect(devicePageExtraSlots({ layout }).length).to.equal(0);
        }
        const filled = withDevicePageSlot(on, N + 1, { key: '', id: 'x.b' });
        const off = withDevicePageWebExtras(filled, false);
        expect(off).to.not.have.property('webExtras');
        expect(off.slots).to.equal(filled.slots);
        expect(devicePageExtraSlots(off)).to.deep.equal([]);
        // ticked again: what was chosen is back
        expect(withDevicePageWebExtras(off, true)).to.deep.equal(filled);
    });

    it('an extra slot is set like a slot of the layout; the list holds them only while one is filled', () => {
        const on = withDevicePageWebExtras(page, true);
        const one = withDevicePageSlot(on, N + 1, { key: '', id: 'x.b' });
        expect(one.slots).to.have.length(N + E);
        expect(one.slots.slice(N)).to.deep.equal([null, { key: '', id: 'x.b' }, null]);
        // the settings stay when something else is chosen, an emptied slot loses them
        const looked = withDevicePageSlotLook(one, N + 1, { trueIcon: 'play', name: 'Los' });
        expect(looked.slots[N + 1]).to.deep.equal({ key: '', id: 'x.b', trueIcon: 'play', name: 'Los' });
        const other = withDevicePageSlot(looked, N + 1, { key: '', id: 'x.c' });
        expect(other.slots[N + 1]).to.deep.equal({ key: '', id: 'x.c', trueIcon: 'play', name: 'Los' });
        const emptied = withDevicePageSlot(other, N + 1, null);
        expect(emptied.slots).to.deep.equal(page.slots);
        expect(emptied.webExtras).to.equal(true);
        // a navigation in an extra slot
        const nav = withDevicePageSlot(on, N, customDevicePageSlot('navigation', ''));
        expect(withDevicePageSlotNavigation(nav, N, 'rooms').slots[N]).to.deep.equal({
            key: '',
            id: '',
            custom: 'navigation',
            targetPage: 'rooms',
        });
        // a slot of the layout next to filled extra slots
        const both = withDevicePageSlot(one, 0, { key: '', id: 'x.v' });
        expect(both.slots[0]).to.deep.equal({ key: '', id: 'x.v' });
        expect(both.slots[N + 1]).to.deep.equal({ key: '', id: 'x.b' });
    });

    it('a layout change keeps the extra slots among themselves, never among the slots of the layout', () => {
        const filled: DevicePageConfig = {
            layout: 2,
            webExtras: true,
            showInfo: true,
            slots: [{ key: '', id: 'x.1' }, null, null, null, null, null, { key: '', id: 'x.e1' }, null, null],
        };
        const one = withDevicePageLayout(filled, 1);
        expect(one.slots).to.have.length(DEVICE_PAGE_LAYOUTS[1].length + DEVICE_PAGE_EXTRA_SLOTS[1].length);
        expect(one.slots[0]).to.deep.equal({ key: '', id: 'x.1' });
        expect(one.slots[DEVICE_PAGE_LAYOUTS[1].length]).to.deep.equal({ key: '', id: 'x.e1' });
        expect(one.webExtras).to.equal(true);
        // and back
        expect(withDevicePageLayout(one, 2)).to.deep.equal(filled);
        // the stage and the status icons stay with a layout change
        const status: DevicePageConfig = {
            layout: 1,
            slots: [],
            showInfo: true,
            statusStage: 3,
            statusSlots: [{ key: '', id: 'x.s' }],
        };
        const two = withDevicePageLayout(status, 2);
        expect(two.slots).to.deep.equal(new Array<null>(N).fill(null));
        expect(two.statusStage).to.equal(3);
        expect(two.statusSlots).to.deep.equal([{ key: '', id: 'x.s' }]);
        expect(devicePageToSave({ devicePage: two })).to.deep.equal(two);
    });

    it('saved as it is: with the option and the extra slots, also unticked; old pages unchanged', () => {
        const on = withDevicePageSlot(withDevicePageWebExtras(page, true), N, { key: '', id: 'x.i' });
        expect(devicePageToSave({ devicePage: on })).to.deep.equal(on);
        expect(devicePageConfigOf(on)).to.deep.equal(on);
        const off = withDevicePageWebExtras(on, false);
        expect(devicePageToSave({ devicePage: off })).to.deep.equal(off);
        expect(devicePageToSave({ devicePage: off })?.slots).to.have.length(N + E);
        expect(devicePageToSave({ devicePage: page })).to.deep.equal(page);
    });
});

describe('channelSelection - alias channels in the object browser', () => {
    const objects = {
        'alias.0.light': { type: 'channel', common: { role: 'light' } },
        'alias.0.light.sub': { type: 'channel', common: { role: 'socket' } },
        'alias.0.other': { type: 'channel', common: { role: 'whatever' } },
        'alias.0.norole': { type: 'channel', common: {} },
        'alias.0.broken': null,
    };
    it('channels with a known role, a picked id becomes its longest channel', () => {
        const roles = channelRolesOf(objects, ['light', 'socket']);
        expect(roles).to.deep.equal({ 'alias.0.light': 'light', 'alias.0.light.sub': 'socket' });
        expect(channelRolesOf(null, ['light'])).to.deep.equal({});
        const ids = Object.keys(roles);
        expect(isInChannels(ids, 'alias.0.light.ON')).to.equal(true);
        expect(isInChannels(ids, 'alias.0.light')).to.equal(true);
        expect(isInChannels(ids, 'alias.0.lighter.ON')).to.equal(false);
        expect(channelIdOf(ids, 'alias.0.light.ON')).to.equal('alias.0.light');
        expect(channelIdOf(ids, 'alias.0.light.sub.SET')).to.equal('alias.0.light.sub');
        expect(channelIdOf(ids, 'alias.0.other.SET')).to.equal('alias.0.other.SET');
        expect(roleOfObject({ common: { role: 5 } })).to.equal(undefined);
    });
});
