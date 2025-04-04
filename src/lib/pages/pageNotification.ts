import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Color } from '../const/Color';
import {
    getIconEntryColor,
    getIconEntryValue,
    getPayload,
    getValueEntryBoolean,
    getValueEntryNumber,
    setTriggeredToState,
} from '../const/tools';
import * as pages from '../types/pages';
import type { IncomingEvent } from '../types/types';
import type { PageItem } from './pageItem';

export class PageNotify extends Page {
    config: pages.PageBaseConfig['config'];
    private lastpage: Page[] = [];
    private step: number = 0;
    private headlinePos: number = 0;
    private rotationTimeout: ioBroker.Timeout | undefined;
    tempItem: PageItem | undefined;
    items: pages.PageBaseConfig['items'];

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        this.config = options.config;
        if (options.items && (options.items.card == 'popupNotify' || options.items.card == 'popupNotify2')) {
            this.items = options.items;
        }
        this.minUpdateInterval = 1000;
        this.neverDeactivateTrigger = true;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardNotifyDataItemOptions> =
            this.enums || this.dpInit
                ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        setTriggeredToState(tempConfig, ['entity1', 'optinalValue']);
        // create Dataitems

        const tempItem: Partial<pages.cardNotifyDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.cardNotifyDataItems;
        // set card because we lose it
        this.items.card = this.card as any;
        await super.init();
        await this.panel.statesControler.activateTrigger(this);
    }

    setLastPage(p: Page | undefined): void {
        if (p !== this) {
            if (p !== undefined) {
                this.lastpage.push(p);
            } else {
                this.lastpage = [];
            }
        }
    }
    removeLastPage(_p: Page | undefined): void {
        this.lastpage = this.lastpage.filter(a => a !== _p);
        this.lastpage.forEach(a => a.removeLastPage(_p));
    }

    /**
     *
     * @returns Build the view for nspanel.
     */
    public async update(): Promise<void> {
        const message: Partial<pages.PageNotifyMessage> = {};
        const items = this.items;
        if (!items) {
            return;
        }
        this.log.debug('update notification page!');
        let value: number | boolean | null = null;
        if (items.card === 'popupNotify' || items.card === 'popupNotify2') {
            const data = items.data;
            value = await getValueEntryNumber(data.entity1);
            if (value === null) {
                value = (await getValueEntryBoolean(data.entity1)) ?? true;
            }

            message.headline = (data.headline && (await data.headline.getTranslatedString())) ?? '';
            message.hColor = await getIconEntryColor(data.colorHeadline, value, Color.White);

            message.blText = (data.buttonLeft && (await data.buttonLeft.getTranslatedString())) ?? '';
            message.blColor = await getIconEntryColor(data.colorButtonLeft, value, Color.White);

            message.brText = (data.buttonRight && (await data.buttonRight.getTranslatedString())) ?? '';
            message.brColor = await getIconEntryColor(data.colorButtonRight, value, Color.White);

            message.text = (data.text && (await data.text.getTranslatedString())) ?? '';

            message.textColor = await getIconEntryColor(data.colorText, value, Color.White);

            const placeholder = (data.optionalValue && (await data.optionalValue.getObject())) ?? null;
            if (placeholder && pages.isPlaceholderType(placeholder)) {
                for (const key in placeholder) {
                    const target = placeholder[key];
                    let val = (target.dp && (await this.panel.statesControler.getStateVal(target.dp))) ?? '';
                    if (val === '') {
                        val = target.text ?? '';
                    }
                    message.headline = message.headline.replaceAll(
                        `\${${key}}`,
                        this.library.getTranslation(val as string),
                    );
                    message.text = message.text.replaceAll(`\${${key}}`, this.library.getTranslation(val as string));
                }
            }
            if (message.text) {
                message.text = message.text.replaceAll('\n', '\r\n').replaceAll('/r/n', '\r\n');
            }
            const maxLineCount = 8;
            let lines = 0;
            if (message.text && (lines = message.text.split('\r\n').length) > maxLineCount) {
                let test = 0;
                let counter = 0;
                let pos = 0;
                this.step = this.step % (lines + 1);

                const currentPos = this.step;
                const text = `${message.text}\r\n` + `\r\n${message.text}`;
                message.text = '';
                while (test++ < 100) {
                    const pos2 = text.indexOf('\r\n', pos) + 2;
                    if (pos2 == -1) {
                        message.text += text.slice(pos);
                        break;
                    }
                    if (counter >= currentPos) {
                        message.text = message.text + text.slice(pos, pos2);
                    }
                    counter++;
                    if (counter >= currentPos + maxLineCount) {
                        break;
                    }
                    pos = pos2;
                }
                if (!this.rotationTimeout) {
                    if (this.unload) {
                        return;
                    }
                    this.rotationTimeout = this.adapter.setTimeout(this.rotation, 3000);
                }
            }

            message.timeout = (data.timeout && (await data.timeout.getNumber())) ?? 0;
        }
        if (items.card === 'popupNotify') {
            this.sendToPanel(this.getMessage(message));
            return;
        } else if (items.card === 'popupNotify2') {
            const data = items.data;
            message.fontSet = (data.textSize && (await data.textSize.getString())) ?? '';
            message.icon = await getIconEntryValue(data.icon, value, '');
            message.iconColor = await getIconEntryColor(data.icon, value, Color.White);
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

    /**
     * Rotate text in view
     *
     * @returns
     */
    private rotation = async (): Promise<void> => {
        if (!this.visibility) {
            this.rotationTimeout = undefined;
            return;
        }
        this.step++;
        await this.update();
        if (this.unload) {
            return;
        }
        this.rotationTimeout = this.adapter.setTimeout(this.rotation, 1500);
    };
    async delete(): Promise<void> {
        if (this.rotationTimeout) {
            this.adapter.clearTimeout(this.rotationTimeout);
        }
        this.rotationTimeout = undefined;
        await super.delete();
    }
    protected async onStateTrigger(_dp: string): Promise<void> {
        this.step = 0;
        if (this.rotationTimeout) {
            this.adapter.clearTimeout(this.rotationTimeout);
        }
        this.rotationTimeout = undefined;
        this.log.debug(`state triggerd ${_dp}`);
        /*if (_dp.includes('popupNotification'))*/ await this.panel.setActivePage(this);
    }
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        const data = this.items && this.items.card === 'popupNotify' && this.items.data;
        let close = true;
        if (data) {
            if (_event.action === 'notifyAction') {
                if (data.setValue2) {
                    if (_event.opt === 'yes') {
                        data.setValue1 && (await data.setValue1.setStateTrue());
                    } else {
                        data.setValue2 && (await data.setValue2.setStateTrue());
                    }
                } else {
                    data.setValue1 && (await data.setValue1.setStateAsync(_event.opt === 'yes'));
                }

                const cb = (data.closingBehaviour && (await data.closingBehaviour.getString())) ?? '';
                if (pages.isClosingBehavior(cb)) {
                    switch (cb) {
                        case 'none':
                            close = false;
                            break;
                        case 'both':
                            close = true;
                            break;
                        case 'yes':
                        case 'no':
                            close = cb == _event.opt;
                            break;
                    }
                }
            }
        }
        if (close) {
            if (this.name.includes('///popupNotification')) {
                this.lastpage = this.lastpage.filter(a => !a.name.includes('///popupNotification'));
            }
            const p = this.lastpage.pop();
            if (p) {
                p.removeLastPage(this);
                this.log.debug(`Set active page from popup to ${p.name}`);
                await this.panel.setActivePage(p);
            } else {
                const page = this.panel.navigation.getCurrentPage();
                this.log.debug(`Set active page from currentpage to ${page.name}`);
                await this.panel.setActivePage(page);
            }
        }
    }
    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            if (!this.pageItems || this.pageItems.length === 0) {
                await this.createPageItems();
            }
            this.sendType();
            await this.update();
        }
    }
}
