/**
 * Device with details: the masks of the filter list (doc/ideas/device-details/README.md) - pure data, shared by the
 * adapter and the admin. Do not import anything here; the logic lies in `./deviceDetails` (which re-exports all of it).
 *
 * Adding an adapter: append a mask to {@link deviceDetailMasks} with
 * - `adapter`: first part of the ids (`hmip` of `hmip.0.devices.<id>`),
 * - `deviceLevel`: number of id parts of a device (`hmip.0.devices.<id>` = 4), so only the devices can be chosen,
 * - `stateDepth` (optional): number of id parts of a state below the device, 2 when missing
 *   (`channels.1.setPointTemperature` = 3),
 * - `entries`: one per row of the filter list - `key` (name = translation `deviceDetail_<key>` in
 *   `admin/i18n/<lang>/translations.json`, all languages, short: it is shown on the panel), `group` (color), `icon`
 *   (name of the icon font, `src/lib/const/icon_mapping.ts`) and `rules` (`role`, end of the id `dp`, `unit`).
 * Take roles and ids from real objects of the adapter; an entry of an own mask without state is listed as empty row,
 * so list only what the devices of the adapter have.
 */

/** color group of an entry: values take the theme color of their group, on/off the colors activated/deactivated */
export type DeviceDetailGroup = 'energy' | 'climate' | 'connection' | 'info';

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
    /**
     * number of parts of the id of a state below the device (`Relay0.Power` = 2, `channels.1.valvePosition` = 3),
     * undefined = 2
     */
    stateDepth?: number;
    entries: readonly DeviceDetailMaskEntry[];
};

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
        {
            key: 'lowBattery',
            group: 'energy',
            icon: 'battery-alert',
            rules: [{ role: ['indicator.lowbat', 'indicator.maintenance.lowbat'] }],
        },
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
    {
        // HomematicIP cloud: hmip.N.devices.<id>, the states lie in channels.0, channels.1, … and info
        // (radiator thermostat of a productive ioBroker, 2026-11-24)
        adapter: 'hmip',
        deviceLevel: 4,
        stateDepth: 3,
        entries: [
            {
                key: 'lowBattery',
                group: 'energy',
                icon: 'battery-alert',
                rules: [{ role: 'indicator.maintenance.lowbat', dp: '.lowBat' }],
            },
            {
                key: 'temperature',
                group: 'climate',
                icon: 'thermometer',
                rules: [{ role: 'value.temperature', dp: '.valveActualTemperature' }],
            },
            {
                key: 'setpoint',
                group: 'climate',
                icon: 'home-thermometer',
                rules: [{ role: 'level.temperature', dp: '.setPointTemperature' }],
            },
            {
                key: 'valvePosition',
                group: 'climate',
                icon: 'valve',
                rules: [{ role: 'value', dp: '.valvePosition' }],
            },
            // role value, no unit
            { key: 'rssi', group: 'connection', icon: 'wifi', rules: [{ role: 'value', dp: '.rssiDeviceValue' }] },
            {
                key: 'unreachable',
                group: 'connection',
                icon: 'lan-disconnect',
                rules: [{ role: 'indicator', dp: '.unreach' }],
            },
            { key: 'firmware', group: 'info', icon: 'chip', rules: [{ role: 'text', dp: '.firmwareVersion' }] },
        ],
    },
];
