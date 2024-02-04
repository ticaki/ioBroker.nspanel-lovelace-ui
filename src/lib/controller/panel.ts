import { PanelSend } from './panel-message';

import dayjs from 'dayjs';
import { Screensaver, ScreensaverConfigType } from '../pages/screensaver';
import * as NSPanel from '../types/types';
import * as pages from '../types/pages';
import { Controller } from './panel-controller';
import { AdapterClassDefinition, BaseClass } from '../classes/library';
import { callbackMessageType } from '../classes/mqtt';
import { ReiveTopicAppendix, SendTopicAppendix } from '../const/definition';
import { testConfigMedia } from '../config';
import { Page, PageConfigAll, PageInterface } from '../pages/Page';
import { PageMedia } from '../pages/pageMedia';
import { IClientPublishOptions } from 'mqtt';
import { StatesControler } from './states-controller';

export interface panelConfigPartial extends Partial<panelConfigTop> {
    format?: Partial<Intl.DateTimeFormatOptions>;
    controller: Controller;
    topic: string;
    name: string;
    pages: PageConfigAll[];
    config: ScreensaverConfigType;
}
export function isPanelConfig(F: object | panelConfig): F is panelConfig {
    if ((F as panelConfig).controller === undefined) return false;
    if ((F as panelConfig).pages === undefined) return false;
    if ((F as panelConfig).topic === undefined) return false;
    if ((F as panelConfig).name === undefined) return false;
    return true;
}
type panelConfig = panelConfigTop & {
    format: Intl.DateTimeFormatOptions;
    controller: Controller;
    topic: string;
    name: string;
    pages: PageConfigAll[];
    config: ScreensaverConfigType;
};

const DefaultOptions = {
    format: {
        weekday: 'short',
        month: 'short',
        year: 'numeric',
        day: 'numeric',
    },
    CustomFormat: '',
    locale: 'de-DE',
    timeout: 30,
    pages: [],
};

type panelConfigTop = { CustomFormat: string; locale: Intl.LocalesArgument; timeout: number };

export class Panel extends BaseClass {
    private minuteLoopTimeout: ioBroker.Timeout | undefined;
    private dateUpdateTimeout: ioBroker.Timeout | undefined;
    private pages: Record<string, Page> = {};
    private _activePage: { page: Page | null; sleep?: boolean } = { page: null };
    private screenSaver: Screensaver | undefined;
    readonly format: Partial<Intl.DateTimeFormatOptions>;
    readonly controller: Controller;
    readonly topic: string;
    readonly reivCallbacks: callbackMessageType[] = [];
    _isOnline = false;
    readonly panelSend: PanelSend;
    readonly statesControler: StatesControler;
    readonly config: ScreensaverConfigType;
    readonly timeout: number;
    readonly CustomFormat: string;
    constructor(adapter: AdapterClassDefinition, options: panelConfigPartial) {
        super(adapter, options.name);
        this.panelSend = new PanelSend(adapter, {
            name: `${options.name}-SendClass`,
            mqttClient: options.controller.mqttClient,
            topic: options.topic,
        });
        this.timeout = options.timeout || 15;
        this.CustomFormat = options.CustomFormat ?? '';
        this.config = options.config;
        this.format = Object.assign(DefaultOptions.format, options.format);
        this.controller = options.controller;
        this.topic = options.topic;
        if (typeof this.panelSend.addMessage === 'function') this.sendToPanelClass = this.panelSend.addMessage;
        this.statesControler = options.controller.statesControler;
        let scsFound = 0;
        for (const a in options.pages) {
            const pageConfig = options.pages[a];
            if (!pageConfig) continue;
            switch (pageConfig.card) {
                case 'cardChart': {
                    break;
                }
                case 'cardLChart': {
                    break;
                }
                case 'cardEntities': {
                    break;
                }
                case 'cardGrid': {
                    break;
                }
                case 'cardGrid2': {
                    break;
                }
                case 'cardThermo': {
                    break;
                }
                case 'cardMedia': {
                    const pmconfig = {
                        card: testConfigMedia.card,
                        panel: this,
                        id: a,
                        name: 'PM',
                        alwaysOn: testConfigMedia.alwaysOn,
                        adapter: this.adapter,
                        panelSend: this.panelSend,
                    };
                    this.pages[a] = new PageMedia(pmconfig, pageConfig);
                    this.pages[a].init();
                    break;
                }
                case 'cardUnlock': {
                    break;
                }
                case 'cardQR': {
                    break;
                }
                case 'cardAlarm': {
                    break;
                }
                case 'cardPower': {
                    break;
                }
                case 'screensaver':
                case 'screensaver2': {
                    if (scsFound++ > 0) continue;

                    //const opt = Object.assign(DefaultOptions, pageConfig);
                    const ssconfig: PageInterface = {
                        card: 'screensaver',
                        panel: this,
                        id: a,
                        name: 'SrS',
                        adapter: this.adapter,
                        panelSend: this.panelSend,
                    };
                    this.screenSaver = new Screensaver(ssconfig, pageConfig);
                    break;
                }
            }
        }
        if (scsFound === 0 || this.screenSaver === undefined) {
            this.log.error('no screensaver found! Stop!');
            throw new Error('no screensaver found! Stop!');
            this.adapter.controller!.delete();
            return;
        }
    }

    private sendToPanelClass: (payload: string, opt?: IClientPublishOptions) => void = () => {};
    protected sendToPanel: (payload: string, opt?: IClientPublishOptions) => void = (
        payload: string,
        opt?: IClientPublishOptions,
    ) => {
        this.sendToPanelClass(payload, opt);
    };
    async setActivePage(_notSleep?: boolean): Promise<void>;
    async setActivePage(_page?: Page | boolean | undefined): Promise<void>;
    async setActivePage(_page?: Page | boolean | undefined, _notSleep?: boolean): Promise<void> {
        if (_page === undefined) return;
        let page = this._activePage.page;
        let sleep = false;
        if (typeof _page === 'boolean') {
            sleep = !_page;
        } else {
            page = _page;
            sleep = _notSleep ?? false;
        }
        if (sleep == !this._activePage.sleep || page != this._activePage.page) {
            if (page != this._activePage.page) {
                if (this._activePage.page) this._activePage.page.setVisibility(false);
                if (page && !sleep) {
                    page.setVisibility(true);
                }
                this._activePage = { page, sleep };
            } else if (sleep == !this._activePage.sleep) {
                if (this._activePage.page && !sleep) this._activePage.page.setVisibility(true, true);
                this._activePage.sleep = sleep;
            }
        }
    }
    getActivePage(): Page {
        if (!this._activePage.page) throw new Error(`No active page here, check code!`);
        return this._activePage.page;
    }
    get isOnline(): boolean {
        return this._isOnline;
    }
    set isOnline(s: boolean) {
        this._isOnline = s;
    }
    async isValid(): Promise<true> {
        return true;
    }

    init = async (): Promise<void> => {
        this.controller.mqttClient.subscript(this.topic, this.onMessage);
        this.sendToPanel('pageType~pageStartup', { retain: true });
    };
    registerOnMessage(fn: callbackMessageType): void {
        if (this.reivCallbacks.indexOf(fn) === -1) {
            this.reivCallbacks.push(fn);
        }
    }
    onMessage: callbackMessageType = async (topic: string, message: string) => {
        if (topic.endsWith(SendTopicAppendix)) {
            //this.log.debug(`Receive command ${topic} with ${message}`);
            return;
        }
        for (const fn of this.reivCallbacks) {
            if (fn) fn(topic, message);
        }
        if (topic.endsWith(ReiveTopicAppendix)) {
            //this.log.debug(`Receive message ${topic} with ${message}`);
            const event: NSPanel.IncomingEvent | null = pages.convertToEvent(message);
            if (event) {
                this.HandleIncomingMessage(event);
            }
        }
    };

    /**
     * timeout screensaver after sec
     * @param sec seconds for timeout
     */
    sendScreeensaverTimeout(sec: number): void {
        this.log.debug(`Set screeensaver timeout to ${sec}s.`);
        this.sendToPanel(`timeout~${sec}`);
    }
    restartLoops(): void {
        if (this.minuteLoopTimeout) this.adapter.clearTimeout(this.minuteLoopTimeout);
        if (this.dateUpdateTimeout) this.adapter.clearTimeout(this.dateUpdateTimeout);
        this.minuteLoop();
        this.dateUpdateLoop();
    }
    /**
     * Do panel work always at full minute
     * @returns void
     */
    minuteLoop = (): void => {
        if (this.unload) return;
        this.sendToPanel(`time~${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`);
        const diff = 60000 - (Date.now() % 60000) + 10;
        this.minuteLoopTimeout = this.adapter.setTimeout(this.minuteLoop, diff);
    };

    /**
     * Update Date 2 times per day because of daylight saving.
     * @returns
     */
    dateUpdateLoop = (): void => {
        if (this.unload) return;
        const val =
            this.CustomFormat != ''
                ? dayjs().format(this.CustomFormat)
                : new Date().toLocaleDateString(this.config.locale, this.format);

        this.sendToPanel(`date~${val}`);
        const d: Date = new Date();
        d.setDate(d.getDate() + 1);
        // don't set ms, let them be random
        d.setHours(0, 0, 0);
        const diff = d.getTime() - Date.now();
        this.minuteLoopTimeout = this.adapter.setTimeout(this.minuteLoop, diff);
    };

    async delete(): Promise<void> {
        await super.delete();
        this.isOnline = false;
        if (this.minuteLoopTimeout) this.adapter.clearTimeout(this.minuteLoopTimeout);
        if (this.dateUpdateTimeout) this.adapter.clearTimeout(this.dateUpdateTimeout);
    }

    async HandleIncomingMessage(event: NSPanel.IncomingEvent): Promise<void> {
        this.log.debug(JSON.stringify(event));
        let index: string | undefined;
        for (index in this.pages) {
            if (!(this.pages[index].card === 'screensaver' || this.pages[index].card !== 'screensaver2')) break;
        }
        if (index === undefined) return;
        switch (event.method) {
            case 'startup': {
                this.isOnline = true;
                if (this.screenSaver) await this.screenSaver.init();
                else return;
                if (this.minuteLoopTimeout) this.adapter.clearTimeout(this.minuteLoopTimeout);
                if (this.dateUpdateTimeout) this.adapter.clearTimeout(this.dateUpdateTimeout);
                this.restartLoops();
                this.sendScreeensaverTimeout(this.timeout);
                this.sendToPanel('dimmode~80~100~6371');
                const test = false;
                if (test) {
                    this.sendToPanel('pageType~cardGrid');
                    this.sendToPanel(
                        'entityUpd~Menü~button~bPrev~~65535~~~button~bNext~~65535~~~button~navigate.SensorGrid~21.1~26095~Obergeschoss~PRESS~button~navigate.ObergeschossWindow~~64332~Obergeschoss~Obergeschoss~button~navigate.ogLightsGrid~~65363~Obergeschoss ACTUAL~PRESS~button~navigate.Alexa~~65222~test~PRESS',
                    );
                } else {
                    await this.setActivePage(this.pages[index]);
                }
                // sendPage
                break;
            }
            case 'sleepReached': {
                await this.setActivePage(this.screenSaver);
                break;
            }
            case 'pageOpenDetail': {
                await this.setActivePage(false);
                break;
            }
            case 'buttonPress2': {
                if (event.command == 'screensaver') {
                    await this.setActivePage(this.pages[index]);
                } else {
                    this.getActivePage().onButtonEvent(event);
                    await this.setActivePage(true);
                }
                break;
            }
            case 'renderCurrentPage': {
                break;
            }
            case 'button1': {
                this.screenSaver!.setVisibility(false);

                break;
            }
            case 'button2': {
                this.screenSaver!.setVisibility(false);

                break;
            }
        }
    }

    /*
    function HandleMessage(typ: string, method: NSPanel.EventMethod, page: number | undefined, words: string[] | undefined): void {
        try {
            if (typ == 'event') {
                switch (method as NSPanel.EventMethod) {
                    case 'startup':
                        screensaverEnabled = false;
                        UnsubscribeWatcher();
                        HandleStartupProcess();
                        pageId = 0;
                        GeneratePage(config.pages[0]);
                        if (Debug) log('HandleMessage -> Startup', 'info');
                        Init_Release();
                        break;
                    case 'sleepReached':
                        useMediaEvents = false;
                        screensaverEnabled = true;
                        if (pageId < 0)
                            pageId = 0;
                        HandleScreensaver();
                        if (Debug) log('HandleMessage -> sleepReached', 'info');
                        break;
                    case 'pageOpenDetail':
                        if (words != undefined) {
                            screensaverEnabled = false;
                            UnsubscribeWatcher();
                            if (Debug) {
                                log('HandleMessage -> pageOpenDetail ' + words[0] + ' - ' + words[1] + ' - ' + words[2] + ' - ' + words[3] + ' - ' + words[4], 'info');
                            }
                            let tempId: PageItem['id'];
                            let tempPageItem = words[3].split('?');
                            let placeId: number | undefined = undefined;
                            if (!isNaN(parseInt(tempPageItem[0]))){
                                tempId = activePage!.items[tempPageItem[0]].id;
                                placeId = parseInt(tempPageItem[0])
                                if (tempId == undefined) {
                                    throw new Error(`Missing id in HandleMessage!`)
                                }
                            } else {
                                tempId = tempPageItem[0];
                            }
                            let pageItem: PageItem = findPageItem(tempId);
                            if (pageItem !== undefined && isPopupType(words[2])) {
                                let temp: string | NSPanel.mediaOptional | undefined = tempPageItem[1]
                                if (isMediaOptional(temp)) SendToPanel(GenerateDetailPage(words[2], temp, pageItem, placeId));
                                else SendToPanel(GenerateDetailPage(words[2], undefined, pageItem, placeId));
                            }
                        }
                        break;
                    case 'buttonPress2':
                        screensaverEnabled = false;
                        HandleButtonEvent(words);
                        if (Debug) {
                            if (words != undefined) log('HandleMessage -> buttonPress2 ' + words[0] + ' - ' + words[1] + ' - ' + words[2] + ' - ' + words[3] + ' - ' + words[4], 'info');
                        }
                        break;
                    case 'renderCurrentPage':
                        // Event only for HA at this Moment
                        if (Debug) log('renderCurrentPage', 'info');
                        break;
                    case 'button1':
                    case 'button2':
                        screensaverEnabled = false;
                        HandleHardwareButton(method);
                        if (Debug) log('HandleMessage -> button1 /  button2', 'info')
                        break;
                    default:
                        break;
                }
            }
        } catch (err: any) {
            log('error at function HandleMessage: ' + err.message, 'warn');
        }
    }*/
}
