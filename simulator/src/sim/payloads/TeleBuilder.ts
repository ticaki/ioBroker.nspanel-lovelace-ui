import type { PersistedState } from '../../persistence.js';
import type { SimRuntimeInfo } from './StatusBuilder.js';

export function buildInfo1(state: PersistedState, fwVersion: string): Record<string, unknown> {
    return {
        Info1: {
            Module: 'NSPanel',
            Version: fwVersion,
            FallbackTopic: `cmnd/${state.mqttClient ?? state.hostname}_fb/`,
            GroupTopic: 'cmnd/tasmotas/',
        },
    };
}

export function buildState(state: PersistedState, runtime: SimRuntimeInfo): Record<string, unknown> {
    const days = Math.floor(runtime.uptimeSec / 86_400);
    const h = Math.floor((runtime.uptimeSec % 86_400) / 3600);
    const m = Math.floor((runtime.uptimeSec % 3600) / 60);
    const s = runtime.uptimeSec % 60;
    return {
        Time: new Date().toISOString().replace('Z', '').slice(0, 19),
        Uptime: `${days}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        UptimeSec: runtime.uptimeSec,
        Heap: 146,
        SleepMode: 'Dynamic',
        Sleep: 50,
        LoadAvg: 19,
        MqttCount: 1,
        Berry: { HeapUsed: 16, Objects: 212 },
        POWER1: state.power1,
        POWER2: state.power2,
        Wifi: {
            AP: 1,
            SSId: 'SimNet',
            BSSId: 'DC:15:C8:EB:3E:B8',
            Channel: 7,
            Mode: 'HT40',
            RSSI: 80,
            Signal: -60,
            LinkCount: 1,
            Downtime: '0T00:00:03',
        },
    };
}

export function buildSensor(): Record<string, unknown> {
    return {
        Time: new Date().toISOString().replace('Z', '').slice(0, 19),
        ANALOG: { Temperature1: 21.5 },
        TempUnit: 'C',
    };
}
