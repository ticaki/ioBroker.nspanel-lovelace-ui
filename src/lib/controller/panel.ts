import { PanelSend } from './panel-message';

import dayjs from 'dayjs';
import { Screensaver, ScreensaverConfigType } from '../pages/screensaver';
import * as NSPanel from '../types/types';
import * as pages from '../types/pages';
import { Controller } from './controller';
import { AdapterClassDefinition, BaseClass } from '../classes/library';
import { callbackMessageType } from '../classes/mqtt';
import { ReiveTopicAppendix, genericStateObjects } from '../const/definition';
import { Page, PageConfigAll, PageInterface } from '../classes/Page';
import { PageMedia } from '../pages/pageMedia';
import { IClientPublishOptions } from 'mqtt';
import { StatesControler } from './states-controller';
import { PageGrid } from '../pages/pageGrid';
import { Navigation, NavigationConfig } from '../classes/navigation';
import { PageThermo } from '../pages/pageThermo';
import { PagePower } from '../pages/pagePower';
import { PageItem } from '../pages/pageItem';

export interface panelConfigPartial extends Partial<panelConfigTop> {
    format?: Partial<Intl.DateTimeFormatOptions>;
    controller: Controller;
    topic: string;
    name: string;
    pages: PageConfigAll[];
    navigation: NavigationConfig['navigationConfig'];
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
    navigation: NavigationConfig['navigationConfig'];
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

type panelConfigTop = {
    CustomFormat: string;
    locale: Intl.LocalesArgument;
    timeout: number;
    dimLow: number;
    dimHigh: number;
};

export class Panel extends BaseClass {
    private minuteLoopTimeout: ioBroker.Timeout | undefined;
    private dateUpdateTimeout: ioBroker.Timeout | undefined;
    private pages: (Page | undefined)[] = [];
    private _activePage: Page | undefined = undefined;
    private screenSaver: Screensaver | undefined;
    private InitDone: boolean = false;
    dimMode: { low: number; high: number };
    readonly navigation: Navigation;
    readonly format: Partial<Intl.DateTimeFormatOptions>;
    readonly controller: Controller;
    readonly topic: string;
    readonly reivCallbacks: callbackMessageType[] = [];
    private _isOnline: boolean = false;
    readonly panelSend: PanelSend;
    readonly statesControler: StatesControler;
    readonly config: ScreensaverConfigType;
    readonly timeout: number;
    readonly CustomFormat: string;
    readonly sendToTasmota: (topic: string, payload: string, opt?: IClientPublishOptions) => void = () => {};
    public persistentPageItems: Record<string, PageItem> = {};
    friendlyName: string = '';

    constructor(adapter: AdapterClassDefinition, options: panelConfigPartial) {
        super(adapter, options.name);
        this.friendlyName = options.name;
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
        if (typeof this.panelSend.addMessageTasmota === 'function')
            this.sendToTasmota = this.panelSend.addMessageTasmota;
        this.statesControler = options.controller.statesControler;

        this.dimMode = { low: options.dimLow ?? 70, high: options.dimHigh ?? 90 };

        let scsFound = 0;
        for (let a = 0; a < options.pages.length; a++) {
            let pageConfig = options.pages[a];

            if (!pageConfig) continue;
            switch (pageConfig.card) {
                case 'cardChart': {
                    break;
                }
                case 'cardLChart': {
                    break;
                }
                case 'cardEntities': {
                    const pmconfig = {
                        card: pageConfig.card,
                        panel: this,
                        id: String(a),
                        name: 'PG',
                        alwaysOn: pageConfig.alwaysOn,
                        adapter: this.adapter,
                        panelSend: this.panelSend,
                        uniqueID: pageConfig.uniqueID,
                        dpInit: pageConfig.dpInit,
                    };
                    pageConfig = Page.getPage(pageConfig, this);
                    this.pages[a] = new PageGrid(pmconfig, pageConfig);
                    break;
                }
                case 'cardGrid2':
                case 'cardGrid': {
                    const pmconfig = {
                        card: pageConfig.card,
                        panel: this,
                        id: String(a),
                        name: 'PG',
                        alwaysOn: pageConfig.alwaysOn,
                        adapter: this.adapter,
                        panelSend: this.panelSend,
                        uniqueID: pageConfig.uniqueID,
                        dpInit: pageConfig.dpInit,
                    };
                    pageConfig = Page.getPage(pageConfig, this);
                    this.pages[a] = new PageGrid(pmconfig, pageConfig);
                    break;
                }

                case 'cardThermo': {
                    const pmconfig = {
                        card: pageConfig.card,
                        panel: this,
                        id: String(a),
                        name: 'PM',
                        alwaysOn: pageConfig.alwaysOn,
                        adapter: this.adapter,
                        panelSend: this.panelSend,
                        uniqueID: pageConfig.uniqueID,
                        dpInit: pageConfig.dpInit,
                    };
                    pageConfig = Page.getPage(pageConfig, this);
                    this.pages[a] = new PageThermo(pmconfig, pageConfig);
                    break;
                }
                case 'cardMedia': {
                    const pmconfig = {
                        card: pageConfig.card,
                        panel: this,
                        id: String(a),
                        name: 'PM',
                        alwaysOn: pageConfig.alwaysOn,
                        adapter: this.adapter,
                        panelSend: this.panelSend,
                        uniqueID: pageConfig.uniqueID,
                        dpInit: pageConfig.dpInit,
                    };
                    pageConfig = Page.getPage(pageConfig, this);
                    this.pages[a] = new PageMedia(pmconfig, pageConfig);
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
                    const pmconfig = {
                        card: pageConfig.card,
                        panel: this,
                        id: String(a),
                        name: 'PM',
                        alwaysOn: pageConfig.alwaysOn,
                        adapter: this.adapter,
                        panelSend: this.panelSend,
                        uniqueID: pageConfig.uniqueID,
                        dpInit: pageConfig.dpInit,
                    };
                    pageConfig = Page.getPage(pageConfig, this);
                    this.pages[a] = new PagePower(pmconfig, pageConfig);
                    break;
                }
                case 'screensaver':
                case 'screensaver2': {
                    if (scsFound++ > 0) continue;

                    //const opt = Object.assign(DefaultOptions, pageConfig);
                    const ssconfig: PageInterface = {
                        card: pageConfig.card,
                        panel: this,
                        id: String(a),
                        name: 'SrS',
                        adapter: this.adapter,
                        panelSend: this.panelSend,
                        uniqueID: '',
                        dpInit: '',
                    };
                    this.screenSaver = new Screensaver(ssconfig, pageConfig);
                    break;
                }
            }
        }
        if (scsFound === 0 || this.screenSaver === undefined) {
            this.log.error('no screensaver found! Stop!');
            this.adapter.controller!.delete();
            throw new Error('no screensaver found! Stop!');
            return;
        }
        const navConfig: NavigationConfig = {
            adapter: this.adapter,
            panel: this,
            navigationConfig: options.navigation,
        };
        this.navigation = new Navigation(navConfig);
    }

    init = async (): Promise<void> => {
        this.controller.mqttClient.subscript(this.topic + '/tele/#', this.onMessage);
        this.controller.mqttClient.subscript(this.topic + '/stat/#', this.onMessage);
        this.sendToTasmota(this.topic + '/cmnd/STATUS0', '');
    };
    start = async (): Promise<void> => {
        this.adapter.subscribeStates(`panel.${this.name}.cmd.*`);
        genericStateObjects.panel.panels._channel.common.name = this.friendlyName;
        await this.library.writedp(`panel.${this.name}`, undefined, genericStateObjects.panel.panels._channel);
        await this.library.writedp(
            `panel.${this.name}.cmd`,
            undefined === 'ON',
            genericStateObjects.panel.panels.cmd._channel,
        );
        await this.library.writedp(
            `panel.${this.name}.alarm`,
            undefined === 'ON',
            genericStateObjects.panel.panels.alarm._channel,
        );
        for (const page of this.pages) {
            if (page) this.log.debug('init page ' + page.uniqueID);
            if (page) await page.init();
        }
        this.statesControler.setInternalState(`${this.name}/cmd/power1`, false, true, {
            name: 'power1',
            type: 'boolean',
            write: false,
            read: true,
            role: 'value',
        });
        this.statesControler.setInternalState(`${this.name}/cmd/power2`, false, true, {
            name: 'power1',
            type: 'boolean',
            write: false,
            read: true,
            role: 'value',
        });
        this.sendToTasmota(this.topic + '/cmnd/POWER1', '');
        this.sendToTasmota(this.topic + '/cmnd/POWER2', '');
        this.navigation.init();
        this.sendToPanel('pageType~pageStartup', { retain: true });
    };

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
        let page = this._activePage;
        let sleep = false;
        if (typeof _page === 'boolean') {
            sleep = !_page;
        } else {
            page = _page;
            sleep = _notSleep ?? false;
        }
        if (!this._activePage) {
            if (page === undefined) return;
            await page.setVisibility(true);

            this._activePage = page;
        } else if (sleep !== this._activePage.sleep || page !== this._activePage) {
            if (page != this._activePage) {
                if (this._activePage) await this._activePage.setVisibility(false);
                if (page) {
                    if (!sleep) await page.setVisibility(true);
                    page.sleep = sleep;
                    this._activePage = page;
                }
            } else if (sleep !== this._activePage.sleep) {
                if (!sleep) await this._activePage.setVisibility(true, true);
                this._activePage.sleep = sleep;
            }
        }
    }
    getActivePage(): Page {
        if (!this._activePage) throw new Error(`No active page here, check code!`);
        return this._activePage;
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

    registerOnMessage(fn: callbackMessageType): void {
        if (this.reivCallbacks.indexOf(fn) === -1) {
            this.reivCallbacks.push(fn);
        }
    }
    onMessage: callbackMessageType = async (topic: string, message: string) => {
        for (const fn of this.reivCallbacks) {
            if (fn) fn(topic, message);
        }
        if (topic.endsWith(ReiveTopicAppendix)) {
            //this.log.debug(`Receive message ${topic} with ${message}`);
            const event: NSPanel.IncomingEvent | null = this.convertToEvent(message);
            if (event) {
                this.HandleIncomingMessage(event);
            }
        } else {
            const command = (topic.match(/[0-9a-zA-Z]+?\/[0-9a-zA-Z]+$/g) ||
                [])[0] as NSPanel.TasmotaIncomingTopics | null;
            if (command) {
                //this.log.debug(`Receive other message ${topic} with ${message}`);
                switch (command) {
                    case 'stat/POWER2': {
                        this.library.writedp(
                            `panel.${this.name}.cmd.power2`,
                            message === 'ON',
                            genericStateObjects.panel.panels.cmd.power2,
                        );
                        this.statesControler.setInternalState(`${this.name}/cmd/power2`, message === 'ON', true);
                        break;
                    }
                    case 'stat/POWER1': {
                        this.library.writedp(
                            `panel.${this.name}.cmd.power1`,
                            message === 'ON',
                            genericStateObjects.panel.panels.cmd.power1,
                        );
                        this.statesControler.setInternalState(`${this.name}/cmd/power1`, message === 'ON', true);
                        break;
                    }
                    case 'stat/STATUS0': {
                        const data = JSON.parse(message) as NSPanel.STATUS0;
                        this.name = this.library.cleandp(data.StatusNET.Mac, false, true);
                        if (!this.InitDone) {
                            this.sendToTasmota(
                                this.topic + '/cmnd/Rule3',
                                'ON CustomSend DO RuleTimer1 120 ENDON ON Rules#Timer=1 DO CustomSend pageType~pageStartup ENDON',
                            );
                            this.sendToTasmota(this.topic + '/cmnd/Rule3', 'ON');
                            this.InitDone = true;
                            await this.start();
                        }
                        this.library.writedp(
                            `panel.${this.name}.info`,
                            undefined,
                            genericStateObjects.panel.panels.info._channel,
                        );
                        this.library.writedp(
                            `panel.${this.name}.info.status`,
                            message,
                            genericStateObjects.panel.panels.info.status,
                        );
                    }
                }
            }
        }
    };

    async onStateChange(id: string, state: ioBroker.State): Promise<void> {
        if (state.ack) return;
        if (id.split('.')[1] === this.name) {
            const cmd = id.replace(`panel.${this.name}.cmd.`, '');
            switch (cmd) {
                case 'power1': {
                    this.sendToTasmota(this.topic + '/cmnd/POWER1', state.val ? 'ON' : 'OFF');
                    break;
                }
                case 'power2': {
                    this.sendToTasmota(this.topic + '/cmnd/POWER2', state.val ? 'ON' : 'OFF');
                    break;
                }
            }
        }
    }

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

        this.pages = this.pages.filter((a) => a && !a.unload);

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
        this.dateUpdateTimeout = this.adapter.setTimeout(this.dateUpdateLoop, diff);
    };

    async delete(): Promise<void> {
        await super.delete();
        this.isOnline = false;
        this.persistentPageItems = {};
        if (this.minuteLoopTimeout) this.adapter.clearTimeout(this.minuteLoopTimeout);
        if (this.dateUpdateTimeout) this.adapter.clearTimeout(this.dateUpdateTimeout);
    }

    getPagebyUniqueID(uniqueID: string): Page | null {
        if (!uniqueID) return null;
        const index = this.pages.findIndex((a) => a && a.uniqueID && a.uniqueID === uniqueID);
        return this.pages[index] ?? null;
    }
    async HandleIncomingMessage(event: NSPanel.IncomingEvent): Promise<void> {
        this.log.debug('Receive message:' + JSON.stringify(event));
        const index = this.pages.findIndex((a) => {
            if (a && a.card !== 'screensaver' && a.card !== 'screensaver2') return true;
            return false;
        });
        if (index === -1 || (this.isOnline === false && event.method !== 'startup')) return;
        switch (event.method) {
            case 'startup': {
                this.isOnline = true;
                if (this.screenSaver) await this.screenSaver.init();
                else return;
                this.restartLoops();

                this.sendToPanel(`dimmode~${this.dimMode.low}~${this.dimMode.high}~6371`);

                this.navigation.resetPosition();
                const page = this.navigation.getCurrentPage();
                const test = false;
                if (test) {
                    this.sendToPanel('pageType~cardGrid');
                    this.sendToPanel(
                        'entityUpd~Menü~button~bPrev~~65535~~~button~bNext~~65535~~~button~navigate.SensorGrid~21.1~26095~Obergeschoss~PRESS~button~navigate.ObergeschossWindow~~64332~Obergeschoss~Obergeschoss~button~navigate.ogLightsGrid~~65363~Obergeschoss ACTUAL~PRESS~button~navigate.Alexa~~65222~test~PRESS',
                    );
                } else {
                    await this.setActivePage(page);
                }
                // sendPage
                break;
            }
            case 'sleepReached': {
                await this.setActivePage(this.screenSaver);
                this.navigation.resetPosition();
                break;
            }
            case 'pageOpenDetail': {
                await this.setActivePage(false);
                this.getActivePage().onPopupRequest(
                    event.id,
                    event.popup as NSPanel.PopupType,
                    event.action,
                    event.opt,
                    event,
                );
                break;
            }
            case 'buttonPress2': {
                if (event.id == 'screensaver') {
                    await this.setActivePage(this.navigation.getCurrentPage());
                } else if (event.action === 'bExit') {
                    await this.setActivePage(true);
                } else {
                    if (
                        event.action === 'button' &&
                        ['bNext', 'bPrev', 'bUp', 'bHome', 'bSubNext', 'bSubPrev'].indexOf(event.id) != -1
                    ) {
                        if (['bPrev', 'bUp', 'bSubPrev'].indexOf(event.id) != -1) this.navigation.goLeft();
                        else if (['bNext', 'bHome', 'bSubNext'].indexOf(event.id) != -1) this.navigation.goRight();
                        break;
                    }
                    this.getActivePage().onPopupRequest(
                        event.id,
                        event.popup as NSPanel.PopupType,
                        event.action,
                        event.opt,
                        event,
                    );
                    await this.getActivePage().onButtonEvent(event);
                }
                break;
            }
            case 'renderCurrentPage': {
                // Event only for HA at this Moment
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
    private convertToEvent(msg: string): NSPanel.IncomingEvent | null {
        try {
            msg = (JSON.parse(msg) || {}).CustomRecv;
        } catch (e) {
            this.log.warn('Receive a broken msg from mqtt: ' + msg);
        }
        if (msg === undefined) return null;
        const temp = msg.split(',');
        if (!NSPanel.isEventType(temp[0])) return null;
        if (!NSPanel.isEventMethod(temp[1])) return null;
        let popup: undefined | string = undefined;
        if (temp[1] === 'pageOpenDetail') popup = temp.splice(2, 1)[0];
        const arr = String(temp[2]).split('?');
        if (arr[3])
            return {
                type: temp[0],
                method: temp[1],
                target: parseInt(arr[3]),
                page: parseInt(arr[1]),
                cmd: parseInt(arr[0]),
                popup: popup,
                id: arr[2],
                action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
                opt: temp[4] ?? '',
            };
        if (arr[2])
            return {
                type: temp[0],
                method: temp[1],
                page: parseInt(arr[0]),
                cmd: parseInt(arr[1]),
                popup: popup,
                id: arr[2],
                action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
                opt: temp[4] ?? '',
            };
        else if (arr[1])
            return {
                type: temp[0],
                method: temp[1],
                page: parseInt(arr[0]),
                popup: popup,
                id: arr[1],
                action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
                opt: temp[4] ?? '',
            };
        else
            return {
                type: temp[0],
                method: temp[1],
                popup: popup,
                id: arr[0],
                action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
                opt: temp[4] ?? '',
            };
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
