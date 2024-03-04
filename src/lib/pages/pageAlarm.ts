import { Page, PageInterface } from '../classes/Page';
import { Green, rgb_dec565 } from '../const/Color';
import { genericStateObjects } from '../const/definition';
import { Icons } from '../const/icon_mapping';
import { getPayload } from '../const/tools';
import * as pages from '../types/pages';
import { IncomingEvent } from '../types/types';

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
 * untested
 */
export class PageAlarm extends Page {
    items: pages.PageBaseConfig['items'];
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    private status: pages.AlarmStates = 'armed';

    async setMode(m: pages.AlarmButtonEvents): Promise<void> {
        this.library.writedp(
            `panels.${this.panel.name}.alarm.${this.name}.mode`,
            m,
            genericStateObjects.panel.panels.alarm.cardAlarm.mode,
        );
    }

    async getStatus(): Promise<pages.AlarmStates> {
        const state = this.adapter.library.readdb(`panels.${this.panel.name}.alarm.${this.name}.status`);
        if (state) {
            if (typeof state.val === 'number') {
                this.status = alarmStates[state.val];
            }
        }
        return this.status;
    }

    async setStatus(value: pages.AlarmStates): Promise<void> {
        this.status = value;
        await this.library.writedp(
            `panels.${this.panel.name}.alarm.${this.name}.status`,
            alarmStates.indexOf(this.status),
            genericStateObjects.panel.panels.alarm.cardAlarm.status,
        );
    }
    private pin: number = 0;
    private failCount: number = 0;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        if (options.config && options.config.card == 'cardAlarm') this.config = options.config;
        this.minUpdateInterval = 500;
        this.neverDeactivateTrigger = true;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardAlarmDataItemOptions> =
            this.enums || this.dpInit
                ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardAlarmDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.cardAlarmDataItems;
        // set card because we lose it
        this.items.card = 'cardAlarm';
        this.library.writedp(
            `panels.${this.panel.name}.alarm.${this.name}`,
            undefined,
            genericStateObjects.panel.panels.alarm.cardAlarm._channel,
        );
        await super.init();
        const status = await this.getStatus();
        if (status === 'pending') await this.setStatus('armed');
        else if (status === 'arming') await this.setStatus('disarmed');
        else await this.setStatus(this.status);

        this.pin =
            (this.items && this.items.data && this.items.data.pin && (await this.items.data.pin.getNumber())) ?? 0;
    }

    /**
     *
     * @returns
     */
    public async update(): Promise<void> {
        if (!this.visibility) return;
        await this.getStatus();
        const message: Partial<pages.PageAlarmMessage> = {};
        const items = this.items;
        if (!items || items.card !== 'cardAlarm') return;
        const data = items.data;
        message.intNameEntity = this.id;
        message.headline = (data.headline && (await data.headline.getTranslatedString())) ?? this.name;
        message.navigation = this.getNavigation();
        if (this.status === 'armed' || this.status === 'triggered') {
            message.button1 = 'disarm';
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
                (data.button1 && (await data.button1.getTranslatedString())) ?? this.library.getTranslation('arm_away');
            message.status1 = message.button1 ? 'A1' : '';
            message.button2 =
                (data.button2 && (await data.button2.getTranslatedString())) ?? this.library.getTranslation('arm_home');
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
            message.iconColor = String(rgb_dec565(Green)); //iconcolor*~*
            message.numpad = 'enable'; //numpadStatus*~*
            message.flashing = 'disable'; //flashing*
        } else if (this.status == 'arming' || this.status == 'pending') {
            message.icon = Icons.GetIcon('shield'); //icon*~*
            message.iconColor = String(rgb_dec565({ r: 243, g: 179, b: 0 })); //iconcolor*~*
            message.numpad = 'disable'; //numpadStatus*~*
            message.flashing = 'enable'; //flashing*
        } else if (this.status == 'triggered') {
            message.icon = Icons.GetIcon('bell-ring'); //icon*~*
            message.iconColor = String(rgb_dec565({ r: 223, g: 76, b: 30 })); //iconcolor*~*
            message.numpad = 'enable'; //numpadStatus*~*
            message.flashing = 'enable'; //flashing*
        }
        //message.icon = await getIconEntryValue(data.icon, true, 'shield-home');
        //message.iconColor = await getIconEntryColor(data.icon, true, '');
        //message.numpad = 'enable';
        //message.flashing = 'enable';

        this.sendToPanel(this.getMessage(message));
    }

    private getMessage(message: Partial<pages.PageAlarmMessage>): string {
        let result: pages.PageAlarmMessage = PageAlarmMessageDefault;
        result = Object.assign(result, message) as pages.PageAlarmMessage;
        return getPayload(
            'entityUpd',
            result.headline,
            result.navigation,
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
        );
    }

    protected async onStateTrigger(id: string): Promise<void> {
        if (this.items && this.items.card === 'cardAlarm') {
            const approved = this.items.data && this.items.data.approved;
            if (approved && approved.options.type === 'triggered' && approved.options.dp === id) {
                await this.getStatus();
                const val = await approved.getBoolean();
                if (val) {
                    if (this.status === 'pending') await this.setStatus('disarmed');
                    else if (this.status === 'arming') await this.setStatus('armed');
                } else {
                    if (this.status === 'pending') await this.setStatus('armed');
                    else if (this.status === 'arming') await this.setStatus('disarmed');
                }
                this.adapter.setTimeout(() => this.update(), 50);
            }
        }
    }
    /**
     *a
     * @param _event
     * @returns
     */
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        const button = _event.action;
        const value = _event.opt;
        if (!this.items || this.items.card !== 'cardAlarm') return;
        const approved = this.items.data && this.items.data.approved;

        if (pages.isAlarmButtonEvent(button)) {
            await this.getStatus();
            if (this.status === 'triggered') return;

            if (this.pin === 0) {
                this.log.warn(`Pin is missing`);
                return;
            }
            if (this.pin !== parseInt(value)) {
                if (++this.failCount < 3) {
                    this.log.warn('Wrong pin entered. try ' + this.failCount + ' of 3');
                } else {
                    this.log.error('Wrong pin entered. locked!');
                    await this.setStatus('triggered');
                }
                this.update;
                return;
            }
            this.log.debug('Alarm event ' + button + ' value: ' + value);
            switch (button) {
                case 'A1':
                case 'A2':
                case 'A3':
                case 'A4': {
                    if (this.status === 'disarmed' && approved) {
                        await this.setStatus('arming');
                        await this.setMode(button);
                        this.adapter.setTimeout(() => this.update(), 50);
                    } else if (this.status === 'arming') {
                    } else if (!approved) {
                        await this.setStatus('armed');
                        await this.setMode(button);
                        this.adapter.setTimeout(() => this.update(), 50);
                    }
                    break;
                }
                case 'D1': {
                    if (this.status === 'armed' && approved) {
                        await this.setStatus('pending');
                        await this.setMode(button);
                        this.adapter.setTimeout(() => this.update(), 50);
                    } else if (this.status === 'pending') {
                    } else if (!approved) {
                        await this.setStatus('disarmed');
                        await this.setMode(button);
                        this.adapter.setTimeout(() => this.update(), 50);
                    }

                    break;
                }
                case 'U1': {
                    break;
                }
            }
        }
        //if (event.page && event.id && this.pageItems) {
        //    this.pageItems[event.id as any].setPopupAction(event.action, event.opt);
        //}
    }
}
