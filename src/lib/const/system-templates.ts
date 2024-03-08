import { NavigationItemConfig } from '../classes/navigation';
import { PageBaseConfig } from '../types/pages';
import { Color } from '../const/Color';

const popupWelcome: PageBaseConfig = {
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///WelcomePopup',
    config: {
        card: 'popupNotify',
        data: {
            entity1: { value: { type: 'state', dp: '0_userdata.0.example_state' } },
            headline: { type: 'const', constVal: 'welcomeHToken' },
            colorHeadline: { true: { color: { type: 'const', constVal: Color.Green } } },
            buttonLeft: { type: 'const', constVal: '' },
            colorButtonLeft: { true: { color: { type: 'const', constVal: Color.White } } },
            buttonRight: { type: 'const', constVal: '' },
            colorButtonRight: { true: { color: { type: 'const', constVal: Color.White } } },
            text: { type: 'const', constVal: 'welcomeTToken' }, // text: { type: 'const', constVal: 'Text Test ${pl}' },
            colorText: { true: { color: { type: 'const', constVal: Color.White } } },
            timeout: { type: 'const', constVal: 3 },
            // {placeholder: {text: '' oder dp: ''}} im Text muss dann ${dieserKeyStehtImText} stehen
            // optionalValue: { type: 'const', constVal: { dieserKeyStehtImText: { text: 'das ist ein placeholder' } } },
            //setValue1: { type: 'const', constVal: true }, // alleine ist es ein switch
            //setValue2: { type: 'const', constVal: true }, // mit setValue2 wird 1, bei yes und 2 bei no auf true gesetzt
        },
    },
    pageItems: [],
    items: undefined,
};

const popupNotification: PageBaseConfig = {
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///popupNotification',
    config: {
        card: 'popupNotify',
        data: {
            entity1: { value: { type: 'internal', dp: 'cmd/popupNotification', read: 'return true' } },
            headline: { type: 'internal', dp: 'cmd/popupNotification', read: 'return JSON.parse(val).headline' },
            colorHeadline: { true: { color: { type: 'const', constVal: Color.Green } } },
            buttonLeft: { type: 'const', constVal: 'nextF' },
            colorButtonLeft: { true: { color: { type: 'const', constVal: Color.White } } },
            buttonRight: { type: 'const', constVal: 'ok' },
            colorButtonRight: { true: { color: { type: 'const', constVal: Color.White } } },
            text: { type: 'internal', dp: 'cmd/popupNotification', read: 'return JSON.parse(val).text' }, // text: { type: 'const', constVal: 'Text Test ${pl}' },
            colorText: { true: { color: { type: 'const', constVal: Color.White } } },
            timeout: { type: 'const', constVal: 0 },
            // {placeholder: {text: '' oder dp: ''}}
            // optionalValue: { type: 'const', constVal: { pl: { text: 'das ist ein placeholder' } } },
            setValue1: { type: 'internalState', dp: 'cmd/NotificationCleared' },
            setValue2: { type: 'internalState', dp: 'cmd/NotificationNext' },
            closingBehaviour: { type: 'const', constVal: 'none' },
        },
    },
    pageItems: [],
    items: undefined,
};

const popupNotification2: PageBaseConfig = {
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///popupNotification2',
    config: {
        card: 'popupNotify',
        data: {
            entity1: { value: { type: 'internal', dp: 'cmd/popupNotification2', read: 'return true' } },
            headline: { type: 'internal', dp: 'cmd/popupNotification2', read: 'return JSON.parse(val).headline' },
            colorHeadline: { true: { color: { type: 'const', constVal: Color.Green } } },
            buttonLeft: { type: 'const', constVal: 'nextF' },
            colorButtonLeft: { true: { color: { type: 'const', constVal: Color.White } } },
            buttonRight: { type: 'const', constVal: 'ok' },
            colorButtonRight: { true: { color: { type: 'const', constVal: Color.Green } } },
            text: { type: 'internal', dp: 'cmd/popupNotification2', read: 'return JSON.parse(val).text' }, // text: { type: 'const', constVal: 'Text Test ${pl}' },
            colorText: { true: { color: { type: 'const', constVal: Color.White } } },
            timeout: { type: 'const', constVal: 0 },
            setValue1: { type: 'internalState', dp: 'cmd/NotificationCleared2' },
            setValue2: { type: 'internalState', dp: 'cmd/NotificationNext2' },
            closingBehaviour: { type: 'const', constVal: 'none' },
        },
    },
    pageItems: [],
    items: undefined,
};
const AdapterInformation: PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///Adapter-Info',
    useColor: false,
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
                        value: { type: 'const', constVal: 'bell-outlline' },
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
const ServiceUnlock: PageBaseConfig = {
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

const ServiceOverview: PageBaseConfig = {
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///Overview',
    useColor: false,
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
                        color: { type: 'const', constVal: Color.Green },
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
                        color: { type: 'const', constVal: Color.Green },
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
                        color: { type: 'const', constVal: Color.Green },
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
    ],
    items: undefined,
};

const AdapterNotConnectedDetail: PageBaseConfig = {
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
const AdapterStoppedDetail: PageBaseConfig = {
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

const AdapterUpdateDetail: PageBaseConfig = {
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

const ScreensaverOptions: PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///ScreensaverOptions',
    useColor: false,
    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'ScreensaverOptions',
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
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/screensaverTimeout' },
                    minScale: { type: 'const', constVal: 0 },
                    maxScale: { type: 'const', constVal: 90 },
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'clock-time-twelve-outline' },
                        color: { type: 'const', constVal: Color.White },
                    },
                    false: undefined,
                },
                text: { true: { type: 'const', constVal: 'screensaverTimeout' }, false: undefined },
            },
        },
        {
            role: '',
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/dimStandby' },
                    factor: { type: 'const', constVal: 1 / 10 },
                    minScale: { type: 'const', constVal: 0 },
                    maxScale: { type: 'const', constVal: 10 },
                },
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
        {
            role: '',
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/dimActive' },
                    factor: { type: 'const', constVal: 1 / 10 },
                    minScale: { type: 'const', constVal: 0 },
                    maxScale: { type: 'const', constVal: 10 },
                },
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
    ],
    items: undefined,
};

const RelaisOption: PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///RelaisOption',
    useColor: false,
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
                        value: { type: 'const', constVal: 'numeric-2-circle-outline' },
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
                setValue1: {
                    type: 'internal',
                    dp: 'cmd/detachLeft',
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
                        value: { type: 'const', constVal: 'numeric-1-circle' },
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
                setValue1: {
                    type: 'internal',
                    dp: 'cmd/detachRight',
                },
            },
        },
    ],
    items: undefined,
};

const DeviceOption: PageBaseConfig = {
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///DeviceOption',
    useColor: false,
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
                        dp: 'cmd/tasmotaVersion',
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
                        dp: 'cmd/displayVersion',
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
                        dp: 'cmd/modelVersion',
                    },
                    false: undefined,
                },
            },
        },
    ],
    items: undefined,
};

const NetworkOption: PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///NetworkOption',
    useColor: false,
    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'Network',
            },
        },
    },
    pageItems: [
        {
            role: 'textNotIcon',
            type: 'text',

            data: {
                icon: {
                    true: {
                        text: { value: { type: 'const', constVal: '1' } },
                        color: { type: 'const', constVal: Color.Gray },
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
            role: 'textNotIcon',
            type: 'text',

            data: {
                icon: {
                    true: {
                        text: { value: { type: 'const', constVal: '2' } },
                        color: { type: 'const', constVal: Color.Gray },
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
            role: 'textNotIcon',
            type: 'text',

            data: {
                icon: {
                    true: {
                        text: { value: { type: 'const', constVal: '3' } },
                        color: { type: 'const', constVal: Color.Gray },
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
            role: 'textNotIcon',
            type: 'text',

            data: {
                icon: {
                    true: {
                        text: { value: { type: 'const', constVal: '4' } },
                        color: { type: 'const', constVal: Color.Gray },
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
            role: 'textNotIcon',
            type: 'text',

            data: {
                icon: {
                    true: {
                        text: { value: { type: 'const', constVal: '5' } },
                        color: { type: 'const', constVal: Color.Gray },
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
            role: 'textNotIcon',
            type: 'text',

            data: {
                icon: {
                    true: {
                        text: { value: { type: 'const', constVal: '6' } },
                        color: { type: 'const', constVal: Color.Gray },
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
                        read: `return val ? val.sts.Wifi.RSSI : '';`,
                    },
                    false: undefined,
                },
            },
        },
        {
            role: 'textNotIcon',
            type: 'text',

            data: {
                icon: {
                    true: {
                        text: { value: { type: 'const', constVal: '7' } },
                        color: { type: 'const', constVal: Color.Gray },
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
            role: 'textNotIcon',
            type: 'text',

            data: {
                icon: {
                    true: {
                        text: { value: { type: 'const', constVal: '8' } },
                        color: { type: 'const', constVal: Color.Gray },
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
    ],
    items: undefined,
};

/**
 * all pages from system
 */
export const systemPages: PageBaseConfig[] = [
    popupWelcome,
    popupNotification,
    popupNotification2,
    AdapterInformation,
    ServiceUnlock,
    ServiceOverview,
    AdapterStoppedDetail,
    AdapterNotConnectedDetail,
    AdapterUpdateDetail,
    ScreensaverOptions,
    RelaisOption,
    DeviceOption,
    NetworkOption,
];
export const systemNavigation: NavigationItemConfig[] = [
    {
        name: '///service', //main ist die erste Seite
        page: '///unlock',
        left: { single: 'main' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'alarm1', double: '2' },
    },
    {
        name: '///Overview', //main ist die erste Seite
        page: '///Overview',
        right: { double: 'main' }, // Die 4 bezieht sich auf den name: 4
        optional: 'notifications',
        //right: { single: 'abfall1', double: 'main' },
    },
    {
        name: '///Adapter-Info', //main ist die erste Seite
        page: '///Adapter-Info',
        left: { double: '///Overview' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'abfall1', double: 'main' },
    },
    {
        name: '///AdapterStoppedDetail', //main ist die erste Seite
        page: '///AdapterStoppedDetail',
        left: { double: '///Adapter-Info' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'abfall1', double: 'main' },
    },
    {
        name: '///AdapterNotConnectedDetail', //main ist die erste Seite
        page: '///AdapterNotConnectedDetail',
        left: { double: '///Adapter-Info' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'abfall1', double: 'main' },
    },
    {
        name: '///AdapterUpdate', //main ist die erste Seite
        page: '///AdapterUpdate',
        left: { double: '///Adapter-Info' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'abfall1', double: 'main' },
    },
    {
        name: '///ScreensaverOptions', //main ist die erste Seite
        page: '///ScreensaverOptions',
        left: { double: '///Overview' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'abfall1', double: 'main' },
    },
    {
        name: '///RelaisOption', //main ist die erste Seite
        page: '///RelaisOption',
        left: { double: '///Overview' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'abfall1', double: 'main' },
    },
    {
        name: '///DeviceOption', //main ist die erste Seite
        page: '///DeviceOption',
        left: { double: '///Overview' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'abfall1', double: 'main' },
    },
    {
        name: '///NetworkOption', //main ist die erste Seite
        page: '///NetworkOption',
        left: { double: '///Overview' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'abfall1', double: 'main' },
    },
];
