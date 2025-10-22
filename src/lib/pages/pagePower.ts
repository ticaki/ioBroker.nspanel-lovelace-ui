import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Color } from '../const/Color';
import {
    deepAssign,
    getEntryTextOnOff,
    getIconEntryColor,
    getIconEntryValue,
    getPayload,
    getPayloadRemoveTilde,
    getScaledNumber,
    getValueAutoUnit,
    getValueEntryNumber,
    getValueEntryString,
} from '../const/tools';
import type * as pages from '../types/pages';
import type { IncomingEvent, nsPanelState } from '../types/types';
import type { ConfigManager } from '../classes/config-manager';

const PagePowerMessageDefault: pages.PagePowerMessage = {
    event: 'entityUpd',
    headline: 'Power Grid',
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
    //items: pages.PageBaseConfig['items'];
    items: pages.cardPowerDataItems | undefined;
    index: number = 0;
    private autoUnit: (number | undefined)[] = [];
    constructor(config: PageInterface, options: pages.PageBase) {
        super(config, options);
        if (options.config && options.config.card == 'cardPower') {
            this.config = options.config;
        }
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        await this.basePanel.statesControler.setInternalState(
            `///${this.name}/powerSum`,
            0,
            true,
            { name: '', type: 'number', role: '', read: true, write: true },
            this.onInternalCommand,
        );
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardPowerDataItemOptions> =
            this.enums || this.dpInit
                ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardPowerDataItems> = await this.basePanel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.cardPowerDataItems;
        // set card because we lose it
        this.items.card = 'cardPower';
        await super.init();
    }

    onInternalCommand = async (id: string, _state: nsPanelState | undefined): Promise<ioBroker.StateValue> => {
        if (!id.startsWith(`///${this.name}`)) {
            return null;
        }
        const token = id.split('/').pop();
        if (token === 'powerSum') {
            const items = this.items;
            if (!items || items.card !== 'cardPower') {
                return null;
            }
            const data = items.data;
            const l1 = await this.getElementSum(data.leftTop, 0);
            const l2 = await this.getElementSum(data.leftMiddle, 0);
            const l3 = await this.getElementSum(data.leftBottom, 0);
            const r1 = await this.getElementSum(data.rightTop, 0);
            const r2 = await this.getElementSum(data.rightMiddle, 0);
            const r3 = await this.getElementSum(data.rightBottom, 0);

            let gesamt = 0;
            let angepasst: number[] = [];

            // Prüfen, ob die interne Berechnung aktiviert ist
            if (this.adapter.config.pagePowerdata[this.index].power8_selInternalCalculation) {
                const negativValue = this.adapter.config.pagePowerdata[this.index].power8_selPowerSupply; // Indexe (1-basiert), deren Werte negativ gezählt werden sollen
                const werte = [l1, l2, l3, r1, r2, r3];
                if (Array.isArray(negativValue) && negativValue.length > 0) {
                    // Werte negieren, falls der Index in negativValue enthalten ist
                    angepasst = werte.map((wert, index) => (negativValue.includes(index + 1) ? wert : 0));
                } else {
                    angepasst = werte;
                }
                // Gesamtsumme berechnen
                gesamt = angepasst.reduce((summe, wert) => summe + wert, 0);
                this.log.debug(`Angepasste Summe: ${gesamt}`);
                return String(gesamt);
            }
        }
        return null;
    };

    static async getPowerPageConfig(
        configManager: ConfigManager,
        page: ScriptConfig.PagePower,
        index: number,
        gridItem: pages.PageBase,
        messages: string[],
    ): Promise<{ gridItem: pages.PageBase; messages: string[] }> {
        const adapter = configManager.adapter;
        const config = adapter.config.pagePowerdata[index];

        //array of states
        const states: string[] = [];
        for (let i = 1; i <= 8; i++) {
            const key = `power${i}_state` as keyof typeof config;
            if (typeof config[key] === 'string' && (await configManager.existsState(config[key]))) {
                states.push(config[key]);
            } else {
                states.push('');
            }
        }

        //array of icons
        const icons: string[] = [];
        for (let i = 1; i <= 6; i++) {
            const key = `power${i}_icon` as keyof typeof config;
            if (typeof config[key] === 'string') {
                icons.push(config[key]);
            } else {
                icons.push('');
            }
        }

        //array of minSpeedScale
        const minSpeedScale: number[] = [];
        for (let i = 1; i <= 6; i++) {
            const key = `power${i}_minSpeedScale` as keyof typeof config;
            if (typeof config[key] === 'number') {
                minSpeedScale.push(config[key]);
            } else {
                minSpeedScale.push(0);
            }
        }

        //array of maxSpeedScale
        const maxSpeedScale: number[] = [];
        for (let i = 1; i <= 6; i++) {
            const key = `power${i}_maxSpeedScale` as keyof typeof config;
            if (typeof config[key] === 'number') {
                maxSpeedScale.push(config[key]);
            } else {
                maxSpeedScale.push(10_000);
            }
        }

        //array of iconColors
        const iconColor: string[] = [];
        for (let i = 1; i <= 6; i++) {
            const color = `power${i}_iconColor` as keyof typeof config;
            const useScale = `_power${i}_useColorScale` as keyof typeof config;
            if (typeof config[color] === 'string' && typeof config[useScale] === 'boolean' && !config[useScale]) {
                iconColor.push(config[color]);
            } else {
                iconColor.push('');
            }
        }
        //array of colorScale
        const iconColorScale: number[][] = [];
        for (let i = 1; i <= 6; i++) {
            const prefix = `power${i}_`;
            const surfix = `ColorScale`;
            const scale = [
                config[`${prefix}min${surfix}` as keyof typeof config],
                config[`${prefix}max${surfix}` as keyof typeof config],
                config[`${prefix}best${surfix}` as keyof typeof config],
            ];
            const useScale = config[`_${prefix}use${surfix}` as keyof typeof config];

            if (scale.every(s => typeof s === 'number') && useScale === true) {
                //iconColorScale.push([0, 800, 500]);
                iconColorScale.push(scale);
            } else {
                iconColorScale.push([]); // Leeres Array, falls die Bedingungen nicht erfüllt sind
            }
        }

        //array of entityHeadline
        const entityHeadline: string[] = [];
        for (let i = 1; i <= 6; i++) {
            const key = `power${i}_entityHeadline` as keyof typeof config;
            if (typeof config[key] === 'string') {
                entityHeadline.push(config[key]);
            } else {
                entityHeadline.push('');
            }
        }

        // array of speedReverse
        const speedReverse: boolean[] = [];
        for (let i = 1; i <= 6; i++) {
            const key = `power${i}_reverse` as keyof typeof config;
            if (typeof config[key] === 'boolean') {
                speedReverse.push(config[key]);
            }
        }

        //array of valueDecimal
        const valueDecimal: number[] = [];
        for (let i = 1; i <= 8; i++) {
            const key = `power${i}_valueDecimal` as keyof typeof config;
            if (typeof config[key] === 'number') {
                valueDecimal.push(config[key]);
            } else {
                valueDecimal.push(0);
            }
        }

        //array of valueUnit
        const configUnit: (number | undefined)[] = [];
        const valueUnit: string[] = [];
        for (let i = 1; i <= 7; i++) {
            const key = `power${i}_valueUnit` as keyof typeof config;
            // Erstellt eine Konfiguration für die bevorzuge Unit - funktioniert nur wenn common.unit gesetzt ist, ansonsten keien Änderung.
            switch (config[key]) {
                case 'W': {
                    configUnit.push(0);
                    break;
                }
                case 'kW': {
                    configUnit.push(1);
                    break;
                }
                case 'MW': {
                    configUnit.push(2);
                    break;
                }
                default: {
                    configUnit.push(undefined);
                }
            }

            if (states[i - 1] != null && states[i - 1] != '' && (await configManager.existsState(states[i - 1]))) {
                const o = await configManager.adapter.getForeignObjectAsync(states[i - 1]);
                if (o && o.common && o.common.unit) {
                    valueUnit.push(` ${o.common.unit}`);
                } else {
                    if (typeof config[key] === 'string' && config[key] != '') {
                        valueUnit.push(` ${config[key]}`);
                    } else {
                        valueUnit.push(' W');
                    }
                }
            } else {
                valueUnit.push('');
            }
        }
        // Sonderfall Power8 - ValueBottom
        const unitPower8 = `power8_valueUnit` as keyof typeof config;
        if (config.power8_selInternalCalculation) {
            valueUnit.push(` ${config[unitPower8]}`);
        } else {
            if (states[7] != null && states[7] != '' && (await configManager.existsState(states[7]))) {
                const o = await configManager.adapter.getForeignObjectAsync(states[7]);
                if (o && o.common && o.common.unit) {
                    valueUnit.push(` ${o.common.unit}`);
                } else {
                    if (typeof config[unitPower8] === 'string' && config[unitPower8] != '') {
                        valueUnit.push(` ${config[unitPower8]}`);
                    } else {
                        valueUnit.push(' W');
                    }
                }
            } else {
                valueUnit.push('');
            }
        }

        let valueKey = {};
        if (config.power8_selInternalCalculation) {
            valueKey = {
                value: { type: 'internal', dp: `///${config.pageName}/powerSum` },
                decimal: { type: 'const', constVal: valueDecimal[7] },
                unit: { type: 'const', constVal: valueUnit[7] },
            };
        } else {
            valueKey = {
                value: { type: 'triggered', dp: states[7] },
                decimal: { type: 'const', constVal: valueDecimal[7] },
                unit: { type: 'const', constVal: valueUnit[7] },
            };
        }

        configManager.log.info(
            `AlwaysOn Display for PagePower ${config.pageName}: ${gridItem.alwaysOn || config.alwaysOnDisplay ? 'always' : 'none'}`,
        );
        gridItem = {
            ...gridItem,
            uniqueID: config.pageName,
            alwaysOn: gridItem.alwaysOn || config.alwaysOnDisplay ? 'always' : 'none',
            hidden: gridItem.hidden || config.hiddenByTrigger,
            config: {
                card: 'cardPower',
                index: index,
                data: {
                    headline: await configManager.getFieldAsDataItemConfig(page.heading || config.headline || ''),
                    homeIcon: { true: { value: { type: 'const', constVal: 'home' } }, false: undefined },
                    homeValueTop: {
                        value: { type: 'triggered', dp: states[6] },
                        decimal: { type: 'const', constVal: valueDecimal[6] },
                        unit: { type: 'const', constVal: valueUnit[6] },
                    },
                    homeValueBot: valueKey,
                    leftTop: {
                        icon: {
                            true: {
                                value: {
                                    type: 'const',
                                    constVal: icons[0],
                                },
                                color: {
                                    type: 'const',
                                    constVal: iconColor[0], //undefined,
                                },
                            },
                            false: undefined,
                            scale: {
                                type: 'const',
                                constVal: {
                                    val_min: iconColorScale[0][0],
                                    val_max: iconColorScale[0][1],
                                    val_best: iconColorScale[0][2],
                                    mode: 'triGrad',
                                },
                            },
                        },
                        value: {
                            value: {
                                type: 'triggered',
                                dp: states[0],
                            },
                            decimal: {
                                type: 'const',
                                constVal: valueDecimal[0],
                            },
                            unit: {
                                type: 'const',
                                constVal: valueUnit[0],
                            },
                        },
                        speed: {
                            value: {
                                type: 'triggered',
                                dp: states[0],
                            },
                            minScale: {
                                type: 'const',
                                constVal: minSpeedScale[0],
                            },
                            maxScale: {
                                type: 'const',
                                constVal: maxSpeedScale[0],
                            },
                            negate: {
                                type: 'const',
                                constVal: speedReverse[0],
                            },
                        },
                        text: {
                            true: { type: 'const', constVal: entityHeadline[0] },
                        },
                        targetUnit: configUnit[0] ? { type: 'const', constVal: configUnit[0] } : undefined,
                    },
                    leftMiddle: {
                        icon: {
                            true: {
                                value: {
                                    type: 'const',
                                    constVal: icons[1],
                                },
                                color: {
                                    type: 'const',
                                    constVal: iconColor[1],
                                },
                            },
                            false: undefined,
                            scale: {
                                type: 'const',
                                constVal: {
                                    val_min: iconColorScale[1][0],
                                    val_max: iconColorScale[1][1],
                                    val_best: iconColorScale[1][2],
                                    mode: 'triGrad',
                                },
                            },
                        },
                        value: {
                            value: {
                                type: 'triggered',
                                dp: states[1],
                            },
                            decimal: {
                                type: 'const',
                                constVal: valueDecimal[1],
                            },
                            unit: {
                                type: 'const',
                                constVal: valueUnit[1],
                            },
                        },
                        speed: {
                            value: {
                                type: 'triggered',
                                dp: states[1],
                            },
                            minScale: {
                                type: 'const',
                                constVal: minSpeedScale[1],
                            },
                            maxScale: {
                                type: 'const',
                                constVal: maxSpeedScale[1],
                            },
                            negate: {
                                type: 'const',
                                constVal: speedReverse[1],
                            },
                        },
                        text: {
                            true: { type: 'const', constVal: entityHeadline[1] },
                        },
                        targetUnit: configUnit[1] ? { type: 'const', constVal: configUnit[1] } : undefined,
                    },
                    leftBottom: {
                        icon: {
                            true: {
                                value: {
                                    type: 'const',
                                    constVal: icons[2],
                                },
                                color: {
                                    type: 'const',
                                    constVal: iconColor[2],
                                },
                            },
                            false: undefined,
                            scale: {
                                type: 'const',
                                constVal: {
                                    val_min: iconColorScale[2][0],
                                    val_max: iconColorScale[2][1],
                                    val_best: iconColorScale[2][2],
                                    mode: 'triGrad',
                                },
                            },
                        },
                        value: {
                            value: {
                                type: 'triggered',
                                dp: states[2],
                            },
                            decimal: {
                                type: 'const',
                                constVal: valueDecimal[2],
                            },
                            unit: {
                                type: 'const',
                                constVal: valueUnit[2],
                            },
                        },
                        speed: {
                            value: {
                                type: 'triggered',
                                dp: states[2],
                            },
                            minScale: {
                                type: 'const',
                                constVal: minSpeedScale[2],
                            },
                            maxScale: {
                                type: 'const',
                                constVal: maxSpeedScale[2],
                            },
                            negate: {
                                type: 'const',
                                constVal: speedReverse[2],
                            },
                        },
                        text: {
                            true: { type: 'const', constVal: entityHeadline[2] },
                        },
                        targetUnit: configUnit[2] ? { type: 'const', constVal: configUnit[2] } : undefined,
                    },
                    rightTop: {
                        icon: {
                            true: {
                                value: {
                                    type: 'const',
                                    constVal: icons[3],
                                },
                                color: {
                                    type: 'const',
                                    constVal: iconColor[3],
                                },
                            },
                            false: undefined,
                            scale: {
                                type: 'const',
                                constVal: {
                                    val_min: iconColorScale[3][0],
                                    val_max: iconColorScale[3][1],
                                    val_best: iconColorScale[3][2],
                                    mode: 'triGrad',
                                },
                            },
                        },
                        value: {
                            value: {
                                type: 'triggered',
                                dp: states[3],
                            },
                            decimal: {
                                type: 'const',
                                constVal: valueDecimal[3],
                            },
                            unit: {
                                type: 'const',
                                constVal: valueUnit[3],
                            },
                        },
                        speed: {
                            value: {
                                type: 'triggered',
                                dp: states[3],
                            },
                            minScale: {
                                type: 'const',
                                constVal: minSpeedScale[3],
                            },
                            maxScale: {
                                type: 'const',
                                constVal: maxSpeedScale[3],
                            },
                            negate: {
                                type: 'const',
                                constVal: speedReverse[3],
                            },
                        },
                        text: {
                            true: { type: 'const', constVal: entityHeadline[3] },
                        },
                        targetUnit: configUnit[3] ? { type: 'const', constVal: configUnit[3] } : undefined,
                    },
                    rightMiddle: {
                        icon: {
                            true: {
                                value: {
                                    type: 'const',
                                    constVal: icons[4],
                                },
                                color: {
                                    type: 'const',
                                    constVal: iconColor[4],
                                },
                            },
                            false: undefined,
                            scale: {
                                type: 'const',
                                constVal: {
                                    val_min: iconColorScale[4][0],
                                    val_max: iconColorScale[4][1],
                                    val_best: iconColorScale[4][2],
                                    mode: 'triGrad',
                                },
                            },
                        },
                        value: {
                            value: {
                                type: 'triggered',
                                dp: states[4],
                            },
                            decimal: {
                                type: 'const',
                                constVal: valueDecimal[4],
                            },
                            unit: {
                                type: 'const',
                                constVal: valueUnit[4],
                            },
                        },
                        speed: {
                            value: {
                                type: 'triggered',
                                dp: states[4],
                            },
                            minScale: {
                                type: 'const',
                                constVal: minSpeedScale[4],
                            },
                            maxScale: {
                                type: 'const',
                                constVal: maxSpeedScale[4],
                            },
                            negate: {
                                type: 'const',
                                constVal: speedReverse[4],
                            },
                        },
                        text: {
                            true: { type: 'const', constVal: entityHeadline[4] },
                        },
                        targetUnit: configUnit[4] ? { type: 'const', constVal: configUnit[4] } : undefined,
                    },
                    rightBottom: {
                        icon: {
                            true: {
                                value: {
                                    type: 'const',
                                    constVal: icons[5],
                                },
                                color: {
                                    type: 'const',
                                    constVal: iconColor[5],
                                },
                            },
                            false: undefined,
                            scale: {
                                type: 'const',
                                constVal: {
                                    val_min: iconColorScale[5][0],
                                    val_max: iconColorScale[5][1],
                                    val_best: iconColorScale[5][2],
                                    mode: 'triGrad',
                                },
                            },
                        },
                        value: {
                            value: {
                                type: 'triggered',
                                dp: states[5],
                            },
                            decimal: {
                                type: 'const',
                                constVal: valueDecimal[5],
                            },
                            unit: {
                                type: 'const',
                                constVal: valueUnit[5],
                            },
                        },
                        speed: {
                            value: {
                                type: 'triggered',
                                dp: states[5],
                            },
                            minScale: {
                                type: 'const',
                                constVal: minSpeedScale[5],
                            },
                            maxScale: {
                                type: 'const',
                                constVal: maxSpeedScale[5],
                            },
                            negate: {
                                type: 'const',
                                constVal: speedReverse[5],
                            },
                        },
                        text: {
                            true: { type: 'const', constVal: entityHeadline[5] },
                        },
                        targetUnit: configUnit[5] ? { type: 'const', constVal: configUnit[5] } : undefined,
                    },
                },
            },
            pageItems: [],
        };
        return { gridItem, messages };
    }

    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        const message: Partial<pages.PagePowerMessage> = {};
        const config = this.adapter.config.pagePowerdata[this.index];
        if (this.items && config != null) {
            const items = this.items;
            message.headline = this.library.getTranslation(
                (items.data.headline && (await items.data.headline.getString())) ?? config.headline ?? '',
            );
            message.navigation = this.getNavigation();

            const data = items.data;

            message.homeIcon = await getIconEntryValue(data.homeIcon, true, '');
            message.homeColor = await getIconEntryColor(data.homeIcon, true, Color.White);
            message.homeValueTop = (await getValueEntryString(data.homeValueTop)) ?? '';
            message.homeValueBot = (await getValueEntryString(data.homeValueBot)) ?? '';

            // to much work to change types to partial in getMessage we assign a full object to this.
            message.leftTop = (await this.getElementUpdate(data.leftTop, 0)) as pages.PagePowerMessageItem;
            message.leftMiddle = (await this.getElementUpdate(data.leftMiddle, 1)) as pages.PagePowerMessageItem;
            message.leftBottom = (await this.getElementUpdate(data.leftBottom, 2)) as pages.PagePowerMessageItem;
            message.rightTop = (await this.getElementUpdate(data.rightTop, 3)) as pages.PagePowerMessageItem;
            message.rightMiddle = (await this.getElementUpdate(data.rightMiddle, 4)) as pages.PagePowerMessageItem;
            message.rightBottom = (await this.getElementUpdate(data.rightBottom, 5)) as pages.PagePowerMessageItem;
        }
        this.sendToPanel(this.getMessage(message), false);
    }

    private async getElementSum(item: pages.cardPowerDataItems['data']['leftBottom'], num: number): Promise<number> {
        if (item === undefined) {
            return num;
        }
        const value = await getValueEntryNumber(item.value);
        return value !== null ? value + num : num;
    }

    private async getElementUpdate(
        item: pages.cardPowerDataItems['data']['leftBottom'],
        index: number,
    ): Promise<undefined | Partial<pages.PagePowerMessageItem>> {
        if (item === undefined) {
            return undefined;
        }

        const message: Partial<pages.PagePowerMessageItem> = {};

        const value = await getValueEntryNumber(item.value);
        if (value === null) {
            return undefined;
        }

        if (this.autoUnit[index] === undefined) {
            const unitEntry = await item.targetUnit?.getNumber();
            if (unitEntry != null) {
                this.autoUnit[index] = unitEntry;
            }
        }

        message.icon = (await getIconEntryValue(item.icon, value >= 0, '')) ?? undefined;
        message.iconColor = (await getIconEntryColor(item.icon, value, Color.White)) ?? undefined;
        message.name = (await getEntryTextOnOff(item.text, value >= 0)) ?? undefined;
        message.speed = (await getScaledNumber(item.speed)) ?? undefined;
        const {
            value: newValue,
            unit,
            endFactor,
        } = await getValueAutoUnit(item.value, null, 6, null, this.autoUnit[index]);
        this.autoUnit[index] = endFactor || 0;
        message.value = `${newValue}${unit ? ` ${unit}` : ''}`;
        this.log.debug(`getElementUpdate ${value} ${newValue} ${unit} ${endFactor}`);

        return message;
    }

    private getMessage(message: Partial<pages.PagePowerMessage>): string {
        let result: pages.PagePowerMessage = PagePowerMessageDefault;
        result = deepAssign(result, message) as pages.PagePowerMessage;
        return getPayload(
            getPayloadRemoveTilde('entityUpd', result.headline),
            result.navigation,
            getPayloadRemoveTilde(
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
            ),
            getPayload(
                this.getMessageItem(result.leftTop),
                this.getMessageItem(result.leftMiddle),
                this.getMessageItem(result.leftBottom),
                this.getMessageItem(result.rightTop),
                this.getMessageItem(result.rightMiddle),
                this.getMessageItem(result.rightBottom),
            ),
        );
    }

    private getMessageItem(i: pages.PagePowerMessageItem | undefined): string {
        if (!i) {
            return getPayloadRemoveTilde('', '', '', '', '', '', '');
        }
        this.log.debug(`${i.icon} ${i.iconColor} ${i.name}  ${i.value} ${String(i.speed)}`);
        return getPayloadRemoveTilde(
            '',
            '',
            i.icon ?? '',
            i.iconColor ?? '',
            i.name ?? '',
            i.value ?? '',
            String(i.speed ?? ''),
        );
    }
    protected async onStateTrigger(): Promise<void> {
        await this.update();
    }
    protected onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            this.autoUnit = [];
        }
        return super.onVisibilityChange(val);
    }
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        //if (event.page && event.id && this.pageItems) {
        //    this.pageItems[event.id as any].setPopupAction(event.action, event.opt);
        //}
    }
}
