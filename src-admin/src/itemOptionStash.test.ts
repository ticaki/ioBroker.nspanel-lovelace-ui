import { expect } from 'chai';
import {
    freshKindFields,
    freshShortPressFields,
    isItemKind,
    switchOption,
    type ItemKind,
    type ItemKindFields,
    type ItemTapFields,
    type OptionStash,
} from './itemOptionStash';
import type { DeviceShortPress } from '../../src/lib/types/deviceDetails';

const DEV = 'shelly.0.dev1';

describe('itemOptionStash - radio buttons of the page item dialog', () => {
    it('switchOption keeps the fields of the option left and brings them back', () => {
        let stash: OptionStash<'a' | 'b', number> = {};
        const fresh = (): number => 0;
        let r = switchOption(stash, 'a', 5, 'b', fresh);
        expect(r.fields).to.equal(0);
        stash = r.stash;
        r = switchOption(stash, 'b', 7, 'a', fresh);
        expect(r.fields).to.equal(5);
        stash = r.stash;
        r = switchOption(stash, 'a', 6, 'b', fresh);
        expect(r.fields).to.equal(7);
        expect(r.stash).to.deep.equal({ a: 6, b: 7 });
    });

    it('switchOption does not change the stash it gets', () => {
        const stash: OptionStash<'a' | 'b', number> = { b: 1 };
        switchOption(stash, 'a', 2, 'b', () => 0);
        expect(stash).to.deep.equal({ b: 1 });
    });

    it('isItemKind', () => {
        expect(isItemKind('standard')).to.equal(true);
        expect(isItemKind('device')).to.equal(true);
        expect(isItemKind('alexaTimer')).to.equal(true);
        expect(isItemKind('popup')).to.equal(false);
    });

    describe('kind: standard <-> device with details', () => {
        const standard: ItemKindFields<string> = {
            device: null,
            deviceError: undefined,
            alexaTimer: null,
            isNavigation: true,
            targetPage: 'kitchen',
            isCustom: false,
            channelId: 'alias.0.light',
        };

        it('a kind chosen for the first time starts like before: a device item switches a state', () => {
            expect(freshKindFields<string>('device', '')).to.deep.equal({
                device: { deviceId: '', shortPress: 'state', entries: [] },
                deviceError: undefined,
                alexaTimer: null,
                isNavigation: false,
                targetPage: '',
                isCustom: true,
                channelId: '',
            });
            expect(freshKindFields<string>('standard', '')).to.deep.equal({
                device: null,
                deviceError: undefined,
                alexaTimer: null,
                isNavigation: false,
                targetPage: '',
                isCustom: false,
                channelId: '',
            });
        });

        it('back and forth loses nothing, the dialog only holds the chosen kind (what is saved)', () => {
            const fresh = (kind: ItemKind): ItemKindFields<string> => freshKindFields(kind, '');
            let r = switchOption<ItemKind, ItemKindFields<string>>({}, 'standard', standard, 'device', fresh);
            const device: ItemKindFields<string> = {
                ...r.fields,
                device: { deviceId: DEV, shortPress: 'state', entries: [{ key: 'power', id: `${DEV}.Power` }] },
                channelId: `${DEV}.Switch`,
            };
            // the device item does not take over the navigation of the standard item
            expect(r.fields.isNavigation).to.equal(false);
            expect(r.fields.targetPage).to.equal('');
            r = switchOption(r.stash, 'device', device, 'standard', fresh);
            expect(r.fields).to.deep.equal(standard);
            r = switchOption(r.stash, 'standard', r.fields, 'device', fresh);
            expect(r.fields).to.deep.equal(device);
        });
    });

    describe('short tap of a device item', () => {
        const fresh = (tap: DeviceShortPress): ItemTapFields<string> => freshShortPressFields(tap, '');

        it('a short tap chosen for the first time: custom item for state, navigation flag, nothing else', () => {
            expect(fresh('state')).to.deep.equal({
                isCustom: true,
                isNavigation: false,
                targetPage: '',
                channelId: '',
            });
            expect(fresh('none')).to.deep.equal({
                isCustom: false,
                isNavigation: false,
                targetPage: '',
                channelId: '',
            });
            expect(fresh('navigation')).to.deep.equal({
                isCustom: false,
                isNavigation: true,
                targetPage: '',
                channelId: '',
            });
            expect(fresh('popup')).to.deep.equal({
                isCustom: false,
                isNavigation: false,
                targetPage: '',
                channelId: '',
            });
        });

        it('state -> popup -> navigation -> state keeps every choice', () => {
            const state: ItemTapFields<string> = {
                isCustom: true,
                isNavigation: false,
                targetPage: '',
                channelId: `${DEV}.Switch`,
            };
            let r = switchOption<DeviceShortPress, ItemTapFields<string>>({}, 'state', state, 'popup', fresh);
            const popup = { ...r.fields, channelId: 'alias.0.light' };
            r = switchOption(r.stash, 'popup', popup, 'navigation', fresh);
            const navigation = { ...r.fields, targetPage: 'kitchen' };
            r = switchOption(r.stash, 'navigation', navigation, 'state', fresh);
            expect(r.fields).to.deep.equal(state);
            r = switchOption(r.stash, 'state', r.fields, 'popup', fresh);
            expect(r.fields).to.deep.equal(popup);
            r = switchOption(r.stash, 'popup', r.fields, 'navigation', fresh);
            expect(r.fields).to.deep.equal(navigation);
            // "none" needs none of the fields: the dialog holds empty ones, the others wait in the stash
            r = switchOption(r.stash, 'navigation', r.fields, 'none', fresh);
            expect(r.fields).to.deep.equal(fresh('none'));
            expect(Object.keys(r.stash).sort()).to.deep.equal(['navigation', 'popup', 'state']);
        });
    });
});
