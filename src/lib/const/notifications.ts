import { PageBaseConfig } from '../types/pages';
import * as Color from './Color';

const popupTest: PageBaseConfig = {
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
            // {placeholder: {text: '' oder dp: ''}}
            // optionalValue: { type: 'const', constVal: { pl: { text: 'das ist ein placeholder' } } },
            //setValue1: { type: 'const', constVal: true },
        },
    },
    pageItems: [],
    items: undefined,
};

export const systemNotifications: PageBaseConfig[] = [popupTest];
