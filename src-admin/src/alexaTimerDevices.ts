/**
 * What the admin offers as the source of an Alexa timer (AlexaTimerSelect): the alexa2 instances and their Echo
 * devices that can do timers. The adapter side is src/lib/classes/alexa-timer.ts.
 */
import { isRawItemObject } from '../../src/lib/types/adminShareConfig';
import { alexaAlarmLabel, alexaAlarmsOf } from '../../src/lib/classes/alexa-alarm';

/** an installed alexa2 instance */
export type AlexaInstanceInfo = {
    /** e.g. `alexa2.0` */
    instance: string;
    /**
     * option "query activity automatically on device interaction" (`native.autoQueryActivityOnTrigger`): without it
     * timers set by voice never show up in alexa2
     */
    autoQuery: boolean;
};

/** an Echo device that can do timers */
export type AlexaDeviceInfo = {
    serial: string;
    /** `Info.name`, the serial number when it has none */
    name: string;
};

/** capability of an Echo device that has timers (`Info.capabilities`) */
export const ALEXA_TIMER_CAPABILITY = 'TIMERS_AND_ALARMS';

/** what is read through the socket of the admin */
export interface AlexaSocket {
    getObjectViewSystem: (type: 'instance' | 'channel', start: string, end: string) => Promise<Record<string, unknown>>;
    getForeignStates: (pattern: string) => Promise<Record<string, unknown>>;
}

/**
 * @param objects instance objects `system.adapter.alexa2.*`
 * @returns the instances, sorted
 */
export function alexaInstancesOf(objects: Record<string, unknown>): AlexaInstanceInfo[] {
    const out: AlexaInstanceInfo[] = [];
    for (const [id, obj] of Object.entries(objects)) {
        const match = /^system\.adapter\.(alexa2\.\d+)$/.exec(id);
        if (!match || !isRawItemObject(obj) || obj.type !== 'instance') {
            continue;
        }
        const native = isRawItemObject(obj.native) ? obj.native : {};
        out.push({ instance: match[1], autoQuery: native.autoQueryActivityOnTrigger === true });
    }
    return out.sort((a, b) => a.instance.localeCompare(b.instance, undefined, { numeric: true }));
}

/**
 * @param state a state of the socket
 * @returns its value as text, '' for anything else
 */
function stateText(state: unknown): string {
    return isRawItemObject(state) && typeof state.val === 'string' ? state.val : '';
}

/**
 * The Echo devices of an instance that can do timers.
 *
 * @param instance e.g. `alexa2.0`
 * @param capabilities states `<instance>.Echo-Devices.*.Info.capabilities`
 * @param names states `<instance>.Echo-Devices.*.Info.name`
 * @returns the devices, sorted by name
 */
export function alexaTimerDevicesOf(
    instance: string,
    capabilities: Record<string, unknown>,
    names: Record<string, unknown>,
): AlexaDeviceInfo[] {
    const prefix = `${instance}.Echo-Devices.`;
    const out: AlexaDeviceInfo[] = [];
    for (const [id, state] of Object.entries(capabilities)) {
        if (!id.startsWith(prefix) || !id.endsWith('.Info.capabilities')) {
            continue;
        }
        const serial = id.slice(prefix.length, id.length - '.Info.capabilities'.length);
        if (!serial || serial.includes('.')) {
            continue;
        }
        const list = stateText(state)
            .split(',')
            .map(c => c.trim());
        if (!list.includes(ALEXA_TIMER_CAPABILITY)) {
            continue;
        }
        out.push({ serial, name: stateText(names[`${prefix}${serial}.Info.name`]) || serial });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name) || a.serial.localeCompare(b.serial));
}

/**
 * @param socket socket of the admin
 * @returns the installed alexa2 instances
 */
export async function loadAlexaInstances(socket: AlexaSocket): Promise<AlexaInstanceInfo[]> {
    return alexaInstancesOf(
        await socket.getObjectViewSystem('instance', 'system.adapter.alexa2.', 'system.adapter.alexa2.香'),
    );
}

/**
 * @param socket socket of the admin
 * @param instance e.g. `alexa2.0`
 * @returns the Echo devices of the instance that can do timers
 */
export async function loadAlexaTimerDevices(socket: AlexaSocket, instance: string): Promise<AlexaDeviceInfo[]> {
    const capabilities = await socket.getForeignStates(`${instance}.Echo-Devices.*.Info.capabilities`);
    const names = await socket.getForeignStates(`${instance}.Echo-Devices.*.Info.name`);
    return alexaTimerDevicesOf(instance, capabilities ?? {}, names ?? {});
}

/** an alarm of an Echo device as the dialog offers it */
export type AlexaAlarmInfo = {
    /** uuid of the alarm */
    id: string;
    /** e.g. `07:30 · MO,TU,WE,TH,FR` */
    label: string;
};

/**
 * The alarms of an Echo device: the channels below `Alarm` with their states (src/lib/classes/alexa-alarm.ts).
 *
 * @param instance e.g. `alexa2.0`
 * @param serial the device
 * @param channels channel objects below `Alarm`
 * @param states states below `Alarm`
 * @param once word for a single alarm
 * @returns the alarms, sorted by label
 */
export function alexaAlarmChoicesOf(
    instance: string,
    serial: string,
    channels: Record<string, unknown>,
    states: Record<string, unknown>,
    once: string,
): AlexaAlarmInfo[] {
    const prefix = `${instance}.Echo-Devices.${serial}.Alarm.`;
    const existing = new Set(Object.keys(channels).map(id => id.slice(prefix.length)));
    const values = new Map<string, unknown>();
    for (const [id, state] of Object.entries(states)) {
        const alarm = id.slice(prefix.length).split('.')[0];
        if (id.startsWith(prefix) && existing.has(alarm)) {
            values.set(id, isRawItemObject(state) ? state.val : undefined);
        }
    }
    return alexaAlarmsOf(prefix, values)
        .map(entry => ({ id: entry.id, label: alexaAlarmLabel(entry, once) }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * @param socket socket of the admin
 * @param instance e.g. `alexa2.0`
 * @param serial the device
 * @param once word for a single alarm
 * @returns the alarms of the device
 */
export async function loadAlexaAlarms(
    socket: AlexaSocket,
    instance: string,
    serial: string,
    once: string,
): Promise<AlexaAlarmInfo[]> {
    const prefix = `${instance}.Echo-Devices.${serial}.Alarm.`;
    const channels = await socket.getObjectViewSystem('channel', prefix, `${prefix}香`);
    const states = await socket.getForeignStates(`${prefix}*`);
    return alexaAlarmChoicesOf(instance, serial, channels ?? {}, states ?? {}, once);
}
