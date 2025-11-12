import type { NavigationItemConfig } from '../classes/navigation';
import type { PageBase } from '../types/pages';
import { Color } from '../const/Color';

const popupNotification: PageBase = {
    dpInit: '',
    alwaysOn: 'ignore',
    uniqueID: '///popupNotificationSystem',
    config: {
        card: 'popupNotify',
        data: {
            details: { type: 'internal', dp: 'system/popupNotification', change: 'ts' },
            setStateYes: { type: 'internal', dp: 'cmd/NotificationCleared' },
            setStateMid: { type: 'internal', dp: 'cmd/NotificationClearedAll' },
        },
    },
    pageItems: [],
    items: undefined,
};

const popupNotification2: PageBase = {
    dpInit: '',
    alwaysOn: 'ignore',
    uniqueID: '///popupNotificationCustom',
    config: {
        card: 'popupNotify',
        data: {
            details: { type: 'internal', dp: 'cmd/popupNotificationCustom', change: 'ts' },
            setStateYes: { type: 'internal', dp: 'cmd/NotificationCustomRight' },
            setStateMid: { type: 'internal', dp: 'cmd/NotificationCustomMid' },
            setStateNo: { type: 'internal', dp: 'cmd/NotificationCustomLeft' },
            setStateID: { type: 'internal', dp: 'cmd/NotificationCustomID' },
            setGlobalYes: { type: 'internal', dp: '///cmd/NotificationCustomRight' },
            setGlobalMid: { type: 'internal', dp: '///cmd/NotificationCustomMid' },
            setGlobalNo: { type: 'internal', dp: '///cmd/NotificationCustomLeft' },
            setGlobalID: { type: 'internal', dp: '///cmd/NotificationCustomID' },
        },
    },
    pageItems: [],
    items: undefined,
};

const AdapterInformation: PageBase = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///Adapter-Info',

    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'Adapter-Info.',
            },
        },
    },
    pageItems: [
        {
            template: 'button.service.adapter.noconnection',
            dpInit: '',
            data: {
                setNavi: { type: 'const', constVal: '///AdapterNotConnectedDetail' },
            },
        },
        {
            template: 'button.service.adapter.stopped',
            dpInit: '',
            data: {
                setNavi: { type: 'const', constVal: '///AdapterStoppedDetail' },
            },
        },
        {
            role: '',
            type: 'button',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'bell-badge-outline' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'bell-outline' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                },
                entity1: {
                    value: {
                        type: 'triggered',
                        dp: 'admin.0.info.updatesNumber',
                        read: 'return val != 0',
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Updates' },
                    false: undefined,
                },
                text1: {
                    true: { type: 'state', dp: 'admin.0.info.updatesNumber' },
                    false: { type: 'const', constVal: '0' },
                },
                setNavi: { type: 'const', constVal: '///AdapterUpdate' },
            },
        },
    ],
    items: undefined,
};

const ServiceUnlock: PageBase = {
    uniqueID: '///unlock',
    alwaysOn: 'always',
    dpInit: '',
    pageItems: [],
    config: {
        card: 'cardAlarm',
        data: {
            alarmType: { type: 'const', constVal: 'unlock' },
            headline: { type: 'const', constVal: 'Service-Unlock' },
            entity1: undefined,
            button1: undefined,
            button2: undefined,
            button3: undefined,
            button4: undefined,
            icon: undefined,
            pin: { type: 'const', constVal: '-1' },
            setNavi: { type: 'const', constVal: '///Overview' },
        },
    },
};

const ServiceOverview: PageBase = {
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///Overview',

    config: {
        card: 'cardGrid2',
        data: {
            headline: {
                type: 'const',
                constVal: 'Overview',
            },
        },
    },
    pageItems: [
        {
            role: '',
            type: 'button',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'folder-alert-outline' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Adapter' },
                    false: undefined,
                },
                setNavi: { type: 'const', constVal: '///Adapter-Info' },
            },
        },
        {
            role: '',
            type: 'button',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'monitor' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Display' },
                    false: undefined,
                },
                setNavi: { type: 'const', constVal: '///ScreensaverOptions' },
                //confirm: { type: 'const', constVal: 'test' },
            },
        },
        {
            role: '',
            type: 'button',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'power' },
                        color: { type: 'const', constVal: Color.option1 },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Relais' },
                    false: undefined,
                },
                setNavi: { type: 'const', constVal: '///RelaisOption' },
            },
        },
        {
            role: '',
            type: 'button',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'information-variant' },
                        color: { type: 'const', constVal: Color.option2 },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Device' },
                    false: undefined,
                },
                setNavi: { type: 'const', constVal: '///DeviceOption' },
            },
        },
        {
            role: '',
            type: 'button',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'wifi' },
                        color: { type: 'const', constVal: Color.option3 },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Network' },
                    false: undefined,
                },
                setNavi: { type: 'const', constVal: '///NetworkOption' },
            },
        },
        {
            role: '',
            type: 'button',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'cog-outline' },
                        color: { type: 'const', constVal: Color.option4 },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'System' },
                    false: undefined,
                },
                setNavi: { type: 'const', constVal: '///SystemOption' },
            },
        },
    ],
    items: undefined,
};

const AdapterNotConnectedDetail: PageBase = {
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///AdapterNotConnectedDetail',
    config: {
        card: 'cardEntities',
        cardRole: 'AdapterConnection',
        scrollType: 'page',
        filterType: 'false',
        data: {
            headline: {
                type: 'const',
                constVal: 'Adapter Offline',
            },
        },
    },
    pageItems: [],
    items: undefined,
};

const AdapterStoppedDetail: PageBase = {
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///AdapterStoppedDetail',
    config: {
        card: 'cardEntities',
        cardRole: 'AdapterStopped',
        scrollType: 'page',
        filterType: 'false',
        data: {
            headline: {
                type: 'const',
                constVal: 'Adapter stopped',
            },
        },
    },
    pageItems: [],
    items: undefined,
};

const AdapterUpdateDetail: PageBase = {
    dpInit: 'admin.0.',
    alwaysOn: 'none',
    uniqueID: '///AdapterUpdate',
    config: {
        card: 'cardEntities',
        cardRole: 'AdapterUpdates',
        scrollType: 'page',
        data: {
            headline: {
                type: 'const',
                constVal: 'Adapter update',
            },
            list: {
                mode: 'auto',
                type: 'state',
                dp: '',
                regexp: /\.info\.updatesJson$/,
                role: '',
            },
        },
    },
    pageItems: [],
    items: undefined,
};

const ScreensaverOptions: PageBase = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///ScreensaverOptions',

    config: {
        card: 'cardGrid3',
        scrollType: 'page',
        data: {
            headline: {
                type: 'const',
                constVal: 'ScreensaverOptions',
            },
        },
    },
    pageItems: [
        {
            role: '',
            type: 'button',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'brightness-6' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Brightness' },
                    false: undefined,
                },
                setNavi: { type: 'const', constVal: '///ScreensaverBrightness' },
            },
        },
        {
            role: '',
            type: 'button',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'monitor-dashboard' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Layout' },
                    false: undefined,
                },
                setNavi: { type: 'const', constVal: '///ScreensaverLayout' },
            },
        },
    ],
    items: undefined,
};

const ScreensaverBrightness: PageBase = {
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///ScreensaverBrightness',

    config: {
        card: 'cardEntities',
        scrollType: 'page',
        data: {
            headline: {
                type: 'const',
                constVal: 'ScreensaverBrightness',
            },
        },
    },
    pageItems: [
        // switch Doppelklick
        {
            role: '',
            type: 'switch',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/screenSaverDoubleClick' },
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'switch' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'switch' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                },
                text: { true: { type: 'const', constVal: 'DoubleClick' }, false: undefined },
            },
        },
        // slider Timeout to Screensaver
        {
            role: '',
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/screenSaverTimeout' },
                },
                minValue1: { type: 'const', constVal: 0 },
                maxValue1: { type: 'const', constVal: 90 },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'clock-time-twelve-outline' },
                        color: { type: 'const', constVal: Color.White },
                    },
                    false: undefined,
                },
                text: { true: { type: 'const', constVal: 'screenSaverTimeout' }, false: undefined },
            },
        },
        // slider Helligkeit Standby
        {
            role: '',
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/dimStandby' },
                },
                minValue1: { type: 'const', constVal: 0 },
                maxValue1: { type: 'const', constVal: 100 },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'clock-time-twelve-outline' },
                        color: { type: 'const', constVal: Color.White },
                    },
                    false: undefined,
                },
                text: { true: { type: 'const', constVal: 'dimStandby' }, false: undefined },
            },
        },
        // slider Helligkeit aktiv
        {
            role: '',
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/dimActive' },
                },
                minValue1: { type: 'const', constVal: 0 },
                maxValue1: { type: 'const', constVal: 100 },

                icon: {
                    true: {
                        value: { type: 'const', constVal: 'clock-time-twelve-outline' },
                        color: { type: 'const', constVal: Color.White },
                    },
                    false: undefined,
                },
                text: { true: { type: 'const', constVal: 'dimActive' }, false: undefined },
            },
        },
        // slider Helligkeit Nacht Standby
        {
            role: '',
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/dimNightStandby' },
                },
                minValue1: { type: 'const', constVal: 0 },
                maxValue1: { type: 'const', constVal: 100 },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'clock-time-twelve-outline' },
                        color: { type: 'const', constVal: Color.White },
                    },
                    false: undefined,
                },
                text: { true: { type: 'const', constVal: 'dimNightStandby' }, false: undefined },
            },
        },
        // slider Helligkeit Nacht aktiv
        {
            role: '',
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/dimNightActive' },
                },
                minValue1: { type: 'const', constVal: 0 },
                maxValue1: { type: 'const', constVal: 100 },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'clock-time-twelve-outline' },
                        color: { type: 'const', constVal: Color.White },
                    },
                    false: undefined,
                },
                text: { true: { type: 'const', constVal: 'dimNightActive' }, false: undefined },
            },
        },
        // slider Helligkeit Nacht Start
        {
            role: '',
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/dimNightHourStart' },
                },
                minValue1: { type: 'const', constVal: 0 },
                maxValue1: { type: 'const', constVal: 23 },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'clock-time-twelve-outline' },
                        color: { type: 'const', constVal: Color.White },
                    },
                    false: undefined,
                },
                text: { true: { type: 'const', constVal: 'dimNightHourStart' }, false: undefined },
            },
        },
        // slider Helligkeit Nacht Ende
        {
            role: '',
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/dimNightHourEnd' },
                },
                minValue1: { type: 'const', constVal: 0 },
                maxValue1: { type: 'const', constVal: 23 },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'clock-time-twelve-outline' },
                        color: { type: 'const', constVal: Color.White },
                    },
                    false: undefined,
                },
                text: { true: { type: 'const', constVal: 'dimNightHourEnd' }, false: undefined },
            },
        },
    ],
    items: undefined,
};

const ScreensaverLayout: PageBase = {
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///ScreensaverLayout',

    config: {
        card: 'cardEntities',
        scrollType: 'page',
        data: {
            headline: {
                type: 'const',
                constVal: 'ScreensaverLayout',
            },
        },
    },
    pageItems: [
        {
            role: 'text.list',
            type: 'button',
            template: 'button.iconLeftSize',
            dpInit: '',
        },
        {
            role: 'text.list',
            type: 'button',
            template: 'button.iconRightSize',
            dpInit: '',
        },
        {
            role: '',
            type: 'input_sel',
            data: {
                headline: { type: 'const', constVal: 'screenSaverLayout' },
                entityInSel: {
                    value: { type: 'internal', dp: 'cmd/screenSaverLayout' },
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'monitor' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: undefined,
                },
                text: { true: { type: 'internal', dp: 'cmd/screenSaverLayout' }, false: undefined },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                //valueList: { type: 'internal', dp: 'cmd/screenSaverLayout', read: 'return val ? val.split(";") : []' },
                valueList: { type: 'const', constVal: 'standard?alternate?advanced?easyview' },
            },
        },
        {
            role: '',
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/screenSaverRotationTime' },
                },
                minValue1: { type: 'const', constVal: 0 },
                maxValue1: { type: 'const', constVal: 60 },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'clock-time-twelve-outline' },
                        color: { type: 'const', constVal: Color.White },
                    },
                    false: undefined,
                },
                text: { true: { type: 'const', constVal: 'screenSaverRotationtime' }, false: undefined },
            },
        },
    ],
    items: undefined,
};

const RelaisOption: PageBase = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///RelaisOption',

    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'RelaisOption',
            },
        },
    },
    pageItems: [
        {
            role: '',
            type: 'button',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'numeric-1-circle-outline' },
                        color: { type: 'const', constVal: Color.Gray },
                    },
                    false: {
                        value: { type: 'const', constVal: 'numeric-1-circle' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                },
                entity1: {
                    value: {
                        type: 'internal',
                        dp: 'cmd/detachLeft',
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'HW-Button left' },
                    false: undefined,
                },
                text1: {
                    true: { type: 'const', constVal: 'decoupled' },
                    false: { type: 'const', constVal: 'coupled' },
                },
            },
        },
        {
            role: '',
            type: 'button',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'numeric-2-circle-outline' },
                        color: { type: 'const', constVal: Color.Gray },
                    },
                    false: {
                        value: { type: 'const', constVal: 'numeric-2-circle' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                },
                entity1: {
                    value: {
                        type: 'internal',
                        dp: 'cmd/detachRight',
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'HW-Button right' },
                    false: undefined,
                },
                text1: {
                    true: { type: 'const', constVal: 'decoupled' },
                    false: { type: 'const', constVal: 'coupled' },
                },
            },
        },
    ],
    items: undefined,
};

const DeviceOption: PageBase = {
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///DeviceOption',

    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'DeviceOption',
            },
        },
    },
    pageItems: [
        {
            role: '',
            type: 'button',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'information-outline' },
                        color: { type: 'const', constVal: Color.option4 },
                    },
                    false: {
                        value: { type: 'const', constVal: 'information-variant' },
                        color: { type: 'const', constVal: Color.off },
                    },
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Tasmota-Restart' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'const',
                        constVal: 'restart',
                    },
                    false: undefined,
                },
                confirm: { type: 'const', constVal: 'sure?' },
                setValue2: {
                    type: 'internal',
                    dp: 'cmd/TasmotaRestart',
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'information-outline' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'information-variant' },
                        color: { type: 'const', constVal: Color.Gray },
                    },
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: 'cmd/tasmotaVersion',
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Tasmota-Version' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internal',
                        dp: 'info/tasmotaVersion',
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'information-outline' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'information-variant' },
                        color: { type: 'const', constVal: Color.Gray },
                    },
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: 'cmd/displayVersion',
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'TFT-Version' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internal',
                        dp: 'info/displayVersion',
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'information-outline' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'information-variant' },
                        color: { type: 'const', constVal: Color.Gray },
                    },
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: 'cmd/modelVersion',
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'HW-Nspanel-Version' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internal',
                        dp: 'info/modelVersion',
                    },
                    false: undefined,
                },
            },
        },
    ],
    items: undefined,
};

const NetworkOption: PageBase = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///NetworkOption',

    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'Network',
            },
        },
        scrollType: 'page',
    },
    pageItems: [
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'desktop-mac' },
                        color: { type: 'const', constVal: Color.info },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Hostname' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internalState',
                        dp: 'info/Tasmota',
                        read: `return val ? val.net.Hostname : '';`,
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'ip-network-outline' },
                        color: { type: 'const', constVal: Color.info },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'IP' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internalState',
                        dp: 'info/Tasmota',
                        read: `return val ? val.net.IPAddress : '';`,
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'dns-outline' },
                        color: { type: 'const', constVal: Color.info },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'DNS' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internalState',
                        dp: 'info/Tasmota',
                        read: `return val ? val.net.DNSServer1 : '';`,
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'router-network' },
                        color: { type: 'const', constVal: Color.info },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Mac' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internalState',
                        dp: 'info/Tasmota',
                        read: `return val ? val.net.Mac : '';`,
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'signal-distance-variant' },
                        color: { type: 'const', constVal: Color.info },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Wifi-SSId' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internalState',
                        dp: 'info/Tasmota',
                        read: `return val ? val.sts.Wifi.SSId : '';`,
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'signal' },
                        color: { type: 'const', constVal: Color.info },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'RSSI' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internalState',
                        dp: 'info/Tasmota',
                        read: `return val ? val.sts.Wifi.RSSI + ' %' : '';`,
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'wifi-strength-2' },
                        color: { type: 'const', constVal: Color.info },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Signal' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internalState',
                        dp: 'info/Tasmota',
                        read: `return val ? val.sts.Wifi.Signal + ' db' : '';`,
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'sort-clock-ascending-outline' },
                        color: { type: 'const', constVal: Color.info },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Wifi-Downtime' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internalState',
                        dp: 'info/Tasmota',
                        read: `return val ? val.sts.Wifi.Downtime : '';`,
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'signal-distance-variant' },
                        color: { type: 'const', constVal: Color.info },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Mode' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internalState',
                        dp: 'info/Tasmota',
                        read: `return val ? val.sts.Wifi.Mode : '';`,
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'timeline-clock-outline' },
                        color: { type: 'const', constVal: Color.info },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'Channel' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internalState',
                        dp: 'info/Tasmota',
                        read: `return val ? val.sts.Wifi.Channel : '';`,
                    },
                    false: undefined,
                },
            },
        },
        {
            role: '',
            type: 'text',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'router-wireless-settings' },
                        color: { type: 'const', constVal: Color.info },
                    },
                    false: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                text: {
                    true: { type: 'const', constVal: 'AP' },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internalState',
                        dp: 'info/Tasmota',
                        read: `return val ? val.sts.Wifi.AP : '';`,
                    },
                    false: undefined,
                },
            },
        },
    ],
    items: undefined,
};

const SystemOption: PageBase = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///SystemOption',
    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'System',
            },
        },
        scrollType: 'page',
    },
    pageItems: [
        {
            role: '',
            type: 'switch',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/hideCards' },
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'switch' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'switch' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                },
                text: { true: { type: 'const', constVal: 'Hide Cards' }, false: undefined },
                setValue1: { type: 'internal', dp: 'cmd/hideCards' },
            },
        },
    ],
    items: undefined,
};

/**
 * all pages from system
 */
export const systemPages: PageBase[] = [
    popupNotification,
    popupNotification2,
    AdapterInformation,
    ServiceUnlock,
    ServiceOverview,
    AdapterStoppedDetail,
    AdapterNotConnectedDetail,
    AdapterUpdateDetail,
    ScreensaverOptions,
    ScreensaverBrightness,
    ScreensaverLayout,
    RelaisOption,
    DeviceOption,
    NetworkOption,
    SystemOption,
];
export const systemNavigation: NavigationItemConfig[] = [
    {
        name: '///service',
        page: '///unlock',
        left: { single: 'main' },
    },
    {
        name: '///Overview',
        page: '///Overview',
        right: { double: 'main' },
        optional: 'notifications',
    },
    {
        name: '///Adapter-Info',
        page: '///Adapter-Info',
        left: { double: '///Overview' },
    },
    {
        name: '///AdapterStoppedDetail',
        page: '///AdapterStoppedDetail',
        left: { double: '///Adapter-Info' },
    },
    {
        name: '///AdapterNotConnectedDetail',
        page: '///AdapterNotConnectedDetail',
        left: { double: '///Adapter-Info' },
    },
    {
        name: '///AdapterUpdate',
        page: '///AdapterUpdate',
        left: { double: '///Adapter-Info' },
    },
    {
        name: '///ScreensaverOptions',
        page: '///ScreensaverOptions',
        left: { double: '///Overview' },
    },
    {
        name: '///ScreensaverBrightness',
        page: '///ScreensaverBrightness',
        left: { double: '///ScreensaverOptions' },
    },
    {
        name: '///ScreensaverLayout',
        page: '///ScreensaverLayout',
        left: { double: '///ScreensaverOptions' },
    },
    {
        name: '///RelaisOption',
        page: '///RelaisOption',
        left: { double: '///Overview' },
    },
    {
        name: '///DeviceOption',
        page: '///DeviceOption',
        left: { double: '///Overview' },
    },
    {
        name: '///NetworkOption',
        page: '///NetworkOption',
        left: { double: '///Overview' },
    },
    {
        name: '///SystemOption',
        page: '///SystemOption',
        left: { double: '///Overview' },
    },
    {
        name: '///PopupInfo',
        page: '///PopupInfo',
        left: { double: '///Overview' },
    },
];
