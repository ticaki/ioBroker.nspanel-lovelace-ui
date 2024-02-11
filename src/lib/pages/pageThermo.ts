import { Page, PageInterface } from '../classes/Page';
import { getPayload, getPayloadArray } from '../const/tools';
import * as pages from '../types/pages';
import { IncomingEvent } from '../types/types';
import { PageItem } from './pageItem';

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
    btDetail: 1,
};

export class PageThermo extends Page {
    config: pages.cardThermoDataItemOptions;
    items: pages.cardThermoDataItems | undefined;
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    tempItem: PageItem | undefined;
    dpInit: string;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options.pageItems);
        if (options.config && options.config.card == 'cardThermo') this.config = options.config;
        else throw new Error('Missing config!');
        if (options.items && options.items.card == 'cardThermo') this.items = options.items;
        this.minUpdateInterval = 2000;
        this.dpInit = options.dpInit;
    }

    async init(): Promise<void> {
        const config = { ...this.config };
        // search states for mode auto
        const tempConfig: Partial<pages.cardThermoDataItems> =
            (await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config)) ?? config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardThermoDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        if (tempItem) tempItem.card = this.config && this.config.card;
        this.items = tempItem as pages.cardThermoDataItems;
    }

    public async update(): Promise<void> {
        const message: Partial<pages.PageThermoMessage> = {};
        message.options = [...PageThermoMessageDefault.options];
        if (this.items) {
            const item = this.items;
            if (this.pageItems) {
                for (let a = 0; a < this.pageItems.length && a < message.options.length; a++) {
                    const temp = this.pageItems[a];
                    if (temp) {
                        const arr = (await temp.getPageItemPayload()).split('~');
                        message.options[a] = getPayload(arr[2], arr[3], arr[5] == '1' ? '1' : '0', arr[1]);
                    }
                }
            }
            message.intNameEntity = this.id;
            message.headline = (item.data.headline && (await item.data.headline.getString())) ?? '';
            message.navigation = this.getNavigation();
            let v: any = (item.data.current && (await item.data.current.getNumber())) ?? null;
            if (v !== null) {
                message.currentTemp = (v as number).toFixed(1);
            } else {
                v = (item.data.current && (await item.data.current.getString())) ?? null;
                if (v !== null) {
                    message.currentTemp = this.library.getTranslation(v);
                }
            }
            v = (item.data.set1 && (await item.data.set1.getNumber())) ?? null;
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
            v = (item.data.text1 && (await item.data.text1.getString())) ?? null;
            if (v !== null) {
                message.tCurTempLbl = this.library.getTranslation(v);
            }
            v = (item.data.text2 && (await item.data.text2.getString())) ?? null;
            if (v !== null) {
                message.tStateLbl = this.library.getTranslation(v);
            }
            v = (item.data.tempStep && (await item.data.tempStep.getString())) ?? null;
            if (v !== null) {
                message.tempStep = v;
            }
            v = (item.data.mode && (await item.data.mode.getNumber())) ?? null;
            if (v !== null) {
                message.status = v;
            } else {
                v = (item.data.mode && (await item.data.mode.getString())) ?? null;
                if (v !== null) {
                    message.status = this.library.getTranslation(v);
                }
            }

            //message.btDetail = '';
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
            if (valHigh !== null && newValHigh !== valHigh) this.items.data.set2!.setStateAsync(newValHigh);
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
