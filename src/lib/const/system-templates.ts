import { NavigationItemConfig } from '../classes/navigation';
import { PageBaseConfig } from '../types/pages';
import * as Color from './Color';

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
const pageAdapterInformation: PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///adapter-info',
    useColor: false,
    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'Adapter-Information',
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
    ],
    items: undefined,
};
const pageServiceUnlock: PageBaseConfig = {
    //card: 'cardAlarm',
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
            pin: { type: 'const', constVal: '' },
            setNavi: { type: 'const', constVal: '///Overview' },
        },
    },
};

const pageGridOverview: PageBaseConfig = {
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
                        value: { type: 'const', constVal: 'power' },
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
                setNavi: { type: 'const', constVal: '///adapter-info' },
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
export const systemTemplates: PageBaseConfig[] = [
    popupWelcome,
    popupNotification,
    popupNotification2,
    pageAdapterInformation,
    pageServiceUnlock,
    pageGridOverview,
    AdapterStoppedDetail,
    AdapterNotConnectedDetail,
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
        //right: { single: 'abfall1', double: 'main' },
    },
    {
        name: '///adapter-info', //main ist die erste Seite
        page: '///adapter-info',
        left: { double: '///Overview' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'abfall1', double: 'main' },
    },
    {
        name: '///AdapterStoppedDetail', //main ist die erste Seite
        page: '///AdapterStoppedDetail',
        left: { double: '///adapter-info' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'abfall1', double: 'main' },
    },
    {
        name: '///AdapterNotConnectedDetail', //main ist die erste Seite
        page: '///AdapterNotConnectedDetail',
        left: { double: '///adapter-info' }, // Die 4 bezieht sich auf den name: 4
        //right: { single: 'abfall1', double: 'main' },
    },
];
