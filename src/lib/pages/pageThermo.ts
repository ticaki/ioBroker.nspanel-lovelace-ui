import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Icons } from '../const/icon_mapping';
import { getPayload, getPayloadArray, getValueEntryString } from '../const/tools';
import type * as pages from '../types/pages';
import type { ButtonActionType, IncomingEvent, PopupType } from '../types/types';

const PageThermoMessageDefault: pages.PageThermoMessage = {
    event: 'entityUpd',
    headline: 'Page Thermo',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    intNameEntity: '',
    currentTemp: '',
    dstTemp: '',
    status: '',
    minTemp: '10',
    maxTemp: '40',
    tempStep: '5',
    options: ['~~~', '~~~', '~~~', '~~~', '~~~', '~~~', '~~~', '~~~'],
    tCurTempLbl: '',
    tStateLbl: '',
    tALbl: '',
    tCF: '',
    temp2: '',
    btDetail: '1',
};
/*type AtLeastOne<T, K extends keyof T = keyof T> = K extends keyof T ? Pick<T, K> & Partial<Omit<T, K>> : never;

type MyType = { a: string; b: string; c: string };
type MyValidType = AtLeastOne<MyType>;

export const a: MyValidType = { c: 'c' };*/

export class PageThermo extends Page {
    //config: pages.cardThermoDataItemOptions;
    items: pages.cardThermoDataItems | undefined;
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    public convertValue: 1 | 10 = 1;
    private nextArrow: boolean = false;

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
                ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardThermoDataItems> = await this.basePanel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        if (tempItem) {
            tempItem.card = 'cardThermo';
        }
        this.items = tempItem as pages.cardThermoDataItems;
        await super.init();

        const v = (this.items.data.maxTemp && (await this.items.data.maxTemp.getNumber())) ?? null;
        if (v !== null) {
            if (v < 100) {
                this.convertValue = 10;
            }
        }
    }

    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        const message: Partial<pages.PageThermoMessage> = {};
        message.options = ['~~~', '~~~', '~~~', '~~~', '~~~', '~~~', '~~~', '~~~'];
        if (this.items) {
            const item = this.items;
            if (this.pageItems) {
                const pageItems = this.pageItems.filter(
                    a => a && a.dataItems && a.dataItems.type === 'button' && a.dataItems.data.entity1,
                );

                const localStep = pageItems.length > 9 ? 7 : 8;
                if (pageItems.length - 1 <= localStep * (this.step - 1)) {
                    this.step = 1;
                }
                // arrow is at index [0]
                const maxSteps = localStep * this.step + 1;
                const minStep = localStep * (this.step - 1) + 1;
                let b = pageItems.length >= 8 ? 0 : Math.ceil((8 - pageItems.length) / 2);
                for (let a = minStep; a < maxSteps; a++, b++) {
                    const temp = pageItems[a];
                    if (temp) {
                        const arr = (await temp.getPageItemPayload()).split('~');
                        message.options[b] = getPayload(arr[2], arr[3], arr[5] == '1' ? '1' : '1', arr[1]);
                    } else {
                        getPayload('', '', '', '');
                    }
                }

                if (localStep === 7) {
                    this.nextArrow = true;
                    const temp = this.pageItems[0];
                    if (temp) {
                        const arr = (await temp.getPageItemPayload()).split('~');
                        message.options[7] = getPayload(arr[2], arr[3], arr[5] == '1' ? '1' : '0', arr[1]);
                    } else {
                        getPayload('', '', '', '');
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
            message.intNameEntity = this.id;
            message.headline = this.library.getTranslation(
                (this.items && this.items.data.headline && (await this.items.data.headline.getString())) ?? '',
            );
            message.navigation = this.getNavigation();

            let v: string | number | null = (item.data.set1 && (await item.data.set1.getNumber())) ?? null;
            if (v !== null) {
                message.dstTemp = v * 10;
                message.dstTemp = Math.round(Number(message.dstTemp));
            }

            v = (item.data.minTemp && (await item.data.minTemp.getNumber())) ?? null;
            if (v !== null) {
                message.minTemp = v * this.convertValue;
            } else if (item.data.set1 && item.data.set1.common.min != null) {
                message.minTemp = item.data.set1.common.min * 10;
            } else {
                message.minTemp = 150;
            }

            v = (item.data.maxTemp && (await item.data.maxTemp.getNumber())) ?? null;
            if (v !== null) {
                message.maxTemp = v * this.convertValue;
            } else if (item.data.set1 && item.data.set1.common.max != null) {
                message.maxTemp = item.data.set1.common.max * 10;
            } else {
                message.maxTemp = 300;
            }

            v = (item.data.tempStep && (await item.data.tempStep.getNumber())) ?? null;
            if (v !== null) {
                message.tempStep = String(v * this.convertValue);
            } else if (item.data.set1 && item.data.set1.common.step) {
                message.tempStep = String(item.data.set1.common.step * 10);
            } else {
                message.tempStep = '5';
            }
            message.tempStep = parseFloat(message.tempStep) < 1 ? '1' : message.tempStep;

            if (
                typeof message.minTemp === 'number' &&
                typeof message.maxTemp === 'number' &&
                typeof message.dstTemp === 'number' &&
                typeof message.tempStep === 'string'
            ) {
                message.dstTemp = Math.min(Math.max(message.dstTemp, message.minTemp), message.maxTemp);
                message.dstTemp =
                    Math.round((message.dstTemp - message.minTemp) / parseInt(message.tempStep) + message.minTemp) *
                    parseInt(message.tempStep);
            }

            v = (item.data.set2 && (await item.data.set2.getNumber())) ?? null;
            if (v !== null) {
                message.temp2 = v * 10;
            }

            // if we dont have a unit we get it from set1 or set2
            v = (item.data.unit && (await item.data.unit.getString())) ?? null;
            if (v !== null) {
                message.tCF = v;
                message.currentTemp += v;
            } else {
                if (item && item.data) {
                    let set = item.data.set1;
                    if (set) {
                        if (set.common.unit) {
                            message.tCF = set.common.unit;
                            message.currentTemp += set.common.unit;
                        }
                    } else {
                        set = item.data.set2;
                        if (set) {
                            if (set.common.unit) {
                                message.tCF = set.common.unit;
                                message.currentTemp += set.common.unit;
                            }
                        }
                    }
                }
            }

            message.tCurTempLbl = this.library.getTranslation((await getValueEntryString(item.data.mixed1)) ?? '');
            message.currentTemp = this.library.getTranslation((await getValueEntryString(item.data.mixed2)) ?? '');
            message.tStateLbl = this.library.getTranslation((await getValueEntryString(item.data.mixed3)) ?? '');
            message.status = this.library.getTranslation((await getValueEntryString(item.data.mixed4)) ?? '');

            message.btDetail =
                this.pageItems && this.pageItems.some(a => a && a.dataItems && a.dataItems.type === 'input_sel')
                    ? '0'
                    : '1';
            //this.pageItems && this.pageItems.some((a) => a.dataItems && a.dataItems.type === 'input_sel') ? '' : 1;
        }
        const msg: pages.PageThermoMessage = { ...PageThermoMessageDefault, ...message };

        this.sendToPanel(this.getMessage(msg), false);
    }

    async onButtonEvent(event: IncomingEvent): Promise<void> {
        if (event.action === 'tempUpdHighLow') {
            if (!this.items) {
                return;
            }
            const values = event.opt.split('|');
            const newValLow = parseInt(values[0]) / 10;
            const newValHigh = parseInt(values[1]) / 10;
            const valLow = (this.items && this.items.data.set1 && (await this.items.data.set1.getNumber())) ?? null;
            const valHigh = (this.items && this.items.data.set2 && (await this.items.data.set2.getNumber())) ?? null;
            if (valLow !== null && newValLow !== valLow && this.items.data.set1) {
                await this.items.data.set1.setState(newValLow);
            }
            if (valHigh !== null && newValHigh !== valHigh && this.items.data.set2) {
                await this.items.data.set2.setState(newValHigh);
            }
        } else if (event.action === 'tempUpd') {
            if (!this.items) {
                return;
            }
            const newValLow = parseInt(event.opt) / 10;
            const valLow = (this.items && this.items.data.set1 && (await this.items.data.set1.getNumber())) ?? null;
            if (valLow !== null && newValLow !== valLow && this.items.data.set1) {
                await this.items.data.set1.setState(newValLow);
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

    public async onPopupRequest(
        id: number | string,
        popup: PopupType | undefined,

        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        action: ButtonActionType | undefined | string,
        value: string | undefined,
        _event: IncomingEvent | null = null,
    ): Promise<void> {
        if (!this.pageItems || !this.pageItems.some(a => a && a.dataItems && a.dataItems.type === 'input_sel')) {
            return;
        }
        const items = this.pageItems; //.filter((a) => a.dataItems && a.dataItems.type === 'input_sel');
        let msg: string | null = null;
        if (popup === 'popupThermo') {
            const items = this.pageItems.filter(a => a && a.dataItems && a.dataItems.type === 'input_sel');

            const temp = [];
            const id = this.id;
            const icon = Icons.GetIcon(
                (this.items && this.items.data.icon && (await this.items.data.icon.getString())) ?? 'fan',
            );
            const color = (this.items && this.items.data.icon && (await this.items.data.icon.getRGBDec())) ?? '11487';
            for (const i of items) {
                i && temp.push(getPayload((await i.GeneratePopup(popup)) ?? '~~~'));
            }
            for (let a = 0; a < 3; a++) {
                if (temp[a] === undefined) {
                    temp[a] = '~~~';
                }
            }
            msg = getPayload('entityUpdateDetail', id, icon, color, temp[0], temp[1], temp[2], '');
        } else if (action && action.startsWith('mode') && value !== undefined) {
            const tempid = parseInt(action.split('?')[1]);
            const item = items[tempid];
            if (!item) {
                return;
            }
            await item.onCommand('mode-insel', value);
        }
        if (msg !== null) {
            this.sendToPanel(msg, false);
        }
    }

    private getMessage(message: pages.PageThermoMessage): string {
        return getPayload(
            'entityUpd',
            message.headline,
            message.navigation,
            message.intNameEntity,
            String(message.currentTemp),
            String(message.dstTemp),
            message.status,
            String(message.minTemp),
            String(message.maxTemp),
            message.tempStep,
            getPayloadArray(message.options),
            message.tCurTempLbl,
            message.tStateLbl,
            message.tALbl,
            message.tCF,
            String(message.temp2),
            String(message.btDetail),
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
