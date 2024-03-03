import * as Definition from '../const/definition';
import * as Types from '../types/types';

//import dayjs from 'dayjs';
//import moment from 'moment';
//import parseFormat from 'moment-parseformat';
import { Page, PageInterface } from '../classes/Page';
import * as pages from '../types/pages';
import * as tools from '../const/tools';
import { PageItem } from './pageItem';
import { BaseClassTriggerd } from '../controller/states-controller';

export type ScreensaverConfigType = {
    momentLocale: string;
    locale: string; //Intl.DateTimeFormat;
    iconBig1: boolean;
    iconBig2: boolean;
};

export class Screensaver extends Page {
    items: undefined;
    private step: number = 0;
    private blockButtons: ioBroker.Timeout | undefined;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    private rotationTime: number = 300000;
    private timoutRotation: ioBroker.Timeout | undefined = undefined;
    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        if (!options.config || (options.config.card !== 'screensaver' && options.config.card !== 'screensaver2'))
            return;
        switch (options.config.mode) {
            case 'standard':
            case 'alternate': {
                config.card = 'screensaver';
                break;
            }
            case 'advanced': {
                config.card = 'screensaver2';
                break;
            }
        }
        config.alwaysOn = 'none';
        super(config, options);
        //moment.locale(this.conddffig2.momentLocale);
        this.rotationTime =
            options.config.rotationTime !== 0 && options.config.rotationTime < 3
                ? 3000
                : options.config.rotationTime * 1000;
    }

    async init(): Promise<void> {
        await super.init();
        await this.createPageItems();
    }

    async getData(places: Types.ScreenSaverPlaces[]): Promise<pages.screensaverMessage | null> {
        const config = this.config;
        if (!config || (config.card !== 'screensaver' && config.card !== 'screensaver2')) return null;
        const message: pages.screensaverMessage = {
            options: {
                indicator: [],
                left: [],
                time: [],
                date: [],
                bottom: [],
                mricon: [],
                favorit: [],
                alternate: [],
            },
        };

        if (this.pageItems) {
            const model = config.model;
            const layout = config.mode;
            for (let a = 0; a < this.pageItems.length; a++) {
                const pageItems: PageItem | undefined = this.pageItems[a];
                const options = message.options;
                if (pageItems && pageItems.config && pageItems.config.modeScr) {
                    const place = pageItems.config.modeScr;
                    const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
                    if (max === 0) continue;
                    if (places.indexOf(place) === -1) continue;

                    const arr = options[place] || [];
                    arr.push(await pageItems.getPageItemPayload());
                    options[place] = arr;
                }
            }
            for (const x in message.options) {
                const place = x as Types.ScreenSaverPlaces;
                if (places.indexOf(place) === -1) continue;
                let items = message.options[place];
                if (items) {
                    const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
                    if (items.length > Definition.ScreenSaverConst[layout][place].maxEntries[model]) {
                        let f = items.length / Definition.ScreenSaverConst[layout][place].maxEntries[model];
                        f = this.step % Math.ceil(f);
                        message.options[place] = items.slice(max * f, max * (f + 1));
                    }
                    items = message.options[place];
                    for (let i = 0; i < max; i++) {
                        const msg = items[i];
                        if (!msg) {
                            items[i] = tools.getPayload('', '', '', '', '', '');
                        } else {
                            const arr = items[i].split('~');
                            arr[0] = '';
                            if (place !== 'indicator') arr[1] = '';
                            items[i] = tools.getPayloadArray(arr);
                        }
                    }
                }
            }
        }
        return message;
    }
    async update(): Promise<void> {
        if (!this.visibility) {
            this.log.error('get update command but not visible!');
            return;
        }

        const message = await this.getData(['left', 'bottom', 'indicator', 'alternate', 'favorit']);
        if (message === null) return;
        if (message.options.alternate.length > 0)
            message.options.alternate.unshift(tools.getPayload('', '', '', '', '', ''));
        const arr: string[] = message.options.favorit.concat(
            message.options.left,
            message.options.bottom,
            message.options.alternate,
            message.options.indicator,
        );
        const msg = tools.getPayload('weatherUpdate', tools.getPayloadArray(arr));

        this.sendToPanel(msg);
        this.HandleScreensaverStatusIcons();
    }

    async onVisibilityChange(v: boolean): Promise<void> {
        //await super.onVisibilityChange(v);
        this.step = -1;
        if (v) {
            await this.sendType();
            await this.update();
            this.rotationLoop();
        } else {
            if (this.timoutRotation) this.adapter.clearTimeout(this.timoutRotation);
        }
    }
    rotationLoop = async (): Promise<void> => {
        if (this.unload) return;
        // only use this if screensaver is activated
        if (!this.visibility) return;
        this.step++ > 100;

        await this.update();

        if (this.rotationTime === 0) return;
        this.timoutRotation = this.adapter.setTimeout(
            this.rotationLoop,
            this.rotationTime < 3000 ? 3000 : this.rotationTime,
        );
    };

    /**
     *
     * @param _dp
     * @param from
     * @returns
     */
    onStateTrigger = async (_dp: string, from: BaseClassTriggerd): Promise<void> => {
        const config = this.config;
        if (!config || (config.card !== 'screensaver' && config.card !== 'screensaver2')) return;
        if (from instanceof PageItem && this.pageItems) {
            const index = parseInt(from.id.split('?')[1]);
            const item = this.pageItems[index];
            if (item && item.config) {
                const place = item.config.modeScr;
                if (place !== undefined) {
                    switch (place) {
                        case 'left':
                        case 'bottom':
                        case 'indicator':
                        case 'alternate':
                        case 'favorit': {
                            await this.update();
                            break;
                        }
                        case 'mricon': {
                            await this.HandleScreensaverStatusIcons();
                            break;
                        }
                        case 'time': {
                            this.HandleTime();
                            break;
                        }
                        case 'date': {
                            this.HandleDate();
                            break;
                        }
                    }
                }
            }
        }
    };
    async HandleTime(): Promise<void> {
        const message = await this.getData(['time']);
        if (message === null || !message.options.time[0]) return;
        this.sendToPanel(`time~${message.options.time[0].split('~')[5]}`);
    }
    async HandleDate(): Promise<void> {
        const message = await this.getData(['date']);
        if (message === null || !message.options.date[0]) return;
        this.sendToPanel(`date~${message.options.date[0].split('~')[5]}`);
    }

    async HandleScreensaverStatusIcons(): Promise<void> {
        if (!this.visibility) {
            this.log.error('get update command but not visible!');
            return;
        }

        const message = await this.getData(['mricon']);
        if (message === null) return;
        const mrIcon1 = message.options.mricon[0].split('~');
        const mrIcon2 = message.options.mricon[1].split('~');
        const msgArray: string[] = [
            'statusUpdate',
            mrIcon1[2] ?? '',
            mrIcon1[3] ?? '',
            mrIcon2[2] ?? '',
            mrIcon2[3] ?? '',
            this.panel.info.nspanel.bigIconLeft ? '1' : '',
            this.panel.info.nspanel.bigIconRight ? '1' : '',
        ];
        const msg = tools.getPayloadArray(msgArray);
        this.sendToPanel(msg);
    }

    async onButtonEvent(event: Types.IncomingEvent): Promise<void> {
        if (event.page && event.id && this.pageItems && this.pageItems[event.id as any]) {
            if (this.blockButtons) return;
            this.pageItems[event.id as any]!.onCommand(event.action, event.opt);
            this.blockButtons = this.adapter.setTimeout(() => {
                this.blockButtons = undefined;
            }, 500);
        }
    }

    async delete(): Promise<void> {
        await super.delete();
        if (this.timoutRotation) this.adapter.clearTimeout(this.timoutRotation);
        if (this.blockButtons) this.adapter.clearTimeout(this.blockButtons);
    }
}
