import { settings, device, room } from './types-d';

type ChangeTypeToChannelAndState<Obj> = Obj extends object
    ? {
          [K in keyof Obj]-?: ChangeTypeToChannelAndState<Obj[K]>;
      } & customChannelType
    : ioBroker.StateObject;
export type ChangeToChannel<Obj, T> = Obj extends object
    ? { [K in keyof Obj]-?: customChannelType & T }
    : ioBroker.StateObject;

export type ChangeTypeOfKeys<Obj, N> = Obj extends object ? { [K in keyof Obj]-?: ChangeTypeOfKeys<Obj[K], N> } : N;

export type customChannelType = {
    _channel: ioBroker.ChannelObject | ioBroker.DeviceObject;
};

export const defaultChannel: ioBroker.ChannelObject = {
    _id: '',
    type: 'channel',
    common: {
        name: 'Hey no description... ',
    },
    native: {},
};

export const genericStateObjects: {
    default: ioBroker.StateObject;
    customString: ioBroker.StateObject;
    devices: ioBroker.FolderObject;
    rooms: ioBroker.FolderObject;
    settings: ioBroker.FolderObject;
    global: ioBroker.FolderObject;
    presense: ioBroker.StateObject;
    deviceDB: ioBroker.StateObject;
} = {
    default: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'genericStateObjects.state',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    deviceDB: {
        _id: '',
        type: 'state',
        common: {
            name: 'genericStateObjects.deviceDB',
            type: 'string',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    },
    presense: {
        _id: '',
        type: 'state',
        common: {
            name: 'genericStateObjects.presense',
            type: 'boolean',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    customString: {
        _id: 'User_State',
        type: 'state',
        common: {
            name: 'genericStateObjects.customString',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    devices: {
        _id: '',
        type: 'folder',
        common: {
            name: 'devices.folder',
        },
        native: {},
    },
    rooms: {
        _id: '',
        type: 'folder',
        common: {
            name: 'rooms.folder',
        },
        native: {},
    },
    settings: {
        _id: '',
        type: 'folder',
        common: {
            name: 'settings.folder',
        },
        native: {},
    },
    global: {
        _id: '',
        type: 'folder',
        common: {
            name: 'settings.global',
        },
        native: {},
    },
};

export type statesObjectsType = {
    state: ioBroker.StateObject;
    rooms: customChannelType | ChangeTypeToChannelAndState<room>;
    devices: customChannelType | ChangeTypeToChannelAndState<device>;
    settings: customChannelType & { config: customChannelType | ChangeTypeToChannelAndState<settings> };
};

export const statesObjects: statesObjectsType = {
    state: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'genericStateObjects.state',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    rooms: {
        _channel: {
            _id: '',
            type: 'device',
            common: {
                name: 'room.channel',
            },
            native: {},
        },
        restart: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.restart',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
            },
            native: {},
        },
        known_irks: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.known_irks',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        known_macs: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.known_macs',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        query: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.query',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        exclude: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.exclude',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
            native: {},
        },
        status: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.status',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
            native: {},
        },
        max_distance: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.distance',
                type: 'number',
                role: 'value',
                unit: 'm',
                read: true,
                write: true,
            },
            native: {},
        },
        absorption: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.absorption',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
            },
            native: {},
        },
        tx_ref_rssi: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.tx_ref_rssi',
                type: 'number',
                role: 'value',
                unit: 'db',
                read: true,
                write: false,
            },
            native: {},
        },
        rx_adj_rssi: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.rx_adj_rssi',
                type: 'number',
                role: 'value',
                unit: 'db',
                read: true,
                write: false,
            },
            native: {},
        },
        include: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.include',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
            native: {},
        },
        count_ids: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.count_ids',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        arduino_ota: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.arduino_ota',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
            native: {
                convert: 'val ? "ON" : "OFF"',
            },
        },
        auto_update: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.auto_update',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
            native: {
                convert: 'val ? "ON" : "OFF"',
            },
        },
        prerelease: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.prerelease',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
            native: {
                convert: 'val ? "ON" : "OFF"',
            },
        },
        motion: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.motion',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: false,
            },
            native: {},
        },
        switch: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.switch',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: false,
            },
            native: {},
        },
        button: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.button',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: false,
            },
            native: {},
        },
        pir_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.pri_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        radar_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.radar_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        switch_1_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.switch_1_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        switch_2_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.switch_2_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        button_1: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.button_1',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: false,
            },
            native: {},
        },
        button_1_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.button_1_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        button_2_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.button_2_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        led_1: {
            _channel: {
                _id: '',
                type: 'channel',
                common: {
                    name: 'room.led_1.channel',
                },
                native: {},
            },
            state: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.led_1.state',
                    type: 'boolean',
                    role: 'indicator',
                    read: true,
                    write: false,
                },
                native: {},
            },
            brightness: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.led_1.brightness',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            color: {
                _channel: {
                    _id: '',
                    type: 'channel',
                    common: {
                        name: 'room.led_1.color.channel',
                    },
                    native: {},
                },
                r: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'red',
                        type: 'number',
                        role: 'value',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                g: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'green',
                        type: 'number',
                        role: 'value',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                b: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'blue',
                        type: 'number',
                        role: 'value',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
            },
        },
        telemetry: {
            _channel: {
                _id: '',
                type: 'channel',
                common: {
                    name: 'room.telemetry.channel',
                },
                native: {},
            },
            ip: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.ip',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            uptime: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.uptime',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            firm: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.firm',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            rssi: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.rssi',
                    type: 'number',
                    role: 'value',
                    unit: 'db',
                    read: true,
                    write: false,
                },
                native: {},
            },
            ver: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.ver',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            count: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.count',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            adverts: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.adverts',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            seen: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.seen',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            reported: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.reported',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            freeHeap: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.freeheap',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            maxHeap: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.maxHeap',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            scanStack: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.scanStack',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            loopStack: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.loopStack',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            bleStack: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.bleStack',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
        },
    },
    devices: {
        _channel: {
            _id: '',
            type: 'device',
            common: {
                name: 'devices.channel',
            },
            native: {},
        },
        mac: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.mac',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        id: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.id',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        name: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.name',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        disc: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.disc',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        idType: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.idType',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        'rssi@1m': {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.rssi@1m',
                type: 'number',
                role: 'value',
                unit: 'db',
                read: true,
                write: false,
            },
            native: {},
        },
        rssi: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.rssi',
                type: 'number',
                role: 'value',
                unit: 'db',
                read: true,
                write: false,
            },
            native: {},
        },
        raw: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.raw',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        distance: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.distance',
                type: 'number',
                role: 'value',
                unit: 'm',
                read: true,
                write: false,
            },
            native: {},
        },
        int: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.int',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        close: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.close',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: false,
            },
            native: {},
        },
    },
    settings: {
        _channel: {
            _id: '',
            type: 'channel',
            common: {
                name: 'settings.channel',
            },
            native: {},
        },
        config: {
            _channel: {
                _id: '',
                type: 'channel',
                common: {
                    name: 'settings.config.channel',
                },
                native: {},
            },
            id: {
                _id: '',
                type: 'state',
                common: {
                    name: 'settings.config.id',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            name: {
                _id: '',
                type: 'state',
                common: {
                    name: 'devices.name',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
        },
    },
};

export const Defaults = {
    state: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'No definition',

            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
};
