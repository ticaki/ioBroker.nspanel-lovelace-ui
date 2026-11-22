import { expect } from 'chai';
import { alexaAlarmChoicesOf, alexaInstancesOf, alexaTimerDevicesOf, loadAlexaTimerDevices } from './alexaTimerDevices';

describe('alexaTimerDevices', () => {
    it('instances with the option for voice timers, sorted by number', () => {
        expect(
            alexaInstancesOf({
                'system.adapter.alexa2.10': { type: 'instance', native: { autoQueryActivityOnTrigger: true } },
                'system.adapter.alexa2.2': { type: 'instance', native: {} },
                'system.adapter.alexa2.0': { type: 'instance', native: { autoQueryActivityOnTrigger: true } },
                'system.adapter.alexa2.0.alive': { type: 'state' },
                'system.adapter.alexa2.3': null,
            }),
        ).to.deep.equal([
            { instance: 'alexa2.0', autoQuery: true },
            { instance: 'alexa2.2', autoQuery: false },
            { instance: 'alexa2.10', autoQuery: true },
        ]);
    });

    it('only Echo devices with timers, name from Info.name', () => {
        const p = 'alexa2.0.Echo-Devices.';
        expect(
            alexaTimerDevicesOf(
                'alexa2.0',
                {
                    [`${p}G091.Info.capabilities`]: { val: 'ADAPTIVE_VOLUME,TIMERS_AND_ALARMS,AUDIO_PLAYER' },
                    [`${p}G092.Info.capabilities`]: { val: 'TIMERS_AND_ALARMS' },
                    [`${p}group.Info.capabilities`]: { val: 'AUDIO_PLAYER,VOLUME_SETTING' },
                    [`${p}x.y.Info.capabilities`]: { val: 'TIMERS_AND_ALARMS' },
                    'alexa2.1.Echo-Devices.G093.Info.capabilities': { val: 'TIMERS_AND_ALARMS' },
                },
                { [`${p}G091.Info.name`]: { val: 'Schlafzimmer rosa' }, [`${p}G092.Info.name`]: { val: 'Anrichte' } },
            ),
        ).to.deep.equal([
            { serial: 'G092', name: 'Anrichte' },
            { serial: 'G091', name: 'Schlafzimmer rosa' },
        ]);
    });

    it('reads both patterns through the socket', async () => {
        const asked: string[] = [];
        const devices = await loadAlexaTimerDevices(
            {
                getObjectViewSystem: async () => Promise.resolve({}),
                getForeignStates: async pattern => {
                    asked.push(pattern);
                    return Promise.resolve(
                        pattern.endsWith('capabilities')
                            ? { 'alexa2.1.Echo-Devices.S1.Info.capabilities': { val: 'TIMERS_AND_ALARMS' } }
                            : {},
                    );
                },
            },
            'alexa2.1',
        );
        expect(asked).to.deep.equal(['alexa2.1.Echo-Devices.*.Info.capabilities', 'alexa2.1.Echo-Devices.*.Info.name']);
        expect(devices).to.deep.equal([{ serial: 'S1', name: 'S1' }]);
    });

    it('alarms of a device: only those with a channel, labelled', () => {
        const p = 'alexa2.0.Echo-Devices.G091.Alarm.';
        expect(
            alexaAlarmChoicesOf(
                'alexa2.0',
                'G091',
                { [`${p}u1`]: {}, [`${p}u2`]: {} },
                {
                    [`${p}u1.time`]: { val: '07:30:00' },
                    [`${p}u1.recurringDays`]: { val: 'MO,TU,WE,TH,FR' },
                    [`${p}u1.recurringPattern`]: { val: 'XXXX-WD' },
                    [`${p}u2.time`]: { val: '06:00:00' },
                    [`${p}u2.date`]: { val: '2026-11-13' },
                    [`${p}u2.recurringPattern`]: { val: '0' },
                    [`${p}gone.time`]: { val: '05:00:00' },
                    [`${p}New`]: { val: '' },
                },
                'einmalig',
            ),
        ).to.deep.equal([
            { id: 'u2', label: '06:00 · einmalig 2026-11-13' },
            { id: 'u1', label: '07:30 · MO,TU,WE,TH,FR' },
        ]);
    });
});
