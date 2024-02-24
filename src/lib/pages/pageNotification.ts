import { Page, PageInterface } from '../classes/Page';
import { White } from '../const/Color';
import {
    getIconEntryColor,
    getIconEntryValue,
    getPayload,
    getValueEntryBoolean,
    getValueEntryNumber,
    setTriggeredToState,
} from '../const/tools';
import * as pages from '../types/pages';
import { IncomingEvent } from '../types/types';
import { PageItem } from './pageItem';

export class PageNotify extends Page {
    config: pages.PageBaseConfig['config'];
    items: pages.PageBaseConfig['items'];
    private lastpage: Page | undefined;
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    tempItem: PageItem | undefined;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        this.config = options.config;
        if (options.items && (options.items.card == 'popupNotify' || options.items.card == 'popupNotify2'))
            this.items = options.items;
        this.minUpdateInterval = 1000;
        this.neverDeactivateTrigger = true;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardNotifyDataItemOptions> = this.dpInit
            ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config)
            : config;
        setTriggeredToState(tempConfig, ['entity1']);
        // create Dataitems

        const tempItem: Partial<pages.cardNotifyDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.cardNotifyDataItems;
        // set card because we lose it
        this.items.card = this.card as any;
        await super.init();
    }

    setLastPage(p: Page | undefined): void {
        if (p !== this) this.lastpage = p;
    }

    public async update(): Promise<void> {
        const message: Partial<pages.PageNotifyMessage> = {};
        const items = this.items;
        if (!items) return;
        let value: number | boolean | null = null;
        if (items.card === 'popupNotify' || items.card === 'popupNotify2') {
            const data = items.data;
            value = await getValueEntryNumber(data.entity1);
            if (value === null) value = (await getValueEntryBoolean(data.entity1)) ?? true;

            message.headline = (data.headline && (await data.headline.getString())) ?? '';
            message.hColor = await getIconEntryColor(data.colorHeadline, value, White);

            message.blText = (data.buttonLeft && (await data.buttonLeft.getString())) ?? '';
            message.blColor = await getIconEntryColor(data.colorButtonLeft, value, White);

            message.brText = (data.buttonRight && (await data.buttonRight.getString())) ?? '';
            message.brColor = await getIconEntryColor(data.colorButtonRight, value, White);

            message.text = (data.text && (await data.text.getString())) ?? '';
            message.textColor = await getIconEntryColor(data.colorText, value, White);

            message.timeout = (data.timeout && (await data.timeout.getNumber())) ?? 0;
        }
        if (items.card === 'popupNotify') {
            this.sendToPanel(this.getMessage(message));
            return;
        } else if (items.card === 'popupNotify2') {
            const data = items.data;
            message.fontSet = (data.textSize && (await data.textSize.getString())) ?? '';
            message.icon = await getIconEntryValue(data.icon, value, '');
            message.iconColor = await getIconEntryColor(data.icon, value, White);
            this.sendToPanel(this.getMessage2(message));
            return;
        }
    }
    private getMessage(message: Partial<pages.PageNotifyMessage>): string {
        return getPayload(
            'entityUpdateDetail',
            this.id,
            message.headline ?? '',
            message.hColor ?? '',
            message.blText ?? '',
            message.blColor ?? '',
            message.brText ?? '',
            message.brColor ?? '',
            message.text ?? '',
            message.textColor ?? '',
            String(message.timeout ?? 0),
        );
    }
    private getMessage2(message: Partial<pages.PageNotifyMessage>): string {
        return getPayload(
            'entityUpdateDetail',
            this.id,
            message.headline ?? '',
            message.hColor ?? '',
            message.blText ?? '',
            message.blColor ?? '',
            message.brText ?? '',
            message.brColor ?? '',
            message.text ?? '',
            message.textColor ?? '',
            String(message.timeout ?? 0),
            message.fontSet ?? '0',
            message.icon ?? '',
            message.iconColor ?? '',
        );
    }
    protected async onStateTrigger(): Promise<void> {
        this.panel.setActivePage(this);
    }
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        this.log.debug('we are here');
        if (_event.action === 'notifyAction') {
            const data = this.items && this.items.card === 'popupNotify' && this.items.data;
            if (data) {
                if (data.setValue2) {
                    if (_event.opt === 'yes') data.setValue1 && (await data.setValue1.setStateTrue());
                    else data.setValue2 && (await data.setValue2.setStateTrue());
                } else data.setValue1 && (await data.setValue1.setStateAsync(_event.opt === 'yes'));
            }
        }
        if (this.lastpage) this.panel.setActivePage(this.lastpage);
    }
}
