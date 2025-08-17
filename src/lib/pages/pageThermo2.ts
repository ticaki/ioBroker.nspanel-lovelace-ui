import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Icons } from '../const/icon_mapping';
import { getPayload, getPayloadArray } from '../const/tools';
import type * as pages from '../types/pages';
import type { IncomingEvent } from '../types/types';
import { PageItem } from './pageItem';

const PageThermo2MessageDefault: pages.PageThermo2Message = {
    event: 'entityUpd',
    headline: 'Page Thermo',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    dstTemp: '',
    minTemp: '10',
    maxTemp: '40',
    tempStep: '5',
    unit: '',
    power: false,
    options: [
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
        '~~~~~',
    ],
};
/*type AtLeastOne<T, K extends keyof T = keyof T> = K extends keyof T ? Pick<T, K> & Partial<Omit<T, K>> : never;

type MyType = { a: string; b: string; c: string };
type MyValidType = AtLeastOne<MyType>;

export const a: MyValidType = { c: 'c' };*/

export class PageThermo2 extends Page {
    //config: pages.cardThermoDataItemOptions;
    items: pages.cardThermoDataItems | undefined;
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    public convertValue: 1 | 10 = 1;
    private nextArrow: boolean = false;
    public index = 0;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        if (config.card !== 'cardThermo') {
            return;
        }
        if (options && options.pageItems) {
            options.pageItems.unshift({
                type: 'button',
                dpInit: '',
                role: 'button',
                modeScr: undefined,
                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'arrow-right-bold-circle-outline' },
                            color: { type: 'const', constVal: { red: 205, green: 142, blue: 153 } },
                        },
                    },
                    entity1: { value: { type: 'const', constVal: true } },
                },
            });
        }
        super(config, options);
        if (options.config && options.config.card == 'cardThermo') {
            this.config = options.config;
        } else {
            throw new Error('Missing config!');
        }
        if (options.items && options.items.card == 'cardThermo') {
            this.items = options.items;
        }
        this.filterDuplicateMessages = false;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardThermoDataItems> =
            this.enums || this.dpInit
                ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardThermoDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        if (tempItem) {
            tempItem.card = 'cardThermo';
        }
        this.items = tempItem as pages.cardThermoDataItems;
        await super.init();

        const v = Array.isArray(this.items.data)
            ? this.items.data[0]
                ? this.items.data[0].maxTemp && (await this.items.data[0].maxTemp.getNumber())
                : null
            : ((this.items.data.maxTemp && (await this.items.data.maxTemp.getNumber())) ?? null);
        if (v != null) {
            if (v < 100) {
                this.convertValue = 10;
            }
        }
    }

    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        const message: Partial<pages.PageThermo2Message> = {};
        message.options = [
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
            '~~~~~',
        ];
        if (this.items) {
            const data = Array.isArray(this.items.data)
                ? this.items.data[this.index]
                    ? this.items.data[this.index]
                    : null
                : this.items.data;
            if (this.pageItems && data) {
                /*const pageItems = this.pageItems.filter(
                    a => a && a.dataItems && a.dataItems.type === 'button' && a.dataItems.data.entity1,
                );*/
                const pageItems = this.pageItems;

                if (pageItems[1] && pageItems[1].dataItems?.data) {
                    const t = pageItems[1].dataItems;
                    if (PageItem.isPageItemTextDataItems(t)) {
                        t.data = t.data || {};
                        t.data.entity1 = data.entity1;
                    }
                }

                if (pageItems[3] && pageItems[3].dataItems?.data) {
                    const t = pageItems[3].dataItems;
                    if (PageItem.isPageItemTextDataItems(t)) {
                        t.data = t.data || {};
                        t.data.entity1 = data.humidity;
                    }
                }

                const a = pageItems[0] && (await pageItems[0].dataItems?.data.icon?.true?.value?.getString());
                this.log.debug(`Icon: ${a}`);
                let b = 0;
                for (let a = 1; a < 9; a++, b++) {
                    const temp = pageItems[a];
                    if (temp) {
                        message.options[b] = await temp.getPageItemPayload();
                    }
                }

                const localStep = pageItems.length > 17 ? 7 : 8;
                if (pageItems.length - 9 - 1 <= localStep * (this.step - 1)) {
                    this.step = 1;
                }
                // arrow is at index [0]
                const maxSteps = localStep * this.step + 9;
                const minStep = localStep * (this.step - 1) + 9;
                b = 8; //pageItems.length >= 16 ? 0 : Math.ceil((8 - (pageItems.length-8)) / 2);
                for (let a = minStep; a < maxSteps; a++, b++) {
                    const temp = pageItems[a];
                    if (temp) {
                        message.options[b] = await temp.getPageItemPayload();
                    }
                }

                if (localStep === 7) {
                    this.nextArrow = true;
                    const temp = this.pageItems[8];
                    if (temp) {
                        const a = await temp.dataItems?.data.icon?.true?.value?.getString();
                        this.log.debug(`Next Arrow Icon: ${a} used`);
                        message.options[message.options.length - 1] = await temp.getPageItemPayload();
                    }
                }

                /*for (let a = 0; a < pageItems.length && a < message.options.length; a++) {
                    const temp = pageItems[a];
                    if (temp) {
                        const arr = (await temp.getPageItemPayload()).split('~');
                        message.options[a] = getPayload(arr[2], arr[3], arr[5] == '1' ? '1' : '0', arr[1]);
                    }
                }*/
            }

            if (data) {
                message.headline = this.library.getTranslation(
                    (data && data.headline && (await data.headline.getString())) ?? '',
                );

                message.navigation = this.getNavigation();

                let v: number | null = (data.set && (await data.set.getNumber())) ?? null;
                if (v !== null) {
                    message.dstTemp = v * 10;
                }
                v = (data.minTemp && (await data.minTemp.getNumber())) ?? null;
                if (v !== null) {
                    message.minTemp = v * this.convertValue;
                } else if (data.set && data.set.common.min != null) {
                    message.minTemp = data.set.common.min * 10;
                } else {
                    message.minTemp = 150;
                }

                v = (data.maxTemp && (await data.maxTemp.getNumber())) ?? null;
                if (v !== null) {
                    message.maxTemp = v * this.convertValue;
                } else if (data.set && data.set.common.max != null) {
                    message.maxTemp = data.set.common.max * 10;
                } else {
                    message.maxTemp = 300;
                }

                // if we dont have a unit we get it from set1 or set2
                const v1 = (data.unit && (await data.unit.getString())) ?? null;
                if (v1 !== null) {
                    message.unit = Icons.GetIcon(v1) || v1;
                } else {
                    if (data) {
                        const set = data.set;
                        if (set) {
                            if (set.common.unit) {
                                message.unit = set.common.unit;
                            }
                        } /*else {
                        set = data.set2;
                        if (set) {
                            if (set.common.unit) {
                                message.tCF = set.common.unit;
                            }
                        }
                    }*/
                    }
                }
                v = (data.tempStep && (await data.tempStep.getNumber())) ?? null;
                if (v !== null) {
                    message.tempStep = String(v * this.convertValue);
                } else if (data.set && data.set.common.step) {
                    message.tempStep = String(data.set.common.step * 10);
                } else {
                    message.tempStep = '5';
                }
                message.tempStep = parseFloat(message.tempStep) < 1 ? '1' : message.tempStep;
            }
            //this.pageItems && this.pageItems.some((a) => a.dataItems && a.dataItems.type === 'input_sel') ? '' : 1;
        }

        const msg: pages.PageThermo2Message = Object.assign(PageThermo2MessageDefault, message);
        const msg2 = this.getMessage(msg);
        this.sendToPanel(msg2, false);
    }

    async onButtonEvent(event: IncomingEvent): Promise<void> {
        if (event.action === 'tempUpd') {
            if (!this.items) {
                return;
            }
            const data = Array.isArray(this.items.data)
                ? this.items.data[this.index]
                    ? this.items.data[this.index]
                    : null
                : this.items.data;
            if (data) {
                const newValLow = parseInt(event.opt) / 10;
                const valLow = (data.set && (await data.set.getNumber())) ?? null;
                if (valLow !== null && newValLow !== valLow) {
                    await data.set!.setStateAsync(newValLow);
                }
            }
        } else if (
            event.action === 'hvac_action' &&
            this.pageItems &&
            this.pageItems[Number(event.opt.split('?')[1])]
        ) {
            if (this.nextArrow && event.opt.split('?')[1] === '0') {
                this.step++;
                await this.update();
            } else if (await this.pageItems[Number(event.opt.split('?')[1])]!.onCommand('button', '')) {
                return;
            }
        }
    }

    private getMessage(message: pages.PageThermo2Message): string {
        return getPayload(
            'entityUpd',
            message.headline,
            message.navigation,
            String(message.dstTemp),
            String(message.minTemp),
            String(message.maxTemp),
            message.tempStep,
            message.unit,
            message.power ? '1' : '0',
            getPayloadArray(message.options),
        );
    }
    protected async onVisibilityChange(val: boolean): Promise<void> {
        await super.onVisibilityChange(val);
        if (val) {
            for (const item of this.pageItems ?? []) {
                if (item && item.dataItems && item.dataItems.type === 'input_sel') {
                    if (this.controller) {
                        await this.controller.statesControler.activateTrigger(item);
                    }
                }
            }
        } else {
            for (const item of this.pageItems ?? []) {
                if (item && item.dataItems && item.dataItems.type === 'input_sel') {
                    if (this.controller) {
                        await this.controller.statesControler.deactivateTrigger(item);
                    }
                }
            }
        }
    }
    protected async onStateTrigger(): Promise<void> {
        await this.update();
    }
    async reset(): Promise<void> {
        this.step = 1;
    }
}
