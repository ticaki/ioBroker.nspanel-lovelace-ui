import * as types from '../types/types';

/*type ChangeTypeToChannelAndState<Obj> = Obj extends object
    ? {
          [K in keyof Obj]-?: ChangeTypeToChannelAndState<Obj[K]>;
      } & customChannelType
    : ioBroker.StateObject;
export type ChangeToChannel<Obj, T> = Obj extends object
    ? { [K in keyof Obj]-?: customChannelType & T }
    : ioBroker.StateObject;
*/
export type ChangeTypeOfKeysForState<Obj, N> = Obj extends object
    ? customChannelType & { [K in keyof Obj]: ChangeTypeOfKeysForState<Obj[K], N> }
    : N;
export type customChannelType = {
    _channel: ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.FolderObject;
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
    panel: customChannelType & {
        panels: customChannelType & {
            cmd: customChannelType & {
                dim: customChannelType & {
                    active: ioBroker.StateObject;
                    standby: ioBroker.StateObject;
                    dayMode: ioBroker.StateObject;
                    nightActive: ioBroker.StateObject;
                    nightStandby: ioBroker.StateObject;
                    nightHourStart: ioBroker.StateObject;
                    nightHourEnd: ioBroker.StateObject;
                    schedule: ioBroker.StateObject;
                    delay: ioBroker.StateObject;
                };
                screenSaver: customChannelType & {
                    infoIcon: ioBroker.StateObject;
                    timeout: ioBroker.StateObject;
                    doubleClick: ioBroker.StateObject;
                    layout: Omit<ioBroker.StateObject, 'common'> & {
                        common: Omit<ioBroker.StateObject['common'], 'states'>;
                    } & {
                        common: { states: Record<types.ScreensaverModeTypeAsNumber, string> };
                    };
                    rotationTime: ioBroker.StateObject;
                };
                goToNavigationPoint: ioBroker.StateObject;
                mainNavigationPoint: ioBroker.StateObject;
                power1: ioBroker.StateObject;
                power2: ioBroker.StateObject;
                detachRight: ioBroker.StateObject;
                detachLeft: ioBroker.StateObject;
            };

            buttons: customChannelType & {
                left: ioBroker.StateObject;
                right: ioBroker.StateObject;
                indicator: ioBroker.StateObject;
                screensaverGesture: ioBroker.StateObject;
            };
            info: customChannelType & {
                status: ioBroker.StateObject;
            } & ChangeTypeOfKeysForState<Required<types.PanelInfo>, ioBroker.StateObject>;
            alarm: customChannelType & {
                cardAlarm: customChannelType & {
                    status: ioBroker.StateObject;
                    mode: ioBroker.StateObject;
                };
            };
        };
    };
} = {
    default: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'StateObjects.state',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    panel: {
        _channel: {
            _id: '',
            type: 'folder',
            common: {
                name: 'StateObjects.panel',
            },
            native: {},
        },
        panels: {
            _channel: {
                _id: '',
                type: 'device',
                common: {
                    name: 'StateObjects.panels',
                    statusStates: {
                        onlineId: 'info.isOnline',
                    },
                },
                native: {},
            },
            buttons: {
                _channel: {
                    _id: '',
                    type: 'channel',
                    common: {
                        name: 'StateObjects.buttons',
                    },
                    native: {},
                },
                left: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.buttons.left',
                        type: 'boolean',
                        role: 'button.press',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                right: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.buttons.right',
                        type: 'boolean',
                        role: 'button.press',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                indicator: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.buttons.indicator',
                        type: 'boolean',
                        role: 'button.press',
                        read: true,
                        write: false,
                        def: true,
                    },
                    native: {},
                },
                screensaverGesture: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.buttons.screensaverGesture',
                        type: 'number',
                        role: 'value',
                        read: true,
                        write: false,
                        def: 0,
                        states: ['inactive', 'active', 'exit', 'swipeUp', 'swipeDown', 'swipeLeft', 'swipeRight'],
                    },
                    native: {},
                },
            },
            cmd: {
                _channel: {
                    _id: '',
                    type: 'channel',
                    common: {
                        name: 'StateObjects.cmd',
                    },
                    native: {},
                },

                mainNavigationPoint: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.mainNavigationPoint',
                        type: 'string',
                        role: 'level.text',
                        read: true,
                        write: true,
                        states: {},
                    },
                    native: {},
                },
                goToNavigationPoint: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.navigateToPage',
                        type: 'string',
                        role: 'level.text',
                        read: true,
                        write: true,
                        states: {},
                    },
                    native: {},
                },
                power1: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.power1',
                        type: 'boolean',
                        role: 'switch',
                        read: true,
                        write: true,
                    },
                    native: {},
                },
                power2: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.power2',
                        type: 'boolean',
                        role: 'switch',
                        read: true,
                        write: true,
                    },
                    native: {},
                },
                detachLeft: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.detachLeft',
                        type: 'boolean',
                        role: 'switch',
                        read: true,
                        write: true,
                    },
                    native: {},
                },
                detachRight: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.detachRight',
                        type: 'boolean',
                        role: 'switch',
                        read: true,
                        write: true,
                    },
                    native: {},
                },

                screenSaver: {
                    _channel: {
                        _id: '',
                        type: 'folder',
                        common: {
                            name: 'StateObjects.screenSaver.screenSaver',
                        },
                        native: {},
                    },
                    infoIcon: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.screenSaver.infoIcon',
                            type: 'string',
                            role: 'text',
                            states: types.screenSaverInfoIcons,
                            read: true,
                            write: true,
                            def: '',
                        },
                        native: {},
                    },
                    timeout: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.screenSaver.timeout',
                            type: 'number',
                            role: 'level',
                            unit: 's',
                            read: true,
                            write: true,
                        },
                        native: {},
                    },
                    layout: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.screenSaver.layout',
                            type: 'number',
                            role: 'level',
                            read: true,
                            write: true,
                            states: types.arrayOfScreensaverModes,
                        },
                        native: {},
                    },
                    rotationTime: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.screenSaver.rotationTime',
                            type: 'number',
                            role: 'level',
                            unit: 's',
                            min: 0,
                            max: 3600,
                            step: 1,
                            read: true,
                            write: true,
                        },
                        native: {},
                    },
                    doubleClick: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.screenSaver.doubleClick',
                            type: 'boolean',
                            role: 'switch',
                            read: true,
                            write: true,
                        },
                        native: {},
                    },
                },
                dim: {
                    _channel: {
                        _id: '',
                        type: 'folder',
                        common: {
                            name: 'StateObjects.dim',
                        },
                        native: {},
                    },
                    standby: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.dimStandby',
                            type: 'number',
                            role: 'level',
                            unit: '%',
                            read: true,
                            write: true,
                        },
                        native: {},
                    },
                    active: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.dimActive',
                            type: 'number',
                            role: 'level',
                            unit: '%',
                            read: true,
                            write: true,
                        },
                        native: {},
                    },
                    dayMode: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.dayMode',
                            type: 'boolean',
                            role: 'switch',
                            read: true,
                            write: true,
                        },
                        native: {},
                    },
                    nightStandby: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.dimNightStandby',
                            type: 'number',
                            role: 'level',
                            unit: '%',
                            read: true,
                            write: true,
                        },
                        native: {},
                    },
                    nightActive: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.dimNightActive',
                            type: 'number',
                            role: 'level',
                            unit: '%',
                            read: true,
                            write: true,
                        },
                        native: {},
                    },
                    nightHourStart: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.dimNightHourStart',
                            type: 'number',
                            role: 'level',
                            read: true,
                            write: true,
                            min: -1,
                            max: 23,
                            step: 1,
                            unit: 'h',
                            def: 22,
                        },
                        native: {},
                    },
                    schedule: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.dimSchedule',
                            type: 'boolean',
                            role: 'switch',
                            read: true,
                            write: true,
                            def: true,
                        },
                        native: {},
                    },
                    nightHourEnd: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.dimNightHourEnd',
                            type: 'number',
                            role: 'level',
                            read: true,
                            write: true,
                            min: -1,
                            max: 23,
                            unit: 'h',
                            step: 1,
                            def: 7,
                        },
                        native: {},
                    },
                    delay: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.dimDelay',
                            type: 'number',
                            role: 'level',
                            unit: 's',
                            read: true,
                            write: true,
                        },
                        native: {},
                    },
                },
            },
            info: {
                _channel: {
                    _id: '',
                    type: 'channel',
                    common: {
                        name: 'Information',
                    },
                    native: {},
                },
                status: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.status',
                        type: 'string',
                        role: 'json',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                nspanel: {
                    _channel: {
                        _id: '',
                        type: 'folder',
                        common: {
                            name: 'StateObjects.nspanel',
                        },
                        native: {},
                    },
                    currentPage: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.currentPage',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    displayVersion: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.displayVersion',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    onlineVersion: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.onlineVersion',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    firmwareUpdate: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.firmwareUpdate',
                            type: 'number',
                            role: 'value',
                            read: true,
                            write: false,
                            def: 100,
                            unit: '%',
                        },
                        native: {},
                    },
                    model: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.model',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    bigIconLeft: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.bigIconLeft',
                            type: 'boolean',
                            role: 'indicator',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    bigIconRight: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.bigIconRight',
                            type: 'boolean',
                            role: 'indicator',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                },
                isOnline: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.isOnline',
                        type: 'boolean',
                        role: 'indicator.reachable',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                tasmota: {
                    _channel: {
                        _id: '',
                        type: 'folder',
                        common: {
                            name: 'Tasmota',
                        },
                        native: {},
                    },
                    firmwareversion: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.firmwareversion',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    safeboot: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.safeboot',
                            type: 'boolean',
                            role: 'indicator',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    onlineVersion: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.onlineVersion',
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
                            name: 'StateObjects.uptime',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    sts: {
                        _channel: {
                            _id: '',
                            type: 'folder',
                            common: {
                                name: 'sts',
                            },
                            native: {},
                        },
                        Time: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'Time',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        Uptime: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'Uptime',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        UptimeSec: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'UptimeSec',
                                type: 'number',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        Heap: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'Heap',
                                type: 'number',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        SleepMode: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'SleepMode',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        Sleep: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'Sleep',
                                type: 'number',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        LoadAvg: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'LoadAvg',
                                type: 'number',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        MqttCount: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'MqttCount',
                                type: 'number',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        Berry: {
                            _channel: {
                                _id: '',
                                type: 'folder',
                                common: {
                                    name: 'Berry',
                                },
                                native: {},
                            },
                            HeapUsed: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'HeapUsed',
                                    type: 'number',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            Objects: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'Objects',
                                    type: 'number',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                        },
                        POWER1: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'POWER1',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        POWER2: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'POWER2',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        Wifi: {
                            _channel: {
                                _id: '',
                                type: 'folder',
                                common: {
                                    name: 'Wifi',
                                },
                                native: {},
                            },
                            AP: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'AP',
                                    type: 'number',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            SSId: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'SSId',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            BSSId: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'BSSId',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            Channel: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'Channel',
                                    type: 'number',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            Mode: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'Mode',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            RSSI: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'RSSI',
                                    type: 'number',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            Signal: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'Signal',
                                    type: 'number',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            LinkCount: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'LinkCount',
                                    type: 'number',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            Downtime: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'Downtime',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                        },
                    },
                    net: {
                        _channel: {
                            _id: '',
                            type: 'folder',
                            common: {
                                name: 'net',
                            },
                            native: {},
                        },
                        IPAddress: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'IPAddress',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        Gateway: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'Gateway',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        DNSServer1: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'DNSServer1',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        DNSServer2: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'DNSServer2',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        Subnetmask: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'Subnetmask',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        Hostname: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'Hostname',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        Mac: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'Mac',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        IP6Global: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'IP6Global',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        IP6Local: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'IP6Local',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        Ethernet: {
                            _channel: {
                                _id: '',
                                type: 'folder',
                                common: {
                                    name: 'Ethernet',
                                },
                                native: {},
                            },
                            Hostname: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'Hostname',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            IPAddress: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'IPAddress',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            Gateway: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'Gateway',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            Subnetmask: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'Subnetmask',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            DNSServer1: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'DNSServer1',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            DNSServer2: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'DNSServer2',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            Mac: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'Mac',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            IP6Global: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'IP6Global',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                            IP6Local: {
                                _id: '',
                                type: 'state',
                                common: {
                                    name: 'IP6Local',
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            },
                        },
                        Webserver: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'Webserver',
                                type: 'number',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        HTTP_API: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'HTTP_API',
                                type: 'number',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        WifiConfig: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'WifiConfig',
                                type: 'number',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        WifiPower: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'WifiPower',
                                type: 'number',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                    },
                },
            },
            alarm: {
                _channel: {
                    _id: '',
                    type: 'channel',
                    common: {
                        name: 'StateObjects.alarm',
                    },
                    native: {},
                },
                cardAlarm: {
                    _channel: {
                        _id: '',
                        type: 'channel',
                        common: {
                            name: 'StateObjects.cardAlarm',
                        },
                        native: {},
                    },
                    status: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.status',
                            type: 'number',
                            role: 'value',
                            states: ['disarmed', 'armed', 'arming', 'pending', 'triggered'],
                            read: true,
                            write: true,
                        },
                        native: {},
                    },
                    mode: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.power2',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                },
            },
        },
    },

    customString: {
        _id: 'User_State',
        type: 'state',
        common: {
            name: 'StateObjects.customString',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
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

export const InternalStates: { panel: Record<types.PanelInternalCommand, types.InternalStatesObject> } = {
    panel: {
        'cmd/power2': {
            val: false,
            ack: true,
            common: {
                name: 'power2',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
            noTrigger: true,
        },
        'cmd/power1': {
            val: false,
            ack: true,
            common: {
                name: 'power1',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
            noTrigger: true,
        },
        'cmd/bigIconRight': {
            val: true,
            ack: true,
            common: {
                name: '',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
        },
        'cmd/detachLeft': {
            val: true,
            ack: true,
            common: {
                name: '',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
        },
        'cmd/detachRight': {
            val: true,
            ack: true,
            common: {
                name: '',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
        },
        'cmd/bigIconLeft': {
            val: true,
            ack: true,
            common: {
                name: '',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
        },
        'cmd/dimActive': {
            val: 0,
            ack: true,
            common: {
                name: '',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
            },
        },
        'cmd/dimStandby': {
            val: 0,
            ack: true,
            common: {
                name: '',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
            },
        },
        'cmd/dimNightActive': {
            val: 0,
            ack: true,
            common: {
                name: '',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
            },
        },
        'cmd/dimNightStandby': {
            val: 0,
            ack: true,
            common: {
                name: '',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
            },
        },
        'cmd/dimNightHourStart': {
            val: 0,
            ack: true,
            common: {
                name: '',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
            },
        },
        'cmd/dimNightHourEnd': {
            val: 0,
            ack: true,
            common: {
                name: '',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
            },
        },
        'cmd/screenSaverTimeout': {
            val: 0,
            ack: true,
            common: {
                name: '',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
            },
        },
        'cmd/screenSaverLayout': {
            val: 'standard',
            ack: true,
            common: {
                name: '',
                type: 'number',
                role: 'level',
                read: true,
                write: true,
                states: types.arrayOfScreensaverModes,
            },
        },
        'cmd/NotificationCleared2': {
            val: false,
            ack: true,
            common: {
                name: '',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
            },
        },
        'cmd/NotificationNext2': {
            val: false,
            ack: true,
            common: {
                name: '',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
            },
        },
        'cmd/popupNotification2': {
            val: JSON.stringify({}),
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'json',
                read: true,
                write: true,
            },
        },
        'cmd/NotificationCleared': {
            val: false,
            ack: true,
            common: {
                name: '',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
            },
        },
        'cmd/NotificationNext': {
            val: false,
            ack: true,
            common: {
                name: '',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
            },
        },
        'info/NotificationCounter': {
            val: JSON.stringify({}),
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'json',
                read: true,
                write: true,
            },
        },
        'cmd/popupNotification': {
            val: JSON.stringify({}),
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'json',
                read: true,
                write: true,
            },
        },
        'info/modelVersion': {
            val: '',
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
        },
        'info/displayVersion': {
            val: '',
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
        },
        'info/tasmotaVersion': {
            val: '',
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
        },
        'info/Tasmota': {
            val: '',
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'json',
                read: true,
                write: false,
            },
        },
        'cmd/TasmotaRestart': {
            val: '',
            ack: true,
            common: {
                name: '',
                type: 'boolean',
                role: 'switch',
                read: false,
                write: true,
            },
        },
        'cmd/screenSaverRotationTime': {
            val: 0,
            ack: true,
            common: {
                name: '',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
            },
        },
        'cmd/screenSaverDoubleClick': {
            val: true,
            ack: true,
            common: {
                name: '',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
        },
        'cmd/screenSaverInfoIcon': {
            val: true,
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
                states: types.screenSaverInfoIcons,
                def: 'none',
            },
        },
        'info/PopupInfo': {
            val: true,
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
        },
    },
};

export const tasmotaOtaUrl = 'http://ota.tasmota.com/tasmota32/release/';

export const ScreenSaverConst: Record<
    types.ScreensaverModeType,
    Record<types.ScreenSaverPlaces, { maxEntries: Record<types.NSpanelModel, number> }>
> = {
    standard: {
        left: {
            maxEntries: { eu: 0 },
        },
        bottom: {
            maxEntries: { eu: 4 },
        },
        alternate: {
            maxEntries: { eu: 0 },
        },
        indicator: {
            maxEntries: { eu: 0 },
        },
        mricon: {
            maxEntries: { eu: 2 },
        },
        favorit: {
            maxEntries: { eu: 1 },
        },
        time: {
            maxEntries: { eu: 1 },
        },
        date: {
            maxEntries: { eu: 1 },
        },
    },
    alternate: {
        left: {
            maxEntries: { eu: 0 },
        },
        bottom: {
            maxEntries: { eu: 3 },
        },
        alternate: {
            maxEntries: { eu: 1 },
        },
        indicator: {
            maxEntries: { eu: 0 },
        },
        mricon: {
            maxEntries: { eu: 2 },
        },
        favorit: {
            maxEntries: { eu: 1 },
        },
        time: {
            maxEntries: { eu: 1 },
        },
        date: {
            maxEntries: { eu: 1 },
        },
    },
    advanced: {
        left: {
            maxEntries: { eu: 3 },
        },
        bottom: {
            maxEntries: { eu: 6 },
        },
        alternate: {
            maxEntries: { eu: 0 },
        },
        indicator: {
            maxEntries: { eu: 5 },
        },
        mricon: {
            maxEntries: { eu: 2 },
        },
        favorit: {
            maxEntries: { eu: 1 },
        },
        time: {
            maxEntries: { eu: 1 },
        },
        date: {
            maxEntries: { eu: 1 },
        },
    },
    easyview: {
        left: {
            maxEntries: { eu: 0 },
        },
        bottom: {
            maxEntries: { eu: 3 },
        },
        alternate: {
            maxEntries: { eu: 0 },
        },
        indicator: {
            maxEntries: { eu: 0 },
        },
        mricon: {
            maxEntries: { eu: 2 },
        },
        favorit: {
            maxEntries: { eu: 1 },
        },
        time: {
            maxEntries: { eu: 1 },
        },
        date: {
            maxEntries: { eu: 1 },
        },
    },
};

/*export const PageTypeDefinition: Record<PageTypeCards, { maxEntries: number }> = {
    cardAlarm: {
        maxEntries: { eu: 1 },
    },
    cardChart: {
        maxEntries: { eu: 1 },
    },
    cardEntities: {
        maxEntries: { eu: 5 },
    },
    cardGrid: {
        maxEntries: { eu: 6 },
    },
    cardGrid2: {
        maxEntries: { eu: 8 },
    },
    cardLChart: {
        maxEntries: { eu: 1 },
    },
    cardMedia: {
        maxEntries: { eu: 1 },
    },
    cardPower: {
        maxEntries: { eu: 1 },
    },
    cardQR: {
        maxEntries: { eu: 1 },
    },
    cardThermo: {
        maxEntries: { eu: 1 },
    },
    cardUnlock: {
        maxEntries: { eu: 1 },
    },
};*/

export const ReiveTopicAppendix = '/tele/RESULT';
export const SendTopicAppendix = '/cmnd/CustomSend';
