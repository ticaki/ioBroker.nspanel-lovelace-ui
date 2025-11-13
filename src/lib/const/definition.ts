import type { NSPanel } from '../types/NSPanel';
import type * as types from '../types/types';
import * as globals from '../types/function-and-const';
import type { PagePopupDataDetails } from '../types/pages';
import type { RGB } from './Color';

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
    ? Obj extends RGB
        ? N
        : customChannelType & { [K in keyof Obj]: ChangeTypeOfKeysForState<Obj[K], N> }
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
                    headingNotification: ioBroker.StateObject;
                    textNotification: ioBroker.StateObject;
                    activateNotification: ioBroker.StateObject;
                };
                pagePopup: customChannelType & {
                    activate: ioBroker.StateObject;
                    global: ioBroker.StateObject;
                } & ChangeTypeOfKeysForState<PagePopupDataDetails, ioBroker.StateObject>;
                goToNavigationPoint: ioBroker.StateObject;
                mainNavigationPoint: ioBroker.StateObject;
                power1: ioBroker.StateObject;
                power2: ioBroker.StateObject;
                detachRight: ioBroker.StateObject;
                detachLeft: ioBroker.StateObject;
                hideCards: ioBroker.StateObject;
                buzzer: ioBroker.StateObject;
                isBuzzerAllowed: ioBroker.StateObject;
            };

            buttons: customChannelType & {
                left: ioBroker.StateObject;
                right: ioBroker.StateObject;
                indicator: ioBroker.StateObject;
                screensaverGesture: ioBroker.StateObject;
            };
            pagePopup: customChannelType & {
                id: ioBroker.StateObject;
                buttonRight: ioBroker.StateObject;
                buttonMid: ioBroker.StateObject;
                buttonLeft: ioBroker.StateObject;
            };
            info: customChannelType & {
                status: ioBroker.StateObject;
            } & ChangeTypeOfKeysForState<Required<types.PanelInfo>, ioBroker.StateObject>;
            alarm: customChannelType & {
                cardAlarm: customChannelType & {
                    status: ioBroker.StateObject;
                    mode: ioBroker.StateObject;
                    approve: ioBroker.StateObject;
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
            pagePopup: {
                _channel: {
                    _id: '',
                    type: 'channel',
                    common: {
                        name: 'StateObjects.pagePopup',
                    },
                    native: {},
                },
                id: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'Id of the popup',
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                        def: '',
                    },
                    native: {},
                },
                buttonRight: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'Button right',
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                        def: '',
                    },
                    native: {},
                },
                buttonMid: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'Button middle',
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                        def: '',
                    },
                    native: {},
                },
                buttonLeft: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'Button left',
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                        def: '',
                    },
                    native: {},
                },
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
                isBuzzerAllowed: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'Allow buzzer from notifications and popups',
                        type: 'boolean',
                        role: 'switch',
                        read: true,
                        write: true,
                        def: true,
                    },
                    native: {},
                },
                hideCards: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.hideCards',
                        type: 'boolean',
                        role: 'switch',
                        read: true,
                        write: true,
                        def: false,
                    },
                    native: {},
                },
                buzzer: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.buzzer',
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: true,
                        desc: 'Send buzzer command to panel (e.g., "1,2,3,0xF54" for tone, duration, count, frequency)',
                        def: '',
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
                            states: globals.screenSaverInfoIcons,
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
                    headingNotification: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.headingNotification',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: true,
                            def: '',
                        },
                        native: {},
                    },
                    textNotification: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.textNotification',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: true,
                            def: '',
                        },
                        native: {},
                    },
                    activateNotification: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.activateNotification',
                            type: 'boolean',
                            role: 'switch',
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
                            states: globals.arrayOfScreensaverModes,
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
                            def: 15,
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
                            def: 80,
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
                            def: true,
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
                            def: 0,
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
                            def: 30,
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
                },
                pagePopup: {
                    _channel: {
                        _id: '',
                        type: 'folder',
                        common: {
                            name: 'StateObjects.popup',
                        },
                        native: {},
                    },
                    id: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.popup.id',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: true,
                            def: '',
                        },
                        native: {},
                    },
                    global: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.popup.global',
                            type: 'boolean',
                            role: 'switch',
                            read: true,
                            write: true,
                            def: false,
                        },
                        native: {},
                    },
                    activate: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.popup.activate',
                            type: 'boolean',
                            role: 'button',
                            read: false,
                            write: true,
                            def: false,
                        },
                        native: {},
                    },
                    priority: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.popup.priority',
                            type: 'number',
                            role: 'level',
                            read: true,
                            write: true,
                            def: 50,
                        },
                        native: {},
                    },
                    type: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.popup.type',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: true,
                            states: {
                                information: 'information',
                                acknowledge: 'acknowledge',
                            },
                            def: 'information',
                        },
                        native: {},
                    },
                    headline: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'headline',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: true,
                            def: '',
                        },
                        native: {},
                    },
                    colorHeadline: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'colorHeadline',
                            type: 'string',
                            role: 'json',
                            read: true,
                            write: true,
                            def: JSON.stringify({ r: 255, g: 255, b: 255 }),
                        },
                        native: {},
                    },
                    buttonLeft: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'buttonLeft',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: true,
                            def: '',
                        },
                        native: {},
                    },
                    colorButtonLeft: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'colorButtonLeft',
                            type: 'string',
                            role: 'json',
                            read: true,
                            write: true,
                            def: JSON.stringify({ r: 255, g: 255, b: 255 }),
                        },
                        native: {},
                    },
                    buttonMid: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'buttonMid',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: true,
                            def: '',
                        },
                        native: {},
                    },
                    colorButtonMid: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'colorButtonMid',
                            type: 'string',
                            role: 'json',
                            read: true,
                            write: true,
                            def: JSON.stringify({ r: 255, g: 255, b: 255 }),
                        },
                        native: {},
                    },
                    buzzer: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'buzzer',
                            type: 'boolean',
                            role: 'switch',
                            read: true,
                            write: true,
                            def: false,
                        },
                        native: {},
                    },
                    buttonRight: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'buttonRight',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: true,
                            def: '',
                        },
                        native: {},
                    },
                    colorButtonRight: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'colorButtonRight',
                            type: 'string',
                            role: 'json',
                            read: true,
                            write: true,
                            def: JSON.stringify({ r: 255, g: 255, b: 255 }),
                        },
                        native: {},
                    },
                    text: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'text',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: true,
                            def: '',
                        },
                        native: {},
                    },
                    colorText: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'colorText',
                            type: 'string',
                            role: 'json',
                            read: true,
                            write: true,
                            def: JSON.stringify({ r: 255, g: 255, b: 255 }),
                        },
                        native: {},
                    },

                    textSize: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'textSize',
                            type: 'number',
                            role: 'level',
                            read: true,
                            write: true,
                            def: 3,
                            min: 1,
                            max: 5,
                            step: 1,
                        },
                        native: {},
                    },
                    icon: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'icon',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: true,
                            def: '',
                        },
                        native: {},
                    },
                    iconColor: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'colorIcon',
                            type: 'string',
                            role: 'json',
                            read: true,
                            write: true,
                            def: JSON.stringify({ r: 255, g: 255, b: 255 }),
                        },
                        native: {},
                    },
                    alwaysOn: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'alwaysOn',
                            type: 'boolean',
                            role: 'switch',
                            read: true,
                            write: true,
                            def: true,
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
                    berryDriverVersion: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.berryDriverVersion',
                            type: 'number',
                            role: 'value',
                            read: true,
                            write: false,
                            def: 0,
                        },
                        native: {},
                    },
                    berryDriverVersionOnline: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.berryDriverVersionOnline',
                            type: 'number',
                            role: 'value',
                            read: true,
                            write: false,
                            def: 0,
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
                    scriptVersion: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.scriptVersion',
                            type: 'string',
                            role: 'text',
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
                    mqttClient: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.mqttClientId',
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
                        name: 'alarm',
                    },
                    native: {},
                },
                cardAlarm: {
                    _channel: {
                        _id: '',
                        type: 'channel',
                        common: {
                            name: 'cardAlarm',
                        },
                        native: {},
                    },
                    approve: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.approve',
                            type: 'boolean',
                            role: 'switch',
                            read: true,
                            write: true,
                        },
                        native: {},
                    },
                    status: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.alarmstatus',
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
                            name: 'StateObjects.alarmmode',
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

export const InternalStates: { panel: Record<NSPanel.PanelInternalCommand, types.InternalStatesObject> } = {
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
        'cmd/isBuzzerAllowed': {
            val: true,
            ack: true,
            common: {
                name: 'isBuzzerAllowed',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
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
                states: globals.arrayOfScreensaverModes,
            },
        },
        'cmd/NotificationClearedAll': {
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
        'cmd/popupNotificationCustom': {
            val: JSON.stringify({}),
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'json',
                read: true,
                write: true,
            },
            noTrigger: true,
        },
        'system/popupNotification': {
            val: JSON.stringify({}),
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'json',
                read: true,
                write: true,
            },
            noTrigger: true,
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
        'cmd/screensaverHeadingNotification': {
            val: '',
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
        },
        'cmd/screensaverTextNotification': {
            val: '',
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
        },
        'cmd/screensaverActivateNotification': {
            val: false,
            ack: true,
            common: {
                name: '',
                type: 'boolean',
                role: 'switch',
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
                states: globals.screenSaverInfoIcons,
                def: 'none',
            },
        },
        'cmd/hideCards': {
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
        'cmd/buzzer': {
            val: '',
            ack: true,
            common: {
                name: 'StateObjects.buzzer',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
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
        'cmd/NotificationCustomRight': {
            val: false,
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
        },
        'cmd/NotificationCustomLeft': {
            val: false,
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
        },
        'cmd/NotificationCustomMid': {
            val: false,
            ack: true,
            common: {
                name: '',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
        },
        'cmd/NotificationCustomID': {
            val: '',
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
    Record<
        NSPanel.ScreenSaverPlaces,
        {
            maxEntries: Pick<Record<types.NSpanelModel, number>, 'eu'> &
                Partial<Omit<Record<types.NSpanelModel, number>, 'eu'>>;
        }
    >
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
        notify: {
            maxEntries: { eu: 99 },
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
        notify: {
            maxEntries: { eu: 99 },
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
        notify: {
            maxEntries: { eu: 99 },
        },
    },
    easyview: {
        left: {
            maxEntries: { eu: 0 },
        },
        bottom: {
            maxEntries: { eu: 3, 'us-p': 4, 'us-l': 3 },
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
        notify: {
            maxEntries: { eu: 99 },
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

export const tasmotaTimeZones = [
    {
        label: 'Africa/Abidjan',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Accra',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Addis_Ababa',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Algiers',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Asmara',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Asmera',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Bamako',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Bangui',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Banjul',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Bissau',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Blantyre',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Brazzaville',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Bujumbura',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Cairo',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Casablanca',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Ceuta',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Africa/Conakry',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Dakar',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Dar_es_Salaam',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Djibouti',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Douala',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/El_Aaiun',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Freetown',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Gaborone',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Harare',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Johannesburg',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Juba',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Kampala',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Khartoum',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Kigali',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Kinshasa',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Lagos',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Libreville',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Lome',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Luanda',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Lubumbashi',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Lusaka',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Malabo',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Maputo',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Maseru',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Mbabane',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Mogadishu',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Monrovia',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Nairobi',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Ndjamena',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Niamey',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Nouakchott',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Ouagadougou',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Porto-Novo',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Sao_Tome',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Timbuktu',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Tripoli',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Tunis',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Windhoek',
        value: 'Timezone +2:00',
    },
    {
        label: 'America/Adak',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-600; TimeDst 0,2,3,1,2,-540',
    },
    {
        label: 'America/Anchorage',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-540; TimeDst 0,2,3,1,2,-480',
    },
    {
        label: 'America/Anguilla',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Antigua',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Araguaina',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Buenos_Aires',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Catamarca',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/ComodRivadavia',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Cordoba',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Jujuy',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/La_Rioja',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Mendoza',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Rio_Gallegos',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Salta',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/San_Juan',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/San_Luis',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Tucuman',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Ushuaia',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Aruba',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Asuncion',
        value: 'Timezone 99; TimeStd 1,4,3,1,0,-240; TimeDst 1,1,10,1,0,-180',
    },
    {
        label: 'America/Atikokan',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Atka',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-600; TimeDst 0,2,3,1,2,-540',
    },
    {
        label: 'America/Bahia',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Bahia_Banderas',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Barbados',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Belem',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Belize',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Blanc-Sablon',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Boa_Vista',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Bogota',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Boise',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Buenos_Aires',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Cambridge_Bay',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Campo_Grande',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Cancun',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Caracas',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Catamarca',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Cayenne',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Cayman',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Chicago',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Chihuahua',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Ciudad_Juarez',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Coral_Harbour',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Cordoba',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Costa_Rica',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Creston',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Cuiaba',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Curacao',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Danmarkshavn',
        value: 'Timezone +0:00',
    },
    {
        label: 'America/Dawson',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Dawson_Creek',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Denver',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Detroit',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Dominica',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Edmonton',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Eirunepe',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/El_Salvador',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Ensenada',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-480; TimeDst 0,2,3,1,2,-420',
    },
    {
        label: 'America/Fort_Nelson',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Fort_Wayne',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Fortaleza',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Glace_Bay',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-240; TimeDst 0,2,3,1,2,-180',
    },
    {
        label: 'America/Godthab',
        value: 'Timezone -2:00',
    },
    {
        label: 'America/Goose_Bay',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-240; TimeDst 0,2,3,1,2,-180',
    },
    {
        label: 'America/Grand_Turk',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Grenada',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Guadeloupe',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Guatemala',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Guayaquil',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Guyana',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Halifax',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-240; TimeDst 0,2,3,1,2,-180',
    },
    {
        label: 'America/Havana',
        value: 'Timezone 99; TimeStd 0,1,11,1,1,-300; TimeDst 0,2,3,1,0,-240',
    },
    {
        label: 'America/Hermosillo',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Indiana/Indianapolis',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Indiana/Knox',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Indiana/Marengo',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Indiana/Petersburg',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'Africa/Abidjan',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Accra',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Addis_Ababa',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Algiers',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Asmara',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Asmera',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Bamako',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Bangui',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Banjul',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Bissau',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Blantyre',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Brazzaville',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Bujumbura',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Cairo',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Casablanca',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Ceuta',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Africa/Conakry',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Dakar',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Dar_es_Salaam',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Djibouti',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Douala',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/El_Aaiun',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Freetown',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Gaborone',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Harare',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Johannesburg',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Juba',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Kampala',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Khartoum',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Kigali',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Kinshasa',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Lagos',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Libreville',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Lome',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Luanda',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Lubumbashi',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Lusaka',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Malabo',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Maputo',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Maseru',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Mbabane',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Mogadishu',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Monrovia',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Nairobi',
        value: 'Timezone +3:00',
    },
    {
        label: 'Africa/Ndjamena',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Niamey',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Nouakchott',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Ouagadougou',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Porto-Novo',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Sao_Tome',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Timbuktu',
        value: 'Timezone +0:00',
    },
    {
        label: 'Africa/Tripoli',
        value: 'Timezone +2:00',
    },
    {
        label: 'Africa/Tunis',
        value: 'Timezone +1:00',
    },
    {
        label: 'Africa/Windhoek',
        value: 'Timezone +2:00',
    },
    {
        label: 'America/Adak',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-600; TimeDst 0,2,3,1,2,-540',
    },
    {
        label: 'America/Anchorage',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-540; TimeDst 0,2,3,1,2,-480',
    },
    {
        label: 'America/Anguilla',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Antigua',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Araguaina',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Buenos_Aires',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Catamarca',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/ComodRivadavia',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Cordoba',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Jujuy',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/La_Rioja',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Mendoza',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Rio_Gallegos',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Salta',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/San_Juan',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/San_Luis',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Tucuman',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Argentina/Ushuaia',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Aruba',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Asuncion',
        value: 'Timezone 99; TimeStd 1,4,3,1,0,-240; TimeDst 1,1,10,1,0,-180',
    },
    {
        label: 'America/Atikokan',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Atka',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-600; TimeDst 0,2,3,1,2,-540',
    },
    {
        label: 'America/Bahia',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Bahia_Banderas',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Barbados',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Belem',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Belize',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Blanc-Sablon',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Boa_Vista',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Bogota',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Boise',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Buenos_Aires',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Cambridge_Bay',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Campo_Grande',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Cancun',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Caracas',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Catamarca',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Cayenne',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Cayman',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Chicago',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Chihuahua',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Ciudad_Juarez',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Coral_Harbour',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Cordoba',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Costa_Rica',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Creston',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Cuiaba',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Curacao',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Danmarkshavn',
        value: 'Timezone +0:00',
    },
    {
        label: 'America/Dawson',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Dawson_Creek',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Denver',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Detroit',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Dominica',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Edmonton',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Eirunepe',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/El_Salvador',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Ensenada',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-480; TimeDst 0,2,3,1,2,-420',
    },
    {
        label: 'America/Fort_Nelson',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Fort_Wayne',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Fortaleza',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Glace_Bay',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-240; TimeDst 0,2,3,1,2,-180',
    },
    {
        label: 'America/Godthab',
        value: 'Timezone -2:00',
    },
    {
        label: 'America/Goose_Bay',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-240; TimeDst 0,2,3,1,2,-180',
    },
    {
        label: 'America/Grand_Turk',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Grenada',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Guadeloupe',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Guatemala',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Guayaquil',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Guyana',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Halifax',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-240; TimeDst 0,2,3,1,2,-180',
    },
    {
        label: 'America/Havana',
        value: 'Timezone 99; TimeStd 0,1,11,1,1,-300; TimeDst 0,2,3,1,0,-240',
    },
    {
        label: 'America/Hermosillo',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Indiana/Indianapolis',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Indiana/Knox',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Indiana/Marengo',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Indiana/Petersburg',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Indiana/Tell_City',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Indiana/Vevay',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Indiana/Vincennes',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Indiana/Winamac',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Indianapolis',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Inuvik',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Iqaluit',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Jamaica',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Jujuy',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Juneau',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-540; TimeDst 0,2,3,1,2,-480',
    },
    {
        label: 'America/Kentucky/Louisville',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Kentucky/Monticello',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Knox_IN',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Kralendijk',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/La_Paz',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Lima',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Los_Angeles',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-480; TimeDst 0,2,3,1,2,-420',
    },
    {
        label: 'America/Louisville',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Lower_Princes',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Maceio',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Managua',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Manaus',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Marigot',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Martinique',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Matamoros',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Mazatlan',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Mendoza',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Menominee',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Merida',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Metlakatla',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-540; TimeDst 0,2,3,1,2,-480',
    },
    {
        label: 'America/Mexico_City',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Miquelon',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-180; TimeDst 0,2,3,1,2,-120',
    },
    {
        label: 'America/Moncton',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-240; TimeDst 0,2,3,1,2,-180',
    },
    {
        label: 'America/Monterrey',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Montevideo',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Montreal',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Montserrat',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Nassau',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/New_York',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Nipigon',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Nome',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-540; TimeDst 0,2,3,1,2,-480',
    },
    {
        label: 'America/Noronha',
        value: 'Timezone -2:00',
    },
    {
        label: 'America/North_Dakota/Beulah',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/North_Dakota/Center',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/North_Dakota/New_Salem',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Nuuk',
        value: 'Timezone -2:00',
    },
    {
        label: 'America/Ojinaga',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Panama',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Pangnirtung',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Paramaribo',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Phoenix',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Port-au-Prince',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Port_of_Spain',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Porto_Acre',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Porto_Velho',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Puerto_Rico',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Punta_Arenas',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Rainy_River',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Rankin_Inlet',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Recife',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Regina',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Resolute',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Rio_Branco',
        value: 'Timezone -5:00',
    },
    {
        label: 'America/Rosario',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Santa_Isabel',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-480; TimeDst 0,2,3,1,2,-420',
    },
    {
        label: 'America/Santarem',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Santiago',
        value: 'This timezone uses a DST start/end rule that Tasmota does not support.',
    },
    {
        label: 'America/Santo_Domingo',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Sao_Paulo',
        value: 'Timezone -3:00',
    },
    {
        label: 'America/Scoresbysund',
        value: 'Timezone 99; TimeStd 0,0,10,1,1,-60; TimeDst 0,0,3,1,0,0',
    },
    {
        label: 'America/Shiprock',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'America/Sitka',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-540; TimeDst 0,2,3,1,2,-480',
    },
    {
        label: 'America/St_Barthelemy',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/St_Johns',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-210.0; TimeDst 0,2,3,1,2,-150.0',
    },
    {
        label: 'America/St_Kitts',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/St_Lucia',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/St_Thomas',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/St_Vincent',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Swift_Current',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Tegucigalpa',
        value: 'Timezone -6:00',
    },
    {
        label: 'America/Thule',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-240; TimeDst 0,2,3,1,2,-180',
    },
    {
        label: 'America/Thunder_Bay',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Tijuana',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-480; TimeDst 0,2,3,1,2,-420',
    },
    {
        label: 'America/Toronto',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'America/Tortola',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Vancouver',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-480; TimeDst 0,2,3,1,2,-420',
    },
    {
        label: 'America/Virgin',
        value: 'Timezone -4:00',
    },
    {
        label: 'America/Whitehorse',
        value: 'Timezone -7:00',
    },
    {
        label: 'America/Winnipeg',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'America/Yakutat',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-540; TimeDst 0,2,3,1,2,-480',
    },
    {
        label: 'America/Yellowknife',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'Antarctica/Casey',
        value: 'Timezone +11:00',
    },
    {
        label: 'Antarctica/Davis',
        value: 'Timezone +7:00',
    },
    {
        label: 'Antarctica/DumontDUrville',
        value: 'Timezone +10:00',
    },
    {
        label: 'Antarctica/Macquarie',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,600; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Antarctica/Mawson',
        value: 'Timezone +5:00',
    },
    {
        label: 'Antarctica/McMurdo',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,720; TimeDst 1,0,9,1,2,780',
    },
    {
        label: 'Antarctica/Palmer',
        value: 'Timezone -3:00',
    },
    {
        label: 'Antarctica/Rothera',
        value: 'Timezone -3:00',
    },
    {
        label: 'Antarctica/South_Pole',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,720; TimeDst 1,0,9,1,2,780',
    },
    {
        label: 'Antarctica/Syowa',
        value: 'Timezone +3:00',
    },
    {
        label: 'Antarctica/Troll',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,0; TimeDst 0,0,3,1,1,120',
    },
    {
        label: 'Antarctica/Vostok',
        value: 'Timezone +6:00',
    },
    {
        label: 'Arctic/Longyearbyen',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Asia/Aden',
        value: 'Timezone +3:00',
    },
    {
        label: 'Asia/Almaty',
        value: 'Timezone +6:00',
    },
    {
        label: 'Asia/Amman',
        value: 'Timezone +3:00',
    },
    {
        label: 'Asia/Anadyr',
        value: 'Timezone +12:00',
    },
    {
        label: 'Asia/Aqtau',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Aqtobe',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Ashgabat',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Ashkhabad',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Atyrau',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Baghdad',
        value: 'Timezone +3:00',
    },
    {
        label: 'Asia/Bahrain',
        value: 'Timezone +3:00',
    },
    {
        label: 'Asia/Baku',
        value: 'Timezone +4:00',
    },
    {
        label: 'Asia/Bangkok',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Barnaul',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Beirut',
        value: 'Timezone 99; TimeStd 0,0,10,1,0,120; TimeDst 0,0,3,1,0,180',
    },
    {
        label: 'Asia/Bishkek',
        value: 'Timezone +6:00',
    },
    {
        label: 'Asia/Brunei',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Calcutta',
        value: 'Timezone +5:30',
    },
    {
        label: 'Asia/Chita',
        value: 'Timezone +9:00',
    },
    {
        label: 'Asia/Choibalsan',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Chongqing',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Chungking',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Colombo',
        value: 'Timezone +5:30',
    },
    {
        label: 'Asia/Dacca',
        value: 'Timezone +6:00',
    },
    {
        label: 'Asia/Damascus',
        value: 'Timezone +3:00',
    },
    {
        label: 'Asia/Dhaka',
        value: 'Timezone +6:00',
    },
    {
        label: 'Asia/Dili',
        value: 'Timezone +9:00',
    },
    {
        label: 'Asia/Dubai',
        value: 'Timezone +4:00',
    },
    {
        label: 'Asia/Dushanbe',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Famagusta',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Asia/Gaza',
        value: 'This timezone uses a DST start/end rule that Tasmota does not support.',
    },
    {
        label: 'Asia/Harbin',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Hebron',
        value: 'This timezone uses a DST start/end rule that Tasmota does not support.',
    },
    {
        label: 'Asia/Ho_Chi_Minh',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Hong_Kong',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Hovd',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Irkutsk',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Istanbul',
        value: 'Timezone +3:00',
    },
    {
        label: 'Asia/Jakarta',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Jayapura',
        value: 'Timezone +9:00',
    },
    {
        label: 'Asia/Jerusalem',
        value: 'This timezone uses a DST start/end rule that Tasmota does not support.',
    },
    {
        label: 'Asia/Kabul',
        value: 'Timezone +4:30',
    },
    {
        label: 'Asia/Kamchatka',
        value: 'Timezone +12:00',
    },
    {
        label: 'Asia/Karachi',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Kashgar',
        value: 'Timezone +6:00',
    },
    {
        label: 'Asia/Kathmandu',
        value: 'Timezone +5:45',
    },
    {
        label: 'Asia/Katmandu',
        value: 'Timezone +5:45',
    },
    {
        label: 'Asia/Khandyga',
        value: 'Timezone +9:00',
    },
    {
        label: 'Asia/Kolkata',
        value: 'Timezone +5:30',
    },
    {
        label: 'Asia/Krasnoyarsk',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Kuala_Lumpur',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Kuching',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Kuwait',
        value: 'Timezone +3:00',
    },
    {
        label: 'Asia/Macao',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Macau',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Magadan',
        value: 'Timezone +11:00',
    },
    {
        label: 'Asia/Makassar',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Manila',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Muscat',
        value: 'Timezone +4:00',
    },
    {
        label: 'Asia/Nicosia',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Asia/Novokuznetsk',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Novosibirsk',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Omsk',
        value: 'Timezone +6:00',
    },
    {
        label: 'Asia/Oral',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Phnom_Penh',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Pontianak',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Pyongyang',
        value: 'Timezone +9:00',
    },
    {
        label: 'Asia/Qatar',
        value: 'Timezone +3:00',
    },
    {
        label: 'Asia/Qostanay',
        value: 'Timezone +6:00',
    },
    {
        label: 'Asia/Qyzylorda',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Rangoon',
        value: 'Timezone +6:30',
    },
    {
        label: 'Asia/Riyadh',
        value: 'Timezone +3:00',
    },
    {
        label: 'Asia/Saigon',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Sakhalin',
        value: 'Timezone +11:00',
    },
    {
        label: 'Asia/Samarkand',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Seoul',
        value: 'Timezone +9:00',
    },
    {
        label: 'Asia/Shanghai',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Singapore',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Srednekolymsk',
        value: 'Timezone +11:00',
    },
    {
        label: 'Asia/Taipei',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Tashkent',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Tbilisi',
        value: 'Timezone +4:00',
    },
    {
        label: 'Asia/Tehran',
        value: 'Timezone +3:30',
    },
    {
        label: 'Asia/Tel_Aviv',
        value: 'This timezone uses a DST start/end rule that Tasmota does not support.',
    },
    {
        label: 'Asia/Thimbu',
        value: 'Timezone +6:00',
    },
    {
        label: 'Asia/Thimphu',
        value: 'Timezone +6:00',
    },
    {
        label: 'Asia/Tokyo',
        value: 'Timezone +9:00',
    },
    {
        label: 'Asia/Tomsk',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Ujung_Pandang',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Ulaanbaatar',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Ulan_Bator',
        value: 'Timezone +8:00',
    },
    {
        label: 'Asia/Urumqi',
        value: 'Timezone +6:00',
    },
    {
        label: 'Asia/Ust-Nera',
        value: 'Timezone +10:00',
    },
    {
        label: 'Asia/Vientiane',
        value: 'Timezone +7:00',
    },
    {
        label: 'Asia/Vladivostok',
        value: 'Timezone +10:00',
    },
    {
        label: 'Asia/Yakutsk',
        value: 'Timezone +9:00',
    },
    {
        label: 'Asia/Yangon',
        value: 'Timezone +6:30',
    },
    {
        label: 'Asia/Yekaterinburg',
        value: 'Timezone +5:00',
    },
    {
        label: 'Asia/Yerevan',
        value: 'Timezone +4:00',
    },
    {
        label: 'Atlantic/Azores',
        value: 'Timezone 99; TimeStd 0,0,10,1,1,-60; TimeDst 0,0,3,1,0,0',
    },
    {
        label: 'Atlantic/Bermuda',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-240; TimeDst 0,2,3,1,2,-180',
    },
    {
        label: 'Atlantic/Canary',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'Atlantic/Cape_Verde',
        value: 'Timezone -1:00',
    },
    {
        label: 'Atlantic/Faeroe',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'Atlantic/Faroe',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'Atlantic/Jan_Mayen',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Atlantic/Madeira',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'Atlantic/Reykjavik',
        value: 'Timezone +0:00',
    },
    {
        label: 'Atlantic/South_Georgia',
        value: 'Timezone -2:00',
    },
    {
        label: 'Atlantic/St_Helena',
        value: 'Timezone +0:00',
    },
    {
        label: 'Atlantic/Stanley',
        value: 'Timezone -3:00',
    },
    {
        label: 'Australia/ACT',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,600; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Australia/Adelaide',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,570.0; TimeDst 1,1,10,1,2,630.0',
    },
    {
        label: 'Australia/Brisbane',
        value: 'Timezone +10:00',
    },
    {
        label: 'Australia/Broken_Hill',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,570.0; TimeDst 1,1,10,1,2,630.0',
    },
    {
        label: 'Australia/Canberra',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,600; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Australia/Currie',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,600; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Australia/Darwin',
        value: 'Timezone +9:30',
    },
    {
        label: 'Australia/Eucla',
        value: 'Timezone +8:45',
    },
    {
        label: 'Australia/Hobart',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,600; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Australia/LHI',
        value: 'Timezone 99; TimeStd 1,1,4,1,2,630.0; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Australia/Lindeman',
        value: 'Timezone +10:00',
    },
    {
        label: 'Australia/Lord_Howe',
        value: 'Timezone 99; TimeStd 1,1,4,1,2,630.0; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Australia/Melbourne',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,600; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Australia/NSW',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,600; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Australia/North',
        value: 'Timezone +9:30',
    },
    {
        label: 'Australia/Perth',
        value: 'Timezone +8:00',
    },
    {
        label: 'Australia/Queensland',
        value: 'Timezone +10:00',
    },
    {
        label: 'Australia/South',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,570.0; TimeDst 1,1,10,1,2,630.0',
    },
    {
        label: 'Australia/Sydney',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,600; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Australia/Tasmania',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,600; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Australia/Victoria',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,600; TimeDst 1,1,10,1,2,660',
    },
    {
        label: 'Australia/West',
        value: 'Timezone +8:00',
    },
    {
        label: 'Australia/Yancowinna',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,570.0; TimeDst 1,1,10,1,2,630.0',
    },
    {
        label: 'Brazil/Acre',
        value: 'Timezone -5:00',
    },
    {
        label: 'Brazil/DeNoronha',
        value: 'Timezone -2:00',
    },
    {
        label: 'Brazil/East',
        value: 'Timezone -3:00',
    },
    {
        label: 'Brazil/West',
        value: 'Timezone -4:00',
    },
    {
        label: 'CET',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'CST6CDT',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'Canada/Atlantic',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-240; TimeDst 0,2,3,1,2,-180',
    },
    {
        label: 'Canada/Central',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'Canada/Eastern',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'Canada/Mountain',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'Canada/Newfoundland',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-210.0; TimeDst 0,2,3,1,2,-150.0',
    },
    {
        label: 'Canada/Pacific',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-480; TimeDst 0,2,3,1,2,-420',
    },
    {
        label: 'Canada/Saskatchewan',
        value: 'Timezone -6:00',
    },
    {
        label: 'Canada/Yukon',
        value: 'Timezone -7:00',
    },
    {
        label: 'Chile/Continental',
        value: 'This timezone uses a DST start/end rule that Tasmota does not support.',
    },
    {
        label: 'Chile/EasterIsland',
        value: 'Timezone 99; TimeStd 1,1,4,7,22,-360; TimeDst 1,1,9,7,22,-300',
    },
    {
        label: 'Cuba',
        value: 'Timezone 99; TimeStd 0,1,11,1,1,-300; TimeDst 0,2,3,1,0,-240',
    },
    {
        label: 'EET',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'EST',
        value: 'Timezone -5:00',
    },
    {
        label: 'EST5EDT',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'Egypt',
        value: 'Timezone +2:00',
    },
    {
        label: 'Eire',
        value: 'Timezone 99; TimeStd 1,0,3,1,1,60; TimeDst 1,0,10,1,2,0',
    },
    {
        label: 'Europe/Amsterdam',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Andorra',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Astrakhan',
        value: 'Timezone +4:00',
    },
    {
        label: 'Europe/Athens',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Belfast',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'Europe/Belgrade',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Berlin',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Bratislava',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Brussels',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Bucharest',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Budapest',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Busingen',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Chisinau',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,120; TimeDst 0,0,3,1,2,180',
    },
    {
        label: 'Europe/Copenhagen',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Dublin',
        value: 'Timezone 99; TimeStd 1,0,3,1,1,60; TimeDst 1,0,10,1,2,0',
    },
    {
        label: 'Europe/Gibraltar',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Guernsey',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'Europe/Helsinki',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Isle_of_Man',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'Europe/Istanbul',
        value: 'Timezone +3:00',
    },
    {
        label: 'Europe/Jersey',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'Europe/Kaliningrad',
        value: 'Timezone +2:00',
    },
    {
        label: 'Europe/Kiev',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Kirov',
        value: 'Timezone +3:00',
    },
    {
        label: 'Europe/Kyiv',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Lisbon',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'Europe/Ljubljana',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/London',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'Europe/Luxembourg',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Madrid',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Malta',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Mariehamn',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Minsk',
        value: 'Timezone +3:00',
    },
    {
        label: 'Europe/Monaco',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Moscow',
        value: 'Timezone +3:00',
    },
    {
        label: 'Europe/Nicosia',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Oslo',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Paris',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Podgorica',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Prague',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Riga',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Rome',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Samara',
        value: 'Timezone +4:00',
    },
    {
        label: 'Europe/San_Marino',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Sarajevo',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Saratov',
        value: 'Timezone +4:00',
    },
    {
        label: 'Europe/Simferopol',
        value: 'Timezone +3:00',
    },
    {
        label: 'Europe/Skopje',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Sofia',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Stockholm',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Tallinn',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Tirane',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Tiraspol',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,120; TimeDst 0,0,3,1,2,180',
    },
    {
        label: 'Europe/Ulyanovsk',
        value: 'Timezone +4:00',
    },
    {
        label: 'Europe/Uzhgorod',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Vaduz',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Vatican',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Vienna',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Vilnius',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Volgograd',
        value: 'Timezone +3:00',
    },
    {
        label: 'Europe/Warsaw',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Zagreb',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Europe/Zaporozhye',
        value: 'Timezone 99; TimeStd 0,0,10,1,4,120; TimeDst 0,0,3,1,3,180',
    },
    {
        label: 'Europe/Zurich',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Factory',
        value: 'Timezone +0:00',
    },
    {
        label: 'GB',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'GB-Eire',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'GMT',
        value: 'Timezone +0:00',
    },
    {
        label: 'GMT+0',
        value: 'Timezone +0:00',
    },
    {
        label: 'GMT-0',
        value: 'Timezone +0:00',
    },
    {
        label: 'GMT0',
        value: 'Timezone +0:00',
    },
    {
        label: 'Greenwich',
        value: 'Timezone +0:00',
    },
    {
        label: 'HST',
        value: 'Timezone -10:00',
    },
    {
        label: 'Hongkong',
        value: 'Timezone +8:00',
    },
    {
        label: 'Iceland',
        value: 'Timezone +0:00',
    },
    {
        label: 'Indian/Antananarivo',
        value: 'Timezone +3:00',
    },
    {
        label: 'Indian/Chagos',
        value: 'Timezone +6:00',
    },
    {
        label: 'Indian/Christmas',
        value: 'Timezone +7:00',
    },
    {
        label: 'Indian/Cocos',
        value: 'Timezone +6:30',
    },
    {
        label: 'Indian/Comoro',
        value: 'Timezone +3:00',
    },
    {
        label: 'Indian/Kerguelen',
        value: 'Timezone +5:00',
    },
    {
        label: 'Indian/Mahe',
        value: 'Timezone +4:00',
    },
    {
        label: 'Indian/Maldives',
        value: 'Timezone +5:00',
    },
    {
        label: 'Indian/Mauritius',
        value: 'Timezone +4:00',
    },
    {
        label: 'Indian/Mayotte',
        value: 'Timezone +3:00',
    },
    {
        label: 'Indian/Reunion',
        value: '+4:00',
    },
    {
        label: 'Iran',
        value: 'Timezone +3:30',
    },
    {
        label: 'Israel',
        value: 'This timezone uses a DST start/end rule that Tasmota does not support.',
    },
    {
        label: 'Jamaica',
        value: 'Timezone -5:00',
    },
    {
        label: 'Japan',
        value: 'Timezone +9:00',
    },
    {
        label: 'Kwajalein',
        value: 'Timezone +12:00',
    },
    {
        label: 'Libya',
        value: 'Timezone +2:00',
    },
    {
        label: 'MET',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'MST',
        value: 'Timezone -7:00',
    },
    {
        label: 'MST7MDT',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'Mexico/BajaNorte',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-480; TimeDst 0,2,3,1,2,-420',
    },
    {
        label: 'Mexico/BajaSur',
        value: 'Timezone -7:00',
    },
    {
        label: 'Mexico/General',
        value: 'Timezone -6:00',
    },
    {
        label: 'NZ',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,720; TimeDst 1,0,9,1,2,780',
    },
    {
        label: 'NZ-CHAT',
        value: 'This timezone has a UTC offset outside the range Tasmota supports.',
    },
    {
        label: 'Navajo',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'PRC',
        value: 'Timezone +8:00',
    },
    {
        label: 'PST8PDT',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-480; TimeDst 0,2,3,1,2,-420',
    },
    {
        label: 'Pacific/Apia',
        value: 'Timezone +13:00',
    },
    {
        label: 'Pacific/Auckland',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,720; TimeDst 1,0,9,1,2,780',
    },
    {
        label: 'Pacific/Bougainville',
        value: 'Timezone +11:00',
    },
    {
        label: 'Pacific/Chatham',
        value: 'This timezone has a UTC offset outside the range Tasmota supports.',
    },
    {
        label: 'Pacific/Chuuk',
        value: 'Timezone +10:00',
    },
    {
        label: 'Pacific/Easter',
        value: 'Timezone 99; TimeStd 1,1,4,7,22,-360; TimeDst 1,1,9,7,22,-300',
    },
    {
        label: 'Pacific/Efate',
        value: 'Timezone +11:00',
    },
    {
        label: 'Pacific/Enderbury',
        value: 'Timezone +13:00',
    },
    {
        label: 'Pacific/Fakaofo',
        value: 'Timezone +13:00',
    },
    {
        label: 'Pacific/Fiji',
        value: 'Timezone +12:00',
    },
    {
        label: 'Pacific/Funafuti',
        value: 'Timezone +12:00',
    },
    {
        label: 'Pacific/Galapagos',
        value: 'Timezone -6:00',
    },
    {
        label: 'Pacific/Gambier',
        value: 'Timezone -9:00',
    },
    {
        label: 'Pacific/Guadalcanal',
        value: 'Timezone +11:00',
    },
    {
        label: 'Pacific/Guam',
        value: 'Timezone +10:00',
    },
    {
        label: 'Pacific/Honolulu',
        value: 'Timezone -10:00',
    },
    {
        label: 'Pacific/Johnston',
        value: 'Timezone -10:00',
    },
    {
        label: 'Pacific/Kanton',
        value: 'Timezone +13:00',
    },
    {
        label: 'Pacific/Kiritimati',
        value: 'This timezone has a UTC offset outside the range Tasmota supports.',
    },
    {
        label: 'Pacific/Kosrae',
        value: 'Timezone +11:00',
    },
    {
        label: 'Pacific/Kwajalein',
        value: 'Timezone +12:00',
    },
    {
        label: 'Pacific/Majuro',
        value: 'Timezone +12:00',
    },
    {
        label: 'Pacific/Marquesas',
        value: 'Timezone -9:30',
    },
    {
        label: 'Pacific/Midway',
        value: 'Timezone -11:00',
    },
    {
        label: 'Pacific/Nauru',
        value: 'Timezone +12:00',
    },
    {
        label: 'Pacific/Niue',
        value: 'Timezone -11:00',
    },
    {
        label: 'Pacific/Norfolk',
        value: 'Timezone 99; TimeStd 1,1,4,1,3,660; TimeDst 1,1,10,1,2,720',
    },
    {
        label: 'Pacific/Noumea',
        value: 'Timezone +11:00',
    },
    {
        label: 'Pacific/Pago_Pago',
        value: 'Timezone -11:00',
    },
    {
        label: 'Pacific/Palau',
        value: 'Timezone +9:00',
    },
    {
        label: 'Pacific/Pitcairn',
        value: 'Timezone -8:00',
    },
    {
        label: 'Pacific/Pohnpei',
        value: 'Timezone +11:00',
    },
    {
        label: 'Pacific/Ponape',
        value: 'Timezone +11:00',
    },
    {
        label: 'Pacific/Port_Moresby',
        value: 'Timezone +10:00',
    },
    {
        label: 'Pacific/Rarotonga',
        value: 'Timezone -10:00',
    },
    {
        label: 'Pacific/Saipan',
        value: 'Timezone +10:00',
    },
    {
        label: 'Pacific/Samoa',
        value: 'Timezone -11:00',
    },
    {
        label: 'Pacific/Tahiti',
        value: 'Timezone -10:00',
    },
    {
        label: 'Pacific/Tarawa',
        value: 'Timezone +12:00',
    },
    {
        label: 'Pacific/Tongatapu',
        value: 'Timezone +13:00',
    },
    {
        label: 'Pacific/Truk',
        value: 'Timezone +10:00',
    },
    {
        label: 'Pacific/Wake',
        value: 'Timezone +12:00',
    },
    {
        label: 'Pacific/Wallis',
        value: 'Timezone +12:00',
    },
    {
        label: 'Pacific/Yap',
        value: 'Timezone +10:00',
    },
    {
        label: 'Poland',
        value: 'Timezone 99; TimeStd 0,0,10,1,3,60; TimeDst 0,0,3,1,2,120',
    },
    {
        label: 'Portugal',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'ROC',
        value: 'Timezone +8:00',
    },
    {
        label: 'ROK',
        value: 'Timezone +9:00',
    },
    {
        label: 'Singapore',
        value: 'Timezone +8:00',
    },
    {
        label: 'Turkey',
        value: 'Timezone +3:00',
    },
    {
        label: 'UCT',
        value: 'Timezone +0:00',
    },
    {
        label: 'US/Alaska',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-540; TimeDst 0,2,3,1,2,-480',
    },
    {
        label: 'US/Aleutian',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-600; TimeDst 0,2,3,1,2,-540',
    },
    {
        label: 'US/Arizona',
        value: 'Timezone -7:00',
    },
    {
        label: 'US/Central',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'US/East-Indiana',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'US/Eastern',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'US/Hawaii',
        value: 'Timezone -10:00',
    },
    {
        label: 'US/Indiana-Starke',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-360; TimeDst 0,2,3,1,2,-300',
    },
    {
        label: 'US/Michigan',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-300; TimeDst 0,2,3,1,2,-240',
    },
    {
        label: 'US/Mountain',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-420; TimeDst 0,2,3,1,2,-360',
    },
    {
        label: 'US/Pacific',
        value: 'Timezone 99; TimeStd 0,1,11,1,2,-480; TimeDst 0,2,3,1,2,-420',
    },
    {
        label: 'US/Samoa',
        value: 'Timezone -11:00',
    },
    {
        label: 'UTC',
        value: 'Timezone +0:00',
    },
    {
        label: 'Universal',
        value: 'Timezone +0:00',
    },
    {
        label: 'W-SU',
        value: 'Timezone +3:00',
    },
    {
        label: 'WET',
        value: 'Timezone 99; TimeStd 0,0,10,1,2,0; TimeDst 0,0,3,1,1,60',
    },
    {
        label: 'Zulu',
        value: 'Timezone +0:00',
    },
];

export const tasmotaTimeZonesAdmin = tasmotaTimeZones.map(tz => ({
    label: tz.label,
    value: tz.label,
}));

export function getTasmotaTimeZone(label: string): string {
    const tz = tasmotaTimeZones.find(tz => tz.label === label);
    return tz ? tz.value : '';
}

export const weatherEntities = ['brightsky', 'openweathermap', 'pirate-weather', 'accuweather'] as const;

/**
 * Type Guard für DimConfig-Key.
 *
 * @param key - Zu prüfender Wert.
 * @returns True, wenn key ein gültiger DimConfig-Key ist.
 */
export function isDimConfigKey(key: unknown): key is keyof DimConfig {
    if (typeof key !== 'string') {
        return false;
    }
    return [
        'standby',
        'active',
        'dayMode',
        'nightStandby',
        'nightActive',
        'nightHourStart',
        'nightHourEnd',
        'schedule',
    ].includes(key);
}

// 3) Wert-Guard abhängig vom Key
const dimTypeMap: { [P in keyof DimConfig]: 'number' | 'boolean' } = {
    standby: 'number',
    active: 'number',
    dayMode: 'boolean',
    nightStandby: 'number',
    nightActive: 'number',
    nightHourStart: 'number',
    nightHourEnd: 'number',
    schedule: 'boolean',
} as const;

export function isDimValueForKey<K extends keyof DimConfig>(key: K, val: unknown): val is DimConfig[K] {
    return typeof val === dimTypeMap[key];
}
