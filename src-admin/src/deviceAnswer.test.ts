import { expect } from 'chai';
import { applyDeviceAnswer, type DeviceAnswerTarget } from './deviceAnswer';
import { freshKindFields, freshShortPressFields, switchOption } from './itemOptionStash';
import { emptyChannelValueConfig } from '../../src/lib/types/adminShareConfig';
import type { DeviceDetailsInfo, DeviceStateInfo } from '../../src/lib/types/deviceDetails';

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
