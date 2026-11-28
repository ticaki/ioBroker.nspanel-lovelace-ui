import { expect } from 'chai';
import { applyDeviceAnswer, type DeviceAnswerTarget } from './deviceAnswer';
import { freshKindFields, freshShortPressFields, switchOption } from './itemOptionStash';
import { emptyChannelValueConfig } from '../../src/lib/types/adminShareConfig';
import {
    buildDeviceDetailRows,
    deviceDetailEntriesOfRows,
    type DeviceDetailsInfo,
    type DeviceStateInfo,
} from '../../src/lib/types/deviceDetails';

const DEV = 'shelly.0.shellyplus1pm#0cdc7ef765c0#1';
const SWITCH = `${DEV}.Relay0.Switch`;

const state = (id: string, role: string, type: string, write: boolean): DeviceStateInfo => ({
    id,
    name: id,
    role,
    type,
    read: true,
    write,
});

const answer: DeviceDetailsInfo = {
    ok: true,
    adapter: 'shelly',
    name: 'Plus 1PM',
    states: [
        state(SWITCH, 'switch', 'boolean', true),
        state(`${DEV}.Relay0.Power`, 'value.power', 'number', false),
        state(`${DEV}.rssi`, 'value', 'number', false),
    ],
};

/** a new device item, the id just typed in, no answer yet */
function newDeviceItem(): DeviceAnswerTarget {
    const kind = freshKindFields('device', emptyChannelValueConfig(''));
    return {
        kind: { ...kind, device: { deviceId: DEV, shortPress: 'state', entries: [] } },
        shortPressStash: {},
        entriesDeviceId: '',
    };
}

/**
 * The user switched the short tap from `state` to another one before the answer came.
 *
 * @param target the fields before
 * @param to the short tap chosen
 * @returns the fields after
 */
function switchTap(target: DeviceAnswerTarget, to: 'none' | 'navigation' | 'popup'): DeviceAnswerTarget {
    const { isNavigation, targetPage, isCustom, channelId, device } = target.kind;
    const r = switchOption(
        target.shortPressStash,
        'state',
        { isNavigation, targetPage, isCustom, channelId },
        to,
        tap => freshShortPressFields(tap, emptyChannelValueConfig('')),
    );
    return {
        ...target,
        kind: { ...target.kind, ...r.fields, device: device && { ...device, shortPress: to } },
        shortPressStash: r.stash,
    };
}

describe('deviceAnswer - late answer of getDeviceDetails', () => {
    it('suggests the switch state and the learned ticks while the short tap state is shown', () => {
        const r = applyDeviceAnswer(newDeviceItem(), DEV, answer, { shelly: ['power'] });
        expect(r).to.not.equal(null);
        expect(r!.kind.channelId.valueStateId).to.equal(SWITCH);
        expect(r!.kind.device!.entries.map(e => e.key)).to.deep.equal(['power']);
        expect(r!.entriesDeviceId).to.equal(DEV);
    });

    it('an answer after switching the short tap puts the state into the stashed short tap state', () => {
        const target = switchTap(newDeviceItem(), 'none');
        const r = applyDeviceAnswer(target, DEV, answer, { shelly: ['power'] });
        expect(r).to.not.equal(null);
        // the shown short tap stays untouched
        expect(r!.kind.device!.shortPress).to.equal('none');
        expect(r!.kind.channelId.valueStateId).to.equal('');
        expect(r!.kind.device!.entries.map(e => e.key)).to.deep.equal(['power']);
        // switching back brings the suggested state
        expect(r!.shortPressStash.state?.channelId.valueStateId).to.equal(SWITCH);
        expect(r!.shortPressStash.state?.isCustom).to.equal(true);
    });

    it('a stashed state of the device is kept', () => {
        const target = newDeviceItem();
        const chosen = `${DEV}.Relay0.Other`;
        target.kind.channelId = emptyChannelValueConfig(chosen);
        const r = applyDeviceAnswer(switchTap(target, 'navigation'), DEV, answer, {});
        expect(r!.shortPressStash.state?.channelId.valueStateId).to.equal(chosen);
    });

    it('a device without switch state gets the short tap none, the stashed state tap is fresh', () => {
        const noSwitch: DeviceDetailsInfo = { ...answer, states: answer.states.slice(1) };
        const r = applyDeviceAnswer(newDeviceItem(), DEV, noSwitch, {});
        expect(r!.kind.device!.shortPress).to.equal('none');
        expect(r!.kind.isCustom).to.equal(false);
        expect(r!.kind.device!.entries.length).to.be.greaterThan(0);
        expect(r!.shortPressStash.state?.channelId.valueStateId).to.equal('');
    });

    it('the entries of the device stay with a second answer', () => {
        const first = applyDeviceAnswer(newDeviceItem(), DEV, answer, {})!;
        const edited: DeviceAnswerTarget = {
            ...first,
            kind: { ...first.kind, device: { ...first.kind.device!, entries: [] } },
        };
        const second = applyDeviceAnswer(edited, DEV, answer, { shelly: ['power'] });
        expect(second!.kind.device!.entries).to.deep.equal([]);
    });

    it('an answer for another device than the item has now is dropped', () => {
        expect(applyDeviceAnswer(newDeviceItem(), 'shelly.0.other', answer, {})).to.equal(null);
    });

    it('a refused device gets the reason, the rest stays', () => {
        const target = newDeviceItem();
        const r = applyDeviceAnswer(
            target,
            DEV,
            { ok: false, error: 'type', adapter: 'shelly', name: '', states: [] },
            {},
        );
        expect(r!.kind.deviceError).to.equal('type');
        expect(r!.kind.channelId).to.deep.equal(target.kind.channelId);
        expect(r!.entriesDeviceId).to.equal('');
    });
});

/**
 * Two answers for the same device (sendTo on Tab and again when the section mounts after switching the kind) that come
 * almost at once. The dialog applies them one after the other on the fields of the latest state (a setState updater);
 * the device the entries belong to lives in the state next to the entries.
 */
describe('deviceAnswer - two answers for the same device', () => {
    const learned = { shelly: ['power'] };
    const keys = (t: DeviceAnswerTarget | null): string[] => t!.kind.device!.entries.map(e => e.key);

    /**
     * The kind of the item switched (standard and back): the fields go through the kind stash unchanged.
     *
     * @param target the fields of the device kind
     * @returns the fields after switching to standard and back
     */
    function switchKindAndBack(target: DeviceAnswerTarget): DeviceAnswerTarget {
        const toStandard = switchOption({}, 'device', target.kind, 'standard', kind =>
            freshKindFields(kind, emptyChannelValueConfig('')),
        );
        const back = switchOption(toStandard.stash, 'standard', toStandard.fields, 'device', kind =>
            freshKindFields(kind, emptyChannelValueConfig('')),
        );
        return { ...target, kind: back.fields };
    }

    it('cause of the bug: the second answer on the old fields with the device of the first loses the entries', () => {
        // what the dialog did before: this.state (not rendered yet) + the instance field set by the first answer
        const before = newDeviceItem();
        const first = applyDeviceAnswer(before, DEV, answer, learned)!;
        expect(keys(first)).to.deep.equal(['power']);
        const second = applyDeviceAnswer({ ...before, entriesDeviceId: first.entriesDeviceId }, DEV, answer, learned);
        expect(keys(second)).to.deep.equal([]);
    });

    it('one after the other: the second answer keeps the learned entries of the first', () => {
        const first = applyDeviceAnswer(newDeviceItem(), DEV, answer, learned)!;
        const second = applyDeviceAnswer(first, DEV, answer, learned)!;
        expect(keys(second)).to.deep.equal(['power']);
        expect(second.kind.channelId.valueStateId).to.equal(SWITCH);
        expect(second.kind.device!.shortPress).to.equal('state');
    });

    it('both on the same old fields (entries and their device of one moment): the same result twice', () => {
        const before = newDeviceItem();
        const first = applyDeviceAnswer(before, DEV, answer, learned)!;
        const second = applyDeviceAnswer({ ...before, shortPressStash: first.shortPressStash }, DEV, answer, learned)!;
        expect(second.kind).to.deep.equal(first.kind);
        expect(second.entriesDeviceId).to.equal(DEV);
    });

    it('first answer while the short tap none is shown, second after switching back to state and the kind', () => {
        // Tab, then state -> none: the first answer comes while none is shown
        const first = applyDeviceAnswer(switchTap(newDeviceItem(), 'none'), DEV, answer, learned)!;
        expect(keys(first)).to.deep.equal(['power']);
        // none -> state brings the stashed state, then standard -> device remounts the section
        const back = switchOption(
            first.shortPressStash,
            'none',
            {
                isNavigation: first.kind.isNavigation,
                targetPage: first.kind.targetPage,
                isCustom: first.kind.isCustom,
                channelId: first.kind.channelId,
            },
            'state',
            tap => freshShortPressFields(tap, emptyChannelValueConfig('')),
        );
        const shown = switchKindAndBack({
            ...first,
            kind: { ...first.kind, ...back.fields, device: { ...first.kind.device!, shortPress: 'state' } },
            shortPressStash: back.stash,
        });
        const second = applyDeviceAnswer(shown, DEV, answer, learned)!;
        expect(keys(second)).to.deep.equal(['power']);
        expect(second.kind.channelId.valueStateId).to.equal(SWITCH);
    });

    it('nothing learned: the mask defaults; learned nothing: no entries - status and filter list agree', () => {
        const mask = applyDeviceAnswer(newDeviceItem(), DEV, answer, {})!;
        const maskAgain = applyDeviceAnswer(mask, DEV, answer, {})!;
        expect(keys(maskAgain)).to.deep.equal(keys(mask));
        expect(keys(mask).length).to.be.greaterThan(0);
        const none = applyDeviceAnswer(newDeviceItem(), DEV, answer, { shelly: [] })!;
        expect(none.kind.device!.entries).to.deep.equal([]);
        expect(applyDeviceAnswer(none, DEV, answer, { shelly: ['power'] })!.kind.device!.entries).to.deep.equal([]);
        // the filter list is built from the entries (the section passes an empty learned list): it ticks exactly them
        for (const t of [mask, none]) {
            const entries = t.kind.device!.entries;
            const rows = buildDeviceDetailRows(DEV, answer.states, entries, []);
            expect(deviceDetailEntriesOfRows(rows)).to.deep.equal(entries);
        }
    });
});
