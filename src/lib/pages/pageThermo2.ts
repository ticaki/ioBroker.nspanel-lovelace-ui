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
import * as configManagerConst from '../const/config-manager-const';

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
    heatCycles: number = 1;
    protected maxItems: number = 8;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    public convertValue: 1 | 10 = 1;
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
        const tempConfig: Partial<pages.cardThermo2DataItemOptions> =
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
        if (this.heatCycles > 1 && tempItem?.card === 'cardThermo2') {
            if (this.config?.card === 'cardThermo2' && this.config?.filterType) {
                this.config.filterType = this.index;
            }
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
                const item2 = Array.isArray(tempConfig?.data) && tempConfig?.data[i - 1];

                this.pageItemConfig.unshift({
                    role: 'heatcycle',
                    type: 'button',
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value:
                                    item2 && item2.icon4?.true?.value
                                        ? item2.icon4.true.value
                                        : { type: 'const', constVal: `numeric-${i}-circle-outline` },
                                color:
                                    item2 && item2.icon4?.true?.color
                                        ? item2.icon4.true.color
                                        : {
                                              type: 'const',
                                              constVal: Color.Green,
                                          },
                            },

                            false: {
                                value:
                                    item2 && item2.icon4?.false?.value
                                        ? item2.icon4.false.value
                                        : { type: 'const', constVal: `numeric-${i}-circle-outline` },
                                color:
                                    item2 && item2.icon4?.false?.color
                                        ? item2.icon4.false.color
                                        : {
                                              type: 'const',
                                              constVal: Color.Gray,
                                          },
                            },
                        },
                        entity1: {
                            value: {
                                type: 'internal',
                                dp: `///${this.panel.name}/${this.name}/${i - 1}`,
                                change: 'ts',
                            },
                        },
                        setValue2: { type: 'internal', dp: `///${this.panel.name}/${this.name}/${i - 1}` },
                    },
                });
            }
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
                message.dstTemp = Math.round(((await getValueEntryNumber(data.entity3)) || 0) * 10).toString();
                message.minTemp = Math.round(((await data.minValue?.getNumber()) || 15) * 10).toString();
                message.maxTemp = Math.round(((await data.maxValue?.getNumber()) || 28) * 10).toString();
                message.tempStep = Math.round(((await data.stepValue?.getNumber()) || 0.5) * 10).toString();
                message.unit = (await data.entity3?.unit?.getString()) || '°C';
                message.power = (await data.power?.getBoolean()) || false;
                const statesText = this.library.getTranslation((await data.mode?.getString()) || '');

                //build pageitem strings for thermo2 - spezial case
                for (let i = 0; i < 7; i++) {
                    message.options[i] = `text~${this.name}.${i}~${
                        [
                            await getIconEntryValue(data?.icon1, true, 'thermometer'),
                            (((await data?.entity1?.value?.getNumber()) || 0) * 10).toString(),
                            (await data?.entity1?.unit?.getString()) || '°C',
                            await getIconEntryValue(data?.icon2, true, 'water-percent'),
                            (((await data?.entity2?.value?.getNumber()) || 0) * 10).toString(),
                            (await data?.entity2?.unit?.getString()) || '%',
                            statesText,
                        ][i]
                    }~${
                        [
                            await getIconEntryColor(data?.icon1, !!(await data?.power?.getBoolean()), Color.Green),
                            await getIconEntryColor(data?.icon1, !!(await data?.power?.getBoolean()), Color.Green),
                            await getIconEntryColor(data?.icon1, !!(await data?.power?.getBoolean()), Color.Green),
                            await getIconEntryColor(data?.icon2, !!(await data?.power?.getBoolean()), Color.Magenta),
                            await getIconEntryColor(data?.icon2, !!(await data?.power?.getBoolean()), Color.Magenta),
                            await getIconEntryColor(data?.icon2, !!(await data?.power?.getBoolean()), Color.Magenta),
                            await getIconEntryColor(data?.icon5, true, Color.MSYellow),
                        ][i]
                    }~~${['', '', '', '', '', '', statesText ? String(3) : ''][i]}`;
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
            if (await this.pageItems[Number(event.opt.split('?')[1])]!.onCommand('button', '')) {
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
            !message.power ? '1' : '1',
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
            if (this.config?.card === 'cardThermo2' && this.config?.filterType != null) {
                this.config.filterType = this.index;
            }
            //this.adapter.setTimeout(() => this.update, 100);
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
        gridItem.config.filterType = 0;
        gridItem.config.data = [];
        let o = undefined;
        let airCondition = false;
        const thermoItems = JSON.parse(JSON.stringify(page.thermoItems)) as ScriptConfig.PageThermo2['thermoItems'];
        let filterIndex = -1;
        for (let i = 0; i < thermoItems.length; i++) {
            let actual = '';
            let humidity = '';
            let set = '';
            let role: ScriptConfig.channelRoles = 'thermostat';
            let mode: Types.DataItemsOptions | undefined;
            let foundedStates: configManagerConst.checkedDatapointsUnion | undefined;
            const item = thermoItems[i];
            foundedStates = undefined;
            if (!item) {
                const msg = `${page.uniqueName} item ${i} is invalid!`;
                messages.push(msg);
                adapter.log.error(msg);
                continue;
            }
            let headline = item.name || '';

            if ('id' in item) {
                if (!item || !item.id || item.id.endsWith('.')) {
                    const msg = `${page.uniqueName} id2: ${item.id} is invalid!`;
                    messages.push(msg);
                    adapter.log.error(msg);
                    continue;
                }
                o = await adapter.getForeignObjectAsync(item.id);
                if (
                    !o ||
                    !o.common ||
                    !o.common.role ||
                    (o.common.role !== 'thermostat' && o.common.role !== 'airCondition')
                ) {
                    const msg = `${page.uniqueName} id: ${item.id} ${!o || !o.common ? 'has a invalid object' : o.common.role !== 'thermostat' && o.common.role !== 'airCondition' ? `has wrong role: ${o.common.role} check alias.md` : ' something went wrong'} !`;
                    messages.push(msg);
                    adapter.log.error(msg);
                    thermoItems.splice(i--, 1);
                    continue;
                }
                role = o.common.role;
                try {
                    foundedStates = await configManager.searchDatapointsForItems(
                        configManagerConst.requiredScriptDataPoints,
                        role,
                        item.id,
                        messages,
                    );
                } catch {
                    continue;
                }
                if (!foundedStates) {
                    const msg = `${page.uniqueName} id: ${item.id} has no states!`;
                    messages.push(msg);
                    adapter.log.error(msg);
                    continue;
                }
                headline = airCondition
                    ? item.name2 || 'COOLING'
                    : item.name ||
                      (typeof o.common.name === 'object'
                          ? o.common[configManager.adapter.language || 'en']
                          : o.common.name) ||
                      'HEATING';
                actual = foundedStates[role].ACTUAL?.dp || '';
                humidity = foundedStates[role].HUMIDITY?.dp || '';
                set = airCondition ? foundedStates[role].SET2?.dp || '' : foundedStates[role].SET?.dp || '';
                role = o.common.role;

                if (foundedStates[role].MODE) {
                    mode = foundedStates[role].MODE;
                    if (mode && mode.dp) {
                        const o2 = await adapter.getForeignObjectAsync(mode.dp);
                        if (o2?.common?.states) {
                            mode = {
                                ...mode,
                                read: `return ${JSON.stringify(o2.common.states)}[val] || val`,
                            };
                        } else {
                            mode = {
                                ...mode,
                                read: `return ${JSON.stringify(
                                    item.modeList
                                        ? item.modeList
                                        : ['OFF', 'AUTO', 'COOL', 'HEAT', 'ECO', 'FAN', 'DRY'],
                                )}[val] || val`,
                            };
                        }
                    }
                }
                if (o.common.role === 'airCondition') {
                    if (!airCondition) {
                        airCondition = true;
                        thermoItems.splice(i, 0, item);
                    } else if (airCondition) {
                        airCondition = false;
                    }
                }
            } else {
                if (!item || !item.thermoId1 || item.thermoId1.endsWith('.')) {
                    const msg = `${page.uniqueName} thermoId1: ${item.thermoId1} is invalid!`;
                    messages.push(msg);
                    adapter.log.error(msg);
                    continue;
                }
                actual = item.thermoId1;
                o = await adapter.getForeignObjectAsync(item.thermoId1);
                if (!o || !o.common) {
                    const msg = `${page.uniqueName} id: ${item.thermoId1} has a invalid object!`;
                    messages.push(msg);
                    adapter.log.error(msg);
                    continue;
                }
                if (
                    !item ||
                    (item.thermoId2 &&
                        (item.thermoId2.endsWith('.') || !(await configManager.existsState(item.thermoId2))))
                ) {
                    const msg = `${page.uniqueName} thermoId2: ${item.thermoId2} is invalid!`;
                    messages.push(msg);
                    adapter.log.error(msg);
                    continue;
                }
                humidity = item.thermoId2 || '';
                if (
                    !item ||
                    (item.modeId && (item.modeId.endsWith('.') || !(await configManager.existsState(item.modeId))))
                ) {
                    const msg = `${page.uniqueName} thermoId2: ${item.thermoId2} is invalid!`;
                    messages.push(msg);
                    adapter.log.error(msg);
                    continue;
                }
                if (item.modeId) {
                    let states: string[] | Record<string, string> = [
                        'OFF',
                        'AUTO',
                        'COOL',
                        'HEAT',
                        'ECO',
                        'FAN',
                        'DRY',
                    ];
                    if (!item.modeList || !Array.isArray(item.modeList) || item.modeList.length < 1) {
                        const o = await adapter.getForeignObjectAsync(item.modeId);
                        if (o?.common?.states) {
                            states = o.common.states;
                        }
                    } else {
                        states = item.modeList;
                    }
                    mode = { type: 'triggered', dp: item.modeId, read: `return ${JSON.stringify(states)}[val]` };
                }
                set = item.set;
            }
            for (const im of [item.minValue, item.maxValue, item.stepValue]) {
                if (im != null && (typeof im !== 'number' || im < 0)) {
                    const msg = `${page.uniqueName} item: ${i} val: ${im} invalid - Error in minValue, maxValue or stepValue!`;
                    messages.push(msg);
                    adapter.log.warn(msg);
                    continue;
                }
            }
            if (adapter.config.defaultValueCardThermo) {
                if (item.minValue != null) {
                    item.minValue /= 10;
                }
                if (item.maxValue != null) {
                    item.maxValue /= 10;
                }
                if (item.stepValue != null) {
                    item.stepValue /= 10;
                }
            }
            const data: pages.cardThermo2DataItemOptions['data'] = {
                entity3: (await configManager.existsAndWriteableState(set))
                    ? {
                          value: { type: 'triggered', dp: set },
                          set: { type: 'state', dp: set },
                      }
                    : undefined,
                entity1: (await configManager.existsState(actual))
                    ? {
                          value: { type: 'triggered', dp: actual || '' },
                          unit: { type: 'const', constVal: item.unit || '°C' },
                      }
                    : undefined,
                icon1: {
                    true: {
                        value: { type: 'const', constVal: item.icon || 'thermometer' },
                        color: await configManager.getIconColor(item.onColor, Color.Green),
                    },
                },

                icon2: {
                    true: {
                        value: { type: 'const', constVal: item.icon2 || 'water-percent' },
                        color: await configManager.getIconColor(item.onColor2, Color.Magenta),
                    },
                },
                icon4:
                    role !== 'airCondition' || airCondition
                        ? {
                              true: {
                                  value: item.iconHeatCycle
                                      ? { type: 'const', constVal: item.iconHeatCycle }
                                      : undefined,
                                  color: item.iconHeatCycleOnColor
                                      ? await configManager.getIconColor(item.iconHeatCycleOnColor, Color.Green)
                                      : undefined,
                              },

                              false: {
                                  value: item.iconHeatCycle
                                      ? { type: 'const', constVal: item.iconHeatCycle }
                                      : undefined,
                                  color: item.iconHeatCycleOffColor
                                      ? await configManager.getIconColor(item.iconHeatCycleOffColor, Color.Gray)
                                      : undefined,
                              },
                          }
                        : {
                              true: {
                                  value: item.iconHeatCycle2
                                      ? { type: 'const', constVal: item.iconHeatCycle2 }
                                      : undefined,
                                  color: await configManager.getIconColor(item.iconHeatCycleOnColor2, Color.Blue),
                              },

                              false: {
                                  value: item.iconHeatCycle2
                                      ? { type: 'const', constVal: item.iconHeatCycle2 }
                                      : undefined,
                                  color: await configManager.getIconColor(item.iconHeatCycleOffColor2, {
                                      r: 80,
                                      g: 80,
                                      b: 140,
                                  }),
                              },
                          },
                entity2: (await configManager.existsState(humidity))
                    ? {
                          value: { type: 'triggered', dp: humidity || '' },
                          unit: { type: 'const', constVal: item.unit || '%' },
                      }
                    : undefined,
                headline: { type: 'const', constVal: headline || 'HEATING' },
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
                mode: mode,
            };
            if (Array.isArray(gridItem.config.data)) {
                gridItem.config.data.push(data);
            }
            if (!foundedStates) {
                continue;
            }

            if (role !== 'thermostat' && role !== 'airCondition') {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                const msg = `${page.uniqueName} id: ${o._id} role '${role}' not supported for cardThermo2!`;
                messages.push(msg);
                adapter.log.error(msg);
                continue;
            }
            filterIndex++;

            gridItem.pageItems = gridItem.pageItems || [];
            if (role === 'thermostat' || role === 'airCondition') {
                if (foundedStates[role].MODESET) {
                    const dataItem = foundedStates[role].MODESET;
                    if (dataItem && dataItem.dp) {
                        const dp = dataItem.dp;
                        const o = await adapter.getForeignObjectAsync(dp);
                        if (o?.common) {
                            let nativ: { icon: string; color: ScriptConfig.RGB } | undefined =
                                o.common.nativ?.nspanelIcons;
                            if (nativ != null && !Array.isArray(nativ)) {
                                nativ = undefined;
                            }
                            gridItem.pageItems.push({
                                role: '',
                                type: 'input_sel',
                                filter: filterIndex,
                                dpInit: '',
                                data: {
                                    icon: {
                                        true: {
                                            value: {
                                                ...dataItem,
                                                read: `
                                                    ${
                                                        nativ && nativ.length > 0 && nativ.every(e => 'icon' in e)
                                                            ? `return ${JSON.stringify(nativ)}.icon[val] || val`
                                                            : ''
                                                    }
                                                    switch(val) {
                                                    case 0: return 'power-off';
                                                    case 1: return 'heat-wave';
                                                    case 2: return 'snowflake';
                                                    case 3: return 'refresh-auto';
                                                    }
                                                `,
                                            },
                                            color: {
                                                ...dataItem,
                                                read: `
                                                    ${
                                                        nativ && nativ.length > 0 && nativ.every(e => 'color' in e)
                                                            ? `return ${JSON.stringify(nativ)}.color[val] || Color.Gray`
                                                            : ''
                                                    }
                                                    switch(val) {
                                                    case 0: return 'Color.Gray';
                                                    case 1: return 'Color.Red';
                                                    case 2: return 'Color.Blue';
                                                    case 3: return 'Color.MSYellow';
                                                    }
                                                `,
                                            },
                                        },

                                        false: {
                                            value: {
                                                ...dataItem,
                                                read: `
                                                    ${
                                                        nativ && nativ.length > 0
                                                            ? `return ${JSON.stringify(nativ)}[val] || val`
                                                            : ''
                                                    }
                                                    switch(val) {
                                                    case 0: return 'power-off';
                                                    case 1: return 'heat-wave';
                                                    case 2: return 'snowflake';
                                                    case 3: return 'refresh-auto';
                                                    }
                                                `,
                                            },
                                            color: { type: 'const', constVal: Color.Gray },
                                        },
                                    },
                                    entityInSel: {
                                        value: foundedStates[role].MODESET,
                                        set: foundedStates[role].MODESET,
                                    },
                                    headline: { type: 'const', constVal: o.common.name || 'Mode' },
                                },
                            });
                        }
                    }
                } else {
                    //Automatic
                    if (foundedStates[role].AUTOMATIC && !foundedStates[role].MANUAL) {
                        foundedStates[role].MANUAL = JSON.parse(JSON.stringify(foundedStates[role].AUTOMATIC));
                        if (foundedStates[role].MANUAL!.type === 'triggered') {
                            foundedStates[role].MANUAL!.read = 'return !val';
                            foundedStates[role].MANUAL!.write = 'return !val';
                        }
                    } else if (!foundedStates[role].AUTOMATIC && foundedStates[role].MANUAL) {
                        foundedStates[role].AUTOMATIC = JSON.parse(JSON.stringify(foundedStates[role].MANUAL));
                        if (foundedStates[role].AUTOMATIC!.type === 'triggered') {
                            foundedStates[role].AUTOMATIC!.read = 'return !val';
                            foundedStates[role].AUTOMATIC!.write = 'return !val';
                        }
                    }

                    if (foundedStates[role].AUTOMATIC) {
                        gridItem.pageItems.push({
                            role: 'button',
                            type: 'button',
                            filter: filterIndex,
                            dpInit: '',
                            data: {
                                icon: {
                                    true: {
                                        value: { type: 'const', constVal: 'alpha-a-circle' },
                                        color: { type: 'const', constVal: Color.activated },
                                    },
                                    false: {
                                        value: { type: 'const', constVal: 'alpha-a-circle-outline' },
                                        color: { type: 'const', constVal: Color.deactivated },
                                    },
                                },
                                entity1: {
                                    value: foundedStates[role].AUTOMATIC,
                                    set: foundedStates[role].AUTOMATIC,
                                },
                            },
                        });
                    }
                    //Manual
                    if (foundedStates[role].MANUAL) {
                        gridItem.pageItems.push({
                            role: 'button',
                            type: 'button',
                            filter: filterIndex,
                            dpInit: '',
                            data: {
                                icon: {
                                    true: {
                                        value: { type: 'const', constVal: 'alpha-m-circle' },
                                        color: { type: 'const', constVal: Color.activated },
                                    },
                                    false: {
                                        value: { type: 'const', constVal: 'alpha-m-circle-outline' },
                                        color: { type: 'const', constVal: Color.deactivated },
                                    },
                                },
                                entity1: {
                                    value: foundedStates[role].MANUAL,
                                    set: foundedStates[role].MANUAL,
                                },
                            },
                        });
                    }
                    if (foundedStates[role].OFF) {
                        gridItem.pageItems.push({
                            role: 'button',
                            type: 'button',
                            filter: filterIndex,
                            dpInit: '',
                            data: {
                                icon: {
                                    true: {
                                        value: { type: 'const', constVal: 'power-off' },
                                        color: { type: 'const', constVal: Color.activated },
                                    },
                                    false: {
                                        value: { type: 'const', constVal: 'power-off' },
                                        color: { type: 'const', constVal: Color.deactivated },
                                    },
                                },
                                entity1: {
                                    value: foundedStates[role].OFF,
                                    set: foundedStates[role].OFF,
                                },
                            },
                        });
                    }
                }

                // airCondition with mode
            }
            if (foundedStates[role].POWER) {
                gridItem.pageItems.push({
                    role: 'button',
                    type: 'button',
                    filter: filterIndex,
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'power-standby' },
                                color: { type: 'const', constVal: Color.activated },
                            },
                            false: {
                                value: { type: 'const', constVal: 'power-standby' },
                                color: { type: 'const', constVal: Color.deactivated },
                            },
                        },
                        entity1: {
                            value: foundedStates[role].POWER,
                            set: foundedStates[role].POWER,
                        },
                    },
                });
            }

            //Boost
            if (foundedStates[role].BOOST) {
                gridItem.pageItems.push({
                    role: 'button',
                    type: 'button',
                    filter: filterIndex,
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'fast-forward-60' },
                                color: { type: 'const', constVal: Color.activated },
                            },
                            false: {
                                value: { type: 'const', constVal: 'fast-forward-60' },
                                color: { type: 'const', constVal: Color.deactivated },
                            },
                        },
                        entity1: {
                            value: foundedStates[role].BOOST,
                            set: foundedStates[role].BOOST,
                        },
                    },
                });
            }
            //Fenster
            if (foundedStates[role].WINDOWOPEN) {
                gridItem.pageItems.push({
                    role: 'indicator',
                    type: 'button',
                    filter: filterIndex,
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'window-open-variant' },
                                color: { type: 'const', constVal: Color.open },
                            },
                            false: {
                                value: { type: 'const', constVal: 'window-closed-variant' },
                                color: { type: 'const', constVal: Color.close },
                            },
                        },
                        entity1: {
                            value: foundedStates[role].WINDOWOPEN,
                        },
                    },
                });
            }
            //Party
            if (foundedStates[role].PARTY) {
                gridItem.pageItems.push({
                    role: 'button',
                    type: 'button',
                    filter: filterIndex,
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'party-popper' },
                                color: { type: 'const', constVal: Color.activated },
                            },
                            false: {
                                value: { type: 'const', constVal: 'party-popper' },
                                color: { type: 'const', constVal: Color.deactivated },
                            },
                        },
                        entity1: {
                            value: foundedStates[role].PARTY,
                            set: foundedStates[role].PARTY,
                        },
                    },
                });
            }
            if (foundedStates[role].MAINTAIN) {
                gridItem.pageItems.push({
                    role: 'indicator',
                    type: 'button',
                    filter: filterIndex,
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'account-wrench' },
                                color: { type: 'const', constVal: Color.bad },
                            },
                            false: {
                                value: { type: 'const', constVal: 'account-wrench' },
                                color: { type: 'const', constVal: Color.deactivated },
                            },
                        },
                        entity1: {
                            value: foundedStates[role].MAINTAIN,
                        },
                    },
                });
            }
            if (foundedStates[role].UNREACH) {
                gridItem.pageItems.push({
                    role: 'indicator',
                    type: 'button',
                    filter: filterIndex,
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'wifi-off' },
                                color: { type: 'const', constVal: Color.bad },
                            },
                            false: {
                                value: { type: 'const', constVal: 'wifi' },
                                color: { type: 'const', constVal: Color.good },
                            },
                        },
                        entity1: {
                            value: foundedStates[role].UNREACH,
                        },
                    },
                });
            }
            if (foundedStates[role].MAINTAIN) {
                gridItem.pageItems.push({
                    role: 'indicator',
                    type: 'button',
                    filter: filterIndex,
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'account-wrench' },
                                color: { type: 'const', constVal: Color.true },
                            },
                            false: {
                                value: { type: 'const', constVal: 'account-wrench' },
                                color: { type: 'const', constVal: Color.deactivated },
                            },
                        },
                        entity1: {
                            value: foundedStates[role].MAINTAIN,
                        },
                    },
                });
            }
            if (foundedStates[role].LOWBAT) {
                gridItem.pageItems.push({
                    role: 'indicator',
                    type: 'button',
                    filter: filterIndex,
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'battery-low' },
                                color: { type: 'const', constVal: Color.bad },
                            },
                            false: {
                                value: { type: 'const', constVal: 'battery-high' },
                                color: { type: 'const', constVal: Color.good },
                            },
                        },
                        entity1: {
                            value: foundedStates[role].LOWBAT,
                        },
                    },
                });
            }
            if (foundedStates[role].ERROR) {
                gridItem.pageItems.push({
                    role: 'indicator',
                    type: 'button',
                    filter: filterIndex,
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'alert-circle' },
                                color: { type: 'const', constVal: Color.bad },
                            },
                            false: {
                                value: { type: 'const', constVal: 'alert-circle' },
                                color: { type: 'const', constVal: Color.deactivated },
                            },
                        },
                        entity1: {
                            value: foundedStates[role].ERROR,
                        },
                    },
                });
            }
            if (foundedStates[role].VACATION) {
                gridItem.pageItems.push({
                    role: 'indicator',
                    type: 'button',
                    filter: filterIndex,
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'palm-tree' },
                                color: { type: 'const', constVal: Color.activated },
                            },
                            false: {
                                value: { type: 'const', constVal: 'palm-tree' },
                                color: { type: 'const', constVal: Color.deactivated },
                            },
                        },
                        entity1: {
                            value: foundedStates[role].VACATION,
                        },
                    },
                });
            }
            if (foundedStates[role].WORKING) {
                gridItem.pageItems.push({
                    role: 'indicator',
                    type: 'button',
                    filter: filterIndex,
                    dpInit: '',
                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'briefcase-check' },
                                color: { type: 'const', constVal: Color.activated },
                            },
                            false: {
                                value: { type: 'const', constVal: 'briefcase-check' },
                                color: { type: 'const', constVal: Color.deactivated },
                            },
                        },
                        entity1: {
                            value: foundedStates[role].WORKING,
                        },
                    },
                });
            }
        }
        return { gridItem, messages };
    }
}
