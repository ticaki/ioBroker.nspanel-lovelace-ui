import { Page, PageInterface } from '../classes/Page';
import { Icons } from '../const/icon_mapping';
import { getPayload, getPayloadArray, getValueEntryString } from '../const/tools';
import * as pages from '../types/pages';
import { ButtonActionType, IncomingEvent, PopupType } from '../types/types';

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

export class PageThermo extends Page {
    //config: pages.cardThermoDataItemOptions;
    items: pages.cardThermoDataItems | undefined;
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        if (options.card === 'screensaver' || options.card === 'screensaver2') return;
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
        if (options.config && options.config.card == 'cardThermo') this.config = options.config;
        else throw new Error('Missing config!');
        if (options.items && options.items.card == 'cardThermo') this.items = options.items;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardThermoDataItems> = this.dpInit
            ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config)
            : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardThermoDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        if (tempItem) tempItem.card = 'cardThermo';
        this.items = tempItem as pages.cardThermoDataItems;
        await super.init();
    }

    public async update(): Promise<void> {
        const message: Partial<pages.PageThermoMessage> = {};
        message.options = ['~~~', '~~~', '~~~', '~~~', '~~~', '~~~', '~~~', '~~~'];
        if (this.items) {
            const item = this.items;
            if (this.pageItems) {
                const pageItems = this.pageItems.filter((a) => a && a.dataItems && a.dataItems.type === 'button');
                const localStep = pageItems.length > 9 ? 7 : 8;
                if (pageItems.length - 1 <= localStep * (this.step - 1)) this.step = 1;
                // arrow is at index [0]
                const maxSteps = localStep * this.step + 1;
                const minStep = localStep * (this.step - 1) + 1;
                let b = 0;
                for (let a = minStep; a < maxSteps; a++, b++) {
                    const temp = pageItems[a];
                    if (temp) {
                        const arr = (await temp.getPageItemPayload()).split('~');
                        message.options[b] = getPayload(arr[2], arr[3], arr[5] == '1' ? '1' : '0', arr[1]);
                    } else getPayload('', '', '', '');
                }

                if (localStep === 7) {
                    this.nextArrow = true;
                    const temp = this.pageItems[0];
                    if (temp) {
                        const arr = (await temp.getPageItemPayload()).split('~');
                        message.options[7] = getPayload(arr[2], arr[3], arr[5] == '1' ? '1' : '0', arr[1]);
                    } else getPayload('', '', '', '');
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
            }
            v = (item.data.minTemp && (await item.data.minTemp.getNumber())) ?? null;
            if (v !== null) {
                message.minTemp = v * 10;
            }
            v = (item.data.maxTemp && (await item.data.maxTemp.getNumber())) ?? null;
            if (v !== null) {
                message.maxTemp = v * 10;
            }
            v = (item.data.set2 && (await item.data.set2.getNumber())) ?? null;
            if (v !== null) {
                message.temp2 = v * 10;
            }
            v = (item.data.unit && (await item.data.unit.getString())) ?? null;
            if (v !== null) {
                message.tCF = v;
                message.currentTemp += v;
            }
            v = (item.data.tempStep && (await item.data.tempStep.getString())) ?? null;
            if (v !== null) {
                message.tempStep = v;
            }

            message.tCurTempLbl = this.library.getTranslation((await getValueEntryString(item.data.mixed1)) ?? '');
            message.currentTemp = this.library.getTranslation((await getValueEntryString(item.data.mixed2)) ?? '');
            message.tStateLbl = this.library.getTranslation((await getValueEntryString(item.data.mixed3)) ?? '');
            message.status = this.library.getTranslation((await getValueEntryString(item.data.mixed4)) ?? '');

            message.btDetail =
                this.pageItems && this.pageItems.some((a) => a && a.dataItems && a.dataItems.type === 'input_sel')
                    ? '0'
                    : '1';
            //this.pageItems && this.pageItems.some((a) => a.dataItems && a.dataItems.type === 'input_sel') ? '' : 1;
        }
        const msg: pages.PageThermoMessage = Object.assign(PageThermoMessageDefault, message);

        this.sendToPanel(this.getMessage(msg));
    }

    async onButtonEvent(event: IncomingEvent): Promise<void> {
        if (event.action === 'tempUpdHighLow') {
            if (!this.items) return;
            const values = event.opt.split('|');
            const newValLow = parseInt(values[0]) / 10;
            const newValHigh = parseInt(values[1]) / 10;
            const valLow = (this.items && this.items.data.set1 && (await this.items.data.set1.getNumber())) ?? null;
            const valHigh = (this.items && this.items.data.set2 && (await this.items.data.set2.getNumber())) ?? null;
            if (valLow !== null && newValLow !== valLow) this.items.data.set1!.setStateAsync(newValLow);
            if (valHigh !== null && newValHigh !== valHigh) await this.items.data.set2!.setStateAsync(newValHigh);
        } else if (event.action === 'tempUpd') {
            if (!this.items) return;
            const newValLow = parseInt(event.opt) / 10;
            const valLow = (this.items && this.items.data.set1 && (await this.items.data.set1.getNumber())) ?? null;
            if (valLow !== null && newValLow !== valLow) await this.items.data.set1!.setStateAsync(newValLow);
        } else if (
            event.action === 'hvac_action' &&
            this.pageItems &&
            this.pageItems[Number(event.opt.split('?')[1])]
        ) {
            if (this.nextArrow && event.opt.split('?')[1] === '0') {
                this.step++;
                this.update();
            } else if (await this.pageItems[Number(event.opt.split('?')[1])]!.onCommand('button', '')) return;
        }
    }

    public async onPopupRequest(
        id: number | string,
        popup: PopupType | undefined,
        action: ButtonActionType | undefined | string,
        value: string | undefined,
        _event: IncomingEvent | null = null,
    ): Promise<void> {
        if (!this.pageItems || !this.pageItems.some((a) => a && a.dataItems && a.dataItems.type === 'input_sel'))
            return;
        const items = this.pageItems; //.filter((a) => a.dataItems && a.dataItems.type === 'input_sel');
        let msg: string | null = null;
        if (popup === 'popupThermo') {
            const items = this.pageItems.filter((a) => a && a.dataItems && a.dataItems.type === 'input_sel');

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
                if (temp[a] === undefined) temp[a] = '~~~';
            }
            msg = getPayload('entityUpdateDetail', id, icon, color, temp[0], temp[1], temp[2], '');
        } else if (action && action.startsWith('mode') && value !== undefined) {
            const tempid = parseInt(action.split('?')[1]);
            const item = items[tempid];
            if (!item) return;
            item.onCommand('mode-insel', value);
        }
        if (msg !== null) {
            this.sendToPanel(msg);
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
}
