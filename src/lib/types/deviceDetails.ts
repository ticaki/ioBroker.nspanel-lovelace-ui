/**
 * Device with details (doc/ideas/device-details/README.md): a page item shows any device (an object of type device or
 * channel); a long press opens a generated detail page (cardSchedule) with the chosen states of the device.
 *
 * Pure module, shared by the adapter and the admin - it must not import anything that pulls adapter code into the
 * admin bundle.
 *
 * A mask describes the entries of the filter list for the devices of one adapter. Every entry has a name (translation
 * key `deviceDetail_<key>`), a color group, an icon and rules in the style of the templates (`src/lib/templates`):
 * first by `role`, and where the role does not carry it by the end of the id (`dp`).
 */

/** sendTo command of main.ts: the states of a device for the filter list ({@link DeviceDetailsInfo}) */
export const SENDTO_GET_DEVICE_DETAILS_COMMAND = 'getDeviceDetails';

/** role of the generated rows of the detail page (PageItem) */
export const DEVICE_DETAIL_ROW_ROLE = 'deviceDetail';

/** prefix of the translation keys of the mask entries, used on the panel and in the admin */
export const DEVICE_DETAIL_NAME_PREFIX = 'deviceDetail_';

/** color group of an entry: values take the theme color of their group, on/off the colors activated/deactivated */
export type DeviceDetailGroup = 'energy' | 'climate' | 'connection' | 'info';

/** theme key (Color.ts) of every group - climate takes the existing temperature color */
export const deviceDetailGroupColorKey: Readonly<
    Record<DeviceDetailGroup, 'deviceEnergy' | 'temperature' | 'deviceConnection' | 'deviceInfo'>
> = {
    energy: 'deviceEnergy',
    climate: 'temperature',
    connection: 'deviceConnection',
    info: 'deviceInfo',
};

/** a rule matches a state when every condition that is given matches */
export type DeviceDetailRule = {
    /** common.role of the state, one of them */
    role?: string | readonly string[];
    /** the state id ends with it (e.g. `.rssi`), like `dp` of the templates */
    dp?: string;
    /** common.unit of the state */
    unit?: string;
};

/** an entry of the filter list */
export type DeviceDetailMaskEntry = {
    /** key of the entry, name = translation `deviceDetail_<key>` */
    key: string;
    group: DeviceDetailGroup;
    /** icon of the row on the detail page */
    icon: string;
    /** a state belongs to the entry when one of the rules matches */
    rules: readonly DeviceDetailRule[];
};

export type DeviceDetailMask = {
    /** adapter name (first part of the id), '' = the general mask */
    adapter: string;
    /** number of parts of the id of a device (`shelly.0.<device>` = 3), undefined = any level */
    deviceLevel?: number;
    entries: readonly DeviceDetailMaskEntry[];
};

/** what the admin needs to know of a state of the device */
export type DeviceStateInfo = {
    id: string;
    /** common.name in the language of the system */
    name: string;
    role: string;
    /** common.type */
    type: string;
    read: boolean;
    write: boolean;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
};

/** why an object cannot be chosen as device */
export type DeviceSelectionError = 'notFound' | 'type' | 'root' | 'info' | 'level';

/** answer of {@link SENDTO_GET_DEVICE_DETAILS_COMMAND} */
export type DeviceDetailsInfo = {
    ok: boolean;
    error?: DeviceSelectionError;
    /** adapter of the device (first part of the id) */
    adapter: string;
    /** common.name of the device */
    name: string;
    /** the states of the device: directly below it or in at most one sub folder */
    states: DeviceStateInfo[];
};

/** a chosen row of the detail page, saved in the order of the detail page */
export type DeviceDetailEntryConfig = {
    /** key of the mask entry, '' = a state without entry (named by the state) */
    key: string;
    /** full id of the state */
    id: string;
};

/** what a short tap on a device item does */
export type DeviceShortPress =
    /**
     * a writable boolean state of the device (stored as custom item, `channelId` = the state): switched on/off, a
     * button (`read: false`) is written with true
     */
    | 'state'
    /** nothing - only the long press opens the details (stored without channel, runtime item of type text) */
    | 'none'
    /** navigates to a target page (stored as navigation item, `targetPage`) */
    | 'navigation'
    /** the popup of an alias channel (stored as standard item, `channelId` = the channel) */
    | 'popup';

/**
 * @param state a state of the device
 * @param state.type common.type
 * @param state.write common.write
 * @returns true for a state the short tap `state` can use: a writable boolean (a button with `read: false` included)
 */
export function isDeviceShortPressState(state: { type: string; write: boolean }): boolean {
    return state.type === 'boolean' && state.write;
}

/**
 * @param config the device configuration of an item (or a value of the admin)
 * @param config.shortPress the stored short tap
 * @returns its short tap, `state` when not set or unknown
 */
export function deviceShortPressOf(config: { shortPress?: unknown }): DeviceShortPress {
    switch (config.shortPress) {
        case 'none':
        case 'navigation':
        case 'popup':
            return config.shortPress;
        default:
            return 'state';
    }
}

/** admin configuration of the device of a page item ({@link AdminPageItemConfig.device}) */
export type DeviceDetailsConfig = {
    /** id of the device or channel object */
    deviceId: string;
    /** what a short tap does, missing = `state` */
    shortPress?: DeviceShortPress;
    /** the ticked rows of the filter list in the order of the detail page */
    entries: DeviceDetailEntryConfig[];
};

/**
 * The learned ticks per adapter (native `deviceDetailsLearned`): adapter -> identifiers ({@link deviceDetailIdentifier})
 * in their order. An empty list is a valid learned choice (nothing ticked).
 */
export type DeviceDetailsLearned = Record<string, string[]>;

/** the device part of a runtime page item: a long press opens the detail page with these rows */
export type DeviceDetailsRuntime = {
    deviceId: string;
    entries: DeviceDetailEntryConfig[];
};

/** a row of the filter list of the admin */
export type DeviceDetailRow = {
    /** key of the mask entry, '' = a state without entry */
    key: string;
    /** full id of the state, '' = the entry of the mask found no state */
    id: string;
    /** ticked: shown on the detail page */
    enabled: boolean;
};

/** what the detail page does with a state (doc/ideas/device-details/README.md, section Zeilen) */
export type DeviceDetailRowKind =
    /** read: false - shown like a switch, a tap writes true */
    | 'button'
    /** boolean, writable - on/off, a tap switches */
    | 'switch'
    /** boolean, read only - on/off */
    | 'boolean'
    /** number, writable - value with unit, a tap opens popupSlider */
    | 'numberSet'
    /** number, read only - value with unit */
    | 'number'
    /** anything else - text, read only */
    | 'text';

/**
 * The kind of row a state gets on the detail page.
 *
 * @param common type, read and write of the state
 * @param common.type common.type
 * @param common.read common.read (undefined counts as true)
 * @param common.write common.write (undefined counts as true)
 * @returns the kind of the row
 */
export function deviceDetailRowKind(common: { type?: string; read?: boolean; write?: boolean }): DeviceDetailRowKind {
    const writable = common.write !== false;
    if (common.read === false) {
        return 'button';
    }
    if (common.type === 'boolean') {
        return writable ? 'switch' : 'boolean';
    }
    if (common.type === 'number') {
        return writable ? 'numberSet' : 'number';
    }
    return 'text';
}

/** the general mask: rules by role only, for adapters without a mask of their own */
export const generalDeviceDetailMask: DeviceDetailMask = {
    adapter: '',
    entries: [
        { key: 'switch', group: 'info', icon: 'toggle-switch', rules: [{ role: 'switch' }] },
        {
            key: 'power',
            group: 'energy',
            icon: 'lightning-bolt',
            rules: [{ role: ['value.power', 'value.power.active', 'value.power.consumption'], unit: 'W' }],
        },
        { key: 'voltage', group: 'energy', icon: 'flash', rules: [{ role: 'value.voltage' }] },
        { key: 'current', group: 'energy', icon: 'current-ac', rules: [{ role: 'value.current' }] },
        {
            key: 'energy',
            group: 'energy',
            icon: 'counter',
            rules: [
                { role: ['value.energy', 'value.energy.consumed', 'value.energy.active'] },
                { role: 'value.power.consumption', unit: 'kWh' },
                { role: 'value.power.consumption', unit: 'Wh' },
            ],
        },
        { key: 'battery', group: 'energy', icon: 'battery', rules: [{ role: 'value.battery' }] },
        { key: 'batteryVoltage', group: 'energy', icon: 'battery-charging', rules: [{ role: 'battery.voltage' }] },
        { key: 'lowBattery', group: 'energy', icon: 'battery-alert', rules: [{ role: 'indicator.lowbat' }] },
        { key: 'temperature', group: 'climate', icon: 'thermometer', rules: [{ role: 'value.temperature' }] },
        { key: 'setpoint', group: 'climate', icon: 'home-thermometer', rules: [{ role: 'level.temperature' }] },
        { key: 'humidity', group: 'climate', icon: 'water-percent', rules: [{ role: 'value.humidity' }] },
        {
            key: 'illuminance',
            group: 'climate',
            icon: 'brightness-5',
            rules: [{ role: ['value.brightness', 'value.illuminance'] }],
        },
        { key: 'pressure', group: 'climate', icon: 'gauge', rules: [{ role: 'value.pressure' }] },
        { key: 'rssi', group: 'connection', icon: 'wifi', rules: [{ role: 'value.rssi' }] },
        { key: 'reachable', group: 'connection', icon: 'lan-connect', rules: [{ role: 'indicator.reachable' }] },
        { key: 'unreachable', group: 'connection', icon: 'lan-disconnect', rules: [{ role: 'indicator.unreach' }] },
        { key: 'ip', group: 'connection', icon: 'ip-network', rules: [{ role: 'info.ip' }] },
        { key: 'firmware', group: 'info', icon: 'chip', rules: [{ role: 'info.firmware' }] },
    ],
};

/** the masks of the known adapters (allObjects.json of a productive ioBroker, 2026-11-21) */
export const deviceDetailMasks: readonly DeviceDetailMask[] = [
    {
        // shellyplus1pm#…#1 / SHSW-1#…#1 - Relay0, Input0, Sys, … as sub folders
        adapter: 'shelly',
        deviceLevel: 3,
        entries: [
            { key: 'switch', group: 'info', icon: 'toggle-switch', rules: [{ role: 'switch', dp: '.Switch' }] },
            { key: 'power', group: 'energy', icon: 'lightning-bolt', rules: [{ role: 'value.power', dp: '.Power' }] },
            { key: 'voltage', group: 'energy', icon: 'flash', rules: [{ role: 'value.voltage', dp: '.Voltage' }] },
            { key: 'current', group: 'energy', icon: 'current-ac', rules: [{ role: 'value.current', dp: '.Current' }] },
            // Gen2+: value.energy, Gen1 (Shelly 1PM, Plug S, …): value.power.consumption - both Wh in Relay0.Energy
            {
                key: 'energy',
                group: 'energy',
                icon: 'counter',
                rules: [
                    { role: 'value.energy', dp: '.Energy' },
                    { role: 'value.power.consumption', dp: '.Energy' },
                ],
            },
            // every temperature comes as °C and °F pair, the °C state counts
            {
                key: 'temperature',
                group: 'climate',
                icon: 'thermometer',
                rules: [{ role: 'value.temperature', dp: '.temperatureC' }],
            },
            { key: 'humidity', group: 'climate', icon: 'water-percent', rules: [{ role: 'value.humidity' }] },
            // role value, unit dBm
            { key: 'rssi', group: 'connection', icon: 'wifi', rules: [{ role: 'value', dp: '.rssi' }] },
            {
                key: 'reachable',
                group: 'connection',
                icon: 'lan-connect',
                rules: [{ role: 'indicator.reachable', dp: '.online' }],
            },
            { key: 'ip', group: 'connection', icon: 'ip-network', rules: [{ role: 'info.ip', dp: '.hostname' }] },
            { key: 'firmware', group: 'info', icon: 'chip', rules: [{ role: 'state', dp: '.version' }] },
            // boolean "new firmware available"
            { key: 'update', group: 'info', icon: 'update', rules: [{ role: 'state', dp: '.firmware' }] },
            { key: 'uptime', group: 'info', icon: 'timer-outline', rules: [{ role: 'value.interval', dp: '.uptime' }] },
        ],
    },
    {
        // Tasmota devices, one channel per device, INFO as sub folder
        adapter: 'sonoff',
        deviceLevel: 3,
        entries: [
            { key: 'switch', group: 'info', icon: 'toggle-switch', rules: [{ role: 'switch' }] },
            {
                key: 'power',
                group: 'energy',
                icon: 'lightning-bolt',
                rules: [{ role: 'value.power.consumption', dp: '.ENERGY_Power' }],
            },
            {
                key: 'voltage',
                group: 'energy',
                icon: 'flash',
                rules: [{ role: 'value.voltage', dp: '.ENERGY_Voltage' }],
            },
            {
                key: 'current',
                group: 'energy',
                icon: 'current-ac',
                rules: [{ role: 'value.current', dp: '.ENERGY_Current' }],
            },
            {
                key: 'energyToday',
                group: 'energy',
                icon: 'counter',
                rules: [{ role: 'value.energy.consumed', dp: '.ENERGY_Today' }],
            },
            {
                key: 'energy',
                group: 'energy',
                icon: 'counter',
                rules: [{ role: 'value.power.consumption', dp: '.ENERGY_Total' }],
            },
            { key: 'temperature', group: 'climate', icon: 'thermometer', rules: [{ role: 'value.temperature' }] },
            { key: 'humidity', group: 'climate', icon: 'water-percent', rules: [{ role: 'value.humidity' }] },
            { key: 'illuminance', group: 'climate', icon: 'brightness-5', rules: [{ role: 'value.illuminance' }] },
            // Wifi_RSSI (%) and Wifi_Signal (dBm) both have the role value.rssi - dBm like the other adapters
            { key: 'rssi', group: 'connection', icon: 'wifi', rules: [{ role: 'value.rssi', dp: '.Wifi_Signal' }] },
            { key: 'reachable', group: 'connection', icon: 'lan-connect', rules: [{ role: 'indicator.reachable' }] },
            { key: 'ip', group: 'connection', icon: 'ip-network', rules: [{ role: 'info.ip', dp: '.IPAddress' }] },
            { key: 'firmware', group: 'info', icon: 'chip', rules: [{ role: 'info.firmware', dp: '.Version' }] },
            {
                key: 'uptime',
                group: 'info',
                icon: 'timer-outline',
                rules: [{ role: 'value.interval', dp: '.UptimeSec' }],
            },
        ],
    },
    {
        // one device object per Zigbee device, all states directly below it
        adapter: 'zigbee2mqtt',
        deviceLevel: 3,
        entries: [
            { key: 'switch', group: 'info', icon: 'toggle-switch', rules: [{ role: 'switch', dp: '.state' }] },
            { key: 'power', group: 'energy', icon: 'lightning-bolt', rules: [{ role: 'value.power' }] },
            { key: 'voltage', group: 'energy', icon: 'flash', rules: [{ role: 'value.voltage' }] },
            { key: 'current', group: 'energy', icon: 'current-ac', rules: [{ role: 'value.current' }] },
            {
                key: 'energy',
                group: 'energy',
                icon: 'counter',
                rules: [{ role: 'value.power.consumption', dp: '.energy' }],
            },
            { key: 'battery', group: 'energy', icon: 'battery', rules: [{ role: 'value.battery' }] },
            { key: 'batteryVoltage', group: 'energy', icon: 'battery-charging', rules: [{ role: 'battery.voltage' }] },
            { key: 'lowBattery', group: 'energy', icon: 'battery-alert', rules: [{ role: 'indicator.lowbat' }] },
            {
                key: 'temperature',
                group: 'climate',
                icon: 'thermometer',
                rules: [{ role: 'value.temperature', dp: '.temperature' }],
            },
            {
                key: 'deviceTemperature',
                group: 'climate',
                icon: 'thermometer-lines',
                rules: [{ role: 'value.temperature', dp: '.device_temperature' }],
            },
            { key: 'humidity', group: 'climate', icon: 'water-percent', rules: [{ role: 'value.humidity' }] },
            {
                key: 'illuminance',
                group: 'climate',
                icon: 'brightness-5',
                rules: [{ role: 'value.brightness', dp: '.illuminance' }],
            },
            { key: 'pressure', group: 'climate', icon: 'gauge', rules: [{ role: 'value.pressure' }] },
            {
                key: 'linkQuality',
                group: 'connection',
                icon: 'signal',
                rules: [{ role: 'state', dp: '.link_quality' }],
            },
            {
                key: 'reachable',
                group: 'connection',
                icon: 'lan-connect',
                rules: [{ role: 'indicator.reachable', dp: '.available' }],
            },
            {
                key: 'lastSeen',
                group: 'connection',
                icon: 'clock-outline',
                rules: [{ role: 'state', dp: '.last_seen' }],
            },
        ],
    },
    {
        // HomeMatic: hm-rpc.N.<serial>, the states lie in the channels :0, :1, … (sub folders)
        adapter: 'hm-rpc',
        deviceLevel: 3,
        entries: [
            { key: 'switch', group: 'info', icon: 'toggle-switch', rules: [{ role: 'switch', dp: '.STATE' }] },
            { key: 'power', group: 'energy', icon: 'lightning-bolt', rules: [{ role: 'value.power' }] },
            { key: 'current', group: 'energy', icon: 'current-ac', rules: [{ role: 'value.current' }] },
            { key: 'energy', group: 'energy', icon: 'counter', rules: [{ role: 'value.power.consumption' }] },
            {
                key: 'voltage',
                group: 'energy',
                icon: 'flash',
                rules: [{ role: 'value.voltage', dp: '.OPERATING_VOLTAGE' }],
            },
            { key: 'lowBattery', group: 'energy', icon: 'battery-alert', rules: [{ role: 'indicator.lowbat' }] },
            {
                key: 'temperature',
                group: 'climate',
                icon: 'thermometer',
                rules: [{ role: 'value.temperature', dp: '.ACTUAL_TEMPERATURE' }],
            },
            {
                key: 'setpoint',
                group: 'climate',
                icon: 'home-thermometer',
                rules: [{ role: 'level.temperature', dp: '.SET_POINT_TEMPERATURE' }],
            },
            { key: 'humidity', group: 'climate', icon: 'water-percent', rules: [{ role: 'value.humidity' }] },
            { key: 'rssi', group: 'connection', icon: 'wifi', rules: [{ role: 'value.rssi', dp: '.RSSI_DEVICE' }] },
            {
                key: 'unreachable',
                group: 'connection',
                icon: 'lan-disconnect',
                rules: [{ role: 'indicator.unreach', dp: '.UNREACH' }],
            },
            { key: 'update', group: 'info', icon: 'update', rules: [{ role: 'indicator', dp: '.UPDATE_PENDING' }] },
        ],
    },
];

/**
 * @param id id of a device or state
 * @returns the adapter of the id (first part, `shelly` of `shelly.0.x`)
 */
export function deviceDetailsAdapter(id: string): string {
    return id.split('.')[0] ?? '';
}

/**
 * The mask of the adapter of a device, the general mask for an adapter without one.
 *
 * @param deviceId id of the device
 * @returns the mask
 */
export function deviceDetailMaskOf(deviceId: string): DeviceDetailMask {
    const adapter = deviceDetailsAdapter(deviceId);
    return deviceDetailMasks.find(m => m.adapter === adapter) ?? generalDeviceDetailMask;
}

/**
 * @param deviceId id of the device
 * @returns true when the adapter of the device has a mask of its own
 */
export function hasOwnDeviceDetailMask(deviceId: string): boolean {
    return deviceDetailMaskOf(deviceId) !== generalDeviceDetailMask;
}

/**
 * Whether an object may be the device of the item: only objects of type device or channel, never an instance, the
 * root of an adapter (`shelly.0`) or the info channel of an instance (`shelly.0.info`); a known adapter fixes the level
 * its devices lie on.
 *
 * @param id id of the object
 * @param type type of the object, undefined = the object does not exist
 * @returns why it cannot be chosen, undefined = it can
 */
export function deviceSelectionError(id: string, type: string | undefined): DeviceSelectionError | undefined {
    if (type === undefined) {
        return 'notFound';
    }
    if (type !== 'device' && type !== 'channel') {
        return 'type';
    }
    const parts = id.split('.');
    const level = parts.length;
    if (level < 3) {
        return 'root';
    }
    // the info channel of an instance (`shelly.0.info`, `zigbee2mqtt.0.info`) is no device
    if (level === 3 && parts[2] === 'info') {
        return 'info';
    }
    const mask = deviceDetailMaskOf(id);
    if (mask.deviceLevel !== undefined && mask.deviceLevel !== level) {
        return 'level';
    }
    return undefined;
}

/**
 * Whether a state belongs to the device: directly below it or in at most one sub folder (`Relay0.Power`, `1.STATE`).
 *
 * @param deviceId id of the device
 * @param stateId id of the state
 * @returns true when it belongs to the device
 */
export function isDeviceDetailState(deviceId: string, stateId: string): boolean {
    if (!deviceId || !stateId.startsWith(`${deviceId}.`)) {
        return false;
    }
    const rest = stateId.slice(deviceId.length + 1).split('.');
    return rest.length >= 1 && rest.length <= 2 && rest.every(part => part !== '');
}

/**
 * @param rule a rule of a mask entry
 * @param state the state
 * @returns true when every condition of the rule matches the state
 */
export function deviceDetailRuleMatches(
    rule: DeviceDetailRule,
    state: Pick<DeviceStateInfo, 'id' | 'role' | 'unit'>,
): boolean {
    if (rule.role === undefined && rule.dp === undefined && rule.unit === undefined) {
        return false;
    }
    if (rule.role !== undefined) {
        const roles: readonly string[] = typeof rule.role === 'string' ? [rule.role] : rule.role;
        if (!roles.includes(state.role)) {
            return false;
        }
    }
    if (rule.dp !== undefined && !state.id.endsWith(rule.dp)) {
        return false;
    }
    if (rule.unit !== undefined && state.unit !== rule.unit) {
        return false;
    }
    return true;
}

/**
 * The first entry of a mask a state belongs to.
 *
 * @param mask the mask
 * @param state the state
 * @returns the entry, undefined when no rule matches
 */
export function deviceDetailEntryOfState(
    mask: DeviceDetailMask,
    state: Pick<DeviceStateInfo, 'id' | 'role' | 'unit'>,
): DeviceDetailMaskEntry | undefined {
    return mask.entries.find(entry => entry.rules.some(rule => deviceDetailRuleMatches(rule, state)));
}

/**
 * An entry of the mask of a device or of the general mask by its key.
 *
 * @param deviceId id of the device
 * @param key key of the entry
 * @returns the entry, undefined for '' or an unknown key
 */
export function deviceDetailEntryByKey(deviceId: string, key: string): DeviceDetailMaskEntry | undefined {
    if (!key) {
        return undefined;
    }
    return (
        deviceDetailMaskOf(deviceId).entries.find(e => e.key === key) ??
        generalDeviceDetailMask.entries.find(e => e.key === key)
    );
}

/**
 * The entry a row stands for: the entry of its key, without key the entry of the general mask the role of the state
 * suggests (icon and color group of the row).
 *
 * @param deviceId id of the device
 * @param key key of the row
 * @param state the state of the row (role, unit), undefined when unknown
 * @returns the entry, undefined when nothing fits
 */
export function deviceDetailEntryOfRow(
    deviceId: string,
    key: string,
    state: Pick<DeviceStateInfo, 'id' | 'role' | 'unit'> | undefined,
): DeviceDetailMaskEntry | undefined {
    return (
        deviceDetailEntryByKey(deviceId, key) ??
        (state ? deviceDetailEntryOfState(generalDeviceDetailMask, state) : undefined)
    );
}

/**
 * @param key key of a mask entry
 * @returns the translation key of its name
 */
export function deviceDetailNameKey(key: string): string {
    return `${DEVICE_DETAIL_NAME_PREFIX}${key}`;
}

/**
 * What a row stands for when the admin learns the ticks of an adapter: the key of its entry, a row without entry by
 * the id of its state below the device (`~Relay0.Power`) - both are the same for the devices of one adapter.
 *
 * @param deviceId id of the device of the row
 * @param row the row
 * @param row.key key of the row
 * @param row.id id of the state of the row
 * @returns the identifier
 */
export function deviceDetailIdentifier(deviceId: string, row: { key: string; id: string }): string {
    if (row.key) {
        return row.key;
    }
    return `~${row.id.startsWith(`${deviceId}.`) ? row.id.slice(deviceId.length + 1) : row.id}`;
}

/**
 * The rows of the filter list: the entries of the mask with the states they found (an entry without a state as an
 * empty row), then every other state of the device as a row of its own.
 *
 * Ticked and order: the saved rows of the item first, in their order; without saved rows the rows the user ticked
 * last at this adapter ({@link DeviceDetailsLearned}, an empty list = nothing ticked), in their order; without both
 * the rows of the mask. A state appears in one row only.
 *
 * @param deviceId id of the device
 * @param states the states of the device
 * @param saved the saved rows of the item, undefined for a new item
 * @param learned the learned identifiers of the adapter ({@link deviceDetailIdentifier}), undefined = none
 * @returns the rows
 */
export function buildDeviceDetailRows(
    deviceId: string,
    states: readonly DeviceStateInfo[],
    saved: readonly DeviceDetailEntryConfig[] | undefined,
    learned: readonly string[] | undefined,
): DeviceDetailRow[] {
    const mask = deviceDetailMaskOf(deviceId);
    const own = states.filter(s => isDeviceDetailState(deviceId, s.id)).sort((a, b) => a.id.localeCompare(b.id));
    const byEntry = new Map<string, DeviceStateInfo[]>();
    const rest: DeviceStateInfo[] = [];
    for (const state of own) {
        const entry = deviceDetailEntryOfState(mask, state);
        if (entry) {
            const list = byEntry.get(entry.key) ?? [];
            list.push(state);
            byEntry.set(entry.key, list);
        } else {
            rest.push(state);
        }
    }
    const candidates: DeviceDetailRow[] = [];
    for (const entry of mask.entries) {
        const found = byEntry.get(entry.key);
        if (found && found.length > 0) {
            for (const state of found) {
                candidates.push({ key: entry.key, id: state.id, enabled: false });
            }
        } else if (mask !== generalDeviceDetailMask) {
            // the general mask only names what the roles find, an empty row of it says nothing
            candidates.push({ key: entry.key, id: '', enabled: false });
        }
    }
    for (const state of rest) {
        candidates.push({ key: '', id: state.id, enabled: false });
    }

    const same = (a: { key: string; id: string }, b: { key: string; id: string }): boolean =>
        a.key === b.key && a.id === b.id;

    if (saved && saved.length > 0) {
        const first: DeviceDetailRow[] = [];
        for (const s of saved) {
            if (s.id !== '' && !first.some(f => f.id === s.id)) {
                first.push({ key: s.key, id: s.id, enabled: true });
            }
        }
        // a state is shown once: a candidate whose state a saved row already shows (exchanged by the user) stays
        // as an empty row of its entry, a plain one is dropped
        const others: DeviceDetailRow[] = [];
        for (const c of candidates) {
            if (first.some(f => same(f, c))) {
                continue;
            }
            const row = c.id !== '' && first.some(f => f.id === c.id) ? { ...c, id: '' } : c;
            if (
                row.id === '' &&
                (row.key === '' || others.some(r => same(r, row)) || first.some(f => f.key === row.key))
            ) {
                continue;
            }
            others.push(row);
        }
        return [...first, ...others];
    }
    if (learned !== undefined) {
        const first: DeviceDetailRow[] = [];
        for (const ident of learned) {
            for (const c of candidates) {
                if (c.id && deviceDetailIdentifier(deviceId, c) === ident && !first.some(f => same(f, c))) {
                    first.push({ ...c, enabled: true });
                }
            }
        }
        return [...first, ...candidates.filter(c => !first.some(f => same(f, c)))];
    }
    return candidates.map(c => ({ ...c, enabled: c.key !== '' && c.id !== '' }));
}

/**
 * The rows the detail page shows: the ticked rows with a state, in their order.
 *
 * @param rows the rows of the filter list
 * @returns the rows to save
 */
export function deviceDetailEntriesOfRows(rows: readonly DeviceDetailRow[]): DeviceDetailEntryConfig[] {
    const out: DeviceDetailEntryConfig[] = [];
    for (const r of rows) {
        if (r.enabled && r.id !== '' && !out.some(o => o.id === r.id)) {
            out.push({ key: r.key, id: r.id });
        }
    }
    return out;
}

/**
 * Another state for a row of the filter list. A state is shown in one row only: a row that held the new state takes
 * the old state of the changed row (both swap), without old state it becomes empty and unticked; a row without entry
 * that would become empty is dropped.
 *
 * @param rows the rows
 * @param index index of the changed row
 * @param id the new state, '' = none
 * @param change further fields of the changed row (e.g. the entry the role suggests)
 * @returns the new rows
 */
export function exchangeDeviceDetailRowState<T extends DeviceDetailRow>(
    rows: readonly T[],
    index: number,
    id: string,
    change: Partial<DeviceDetailRow> = {},
): T[] {
    const row = rows[index];
    if (!row) {
        return [...rows];
    }
    const old = row.id;
    const out: T[] = [];
    rows.forEach((r, i) => {
        if (i === index) {
            out.push({ ...r, ...change, id, enabled: id !== '' && (r.enabled || old === '') });
        } else if (id !== '' && r.id === id) {
            if (old !== '') {
                out.push({ ...r, id: old });
            } else if (r.key !== '') {
                out.push({ ...r, id: '', enabled: false });
            }
        } else {
            out.push(r);
        }
    });
    return out;
}

/**
 * @param value anything
 * @returns true for a saved row
 */
function isDeviceDetailEntryConfig(value: unknown): value is DeviceDetailEntryConfig {
    return (
        !!value &&
        typeof value === 'object' &&
        'key' in value &&
        typeof value.key === 'string' &&
        'id' in value &&
        typeof value.id === 'string'
    );
}

/**
 * @param value anything, e.g. the `device` field of a stored page item
 * @returns true for a usable device configuration
 */
export function isDeviceDetailsConfig(value: unknown): value is DeviceDetailsConfig {
    return (
        !!value &&
        typeof value === 'object' &&
        'deviceId' in value &&
        typeof value.deviceId === 'string' &&
        value.deviceId !== '' &&
        'entries' in value &&
        Array.isArray(value.entries) &&
        value.entries.every(isDeviceDetailEntryConfig)
    );
}

/**
 * The runtime part of a device configuration (the field `deviceDetails` of the runtime page item).
 *
 * @param config the device configuration of an admin page item
 * @returns the runtime part, undefined without a usable configuration
 */
export function deviceDetailsRuntimeOf(config: unknown): DeviceDetailsRuntime | undefined {
    if (!isDeviceDetailsConfig(config)) {
        return undefined;
    }
    return {
        deviceId: config.deviceId,
        entries: config.entries.filter(e => e.id !== '').map(e => ({ key: e.key, id: e.id })),
    };
}

/**
 * @param value anything, e.g. native `deviceDetailsLearned`
 * @returns the learned ticks, invalid entries left out
 */
export function deviceDetailsLearnedOf(value: unknown): DeviceDetailsLearned {
    const out: DeviceDetailsLearned = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return out;
    }
    for (const [adapter, list] of Object.entries(value)) {
        if (Array.isArray(list) && list.every(v => typeof v === 'string')) {
            out[adapter] = [...list];
        }
    }
    return out;
}

/**
 * The learned ticks after saving a device item: they change only when the ticks or their order changed at the item
 * (a new item counts as changed), not with other changes like the name.
 *
 * @param learned the learned ticks so far
 * @param before the device configuration of the item before the dialog, undefined for a new device item
 * @param after the saved device configuration
 * @returns the new learned ticks, undefined when nothing changes
 */
export function updatedDeviceDetailsLearned(
    learned: DeviceDetailsLearned,
    before: DeviceDetailsConfig | undefined,
    after: DeviceDetailsConfig,
): DeviceDetailsLearned | undefined {
    if (!after.deviceId) {
        return undefined;
    }
    const identifiers = (config: DeviceDetailsConfig): string[] =>
        config.entries.map(e => deviceDetailIdentifier(config.deviceId, e));
    const now = identifiers(after);
    if (before && before.deviceId === after.deviceId && JSON.stringify(identifiers(before)) === JSON.stringify(now)) {
        return undefined;
    }
    const adapter = deviceDetailsAdapter(after.deviceId);
    if (JSON.stringify(learned[adapter]) === JSON.stringify(now)) {
        return undefined;
    }
    return { ...learned, [adapter]: now };
}
