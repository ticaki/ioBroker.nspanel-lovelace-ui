import { Page, PageInterface } from '../classes/Page';
import { White } from '../const/Color';
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

const PagePowerMessageDefault: pages.PagePowerMessage = {
    event: 'entityUpd',
    headline: 'Page Grid',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    homeValueTop: '',
    homeIcon: '',
    homeColor: '',
    homeName: '',
    homeValueBot: '',
    leftTop: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
    leftMiddle: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
    leftBottom: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
    rightTop: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
    rightMiddle: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
    rightBottom: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
};

/**
 * untested
 */
export class PagePower extends Page {
    items: pages.PageBaseConfig['items'];

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        if (options.config && options.config.card == 'cardPower') this.config = options.config;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardPowerDataItemOptions> = this.dpInit
            ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config)
            : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardPowerDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.cardPowerDataItems;
        // set card because we lose it
        this.items.card = 'cardPower';
    }

    public async update(): Promise<void> {
        const message: Partial<pages.PagePowerMessage> = {};
        const items = this.items;
        if (!items || items.card !== 'cardPower') return;
        const data = items.data;
        message.headline =
            (this.items && this.items.data.headline && (await this.items.data.headline.getString())) ?? '';
        message.navigation = this.getNavigation();

        message.homeIcon = await getIconEntryValue(data.homeIcon, true, '');
        message.homeColor = await getIconEntryColor(data.homeIcon, true, White);
        message.homeValueTop = (await getValueEntryString(data.homeValueTop)) ?? '';
        message.homeValueBot = (await getValueEntryString(data.homeValueBot)) ?? '';

        // to much work to change types to partial in getMessage we assign a full object to this.
        message.leftTop = (await this.getElementUpdate(data.leftTop)) as pages.PagePowerMessageItem;
        message.leftMiddle = (await this.getElementUpdate(data.leftMiddle)) as pages.PagePowerMessageItem;
        message.leftBottom = (await this.getElementUpdate(data.leftBottom)) as pages.PagePowerMessageItem;
        message.rightTop = (await this.getElementUpdate(data.rightTop)) as pages.PagePowerMessageItem;
        message.rightMiddle = (await this.getElementUpdate(data.rightMiddle)) as pages.PagePowerMessageItem;
        message.rightBottom = (await this.getElementUpdate(data.rightBottom)) as pages.PagePowerMessageItem;

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
    private getMessage(message: Partial<pages.PagePowerMessage>): string {
        let result: pages.PagePowerMessage = PagePowerMessageDefault;
        result = deepAssign(result, message) as pages.PagePowerMessage;
        return getPayload(
            'entityUpd',
            result.headline,
            result.navigation,
            '',
            '',
            result.homeIcon,
            result.homeColor,
            result.homeName,
            result.homeValueBot,
            '',
            '',
            '',
            '',
            '',
            '',
            result.homeValueTop,
            '',
            this.getMessageItem(result.leftTop),
            this.getMessageItem(result.leftMiddle),
            this.getMessageItem(result.leftBottom),
            this.getMessageItem(result.rightTop),
            this.getMessageItem(result.rightMiddle),
            this.getMessageItem(result.rightBottom),
        );
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
