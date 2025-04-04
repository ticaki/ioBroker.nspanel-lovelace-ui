import { PanelSend } from './panel-message';

import { Screensaver, type ScreensaverConfigType } from '../pages/screensaver';
import * as Types from '../types/types';
import * as pages from '../types/pages';
import type { Controller } from './controller';
import { BaseClass, type AdapterClassDefinition } from '../classes/library';
import type { callbackMessageType } from '../classes/mqtt';
import { InternalStates, ReiveTopicAppendix, genericStateObjects } from '../const/definition';
import { type Page, type PageConfigAll } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { PageMedia } from '../pages/pageMedia';
import type { IClientPublishOptions } from 'mqtt';
import type { StatesControler } from './states-controller';
import { PageGrid } from '../pages/pageGrid';
import { Navigation, type NavigationConfig } from '../classes/navigation';
import { PageThermo } from '../pages/pageThermo';
import { PagePower } from '../pages/pagePower';
import type { PageItem } from '../pages/pageItem';
import { PageEntities } from '../pages/pageEntities';
import { PageNotify } from '../pages/pageNotification';
import { systemNavigation, systemPages } from '../templates/system-templates';
import { PageAlarm } from '../pages/pageAlarm';
import { PageChart } from '../pages/pageChart';
import { PageLChart } from '../pages/pageLChart';
import { PageQR } from '../pages/pageQR';
import { Dataitem } from '../classes/data-item';
import { Color } from '../const/Color';
import { PageSchedule } from '../pages/pageSchedule';
import { cardTemplates } from '../templates/card';
import { deepAssign, getRegExp } from '../const/tools';

export interface panelConfigPartial extends Partial<panelConfigTop> {
    format?: Partial<Intl.DateTimeFormatOptions>;
    controller: Controller;
    topic: string;
    name: string;
    buttons: {
        left: Types.ConfigButtonFunction;
        right: Types.ConfigButtonFunction;
    } | null;
    friendlyName?: string;
    pages: PageConfigAll[];
    navigation: NavigationConfig['navigationConfig'];
    config: ScreensaverConfigType;
    updated: boolean;
}

const DefaultOptions = {
    format: {
        weekday: 'short',
        month: 'short',
        year: 'numeric',
        day: 'numeric',
    },
    CustomFormat: '',
    locale: 'de-DE',
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
    private loopTimeout: ioBroker.Timeout | undefined;
    private pages: (Page | undefined)[] = [];
    private _activePage: Page | undefined = undefined;
    private data: Record<string, any> = {};
    public screenSaver: Screensaver | undefined;
    private InitProcess: '' | 'awaiting' | 'done' = '';
    private _isOnline: boolean = false;
    public lastCard: string = '';
    public notifyIndex: number = -1;
    readonly buttons: panelConfigPartial['buttons'];
    readonly navigation: Navigation;
    readonly format: Partial<Intl.DateTimeFormatOptions>;
    readonly controller: Controller;
    readonly topic: string;
    readonly reivCallbacks: callbackMessageType[] = [];
    readonly panelSend: PanelSend;
    readonly statesControler: StatesControler;
    readonly config: ScreensaverConfigType;
    readonly CustomFormat: string;
    readonly sendToTasmota: (topic: string, payload: string, opt?: IClientPublishOptions) => void = () => {};

    timeout: number;
    dimMode: {
        low: number;
        high: number;
        delay: number;
        dayMode: boolean;
        lowNight: number;
        highNight: number;
        startNight: number;
        endNight: number;
        dimSchedule: boolean;
    };
    screenSaverDoubleClick: boolean = true;
    detach: { left: boolean; right: boolean } = { left: false, right: false };
    public persistentPageItems: Record<string, PageItem> = {};

    info: Types.PanelInfo = {
        isOnline: false,
        nspanel: {
            displayVersion: '0.0.0',
            model: '',
            bigIconLeft: false,
            bigIconRight: false,

            currentPage: '',
        },
        tasmota: {
            firmwareversion: '',
            onlineVersion: '',
            net: {
                Hostname: '',
                IPAddress: '',
                Gateway: '',
                Subnetmask: '',
                DNSServer1: '',
                DNSServer2: '',
                Mac: '',
                IP6Global: '',
                IP6Local: '',
                Ethernet: {
                    Hostname: '',
                    IPAddress: '',
                    Gateway: '',
                    Subnetmask: '',
                    DNSServer1: '',
                    DNSServer2: '',
                    Mac: '',
                    IP6Global: '',
                    IP6Local: '',
                },
                Webserver: 0,
                HTTP_API: 0,
                WifiConfig: 0,
                WifiPower: 0,
            },
            uptime: '',
            sts: {
                Time: '',
                Uptime: '',
                UptimeSec: 0,
                Heap: 0,
                SleepMode: '',
                Sleep: 0,
                LoadAvg: 0,
                MqttCount: 0,
                Berry: {
                    HeapUsed: 0,
                    Objects: 0,
                },
                POWER1: '',
                POWER2: '',
                Wifi: {
                    AP: 0,
                    SSId: '',
                    BSSId: '',
                    Channel: 0,
                    Mode: '',
                    RSSI: 0,
                    Signal: 0,
                    LinkCount: 0,
                    Downtime: '',
                },
            },
        },
    };
    friendlyName: string = '';
    configName: string = '';

    constructor(adapter: AdapterClassDefinition, options: panelConfigPartial) {
        super(adapter, options.name);
        this.friendlyName = options.friendlyName ?? options.name;
        this.configName = options.name;
        this.panelSend = new PanelSend(adapter, {
            name: `${options.name}-SendClass`,
            mqttClient: options.controller.mqttClient,
            topic: options.topic,
        });
        this.timeout = options.timeout || 15;
        this.buttons = options.buttons;
        this.CustomFormat = options.CustomFormat ?? '';
        this.config = options.config;
        this.format = Object.assign(DefaultOptions.format, options.format);
        this.controller = options.controller;
        this.topic = options.topic;
        if (typeof this.panelSend.addMessage === 'function') {
            this.sendToPanelClass = this.panelSend.addMessage;
        }
        if (typeof this.panelSend.addMessageTasmota === 'function') {
            this.sendToTasmota = this.panelSend.addMessageTasmota;
        }

        this.statesControler = options.controller.statesControler;

        this.dimMode = {
            low: options.dimLow ?? 70,
            high: options.dimHigh ?? 90,
            delay: 5,
            dayMode: true,
            lowNight: 0,
            highNight: 50,
            startNight: 22,
            endNight: 6,
            dimSchedule: false,
        };

        options.pages = options.pages.concat(systemPages);
        options.navigation = (options.navigation || []).concat(systemNavigation);

        let scsFound = 0;
        for (let a = 0; a < options.pages.length; a++) {
            let pageConfig = options.pages[a] ? Panel.getPage(options.pages[a], this) : options.pages[a];

            if (!pageConfig || !pageConfig.config) {
                continue;
            }
            const pmconfig = {
                card: pageConfig.config.card,
                panel: this,
                id: String(a),
                name: `${pageConfig.uniqueID}`,
                alwaysOn: pageConfig.alwaysOn,
                adapter: this.adapter,
                panelSend: this.panelSend,
                dpInit: pageConfig.dpInit,
            };
            switch (pageConfig.config.card) {
                case 'cardChart': {
                    pageConfig = Panel.getPage(pageConfig, this);
                    this.pages[a] = new PageChart(pmconfig, pageConfig);
                    break;
                }
                case 'cardLChart': {
                    pageConfig = Panel.getPage(pageConfig, this);
                    this.pages[a] = new PageLChart(pmconfig, pageConfig);
                    break;
                }
                case 'cardEntities': {
                    pageConfig = Panel.getPage(pageConfig, this);
                    this.pages[a] = new PageEntities(pmconfig, pageConfig);
                    break;
                }
                case 'cardSchedule': {
                    pageConfig = Panel.getPage(pageConfig, this);
                    this.pages[a] = new PageSchedule(pmconfig, pageConfig);
                    break;
                }
                case 'cardGrid3':
                case 'cardGrid2':
                case 'cardGrid': {
                    pageConfig = Panel.getPage(pageConfig, this);
                    this.pages[a] = new PageGrid(pmconfig, pageConfig);
                    break;
                }

                case 'cardThermo': {
                    pageConfig = Panel.getPage(pageConfig, this);
                    this.pages[a] = new PageThermo(pmconfig, pageConfig);
                    break;
                }
                case 'cardMedia': {
                    pageConfig = Panel.getPage(pageConfig, this);
                    this.pages[a] = new PageMedia(pmconfig, pageConfig);
                    break;
                }

                case 'cardQR': {
                    pageConfig = Panel.getPage(pageConfig, this);
                    this.pages[a] = new PageQR(pmconfig, pageConfig);
                    break;
                }
                case 'cardAlarm': {
                    pageConfig = Panel.getPage(pageConfig, this);
                    this.pages[a] = new PageAlarm(pmconfig, pageConfig);
                    break;
                }
                case 'cardPower': {
                    pageConfig = Panel.getPage(pageConfig, this);
                    this.pages[a] = new PagePower(pmconfig, pageConfig);
                    break;
                }
                case 'popupNotify2':
                case 'popupNotify': {
                    pageConfig = Panel.getPage(pageConfig, this);
                    this.pages[a] = new PageNotify(pmconfig, pageConfig);
                    break;
                }
                case 'screensaver':
                case 'screensaver2':
                case 'screensaver3': {
                    scsFound++;

                    //const opt = Object.assign(DefaultOptions, pageConfig);
                    const ssconfig: PageInterface = {
                        card: pageConfig.config.card,
                        panel: this,
                        id: String(a),
                        name: `${pageConfig.uniqueID}`,
                        adapter: this.adapter,
                        panelSend: this.panelSend,
                        dpInit: '',
                    };
                    this.screenSaver = new Screensaver(ssconfig, pageConfig);
                    this.pages[a] = this.screenSaver;
                    break;
                }
                default: {
                    this.log.error(`Page config is missing card property for page ${pageConfig.uniqueID}`);
                }
            }
        }
        if (scsFound === 0) {
            this.log.error('no screensaver found! Stop!');
            void this.adapter.controller!.delete();
            throw new Error('no screensaver found! Stop!');
        }
        const navConfig: NavigationConfig = {
            adapter: this.adapter,
            panel: this,
            navigationConfig: options.navigation,
        };
        this.navigation = new Navigation(navConfig);
    }

    init = async (): Promise<void> => {
        this.controller.mqttClient.subscript(`${this.topic}/tele/#`, this.onMessage);
        this.controller.mqttClient.subscript(`${this.topic}/stat/#`, this.onMessage);
        this.isOnline = false;

        const channelObj = this.library.cloneObject(genericStateObjects.panel.panels._channel);

        channelObj.common.name = this.friendlyName;
        channelObj.native = {
            topic: this.topic,
            tasmotaName: this.friendlyName,
            name: this.name,
            configName: this.configName,
        };
        await this.library.writedp(`panels.${this.name}`, undefined, channelObj);
        await this.library.writedp(`panels.${this.name}.cmd`, undefined, genericStateObjects.panel.panels.cmd._channel);
        await this.library.writedp(
            `panels.${this.name}.cmd.dim`,
            undefined,
            genericStateObjects.panel.panels.cmd.dim._channel,
        );
        await this.library.writedp(
            `panels.${this.name}.alarm`,
            undefined,
            genericStateObjects.panel.panels.alarm._channel,
        );
        await this.library.writedp(
            `panels.${this.name}.buttons`,
            undefined,
            genericStateObjects.panel.panels.buttons._channel,
        );
        await this.library.writedp(
            `panels.${this.name}.buttons.left`,
            true,
            genericStateObjects.panel.panels.buttons.left,
        );
        await this.library.writedp(
            `panels.${this.name}.buttons.right`,
            true,
            genericStateObjects.panel.panels.buttons.right,
        );
        let state = this.library.readdb(`panels.${this.name}.cmd.dim.standby`);
        if (state && state.val != null) {
            this.dimMode.low = state.val as number;
        }
        state = this.library.readdb(`panels.${this.name}.cmd.dim.active`);
        if (state && state.val != null) {
            this.dimMode.high = state.val as number;
        }
        state = this.library.readdb(`panels.${this.name}.cmd.dim.dayMode`);
        if (state && state.val != null) {
            this.dimMode.dayMode = !!state.val;
        }
        state = this.library.readdb(`panels.${this.name}.cmd.dim.schedule`);
        if (state && state.val != null) {
            this.dimMode.dimSchedule = !!state.val;
        }
        state = this.library.readdb(`panels.${this.name}.cmd.dim.nightActive`);
        if (state && state.val != null) {
            this.dimMode.highNight = state.val as number;
        }
        state = this.library.readdb(`panels.${this.name}.cmd.dim.nightStandby`);
        if (state && state.val != null) {
            this.dimMode.lowNight = state.val as number;
        }
        state = this.library.readdb(`panels.${this.name}.cmd.dim.nightHourStart`);
        if (state && state.val != null && typeof state.val === 'number') {
            this.dimMode.startNight = state.val;
        }
        state = this.library.readdb(`panels.${this.name}.cmd.dim.nightHourEnd`);
        if (state && state.val != null && typeof state.val === 'number') {
            this.dimMode.endNight = state.val;
        }
        state = this.library.readdb(`panels.${this.name}.cmd.dim.delay`);
        if (state && state.val != null) {
            this.dimMode.delay = state.val as number;
        }
        await this.library.writedp(
            `panels.${this.name}.cmd.dim.standby`,
            this.dimMode.low,
            genericStateObjects.panel.panels.cmd.dim.standby,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.dim.active`,
            this.dimMode.high,
            genericStateObjects.panel.panels.cmd.dim.active,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.dim.dayMode`,
            this.dimMode.dayMode,
            genericStateObjects.panel.panels.cmd.dim.dayMode,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.dim.schedule`,
            this.dimMode.dimSchedule,
            genericStateObjects.panel.panels.cmd.dim.schedule,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.dim.nightActive`,
            this.dimMode.highNight,
            genericStateObjects.panel.panels.cmd.dim.nightActive,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.dim.nightStandby`,
            this.dimMode.lowNight,
            genericStateObjects.panel.panels.cmd.dim.nightStandby,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.dim.nightHourStart`,
            String(this.dimMode.startNight),
            genericStateObjects.panel.panels.cmd.dim.nightHourStart,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.dim.nightHourEnd`,
            String(this.dimMode.endNight),
            genericStateObjects.panel.panels.cmd.dim.nightHourEnd,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.dim.delay`,
            this.dimMode.delay,
            genericStateObjects.panel.panels.cmd.dim.delay,
        );
        state = this.library.readdb(`panels.${this.name}.cmd.screenSaverDoubleClick`);
        if (state && state.val != null) {
            this.screenSaverDoubleClick = !!state.val;
        }
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaverDoubleClick`,
            this.screenSaverDoubleClick,
            genericStateObjects.panel.panels.cmd.screenSaverDoubleClick,
        );

        if (state && !state.val) {
            await this.library.writedp(
                `panels.${this.name}.buttons.screensaverGesture`,
                0,
                genericStateObjects.panel.panels.buttons.screensaverGesture,
            );
        } else {
            await this.library.writedp(
                `panels.${this.name}.buttons.screensaverGesture`,
                undefined,
                genericStateObjects.panel.panels.buttons.screensaverGesture,
            );
        }

        state = this.library.readdb(`panels.${this.name}.cmd.detachRight`);
        if (state && state.val != null) {
            this.detach.right = !!state.val;
        }
        state = this.library.readdb(`panels.${this.name}.cmd.detachLeft`);
        if (state && state.val != null) {
            this.detach.left = !!state.val;
        }
        await this.library.writedp(
            `panels.${this.name}.cmd.detachRight`,
            this.detach.right,
            genericStateObjects.panel.panels.cmd.detachRight,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.detachLeft`,
            this.detach.left,
            genericStateObjects.panel.panels.cmd.detachLeft,
        );
        state = this.library.readdb(`panels.${this.name}.cmd.screenSaverTimeout`);
        if (state) {
            this.timeout = parseInt(String(state.val));
        }
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaverTimeout`,
            this.timeout,
            genericStateObjects.panel.panels.cmd.screenSaverTimeout,
        );

        this.adapter.subscribeStates(`panels.${this.name}.cmd.*`);
        this.adapter.subscribeStates(`panels.${this.name}.alarm.*`);
        this.log.debug(`Panel ${this.name} is initialised!`);
        this.restartLoops();
    };

    start = async (): Promise<void> => {
        for (const id in InternalStates.panel) {
            const obj = InternalStates.panel[id as keyof typeof InternalStates.panel];
            await this.statesControler.setInternalState(
                `${this.name}/${id}`,
                obj.val,
                obj.ack,
                obj.common,
                obj.noTrigger ? undefined : this.onInternalCommand,
            );
        }

        for (const page of this.pages) {
            if (page && page.name) {
                this.log.debug(
                    `Initialisation of page ${page.name} - card: ${page.card} - pageItems: ${(page.pageItemConfig || []).length}`,
                );
                await page.init();
            } else {
                this.log.error('Page failed or has no name!');
            }
        }

        this.navigation.init();

        {
            const currentPage = this.library.readdb(`panels.${this.name}.cmd.mainNavigationPoint`);
            if (currentPage && currentPage.val) {
                this.navigation.setMainPageByName(String(currentPage.val));
            }

            genericStateObjects.panel.panels.cmd.mainNavigationPoint.common.states =
                this.navigation.buildCommonStates();
            const page = this.navigation.getCurrentMainPoint();
            await this.library.writedp(
                `panels.${this.name}.cmd.mainNavigationPoint`,
                page,
                genericStateObjects.panel.panels.cmd.mainNavigationPoint,
            );
        }

        const currentScreensaver = this.library.readdb(`panels.${this.name}.cmd.screenSaverLayout`);
        const scs: Page[] = this.pages.filter(
            a => a && (a.card === 'screensaver' || a.card === 'screensaver2' || a.card === 'screensaver3'),
        ) as Page[];
        //const s = scs.filter(a => currentScreensaver && a.name === currentScreensaver.val);
        if (currentScreensaver && currentScreensaver.val != null) {
            if (scs && scs[0]) {
                this.screenSaver = scs[0] as Screensaver;
                if (pages.isScreenSaverModeAsNumber(currentScreensaver.val)) {
                    this.screenSaver.overwriteModel(currentScreensaver.val, true);
                }
            }
        }

        /*const states: Record<Types.ScreensaverModeType, string> = {
            standard: 'Standard',
            advanced: 'Advanced',
            alternate: 'Alternate',
            easyview: 'Easyview',
        };

        genericStateObjects.panel.panels.cmd.screenSaverLayout.common.states = states;*/
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaverLayout`,
            this.screenSaver && this.screenSaver.mode ? Screensaver.mapModeToNumber(this.screenSaver.mode) : 0,
            genericStateObjects.panel.panels.cmd.screenSaverLayout,
        );
        let state = this.library.readdb(`panels.${this.name}.cmd.screenSaverRotationTime`);
        let temp: any = 0;
        if (state && typeof state.val === 'number') {
            temp = state.val === 0 ? state.val : state.val < 3 ? 3 : state.val > 3600 ? 3600 : state.val;
            if (this.screenSaver) {
                this.screenSaver.rotationTime = temp * 1000;
            }
        }
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaverRotationTime`,
            temp,
            genericStateObjects.panel.panels.cmd.screenSaverRotationTime,
        );

        if (this.buttons) {
            for (const b in this.buttons) {
                const k = b as keyof typeof this.buttons;
                const button = this.buttons[k];
                if (button && this.screenSaver) {
                    switch (button.mode) {
                        case 'page': {
                            break;
                        }
                        case 'switch':
                        case 'button': {
                            if (typeof button.state === 'string') {
                                button.state = new Dataitem(
                                    this.adapter,
                                    {
                                        type: 'state',
                                        dp: button.state,
                                    },
                                    this.screenSaver,
                                    this.statesControler,
                                );
                                if (!(await button.state.isValidAndInit())) {
                                    this.buttons[k] = null;
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
        state = this.library.readdb(`panels.${this.name}.info.nspanel.bigIconLeft`);
        this.info.nspanel.bigIconLeft = state ? !!state.val : false;
        state = this.library.readdb(`panels.${this.name}.info.nspanel.bigIconRight`);
        this.info.nspanel.bigIconRight = state ? !!state.val : false;

        this.sendToTasmota(`${this.topic}/cmnd/POWER1`, '');
        this.sendToTasmota(`${this.topic}/cmnd/POWER2`, '');
        this.sendRules();
        //this.restartLoops();
    };

    private sendToPanelClass: (payload: string, opt?: IClientPublishOptions) => void = () => {};
    protected sendToPanel: (payload: string, opt?: IClientPublishOptions) => void = (
        payload: string,
        opt?: IClientPublishOptions,
    ) => {
        this.sendToPanelClass(payload, opt);
    };
    async setActivePage(_page?: Page | boolean, _notSleep?: boolean, _force?: boolean): Promise<void> {
        if (_page === undefined) {
            return;
        }
        let page = this._activePage;
        let sleep = false;
        let force = _force ?? false;
        if (typeof _page === 'boolean') {
            sleep = !_page;
            force = !!sleep;
        } else {
            page = _page;
            sleep = _notSleep ?? false;
        }
        if (!this._activePage) {
            if (page === undefined) {
                return;
            }
            page.setLastPage(this._activePage ?? undefined);
            await page.setVisibility(true);

            this._activePage = page;
        } else if (sleep !== this._activePage.sleep || page !== this._activePage || force) {
            if (page != this._activePage || force) {
                if (this._activePage) {
                    await this._activePage.setVisibility(false);
                }
                if (page) {
                    page.setLastPage(this._activePage ?? undefined);
                    if (!sleep) {
                        await page.setVisibility(true);
                    }
                    page.sleep = sleep;
                    this._activePage = page;
                }
            } else if (sleep !== this._activePage.sleep) {
                page.setLastPage(this._activePage ?? undefined);
                if (!sleep) {
                    await this._activePage.setVisibility(true, true);
                }
                this._activePage.sleep = sleep;
            }
        }
    }
    getActivePage(): Page {
        if (!this._activePage) {
            throw new Error(`No active page here, check code!`);
        }
        return this._activePage;
    }
    get isOnline(): boolean {
        return this._isOnline;
    }
    set isOnline(s: boolean) {
        if (this.unload) {
            return;
        }
        this.info.isOnline = s;
        if (s !== this._isOnline) {
            void this.library.writedp(
                `panels.${this.name}.info.isOnline`,
                s,
                genericStateObjects.panel.panels.info.isOnline,
            );
            if (s) {
                this.log.info('is online!');
            } else {
                this.log.warn('is offline!');
            }
            //this.restartLoops();
        }
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
            if (fn) {
                fn(topic, message);
            }
        }
        if (topic.endsWith(ReiveTopicAppendix)) {
            //this.log.debug(`Receive message ${topic} with ${message}`);
            const event: Types.IncomingEvent | null = this.convertToEvent(message);
            if (event) {
                await this.HandleIncomingMessage(event);
            } else if (message) {
                let msg: any = null;
                try {
                    msg = JSON.parse(message);
                } catch {
                    this.log.warn(`Receive a broken msg from mqtt: ${msg}`);
                }
                if (!msg) {
                    return;
                }
                if ('Flashing' in msg) {
                    this.isOnline = false;
                    this.log.info(`Flashing: ${msg.Flashing.complete}%`);
                    return;
                }
            }
        } else {
            const command = (topic.match(/[0-9a-zA-Z]+?\/[0-9a-zA-Z]+$/g) ||
                [])[0] as Types.TasmotaIncomingTopics | null;
            if (command) {
                //this.log.debug(`Receive other message ${topic} with ${message}`);
                switch (command) {
                    case 'stat/POWER2': {
                        await this.library.writedp(
                            `panels.${this.name}.cmd.power2`,
                            message === 'ON',
                            genericStateObjects.panel.panels.cmd.power2,
                        );
                        await this.statesControler.setInternalState(`${this.name}/cmd/power2`, message === 'ON', true);
                        break;
                    }
                    case 'stat/POWER1': {
                        await this.library.writedp(
                            `panels.${this.name}.cmd.power1`,
                            message === 'ON',
                            genericStateObjects.panel.panels.cmd.power1,
                        );
                        await this.statesControler.setInternalState(`${this.name}/cmd/power1`, message === 'ON', true);
                        break;
                    }
                    case 'stat/STATUS0': {
                        if (this.InitProcess === 'awaiting') {
                            this.log.warn('Receive status0 while awaiting init process!');
                            return;
                        }
                        const data = JSON.parse(message) as Types.STATUS0;
                        if (this.name !== this.library.cleandp(data.StatusNET.Mac, false, true)) {
                            this.log.error(`Receive wrong mac address ${data.StatusNET.Mac}! Update ur config!`);
                        }

                        const i = this.InitProcess === 'done';
                        if (this.InitProcess === '') {
                            const o = await this.adapter.getForeignObjectAsync(
                                `system.adapter.${this.adapter.namespace}`,
                            );
                            if (o && o.native) {
                                if (this.name == this.library.cleandp(data.StatusNET.Mac, false, true)) {
                                    const index = o.native.panels.findIndex((a: any) => a.id === this.name);
                                    const ip = data.StatusNET.IPAddress;
                                    if (index !== -1 && o.native.panels[index].ip != ip) {
                                        o.native.panels[index].ip = ip;
                                        await this.adapter.setForeignObjectAsync(o._id, o);
                                    }
                                }
                            }
                            this.InitProcess = 'awaiting';
                            await this.start();
                            this.InitProcess = 'done';
                        }
                        await this.library.writedp(
                            `panels.${this.name}.info`,
                            undefined,
                            genericStateObjects.panel.panels.info._channel,
                        );
                        await this.library.writedp(
                            `panels.${this.name}.info.status`,
                            message,
                            genericStateObjects.panel.panels.info.status,
                        );
                        this.info.tasmota.net = data.StatusNET;
                        this.info.tasmota.firmwareversion = data.StatusFWR.Version;
                        this.info.tasmota.uptime = data.StatusSTS.Uptime;
                        this.info.tasmota.sts = data.StatusSTS;

                        if (!i) {
                            await this.library.writeFromJson(
                                `panels.${this.name}.info.tasmota`,
                                'panel.panels.info.tasmota',
                                genericStateObjects,
                                this.info.tasmota,
                            );
                        } else {
                            await this.writeInfo();
                        }
                    }
                }
            }
        }
    };

    sendRules(): void {
        this.sendToTasmota(
            `${this.topic}/cmnd/Rule3`,
            `ON CustomSend DO RuleTimer1 120 ENDON ON Rules#Timer=1 DO CustomSend pageType~pageStartup ENDON${
                this.detach.left
                    ? ` ON Button1#state do Publish ${this.topic}/tele/RESULT {"CustomRecv":"event,button1"} ENDON`
                    : ''
            }${
                this.detach.right
                    ? ` ON Button2#state do Publish ${this.topic}/tele/RESULT {"CustomRecv":"event,button2"} ENDON`
                    : ''
            }`,
        );
        this.sendToTasmota(`${this.topic}/cmnd/Rule3`, '1');
    }

    async onStateChange(id: string, state: Types.nsPanelState): Promise<void> {
        if (state.ack) {
            return;
        }
        if (id.split('.')[1] === this.name) {
            const cmd = id.replace(`panels.${this.name}.cmd.`, '');
            switch (cmd) {
                case 'power1': {
                    this.sendToTasmota(`${this.topic}/cmnd/POWER1`, state.val ? 'ON' : 'OFF');
                    break;
                }
                case 'power2': {
                    this.sendToTasmota(`${this.topic}/cmnd/POWER2`, state.val ? 'ON' : 'OFF');
                    break;
                }
                case 'mainNavigationPoint': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    this.navigation.setMainPageByName(state.val ? String(state.val) : 'main');
                    await this.library.writedp(
                        `panels.${this.name}.cmd.mainNavigationPoint`,
                        // eslint-disable-next-line @typescript-eslint/no-base-to-string
                        state.val ? String(state.val) : 'main',
                    );
                    break;
                }
                case 'goToNavigationPoint': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    await this.navigation.setTargetPageByName(state.val ? String(state.val) : 'main');
                    break;
                }
                case 'screenSaverTimeout': {
                    if (state && state.val != null && typeof state.val === 'number') {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/screenSaverTimeout`,

                            parseInt(String(state.val)),
                            false,
                        );
                    }
                    break;
                }
                case 'dim.standby': {
                    if (state && state.val != null && typeof state.val === 'number') {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/dimStandby`,

                            parseInt(String(state.val)),
                            false,
                        );
                    }
                    break;
                }
                case 'dim.active': {
                    if (state && state.val != null && typeof state.val === 'number') {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/dimActive`,

                            parseInt(String(state.val)),
                            false,
                        );
                    }
                    break;
                }
                case 'dim.dayMode': {
                    if (this.dimMode.dimSchedule) {
                        this.log.warn('Timer is active - User input overwritten!');
                    } else {
                        this.dimMode.dayMode = !!state.val;
                        this.sendDimmode();
                    }
                    await this.library.writedp(
                        `panels.${this.name}.cmd.dim.dayMode`,
                        this.dimMode.dayMode,
                        genericStateObjects.panel.panels.cmd.dim.dayMode,
                    );
                    break;
                }
                case 'dim.schedule': {
                    this.dimMode.dimSchedule = !!state.val;

                    if (this.dimMode.dimSchedule) {
                        this.sendDimmode();
                    }

                    await this.library.writedp(
                        `panels.${this.name}.cmd.dayMode`,
                        this.dimMode.dimSchedule,
                        genericStateObjects.panel.panels.cmd.dim.schedule,
                    );
                    break;
                }
                case 'dim.nightActive': {
                    if (state && state.val != null && typeof state.val === 'number') {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/dimNightActive`,

                            parseInt(String(state.val)),
                            false,
                        );
                    }
                    break;
                }
                case 'dim.nightStandby': {
                    if (state && state.val != null && typeof state.val === 'number') {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/dimNightStandby`,

                            parseInt(String(state.val)),
                            false,
                        );
                    }
                    break;
                }
                case 'dim.nightHourStart': {
                    if (state && state.val != null && typeof state.val === 'number') {
                        if (state.val <= 23 && state.val >= 0 && state.val % 1 === 0) {
                            await this.statesControler.setInternalState(
                                `${this.name}/cmd/dimNightHourStart`,

                                parseInt(String(state.val)),
                                false,
                            );
                        }
                    }
                    break;
                }
                case 'dim.nightHourEnd': {
                    if (state && state.val != null && typeof state.val === 'number') {
                        if (state.val <= 23 && state.val >= 0 && state.val % 1 === 0) {
                            await this.statesControler.setInternalState(
                                `${this.name}/cmd/dimNightHourEnd`,

                                parseInt(String(state.val)),
                                false,
                            );
                        }
                    }
                    break;
                }
                case 'dim.delay': {
                    if (state && state.val != null && typeof state.val === 'number') {
                        this.dimMode.delay = state.val;
                        this.sendDimmode();
                        await this.library.writedp(
                            `panels.${this.name}.cmd.dim.delay`,
                            this.dimMode.delay,
                            genericStateObjects.panel.panels.cmd.dim.delay,
                        );
                    }
                    break;
                }
                case 'screenSaverDoubleClick': {
                    if (state && state.val != null) {
                        this.screenSaverDoubleClick = !!state.val;
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/screenSaverDoubleClick`,
                            !!state.val,
                            false,
                        );
                    }
                    /* await this.library.writedp(
                        `panels.${this.name}.cmd.screenSaverDoubleClick`,
                        this.screenSaverDoubleClick,
                        genericStateObjects.panel.panels.cmd.screenSaverDoubleClick,
                    );
                    if (!this.screenSaverDoubleClick) {
                        await this.library.writedp(
                            `panels.${this.name}.buttons.screensaverGesture`,
                            0,
                            genericStateObjects.panel.panels.buttons.screensaverGesture,
                        );
                    } */
                    break;
                }
                case 'detachLeft': {
                    await this.statesControler.setInternalState(`${this.name}/cmd/detachLeft`, !!state.val, false);
                    break;
                }
                case 'detachRight': {
                    await this.statesControler.setInternalState(`${this.name}/cmd/detachRight`, !!state.val, false);
                    break;
                }
                case 'screenSaverLayout': {
                    if (typeof state.val === 'number' && pages.isScreenSaverModeAsNumber(state.val)) {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/screenSaverLayout`,
                            state.val,
                            false,
                        );
                    }
                    break;
                }
                case 'screenSaverRotationTime': {
                    if (state && state.val != null && typeof state.val === 'number') {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/screenSaverRotationTime`,

                            parseInt(String(state.val)),
                            false,
                        );
                    }
                    break;
                }
            }
        }
    }

    /**
     * timeout screensaver after sec
     *
     * @param sec seconds for timeout
     */
    sendScreeensaverTimeout(sec: number): void {
        this.log.debug(`Set screeensaver timeout to ${sec}s.`);
        this.sendToPanel(`timeout~${sec}`);
    }

    sendDimmode(): void {
        const hour = new Date().getHours();
        const oldDayMode = this.dimMode.dayMode;
        if (this.dimMode.dimSchedule) {
            if (this.dimMode.startNight > this.dimMode.endNight) {
                if (hour >= this.dimMode.startNight || hour < this.dimMode.endNight) {
                    this.dimMode.dayMode = false;
                } else {
                    this.dimMode.dayMode = true;
                }
            } else {
                if (hour >= this.dimMode.startNight && hour < this.dimMode.endNight) {
                    this.dimMode.dayMode = false;
                } else {
                    this.dimMode.dayMode = true;
                }
            }
        }
        let cmd = `${Color.rgb_dec565(Color.Black)}~${Color.rgb_dec565(Color.White)}`;
        if (this.dimMode.dayMode) {
            cmd = `dimmode~${this.dimMode.low}~${this.dimMode.high}~${cmd}`;
        } else {
            cmd = `dimmode~${this.dimMode.lowNight}~${this.dimMode.highNight}~${cmd}`;
        }
        if (this.dimMode.dayMode !== oldDayMode) {
            void this.library.writedp(
                `panels.${this.name}.cmd.dim.dayMode`,
                this.dimMode.dayMode,
                genericStateObjects.panel.panels.cmd.dim.dayMode,
            );
        }
        this.sendToPanel(cmd);
    }

    restartLoops(): void {
        if (this.loopTimeout) {
            this.adapter.clearTimeout(this.loopTimeout);
        }
        this.loop();
    }
    /**
     * Do panel work always at full minute
     *
     */
    loop = (): void => {
        this.sendToTasmota(`${this.topic}/cmnd/STATUS0`, '');
        this.pages = this.pages.filter(a => a && !a.unload);
        let t = 300000 + Math.random() * 30000 - 15000;
        if (!this.isOnline) {
            t = 15000;
            this.sendToPanel('pageType~pageStartup', { retain: true });
        }
        if (this.unload) {
            return;
        }
        this.loopTimeout = this.adapter.setTimeout(this.loop, t);
    };

    async delete(): Promise<void> {
        await super.delete();
        this.isOnline = false;
        if (this.loopTimeout) {
            this.adapter.clearTimeout(this.loopTimeout);
        }
        await this.library.writedp(
            `panels.${this.name}.info.isOnline`,
            false,
            genericStateObjects.panel.panels.info.isOnline,
        );
        await this.panelSend.delete();
        await this.navigation.delete();
        for (const a of this.pages) {
            if (a) {
                await a.delete();
            }
        }
        this.persistentPageItems = {};
    }

    getPagebyUniqueID(uniqueID: string): Page | null {
        if (!uniqueID) {
            return null;
        }
        const index = this.pages.findIndex(a => a && a.name && a.name === uniqueID);
        return this.pages[index] ?? null;
    }

    async writeInfo(): Promise<void> {
        await this.library.writeFromJson(
            `panels.${this.name}.info`,
            'panel.panels.info',
            genericStateObjects,
            this.info,
        );
    }
    /**
     *  Handle incoming messages from panel
     *
     * @param event incoming event....
     * @returns void
     */
    async HandleIncomingMessage(event: Types.IncomingEvent): Promise<void> {
        if (this.InitProcess !== 'done') {
            this.isOnline = false;
            return;
        }
        if (!event.method) {
            return;
        }
        if (this._activePage && this._activePage.card !== 'cardAlarm') {
            this.log.debug(`Receive message:${JSON.stringify(event)}`);
        }

        if (!this.screenSaver) {
            return;
        }
        if (this.isOnline === false && event.method !== 'startup') {
            void this.restartLoops();
            return;
        }

        switch (event.method) {
            case 'startup': {
                this.isOnline = true;
                this.info.nspanel.displayVersion = event.opt;
                this.info.nspanel.model = event.action;

                await this.writeInfo();
                this.sendScreeensaverTimeout(this.timeout);
                this.sendDimmode();
                this.navigation.resetPosition();
                await this.adapter.delay(100);
                const i = this.pages.findIndex(a => a && a.name === '///WelcomePopup');
                const popup = i !== -1 ? this.pages[i] : undefined;
                if (popup) {
                    await this.setActivePage(popup, false, true);
                }
                await this.adapter.delay(100);
                if (this.screenSaver) {
                    await this.screenSaver.createPageItems();
                    //this.controller && (await this.controller.statesControler.activateTrigger(this.screenSaver));
                    await this.screenSaver.HandleDate();
                    await this.screenSaver.HandleTime();
                }
                this.log.info('Panel startup finished!');
                break;
            }
            case 'sleepReached': {
                await this.setActivePage(this.screenSaver);
                this.navigation.resetPosition();
                this.pages.forEach(a => a && a.reset());
                break;
            }
            case 'pageOpenDetail': {
                await this.setActivePage(false);
                await this.getActivePage().onPopupRequest(
                    event.id,
                    event.popup as Types.PopupType,
                    event.action,
                    event.opt,
                    event,
                );
                break;
            }
            case 'buttonPress2': {
                if (event.id == 'screensaver') {
                    if (this.screenSaverDoubleClick && this.screenSaver.screensaverSwipe) {
                        switch (event.action) {
                            case 'bExit': {
                                await this.library.writedp(
                                    `panels.${this.name}.buttons.screensaverGesture`,
                                    2,
                                    genericStateObjects.panel.panels.buttons.screensaverGesture,
                                );
                                break;
                            }
                            case 'swipeUp': {
                                await this.library.writedp(
                                    `panels.${this.name}.buttons.screensaverGesture`,
                                    3,
                                    genericStateObjects.panel.panels.buttons.screensaverGesture,
                                );
                                break;
                            }
                            case 'swipeDown': {
                                await this.library.writedp(
                                    `panels.${this.name}.buttons.screensaverGesture`,
                                    4,
                                    genericStateObjects.panel.panels.buttons.screensaverGesture,
                                );
                                break;
                            }
                            case 'swipeLeft': {
                                await this.library.writedp(
                                    `panels.${this.name}.buttons.screensaverGesture`,
                                    5,
                                    genericStateObjects.panel.panels.buttons.screensaverGesture,
                                );
                                break;
                            }
                            case 'swipeRight': {
                                await this.library.writedp(
                                    `panels.${this.name}.buttons.screensaverGesture`,
                                    6,
                                    genericStateObjects.panel.panels.buttons.screensaverGesture,
                                );
                                break;
                            }
                        }
                    }
                    if ((this.screenSaverDoubleClick && parseInt(event.opt) > 1) || !this.screenSaverDoubleClick) {
                        this.navigation.resetPosition();
                        await this.navigation.setCurrentPage();
                        break;
                    }
                } else if (event.action === 'bExit' && event.id !== 'popupNotify') {
                    await this.setActivePage(true);
                } else {
                    if (
                        event.action === 'button' &&
                        ['bNext', 'bPrev', 'bUp', 'bHome', 'bSubNext', 'bSubPrev'].indexOf(event.id) != -1
                    ) {
                        if (['bPrev', 'bUp', 'bSubPrev'].indexOf(event.id) != -1) {
                            this.getActivePage().goLeft();
                        } else if (['bNext', 'bHome', 'bSubNext'].indexOf(event.id) != -1) {
                            this.getActivePage().goRight();
                        }
                        break;
                    }
                    await this.getActivePage().onPopupRequest(
                        event.id,
                        event.popup as Types.PopupType,
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
                await this.onDetachButtonEvent('left');
                break;
            }
            case 'button2': {
                await this.onDetachButtonEvent('right');
                break;
            }
            default: {
                this.log.warn('Missing method in HandleIncomingMessage()');
            }
        }
    }

    onDetachButtonEvent = async (button: 'left' | 'right'): Promise<void> => {
        const action: Types.ConfigButtonFunction = this.buttons
            ? button === 'left'
                ? this.buttons.left
                : this.buttons.right
            : null;
        await this.library.writedp(`panels.${this.name}.buttons.${button}`, false, null, true, true);
        if (action) {
            switch (action.mode) {
                case 'button': {
                    if (typeof action.state === 'string') {
                        this.log.error(`Button ${button} has no state!`);
                        return;
                    }
                    await action.state.setStateTrue();
                    break;
                }
                case 'page': {
                    if (typeof action.page === 'string') {
                        await this.navigation.setTargetPageByName(action.page);
                    }
                    break;
                }
                case 'switch': {
                    if (typeof action.state === 'string') {
                        this.log.error(`Button ${button} has no state!`);
                        return;
                    }
                    await action.state.setStateFlip();
                    break;
                }
            }
        }
    };
    onInternalCommand = async (id: string, state: Types.nsPanelState | undefined): Promise<Types.nsPanelStateVal> => {
        if (!id.startsWith(this.name)) {
            return null;
        }
        const token: Types.PanelInternalCommand = id.replace(`${this.name}/`, '') as Types.PanelInternalCommand;
        if (state && !state.ack && state.val != null) {
            switch (token) {
                case 'cmd/power1': {
                    this.sendToTasmota(`${this.topic}/cmnd/POWER1`, state.val ? 'ON' : 'OFF');
                    break;
                }
                case 'cmd/power2': {
                    this.sendToTasmota(`${this.topic}/cmnd/POWER2`, state.val ? 'ON' : 'OFF');
                    break;
                }
                case `cmd/detachRight`: {
                    this.detach.right = !!state.val;
                    await this.library.writedp(`panels.${this.name}.cmd.detachRight`, this.detach.right);
                    this.sendRules();
                    break;
                }
                case 'cmd/detachLeft': {
                    this.detach.left = !!state.val;
                    await this.library.writedp(`panels.${this.name}.cmd.detachLeft`, this.detach.left);
                    this.sendRules();
                    break;
                }

                case 'cmd/bigIconLeft': {
                    this.info.nspanel.bigIconLeft = !!state.val;
                    this.screenSaver && (await this.screenSaver.HandleScreensaverStatusIcons());
                    //this.statesControler.setInternalState(`${this.name}/cmd/bigIconLeft`, !!state.val, true);
                    await this.library.writeFromJson(
                        `panels.${this.name}.info`,
                        'panel.panels.info',
                        genericStateObjects,
                        this.info,
                    );
                    break;
                }
                case 'cmd/bigIconRight': {
                    this.info.nspanel.bigIconRight = !!state.val;
                    this.screenSaver && (await this.screenSaver.HandleScreensaverStatusIcons());
                    //this.statesControler.setInternalState(`${this.name}/cmd/bigIconRight`, !!state.val, true);
                    await this.library.writeFromJson(
                        `panels.${this.name}.info`,
                        'panel.panels.info',
                        genericStateObjects,
                        this.info,
                    );
                    break;
                }
                case 'cmd/screenSaverTimeout': {
                    if (typeof state.val !== 'boolean') {
                        // eslint-disable-next-line @typescript-eslint/no-base-to-string
                        const val = parseInt(String(state.val));
                        this.timeout = val;
                        this.sendScreeensaverTimeout(this.timeout);
                        await this.statesControler.setInternalState(`${this.name}/cmd/screenSaverTimeout`, val, true);
                        await this.library.writedp(`panels.${this.name}.cmd.screenSaverTimeout`, this.timeout);
                    }
                    break;
                }
                case 'cmd/dimStandby': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dimMode.low = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.standby`, this.dimMode.low);
                    break;
                }
                case 'cmd/dimActive': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dimMode.high = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.active`, this.dimMode.high);
                    break;
                }
                case 'cmd/dimNightActive': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dimMode.highNight = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.nightActive`, this.dimMode.highNight);
                    break;
                }
                case 'cmd/dimNightStandby': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dimMode.lowNight = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.nightStandby`, this.dimMode.lowNight);
                    break;
                }
                case 'cmd/dimNightHourStart': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dimMode.startNight = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.nightHourStart`, this.dimMode.startNight);
                    break;
                }
                case 'cmd/dimNightHourEnd': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dimMode.endNight = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.nightHourEnd`, this.dimMode.endNight);
                    break;
                }
                case 'cmd/NotificationCleared2':
                case 'cmd/NotificationCleared': {
                    await this.controller.systemNotification.clearNotification(this.notifyIndex);
                }
                // eslint-disable-next-line no-fallthrough
                case 'cmd/NotificationNext2':
                case 'cmd/NotificationNext': {
                    this.notifyIndex = this.controller.systemNotification.getNotificationIndex(++this.notifyIndex);

                    if (this.notifyIndex !== -1) {
                        const val = this.controller.systemNotification.getNotification(this.notifyIndex);
                        if (val) {
                            await this.statesControler.setInternalState(
                                `${this.name}/cmd/popupNotification${token.endsWith('2') ? '' : '2'}`,
                                JSON.stringify(val),
                                false,
                            );
                        }
                        break;
                    }
                    await this.HandleIncomingMessage({
                        type: 'event',
                        method: 'buttonPress2',
                        id: 'popupNotify',
                        action: 'bExit',
                        opt: '',
                    });
                    break;
                }
                case 'cmd/TasmotaRestart': {
                    this.sendToTasmota(`${this.topic}/cmnd/Restart`, '1');
                    this.log.info('Restart Tasmota!');
                    this.isOnline = false;
                    break;
                }
                case 'cmd/screenSaverRotationTime': {
                    if (this.screenSaver && typeof state.val === 'number') {
                        const val =
                            state.val === 0 ? state.val : state.val < 3 ? 3 : state.val > 3600 ? 3600 : state.val;
                        if (this.screenSaver.rotationTime !== val * 1000) {
                            this.screenSaver.rotationTime = val * 1000;
                            await this.screenSaver.restartRotationLoop();
                        }
                        await this.library.writedp(`panels.${this.name}.cmd.screenSaverRotationTime`, val);
                    }
                    break;
                }
                case 'cmd/screenSaverDoubleClick': {
                    if (this.screenSaver && typeof state.val === 'boolean') {
                        this.screenSaverDoubleClick = !!state.val;
                        await this.library.writedp(`panels.${this.name}.cmd.screenSaverDoubleClick`, state.val);
                    }
                    break;
                }
                case 'cmd/screenSaverLayout': {
                    if (typeof state.val === 'number' && pages.isScreenSaverModeAsNumber(state.val)) {
                        if (this.screenSaver) {
                            this.screenSaver.overwriteModel(state.val);
                            await this.library.writedp(`panels.${this.name}.cmd.screenSaverLayout`, state.val);
                        }
                    }
                    break;
                }
                case 'info/PopupInfo': {
                    this.data['info/PopupInfo'] = state.val;
                }
            }
            await this.statesControler.setInternalState(id, state.val, true);
        }
        switch (token) {
            case 'cmd/bigIconLeft': {
                return this.info.nspanel.bigIconLeft;
            }
            case 'cmd/bigIconRight': {
                return this.info.nspanel.bigIconRight;
            }
            case 'cmd/screenSaverTimeout': {
                return this.timeout;
            }
            case 'cmd/dimStandby': {
                return this.dimMode.low;
            }
            case 'cmd/dimActive': {
                return this.dimMode.high;
            }
            case 'cmd/dimNightActive': {
                return this.dimMode.highNight;
            }
            case 'cmd/dimNightStandby': {
                return this.dimMode.lowNight;
            }
            case 'cmd/dimNightHourStart': {
                return this.dimMode.startNight;
            }
            case 'cmd/dimNightHourEnd': {
                return this.dimMode.endNight;
            }
            case 'cmd/detachLeft': {
                return this.detach.left;
            }
            case 'cmd/detachRight': {
                return this.detach.right;
            }
            case 'cmd/popupNotification2':
            case 'cmd/popupNotification': {
                if (this.notifyIndex !== -1) {
                    const val = this.controller.systemNotification.getNotification(this.notifyIndex);
                    if (val) {
                        return JSON.stringify(val);
                    }
                }
                return null;
            }
            case 'info/tasmotaVersion': {
                return `${this.info.tasmota.firmwareversion}\r\n${this.info.tasmota.onlineVersion}`;
            }
            case 'info/displayVersion': {
                return this.info.nspanel.displayVersion;
            }
            case 'info/modelVersion': {
                return this.info.nspanel.model;
            }
            case 'info/Tasmota': {
                return this.info.tasmota;
            }
            case 'cmd/screenSaverRotationTime': {
                if (this.screenSaver) {
                    return this.screenSaver.rotationTime;
                }
                break;
            }
            case 'cmd/screenSaverDoubleClick': {
                return this.screenSaverDoubleClick;
            }
            case 'cmd/screenSaverLayout': {
                if (this.screenSaver) {
                    return Screensaver.mapModeToNumber(this.screenSaver.mode);
                }
                break;
            }
            case 'info/PopupInfo': {
                return this.data['info/PopupInfo'] ?? null;
            }
        }
        return null;
    };

    /**
     * Convert incoming string to event msg object
     *
     * @param msg incoming string
     * @returns event object
     */
    private convertToEvent(msg: string): Types.IncomingEvent | null {
        try {
            msg = (JSON.parse(msg) || {}).CustomRecv;
        } catch {
            this.log.warn(`Receive a broken msg from mqtt: ${msg}`);
        }
        if (msg === undefined) {
            return null;
        }
        const temp = msg.split(',');
        if (!Types.isEventType(temp[0])) {
            return null;
        }
        try {
            if (!Types.isEventMethod(temp[1])) {
                return null;
            }
        } catch (e: any) {
            this.log.error(`Error at convertToEvent: ${e}`);
            return null;
        }
        let popup: undefined | string = undefined;
        if (temp[1] === 'pageOpenDetail') {
            popup = temp.splice(2, 1)[0];
        }
        const arr = String(temp[2]).split('?');
        if (arr[3]) {
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
        }
        if (arr[2]) {
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
        } else if (arr[1]) {
            return {
                type: temp[0],
                method: temp[1],
                page: parseInt(arr[0]),
                popup: popup,
                id: arr[1],
                action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
                opt: temp[4] ?? '',
            };
        }
        return {
            type: temp[0],
            method: temp[1],
            popup: popup,
            id: arr[0],
            action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
            opt: temp[4] ?? '',
        };
    }

    async setScreensaverSwipe(b: boolean): Promise<void> {
        if (this.screenSaver) {
            this.screenSaver.screensaverSwipe = b;
            await this.library.writedp(
                `panels.${this.name}.buttons.screensaverGesture`,
                !this.screenSaver.screensaverSwipe ? 0 : 1,
                genericStateObjects.panel.panels.buttons.screensaverGesture,
            );
        }
    }
    static getPage(config: pages.PageBaseConfig, that: BaseClass): pages.PageBaseConfig {
        if ('template' in config && config.template) {
            const template = cardTemplates[config.template];
            if (!template) {
                that.log.error(`Template not found: ${config.template}`);
                return config;
            }
            if (config.dpInit && typeof config.dpInit === 'string') {
                const reg = getRegExp(config.dpInit);
                if (reg) {
                    config.dpInit = reg;
                }
                if (
                    template.adapter &&
                    typeof config.dpInit === 'string' &&
                    !config.dpInit.startsWith(template.adapter)
                ) {
                    return config;
                }
            }
            const newTemplate = structuredClone(template) as Partial<pages.PageBaseConfigTemplate>;
            delete newTemplate.adapter;

            config = deepAssign(newTemplate, config);
        }
        return config;
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
