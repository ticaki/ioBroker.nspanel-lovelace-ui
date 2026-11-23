import { expect } from 'chai';
import { pageItemSaveState, type PageItemSaveFields } from './pageItemSaveState';
import type { DeviceShortPress } from '../../src/lib/types/deviceDetails';

const DEV = 'shelly.0.dev1';

const fields = (over: Partial<PageItemSaveFields>): PageItemSaveFields => ({
    rawMode: false,
    device: null,
    deviceErrorBlocks: false,
    alexaTimerComplete: null,
    isNavigation: false,
    isCustom: false,
    targetPage: '',
    channelId: '',
    channelExists: null,
    checkingChannel: false,
    checkingDatapoints: false,
    roleIsValid: null,
    hasProblems: false,
    datapointErrors: 0,
    datapointDuplicates: 0,
    ...over,
});

/**
 * The fields of a device item as the dialog sets them for the short tap (handleDeviceShortPressChange).
 *
 * @param shortPress the short tap
 * @param over further fields
 * @returns the fields
 */
const device = (shortPress: DeviceShortPress, over: Partial<PageItemSaveFields> = {}): PageItemSaveFields =>
    fields({
        device: { deviceId: DEV, shortPress },
        isCustom: shortPress === 'state',
        isNavigation: shortPress === 'navigation',
        ...over,
    });

describe('src-admin - pageItemSaveState', () => {
    describe('device item', () => {
        it('none: saves with the device alone, no role or datapoint problem', () => {
            const s = pageItemSaveState(device('none'));
            expect(s).to.deep.equal({
                canSave: true,
                standardCanSave: true,
                datapointProblems: false,
                roleProblem: false,
            });
        });
        it('none: stale channel problems do not apply', () => {
            const s = pageItemSaveState(device('none', { hasProblems: true, datapointErrors: 2, roleIsValid: false }));
            expect(s.canSave).to.equal(true);
            expect(s.roleProblem).to.equal(false);
            expect(s.datapointProblems).to.equal(false);
        });
        it('navigation: needs the target page, no role problem', () => {
            expect(pageItemSaveState(device('navigation')).canSave).to.equal(false);
            const s = pageItemSaveState(device('navigation', { targetPage: 'main' }));
            expect(s.canSave).to.equal(true);
            expect(s.roleProblem).to.equal(false);
            expect(s.datapointProblems).to.equal(false);
        });
        it('state: needs the chosen state, the role of the state does not matter', () => {
            expect(pageItemSaveState(device('state')).canSave).to.equal(false);
            const s = pageItemSaveState(
                device('state', { channelId: `${DEV}.switch`, channelExists: true, roleIsValid: false }),
            );
            expect(s.canSave).to.equal(true);
            expect(s.roleProblem).to.equal(false);
            expect(s.datapointProblems).to.equal(false);
        });
        it('state: a problem of the state check does not block or rename the button', () => {
            const s = pageItemSaveState(device('state', { channelId: `${DEV}.switch`, hasProblems: true }));
            expect(s.canSave).to.equal(true);
            expect(s.roleProblem).to.equal(false);
            expect(s.datapointProblems).to.equal(false);
        });
        it('popup: the channel checks of the standard item apply', () => {
            expect(pageItemSaveState(device('popup')).canSave).to.equal(false);
            const ok = pageItemSaveState(
                device('popup', { channelId: 'alias.0.lamp', channelExists: true, roleIsValid: true }),
            );
            expect(ok).to.deep.equal({
                canSave: true,
                standardCanSave: true,
                datapointProblems: false,
                roleProblem: false,
            });
            const unknownRole = pageItemSaveState(
                device('popup', { channelId: 'alias.0.lamp', channelExists: true, roleIsValid: false }),
            );
            expect(unknownRole.canSave).to.equal(true);
            expect(unknownRole.roleProblem).to.equal(true);
            const missingDp = pageItemSaveState(
                device('popup', {
                    channelId: 'alias.0.lamp',
                    channelExists: true,
                    roleIsValid: true,
                    datapointErrors: 1,
                }),
            );
            expect(missingDp.datapointProblems).to.equal(true);
            expect(
                pageItemSaveState(device('popup', { channelId: 'alias.0.lamp', channelExists: false })).canSave,
            ).to.equal(false);
        });
        it('every short tap needs the device and no blocking device error', () => {
            for (const shortPress of ['none', 'navigation', 'state', 'popup', 'devicePage'] as const) {
                const ready = {
                    targetPage: 'main',
                    channelId: 'alias.0.lamp',
                    channelExists: true,
                    roleIsValid: true,
                };
                expect(pageItemSaveState(device(shortPress, ready)).canSave, shortPress).to.equal(true);
                expect(
                    pageItemSaveState(device(shortPress, { ...ready, device: { deviceId: ' ', shortPress } })).canSave,
                    `${shortPress} without device`,
                ).to.equal(false);
                expect(
                    pageItemSaveState(device(shortPress, { ...ready, deviceErrorBlocks: true })).canSave,
                    `${shortPress} blocked`,
                ).to.equal(false);
            }
        });
    });

    describe('standard item', () => {
        it('channel: needs an existing channel, an unknown role reads "Details"', () => {
            expect(pageItemSaveState(fields({ channelId: 'alias.0.x', channelExists: null })).canSave).to.equal(false);
            expect(
                pageItemSaveState(fields({ channelId: 'alias.0.x', channelExists: true, checkingChannel: true }))
                    .canSave,
            ).to.equal(false);
            const s = pageItemSaveState(fields({ channelId: 'alias.0.x', channelExists: true, roleIsValid: false }));
            expect(s.canSave).to.equal(true);
            expect(s.roleProblem).to.equal(true);
        });
        it('custom: the role does not matter, a failed state check does', () => {
            const base = { channelId: '0_userdata.0.b', channelExists: true, isCustom: true, roleIsValid: false };
            expect(pageItemSaveState(fields(base)).roleProblem).to.equal(false);
            expect(pageItemSaveState(fields({ ...base, hasProblems: true })).roleProblem).to.equal(true);
        });
        it('navigation: needs the target page only', () => {
            expect(pageItemSaveState(fields({ isNavigation: true })).canSave).to.equal(false);
            const s = pageItemSaveState(fields({ isNavigation: true, targetPage: 'main' }));
            expect(s.canSave).to.equal(true);
            expect(s.roleProblem).to.equal(false);
        });
        it('raw mode: saves without channel, no checks', () => {
            const s = pageItemSaveState(fields({ rawMode: true, hasProblems: true, datapointErrors: 1 }));
            expect(s.canSave).to.equal(true);
            expect(s.standardCanSave).to.equal(false);
            expect(s.roleProblem).to.equal(false);
            expect(s.datapointProblems).to.equal(false);
        });
    });
    describe('Alexa timer', () => {
        it('needs the complete Echo device only, no channel checks', () => {
            const base = { hasProblems: true, datapointErrors: 1, roleIsValid: false };
            const incomplete = pageItemSaveState(fields({ ...base, alexaTimerComplete: false }));
            expect(incomplete.canSave).to.equal(false);
            expect(incomplete.roleProblem).to.equal(false);
            expect(incomplete.datapointProblems).to.equal(false);
            expect(pageItemSaveState(fields({ ...base, alexaTimerComplete: true })).canSave).to.equal(true);
        });
    });
});
