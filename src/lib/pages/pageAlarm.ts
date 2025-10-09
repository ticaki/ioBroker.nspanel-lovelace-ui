import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Color } from '../const/Color';
import { genericStateObjects } from '../const/definition';
import { Icons } from '../const/icon_mapping';
import { getPayload, getPayloadRemoveTilde } from '../const/tools';
import * as pages from '../types/pages';
import type { IncomingEvent } from '../types/types';

const PageAlarmMessageDefault: pages.PageAlarmMessage = {
    event: 'entityUpd',
    headline: 'Page Grid',
    intNameEntity: '',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    button1: '',
    status1: '',
    button2: '',
    status2: '',
    button3: '',
    status3: '',
    button4: '',
    status4: '',
    icon: '',
    iconColor: '',
    numpad: 'disable',
    flashing: 'disable',
};
const alarmStates: pages.AlarmStates[] = ['disarmed', 'armed', 'arming', 'pending', 'triggered'];

/**
 * Page implementation for alarm/unlock card behaviour.
 *
 * This class is responsible for managing the alarm card state machine
 * (armed / disarmed / arming / pending / triggered) and for building
 * the payload that will be sent to the panel. It also reacts to configured
 * data items (approved, pin, etc.) and handles button actions coming from
 * the touch panel.
 *
 * Note: The Page lifecycle follows the base Page class contract. Important
 * public methods that are invoked by the Page controller are documented below
 * (init, update, onStateTrigger, onButtonEvent).
 */
export class PageAlarm extends Page {
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    private status: pages.AlarmStates = 'armed';
    private useStates = true;
    private alarmType: string = 'alarm';
    items: pages.PageBaseConfig['items'];

    async setMode(m: pages.AlarmButtonEvents): Promise<void> {
        if (this.useStates) {
            await this.library.writedp(
                `panels.${this.basePanel.name}.alarm.${this.name}.mode`,
                m,
                genericStateObjects.panel.panels.alarm.cardAlarm.mode,
            );
        }
    }

    /**
     * Get the current alarm status.
     *
     * Reads the persisted status from the configured states (if state
     * management is enabled) and maps numeric indices to the corresponding
     * AlarmStates value.
     *
     * @returns Promise resolving to the current alarm status
     */
    async getStatus(): Promise<pages.AlarmStates> {
        if (this.useStates) {
            const state = this.library.readdb(`panels.${this.basePanel.name}.alarm.${this.name}.status`);
            if (state) {
                if (typeof state.val === 'number') {
                    this.status = alarmStates[state.val];
                }
            }
        }
        return this.status;
    }

    /**
     * Set the current alarm status and persist it when using states.
     *
     * @param value - new alarm status to set
     * @returns Promise that resolves when the status has been persisted
     */
    async setStatus(value: pages.AlarmStates): Promise<void> {
        this.status = value;
        if (this.useStates) {
            await this.library.writedp(
                `panels.${this.basePanel.name}.alarm.${this.name}.status`,
                alarmStates.indexOf(this.status),
                genericStateObjects.panel.panels.alarm.cardAlarm.status,
            );
        }
    }
    private pin: string = '0';
    private failCount: number = 0;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        if (options.config && options.config.card == 'cardAlarm') {
            this.config = options.config;
        }
        this.minUpdateInterval = 500;
        this.neverDeactivateTrigger = true;
    }

    /**
     * Initialize the alarm page.
     *
     * This method prepares dataitems, default channels and initial runtime
     * values (pin, alarmType, status). It is called during the Page
     * initialization sequence and may perform asynchronous calls to the
     * StatesController and adapter library.
     *
     * @returns Promise that resolves when initialization is complete
     */
    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardAlarmDataItemOptions> =
            this.enums || this.dpInit
                ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardAlarmDataItems> = await this.basePanel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.cardAlarmDataItems;
        // set card because we lose it
        this.items.card = 'cardAlarm';

        await super.init();
        this.useStates = true;
        this.alarmType = (this.items?.data?.alarmType && (await this.items.data.alarmType.getString())) ?? 'alarm';
        /*if (this.alarmType === 'unlock' && this.items?.data?.setNavi) {
            this.useStates = true;
        } else */ {
            await this.library.writedp(
                `panels.${this.basePanel.name}.alarm`,
                undefined,
                genericStateObjects.panel.panels.alarm._channel,
            );
            await this.library.writedp(
                `panels.${this.basePanel.name}.alarm.${this.name}`,
                undefined,
                genericStateObjects.panel.panels.alarm.cardAlarm._channel,
            );
        }
        if (this.alarmType === 'alarm') {
            const status = await this.getStatus();
            if (status === 'pending') {
                await this.setStatus('armed');
            } else if (status === 'arming') {
                await this.setStatus('disarmed');
            } else {
                await this.setStatus(this.status);
            }
        } else {
            await this.setStatus('armed');
        }
        this.pin =
            (this.items && this.items.data && this.items.data.pin && (await this.items.data.pin.getString())) ?? '';
        if (this.pin == '-1') {
            this.pin = this.adapter.config.pw1 ? this.adapter.config.pw1 : '';
        }
    }

    /**
     * Build the current message payload and send it to the panel.
     *
     * The message is assembled from the configured dataitems and the
     * internal alarm status. If the page is not visible or incorrectly
     * configured the update is skipped.
     *
     * @returns Promise that resolves after the message was sent (or skipped)
     */
    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        const message: Partial<pages.PageAlarmMessage> = {};
        const items = this.items;
        if (!items || items.card !== 'cardAlarm') {
            return;
        }
        const data = items.data;
        await this.getStatus();
        message.intNameEntity = this.id;
        message.headline = (data.headline && (await data.headline.getTranslatedString())) ?? this.name;
        message.navigation = this.getNavigation();
        if (this.alarmType === 'alarm') {
            if (this.status === 'armed' || this.status === 'triggered') {
                message.button1 = this.library.getTranslation('disarm');
                message.status1 = 'D1';
                message.button2 = '';
                message.status2 = '';
                message.button3 = '';
                message.status3 = '';
                message.button4 = '';
                message.status4 = '';
            } else {
                //const entity1 = await getValueEntryNumber(data.entity1);
                message.button1 =
                    (data.button1 && (await data.button1.getTranslatedString())) ??
                    this.library.getTranslation('arm_away');
                message.status1 = message.button1 ? 'A1' : '';
                message.button2 =
                    (data.button2 && (await data.button2.getTranslatedString())) ??
                    this.library.getTranslation('arm_home');
                message.status2 = message.button2 ? 'A2' : '';
                message.button3 =
                    (data.button3 && (await data.button3.getTranslatedString())) ??
                    this.library.getTranslation('arm_night');
                message.status3 = message.button3 ? 'A3' : '';
                message.button4 =
                    (data.button4 && (await data.button4.getTranslatedString())) ??
                    this.library.getTranslation('arm_vacation');
                message.status4 = message.button4 ? 'A4' : '';
            }
            if (this.status == 'armed') {
                message.icon = Icons.GetIcon('shield-home'); //icon*~*
                message.iconColor = '63488'; //iconcolor*~*
                message.numpad = 'enable'; //numpadStatus*~*
                message.flashing = 'disable'; //flashing*
            } else if (this.status == 'disarmed') {
                message.icon = Icons.GetIcon('shield-off'); //icon*~*
                message.iconColor = String(Color.rgb_dec565(Color.Green)); //iconcolor*~*
                message.numpad = 'enable'; //numpadStatus*~*
                message.flashing = 'disable'; //flashing*
            } else if (this.status == 'arming' || this.status == 'pending') {
                message.icon = Icons.GetIcon('shield'); //icon*~*
                message.iconColor = String(Color.rgb_dec565({ r: 243, g: 179, b: 0 })); //iconcolor*~*
                message.numpad = 'disable'; //numpadStatus*~*
                message.flashing = 'enable'; //flashing*
            } else if (this.status == 'triggered') {
                message.icon = Icons.GetIcon('bell-ring'); //icon*~*
                message.iconColor = String(Color.rgb_dec565({ r: 223, g: 76, b: 30 })); //iconcolor*~*
                message.numpad = 'enable'; //numpadStatus*~*
                message.flashing = 'enable'; //flashing*
            }
        } else if (this.alarmType === 'unlock') {
            if (this.status == 'triggered') {
                message.button1 = this.library.getTranslation('locked');
                message.status1 = '';
                message.button2 = '';
                message.status2 = '';
                message.button3 = '';
                message.status3 = '';
                message.button4 = '';
                message.status4 = '';
                message.icon = Icons.GetIcon('lock-off'); //icon*~*
                message.iconColor = String(Color.rgb_dec565({ r: 255, g: 0, b: 0 })); //iconcolor*~*
                message.numpad = 'disable'; //numpadStatus*~*
                message.flashing = 'enable'; //flashing*
            } else {
                message.button1 = this.library.getTranslation('unlock');
                message.status1 = 'U1';
                message.button2 = '';
                message.status2 = '';
                message.button3 = '';
                message.status3 = '';
                message.button4 = '';
                message.status4 = '';
                message.icon = Icons.GetIcon('lock-remove'); //icon*~*
                message.iconColor = String(Color.rgb_dec565({ r: 223, g: 76, b: 30 })); //iconcolor*~*
                message.numpad = 'enable'; //numpadStatus*~*
                message.flashing = 'enable'; //flashing*
            }
        }
        //message.icon = await getIconEntryValue(data.icon, true, 'shield-home');
        //message.iconColor = await getIconEntryColor(data.icon, true, '');
        //message.numpad = 'enable';
        //message.flashing = 'enable';

        this.sendToPanel(this.getMessage(message), false);
    }

    private getMessage(message: Partial<pages.PageAlarmMessage>): string {
        let result: pages.PageAlarmMessage = PageAlarmMessageDefault;
        result = { ...result, ...message } as pages.PageAlarmMessage;
        return getPayload(
            getPayloadRemoveTilde('entityUpd', result.headline),
            result.navigation,
            getPayloadRemoveTilde(
                result.intNameEntity,
                result.button1,
                result.status1,
                result.button2,
                result.status2,
                result.button3,
                result.status3,
                result.button4,
                result.status4,
                result.icon,
                result.iconColor,
                result.numpad,
                result.flashing,
            ),
        );
    }

    protected async onStateTrigger(id: string): Promise<void> {
        if (this.items && this.items.card === 'cardAlarm') {
            const approved = this.items.data && this.items.data.approved;
            if (approved && approved.options.type === 'triggered' && approved.options.dp === id) {
                await this.getStatus();
                const val = await approved.getBoolean();
                if (val) {
                    if (this.status === 'pending') {
                        await this.setStatus('disarmed');
                    } else if (this.status === 'arming') {
                        await this.setStatus('armed');
                    }
                } else {
                    if (this.status === 'pending') {
                        await this.setStatus('armed');
                    } else if (this.status === 'arming') {
                        await this.setStatus('disarmed');
                    }
                }
                if (this.unload || this.adapter.unload) {
                    return;
                }
                this.adapter.setTimeout(() => this.update(), 50);
            }
        }
    }
    /**
     * Handle a button event coming from the panel.
     *
     * The incoming event contains the action code (A1/A2/A3/A4/D1/U1/...) and
     * an optional value (for example a numeric PIN). This method validates
     * the PIN (when configured), updates the internal status machine and
     * triggers the configured mode/state writes.
     *
     * @param _event - event payload from the touch panel
     * @returns Promise that resolves after the event has been handled
     */
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        const button = _event.action;
        const value = _event.opt;
        if (!this.items || this.items.card !== 'cardAlarm') {
            return;
        }
        const approved = this.items.data && this.items.data.approved;

        if (pages.isAlarmButtonEvent(button)) {
            await this.getStatus();
            if (this.status === 'triggered') {
                return;
            }

            /*if (this.pin === 0) {
                this.log.warn(`Pin is missing`);
                return;
            }*/
            if (this.pin && this.pin != value) {
                if (++this.failCount < 3) {
                    this.log.warn(`Wrong pin entered. try ${this.failCount} of 3`);
                } else {
                    this.log.error('Wrong pin entered. locked!');
                    await this.setStatus('triggered');
                }
                await this.update();
                return;
            }
            this.log.debug(`Alarm event ${button} value: ${value}`);
            switch (button) {
                case 'A1':
                case 'A2':
                case 'A3':
                case 'A4': {
                    if (this.status === 'disarmed' && approved) {
                        await this.setStatus('arming');
                        await this.setMode(button);
                        if (this.unload || this.adapter.unload) {
                            return;
                        }
                        this.adapter.setTimeout(() => this.update(), 50);
                    } else if (this.status === 'arming') {
                        // nothing to do
                    } else if (!approved) {
                        await this.setStatus('armed');
                        await this.setMode(button);
                        if (this.unload || this.adapter.unload) {
                            return;
                        }
                        this.adapter.setTimeout(() => this.update(), 50);
                    }
                    break;
                }
                case 'D1': {
                    if (this.status === 'armed' && approved) {
                        await this.setStatus('pending');
                        await this.setMode(button);
                        if (this.unload || this.adapter.unload) {
                            return;
                        }
                        this.adapter.setTimeout(() => this.update(), 50);
                    } else if (this.status === 'pending') {
                        // nothing to do
                    } else if (!approved) {
                        await this.setStatus('disarmed');
                        await this.setMode(button);
                        if (this.unload || this.adapter.unload) {
                            return;
                        }
                        this.adapter.setTimeout(() => this.update(), 50);
                    }

                    break;
                }
                case 'U1': {
                    const entry = this.items;
                    const item = entry.data;
                    const value: any = (item.setNavi && (await item.setNavi.getString())) ?? null;
                    if (value !== null) {
                        await this.basePanel.navigation.setTargetPageByName(value);
                        break;
                    }
                    await this.setStatus('disarmed');
                    await this.setStatus('armed');
                    break;
                }
            }
        }
        //if (event.page && event.id && this.pageItems) {
        //    this.pageItems[event.id as any].setPopupAction(event.action, event.opt);
        //}
    }
}
