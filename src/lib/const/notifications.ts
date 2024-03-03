import { PageBaseConfig } from '../types/pages';
import * as Color from './Color';

const popupWelcome: PageBaseConfig = {
    card: 'popupNotify',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///WelcomePopup',
    useColor: false,
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
    card: 'popupNotify',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///popupNotification',
    useColor: false,
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
        },
    },
    pageItems: [],
    items: undefined,
};

const popupNotification2: PageBaseConfig = {
    card: 'popupNotify',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///popupNotification2',
    useColor: false,
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
        },
    },
    pageItems: [],
    items: undefined,
};

export const systemNotifications: PageBaseConfig[] = [popupWelcome, popupNotification, popupNotification2];
