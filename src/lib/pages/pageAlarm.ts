import { Page, PageInterface } from '../classes/Page';
import { White } from '../const/Color';
import { genericStateObjects } from '../const/definition';
import {
    deepAssign,
    getEntryTextOnOff,
    getIconEntryColor,
    getIconEntryValue,
    getPayload,
    getScaledNumber,
    getValueEntryNumber,
    getValueEntryString,
} from '../const/tools';
import * as pages from '../types/pages';
import { IncomingEvent } from '../types/types';

const PageAlarmMessageDefault: pages.PageAlarmMessage = {
    event: 'entityUpd',
    headline: 'Page Grid',
    intNameEntity: '',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    button1: '',
    button2: '',
    button3: '',
    button4: '',
    icon: '',
    iconColor: '',
    numpad: 'disable',
    flashing: 'disable',
};

/**
 * untested
 */
export class PageAlarm extends Page {
    items: pages.PageBaseConfig['items'];
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    private status: 'disarmed' | 'armed' | 'arming' | 'pending' | 'triggered' = 'disarmed';

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        if (options.config && options.config.card == 'cardPower') this.config = options.config;
        this.minUpdateInterval = 500;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardAlarmDataItemOptions> = this.dpInit
            ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config)
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
            `panel.${this.name}.alarm.${this.uniqueID}`,
            undefined,
            genericStateObjects.panel.panels.alarm.cardAlarm._channel,
        );
    }

    public async update(): Promise<void> {
        const message: Partial<pages.PageAlarmMessage> = {};
        const items = this.items;
        if (!items || items.card !== 'cardAlarm') return;
        const data = items.data;
        message.headline =
            (this.items && this.items.data.headline && (await this.items.data.headline.getString())) ?? '';
        message.navigation = this.getNavigation();
        //const entity1 = await getValueEntryNumber(data.entity1);
        message.button1 = (data.button1 && (await data.button1.getString())) ?? '';
        message.button2 = (data.button1 && (await data.button1.getString())) ?? '';
        message.button3 = (data.button1 && (await data.button1.getString())) ?? '';
        message.button4 = (data.button1 && (await data.button1.getString())) ?? '';

        message.icon = await getIconEntryValue(data.icon, true, '');
        message.iconColor = await getIconEntryColor(data.icon, true, '');

        this.library.writedp(
            `panel.${this.name}.alarm.${this.uniqueID}.status`,
            ['disarmed', 'armed', 'arming', 'pending', 'triggered'].indexOf(this.status),
            genericStateObjects.panel.panels.alarm.cardAlarm.status,
        );

        this.sendToPanel(this.getMessage(message));
    }

    private async getElementUpdate(
        item: pages.cardPowerDataItems['data']['leftBottom'],
    ): Promise<undefined | Partial<pages.PagePowerMessageItem>> {
        if (item === undefined) return undefined;

        const message: Partial<pages.PagePowerMessageItem> = {};

        const value = await getValueEntryNumber(item.value);
        if (value === null) return undefined;

        message.icon = (await getIconEntryValue(item.icon, value >= 0, '')) ?? undefined;
        message.iconColor = (await getIconEntryColor(item.icon, value, White)) ?? undefined;
        message.name = (await getEntryTextOnOff(item.text, value >= 0)) ?? undefined;
        message.speed = (await getScaledNumber(item.speed)) ?? undefined;
        message.value = (await getValueEntryString(item.value, value)) ?? undefined;

        return message;
    }
    private getMessage(message: Partial<pages.PageAlarmMessage>): string {
        let result: pages.PageAlarmMessage = PageAlarmMessageDefault;
        result = deepAssign(result, message) as pages.PageAlarmMessage;
        return getPayload('entityUpd', result.headline, result.navigation, '', '');
    }

    private getMessageItem(i: pages.PagePowerMessageItem | undefined): string {
        if (!i) return getPayload('', '', '', '', '', '', '');
        return getPayload('', '', i.icon ?? '', i.iconColor ?? '', i.name ?? '', i.value ?? '', String(i.speed ?? ''));
    }
    protected async onStateTrigger(): Promise<void> {
        this.update();
    }
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        //if (event.page && event.id && this.pageItems) {
        //    this.pageItems[event.id as any].setPopupAction(event.action, event.opt);
        //}
    }
}
