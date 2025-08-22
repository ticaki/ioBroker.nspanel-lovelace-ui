import { type PageInterface } from '../classes/PageInterface';
import {
    getIconEntryColor,
    getIconEntryValue,
    getPayload,
    getPayloadArray,
    getValueEntryNumber,
    setValueEntry,
} from '../const/tools';
import type * as pages from '../types/pages';
import type * as Types from '../types/types';

import type { ConfigManager } from '../classes/config-manager';
import { PageMenu } from './pageMenu';
import { Color } from '../const/Color';

const PageThermo2MessageDefault: pages.PageThermo2Message = {
    event: 'entityUpd',
    headline: 'Page Thermo',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    internalName: 'PageThermo2',
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

export class PageThermo2 extends PageMenu {
    //config: pages.cardThermoDataItemOptions;
    items: pages.cardThermo2DataItems | undefined;
    step: number = 1;
    heatCycles: number = 1;
    protected maxItems: number = 17;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    public convertValue: 1 | 10 = 1;
    private nextArrow: boolean = false;
    public index = 0;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        if (config.card !== 'cardThermo2') {
            return;
        }
        super(config, options);
        this.config = options.config;
        this.iconLeftP = 'arrow-left-bold-outline';
        this.iconLeft = 'arrow-up-bold';
        this.iconRightP = 'arrow-right-bold-outline';
        this.iconRight = 'arrow-down-bold';
        if (options.config && options.config.card == 'cardThermo2') {
            this.config = options.config;
            this.config.scrollType = 'page';
        } else {
            throw new Error('Missing config!');
        }
        if (options.items && options.items.card == 'cardThermo2') {
            this.items = options.items;
        }
        this.filterDuplicateMessages = false;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardThermo2DataItems> =
            this.enums || this.dpInit
                ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardThermo2DataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        if (tempItem) {
            tempItem.card = 'cardThermo2';
        }
        this.heatCycles = Array.isArray(tempItem.data) ? tempItem.data.length : 1;
        if (this.heatCycles > 8 && Array.isArray(tempItem.data)) {
            this.log.warn(
                `PageThermo2: Heat cycles are ${this.heatCycles}, but only 8 are supported! Using only 8 cycles.`,
            );
            tempItem.data = tempItem.data.slice(0, 8);
            this.heatCycles = 8;
        }
        this.pageItemConfig = this.pageItemConfig || [];
        for (let i = this.heatCycles; i > 0; --i) {
            await this.panel.statesControler.setInternalState(
                `///${this.panel.name}/${this.name}/${i - 1}`,
                i === this.index - 1 ? true : false,
                true,
                {
                    type: 'boolean',
                    role: 'button',
                    name: `Thermo2 ${this.name} ${i}`,
                    read: true,
                    write: true,
                },
                this.onInternalCommand,
            );
            this.pageItemConfig.unshift({
                role: '',
                type: 'button',
                dpInit: '',
                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: `numeric-${i}-circle-outline` },
                            color: {
                                type: 'const',
                                constVal: Color.Green,
                            },
                        },
                        false: {
                            value: { type: 'const', constVal: `numeric-${i}-circle-outline` },
                            color: {
                                type: 'const',
                                constVal: Color.Gray,
                            },
                        },
                    },
                    entity1: {
                        value: { type: 'internal', dp: `///${this.panel.name}/${this.name}/${i - 1}` },
                        set: { type: 'internal', dp: `///${this.panel.name}/${this.name}/${i - 1}` },
                    },
                },
            });
        }

        this.items = tempItem as pages.cardThermo2DataItems;
        await super.init();
    }

    public async update(): Promise<void> {
        if (!this?.visibility) {
            return;
        }
        const message: Partial<pages.PageThermo2Message> = {};
        message.options = [];
        message.navigation = this.getNavigation();
        if (this.items) {
            const data = Array.isArray(this.items.data)
                ? this.items.data[this.index]
                    ? this.items.data[this.index]
                    : null
                : this.items.data;
            if (data) {
                message.headline = this.library.getTranslation(
                    (data && data.headline && (await data.headline.getString())) ?? '',
                );
                message.dstTemp = (((await getValueEntryNumber(data.entity3)) || 0) * 10).toString();
                message.minTemp = ((await data.minValue?.getNumber()) || 150).toString();
                message.maxTemp = ((await data.maxValue?.getNumber()) || 280).toString();
                message.tempStep = ((await data.stepValue?.getNumber()) || 5).toString();
                message.unit = (await data.entity3?.unit?.getString()) || '°C';
                message.power = (await data.power?.getBoolean()) || false;

                //build pageitem strings for thermo2 - spezial case
                for (let i = 0; i < 7; i++) {
                    message.options[i] = `text~${this.name}.${i}~${
                        [
                            await getIconEntryValue(data?.icon1, true, 'thermometer'),
                            (((await data?.entity1?.value?.getNumber()) || 0) * 10).toString(),
                            (await data?.entity1?.unit?.getString()) || '°C',
                            await getIconEntryValue(data?.icon1, true, 'water-percent'),
                            (((await data?.entity2?.value?.getNumber()) || 0) * 10).toString(),
                            (await data?.entity2?.unit?.getString()) || '%',
                            '',
                        ][i]
                    }~${
                        [
                            await getIconEntryColor(data?.icon1, !!(await data?.power?.getBoolean()), Color.Green),
                            await getIconEntryColor(data?.icon1, !!(await data?.power?.getBoolean()), Color.Green),
                            await getIconEntryColor(data?.icon1, !!(await data?.power?.getBoolean()), Color.Green),
                            await getIconEntryColor(data?.icon2, !!(await data?.power?.getBoolean()), Color.Magenta),
                            await getIconEntryColor(data?.icon2, !!(await data?.power?.getBoolean()), Color.Magenta),
                            await getIconEntryColor(data?.icon2, !!(await data?.power?.getBoolean()), Color.Magenta),
                            '',
                        ][i]
                    }~~`;
                }
            }
            const arr = (await this.getOptions([])).slice(0, this.maxItems);
            message.options = message.options.concat(arr) as typeof message.options;

            const msg: pages.PageThermo2Message = Object.assign(PageThermo2MessageDefault, message);
            const msg2 = this.getMessage(msg);
            this.sendToPanel(msg2, false);
        }
    }

    async onButtonEvent(event: Types.IncomingEvent): Promise<void> {
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
                const valLow = (await getValueEntryNumber(data.entity3)) ?? null;
                if (valLow !== null && newValLow !== valLow) {
                    await setValueEntry(data.entity3, newValLow);
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
            String(this.name),
            String(message.dstTemp),
            String(message.minTemp),
            String(message.maxTemp),
            message.tempStep,
            message.unit,
            !message.power ? '1' : '0',
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

    onInternalCommand = async (id: string, state: Types.nsPanelState | undefined): Promise<Types.nsPanelStateVal> => {
        if (state?.val) {
            this.index = parseInt(id.split('/').pop() ?? '0');
            this.adapter.setTimeout(() => this.update, 1);
        }
        if (id == `///${this.panel.name}/${this.name}/${this.index}`) {
            return true;
        }
        return false;
    };
    static async getPage(
        configManager: ConfigManager,
        page: ScriptConfig.PageThermo2,
        gridItem: pages.PageBaseConfig,
        messages: string[],
    ): Promise<{ gridItem: pages.PageBaseConfig; messages: string[] }> {
        if (page.type !== 'cardThermo2' || !gridItem.config || gridItem.config.card !== 'cardThermo2') {
            return { gridItem, messages };
        }
        const adapter = configManager.adapter;
        if (!page.thermoItems || !page.thermoItems[0]) {
            const msg = `${page.uniqueName}: Thermo page has no thermo item or item 0 has no id!`;
            messages.push(msg);
            adapter.log.warn(msg);
            return { gridItem, messages };
        }
        gridItem.config.card = 'cardThermo2';
        gridItem.config.data = [];
        for (let i = 0; i < page.thermoItems.length; i++) {
            const item = page.thermoItems[i];
            if (!item || !item.id || item.id.endsWith('.')) {
                const msg = `${page.uniqueName} id: ${item.id} is invalid!`;
                messages.push(msg);
                adapter.log.error(msg);
                return { gridItem, messages };
            }
            if (!item || !item.id2 || item.id2.endsWith('.')) {
                const msg = `${page.uniqueName} id2: ${item.id2} is invalid!`;
                messages.push(msg);
                adapter.log.error(msg);
                return { gridItem, messages };
            }
            if (!item || !item.set || item.set.endsWith('.')) {
                const msg = `${page.uniqueName} set: ${item.set} is invalid!`;
                messages.push(msg);
                adapter.log.error(msg);
                return { gridItem, messages };
            }

            const o = await adapter.getForeignObjectAsync(item.id);
            if (!o || !o.common) {
                const msg = `${page.uniqueName} id: ${page.items[0].id} has a invalid object!`;
                messages.push(msg);
                adapter.log.error(msg);
                return { gridItem, messages };
            }
            const data: pages.cardThermo2DataItemOptions['data'] = {
                entity3: (await configManager.existsAndWriteableState(item.set))
                    ? {
                          value: { type: 'triggered', dp: item.set },
                          set: { type: 'state', dp: item.set },
                      }
                    : undefined,
                entity1: (await configManager.existsState(item.id))
                    ? {
                          value: { type: 'state', dp: item.id || '' },
                      }
                    : undefined,
                icon1: {
                    true: {
                        value: { type: 'const', constVal: item.icon || 'thermometer' },
                        color: { type: 'const', constVal: item.onColor || Color.Green },
                    },
                },

                icon2: {
                    true: {
                        value: { type: 'const', constVal: item.icon2 || 'water-percent' },
                        color: { type: 'const', constVal: Color.Magenta },
                    },
                },
                entity2: {
                    value: { type: 'state', dp: item.id2 || '' },
                },
                headline: { type: 'const', constVal: item.name || '' },
                minValue:
                    item.minValue != null
                        ? {
                              type: 'const',
                              constVal: item.minValue,
                          }
                        : undefined,
                maxValue:
                    item.maxValue != null
                        ? {
                              type: 'const',
                              constVal: item.maxValue,
                          }
                        : undefined,
                stepValue:
                    item.stepValue != null
                        ? {
                              type: 'const',
                              constVal: item.stepValue,
                          }
                        : undefined,
                power: (await configManager.existsState(item.power))
                    ? {
                          type: 'triggered',
                          dp: item.power,
                      }
                    : undefined,
            };
            if (Array.isArray(gridItem.config.data)) {
                gridItem.config.data.push(data);
            }
        }
        return { gridItem, messages };
    }
}
