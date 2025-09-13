import { PanelSend } from './panel-message';

import { Screensaver, type ScreensaverConfigType } from '../pages/screensaver';
import * as Types from '../types/types';
import * as pages from '../types/pages';
import type { Controller } from './controller';
import { BaseClass, type AdapterClassDefinition } from '../classes/library';
import type { callbackMessageType } from '../classes/mqtt';
import * as definition from '../const/definition';
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
import { PageQR } from '../pages/pageQR';
import { Dataitem } from '../classes/data-item';
import { Color, type RGB } from '../const/Color';
import { PageSchedule } from '../pages/pageSchedule';
import { cardTemplates } from '../templates/card';
import { deepAssign, getRegExp, isVersionGreaterOrEqual } from '../const/tools';
import { PageChartBar } from '../pages/pageChartBar';
import { PageChartLine } from '../pages/pageChartLine';
import axios from 'axios';
import { PageThermo2 } from '../pages/pageThermo2';

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
    private blockStartup: ioBroker.Timeout | undefined = null;
    private _isOnline: boolean = false;
    options: panelConfigPartial;
    flashing: boolean = false;
    public screenSaver: Screensaver | undefined;
    public lastCard: string = '';
    public notifyIndex: number = -1;
    public initDone: boolean = false;
    public lightPopupV2: boolean = true; //  Enable Light Popup v2, created in 2025.
    public overrideLightPopup: boolean = true; //  Override light popup config type.
    public hideCards: boolean = false;

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
    dim: {
        standby: number;
        active: number;
        dayMode: boolean;
        nightStandby: number;
        nightActive: number;
        nightHourStart: number;
        nightHourEnd: number;
        schedule: boolean;
    } = {
        standby: definition.genericStateObjects.panel.panels.cmd.dim.standby.common.def,
        active: definition.genericStateObjects.panel.panels.cmd.dim.active.common.def,
        dayMode: definition.genericStateObjects.panel.panels.cmd.dim.dayMode.common.def,
        nightStandby: definition.genericStateObjects.panel.panels.cmd.dim.nightStandby.common.def,
        nightActive: definition.genericStateObjects.panel.panels.cmd.dim.nightActive.common.def,
        nightHourStart: definition.genericStateObjects.panel.panels.cmd.dim.nightHourStart.common.def,
        nightHourEnd: definition.genericStateObjects.panel.panels.cmd.dim.nightHourEnd.common.def,
        schedule: definition.genericStateObjects.panel.panels.cmd.dim.schedule.common.def,
    };
    screenSaverDoubleClick: boolean = true;
    detach: { left: boolean; right: boolean } = { left: false, right: false };
    public persistentPageItems: Record<string, PageItem> = {};

    info: Types.PanelInfo = {
        nspanel: {
            displayVersion: '',
            model: '',
            bigIconLeft: false,
            bigIconRight: false,
            onlineVersion: '',
            firmwareUpdate: 100,
            berryDriverVersion: 0,
            berryDriverVersionOnline: 0,
            currentPage: '',
        },
        tasmota: {
            firmwareversion: '',
            onlineVersion: '',
            safeboot: false,
            mqttClient: '',
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

    meetsVersion(version: string): boolean {
        if (this.info?.nspanel?.displayVersion) {
            return isVersionGreaterOrEqual(this.info.nspanel.displayVersion, version);
        }
        return false;
    }

    constructor(adapter: AdapterClassDefinition, options: panelConfigPartial) {
        super(adapter, options.name, options.friendlyName ?? options.name);
        this.panelSend = new PanelSend(adapter, {
            name: `${this.friendlyName}-SendClass`,
            mqttClient: options.controller.mqttClient,
            topic: options.topic,
            panel: this,
        });
        this.info.tasmota.mqttClient = this.library.cleandp(this.name);
        this.options = options;
        this.timeout = options.timeout || 15;
        this.buttons = options.buttons;
        this.CustomFormat = options.CustomFormat ?? '';
        this.config = options.config;
        this.format = { ...DefaultOptions.format, ...(options.format as any) };
        this.controller = options.controller;
        this.topic = options.topic;
        if (typeof this.panelSend.addMessage === 'function') {
            this.sendToPanelClass = this.panelSend.addMessage;
        }
        if (typeof this.panelSend.addMessageTasmota === 'function') {
            this.sendToTasmota = this.panelSend.addMessageTasmota;
        }
        // remove unused pages except screensaver - pages must be in navigation

        this.statesControler = options.controller.statesControler;

        options.pages = options.pages.filter(b => {
            if (
                b.config?.card === 'screensaver' ||
                b.config?.card === 'screensaver2' ||
                b.config?.card === 'screensaver3'
            ) {
                return true;
            }
            if (options.navigation.find(c => c && c.name === b.uniqueID)) {
                return true;
            }
            return false;
        });
        options.pages = options.pages.concat(systemPages);
        options.navigation = (options.navigation || []).concat(systemNavigation);

        let scsFound = 0;
        for (let a = 0; a < options.pages.length; a++) {
            const pageConfig = options.pages[a] ? Panel.getPage(options.pages[a], this) : options.pages[a];

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
                hidden: pageConfig.hidden || false,
                dpInit: pageConfig.dpInit,
            };
            const Page = this.newPage(pmconfig, pageConfig);
            if (Page) {
                this.pages[a] = Page;
                if (Page instanceof Screensaver) {
                    this.screenSaver = Page;
                    scsFound += 1;
                }
            }
        }
        if (scsFound === 0) {
            this.log.error('No screensaver found! Stop!');
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

    newPage(pmconfig: PageInterface, pageConfig: pages.PageBaseConfig): Page | undefined {
        switch (pageConfig.config?.card) {
            case 'cardChart': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PageChartBar(pmconfig, pageConfig);
            }
            case 'cardLChart': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PageChartLine(pmconfig, pageConfig);
            }
            case 'cardEntities': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PageEntities(pmconfig, pageConfig);
            }
            case 'cardSchedule': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PageSchedule(pmconfig, pageConfig);
            }
            case 'cardGrid3':
            case 'cardGrid2':
            case 'cardGrid': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PageGrid(pmconfig, pageConfig);
            }

            case 'cardThermo': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PageThermo(pmconfig, pageConfig);
            }
            case 'cardThermo2': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PageThermo2(pmconfig, pageConfig);
            }
            case 'cardMedia': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PageMedia(pmconfig, pageConfig);
            }

            case 'cardQR': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PageQR(pmconfig, pageConfig);
            }
            case 'cardAlarm': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PageAlarm(pmconfig, pageConfig);
            }
            case 'cardPower': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PagePower(pmconfig, pageConfig);
            }
            case 'popupNotify2':
            case 'popupNotify': {
                pageConfig = Panel.getPage(pageConfig, this);
                return new PageNotify(pmconfig, pageConfig);
            }
            case 'screensaver':
            case 'screensaver2':
            case 'screensaver3': {
                const ssconfig: PageInterface = {
                    card: pageConfig.config.card,
                    panel: this,
                    id: pmconfig.id,
                    name: `${pageConfig.uniqueID}`,
                    adapter: this.adapter,
                    dpInit: '',
                };

                return new Screensaver(ssconfig, pageConfig);
            }
            default: {
                throw new Error(`Page config is missing card property for page ${pageConfig.uniqueID}`);
            }
        }
    }

    init = async (): Promise<void> => {
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.log.debug(`Panel ${this.name} is initialised!`);
        await this.controller.mqttClient.subscribe(`${this.topic}/tele/#`, this.onMessage);
        await this.controller.mqttClient.subscribe(`${this.topic}/stat/#`, this.onMessage);
        this.isOnline = false;
        const channelObj = this.library.cloneObject(
            definition.genericStateObjects.panel.panels._channel,
        ) as ioBroker.ChannelObject;

        channelObj.common.name = this.friendlyName;
        channelObj.native = {
            topic: this.topic,
            tasmotaName: this.friendlyName,
            name: this.name,
            //configName: this.configName,
        };

        // remove unused dim states
        if (await this.adapter.getStateAsync(`panels.${this.name}.cmd.dim.delay`)) {
            await this.adapter.delObjectAsync(`panels.${this.name}.cmd.dim.delay`);
        }

        await this.library.writedp(`panels.${this.name}`, undefined, channelObj);
        await this.library.writedp(
            `panels.${this.name}.cmd`,
            undefined,
            definition.genericStateObjects.panel.panels.cmd._channel,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.dim`,
            undefined,
            definition.genericStateObjects.panel.panels.cmd.dim._channel,
        );

        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaver`,
            undefined,
            definition.genericStateObjects.panel.panels.cmd.screenSaver._channel,
        );

        await this.library.writedp(
            `panels.${this.name}.buttons`,
            undefined,
            definition.genericStateObjects.panel.panels.buttons._channel,
        );
        await this.library.writedp(
            `panels.${this.name}.buttons.left`,
            true,
            definition.genericStateObjects.panel.panels.buttons.left,
        );

        await this.library.writedp(
            `panels.${this.name}.buttons.right`,
            true,
            definition.genericStateObjects.panel.panels.buttons.right,
        );
        const keys = Object.keys(this.dim);
        for (const d of keys) {
            const key = d as keyof typeof this.dim;
            const state = this.library.readdb(`panels.${this.name}.cmd.dim.${key}`);
            if (state && state.val != null && key in this.dim && typeof state.val === typeof this.dim[key]) {
                //@ts-expect-error
                this.dim[key] = state.val;
            }
            await this.library.writedp(
                `panels.${this.name}.cmd.dim.${key}`,
                this.dim[key],
                definition.genericStateObjects.panel.panels.cmd.dim[key],
            );
        }

        let state = this.library.readdb(`panels.${this.name}.cmd.screenSaver.doubleClick`);
        if (state && state.val != null) {
            this.screenSaverDoubleClick = !!state.val;
        }
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaver.doubleClick`,
            this.screenSaverDoubleClick,
            definition.genericStateObjects.panel.panels.cmd.screenSaver.doubleClick,
        );

        if (state && !state.val) {
            await this.library.writedp(
                `panels.${this.name}.buttons.screensaverGesture`,
                0,
                definition.genericStateObjects.panel.panels.buttons.screensaverGesture,
            );
        } else {
            await this.library.writedp(
                `panels.${this.name}.buttons.screensaverGesture`,
                undefined,
                definition.genericStateObjects.panel.panels.buttons.screensaverGesture,
            );
        }

        state = this.library.readdb(`panels.${this.name}.cmd.hideCards`);
        if (state && state.val != null) {
            this.hideCards = !!state.val;
        }
        await this.library.writedp(
            `panels.${this.name}.cmd.hideCards`,
            this.hideCards,
            definition.genericStateObjects.panel.panels.cmd.hideCards,
        );

        // Initialize buzzer state
        await this.library.writedp(
            `panels.${this.name}.cmd.buzzer`,
            '',
            definition.genericStateObjects.panel.panels.cmd.buzzer,
        );

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
            definition.genericStateObjects.panel.panels.cmd.detachRight,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.detachLeft`,
            this.detach.left,
            definition.genericStateObjects.panel.panels.cmd.detachLeft,
        );
        state = this.library.readdb(`panels.${this.name}.cmd.screenSaver.timeout`);
        if (state) {
            this.timeout = parseInt(String(state.val));
        }
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaver.timeout`,
            this.timeout,
            definition.genericStateObjects.panel.panels.cmd.screenSaver.timeout,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaver.headingNotification`,
            undefined,
            definition.genericStateObjects.panel.panels.cmd.screenSaver.headingNotification,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaver.textNotification`,
            undefined,
            definition.genericStateObjects.panel.panels.cmd.screenSaver.textNotification,
        );
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaver.activateNotification`,
            false,
            definition.genericStateObjects.panel.panels.cmd.screenSaver.activateNotification,
        );

        state = this.library.readdb(`panels.${this.name}.info.nspanel.firmwareUpdate`);
        await this.library.writedp(
            `panels.${this.name}.info.nspanel.firmwareUpdate`,
            state && typeof state.val === 'number' ? (state.val >= 99 ? 100 : state.val) : undefined,
            definition.genericStateObjects.panel.panels.info.nspanel.firmwareUpdate,
        );
        for (const id in definition.InternalStates.panel) {
            const obj = definition.InternalStates.panel[id as keyof typeof definition.InternalStates.panel];
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
                if (this.adapter.config.debugLogPages) {
                    this.log.debug(
                        `Initialisation of page ${page.name} - card: ${page.card} - pageItems: ${(page.pageItemConfig || []).length}`,
                    );
                }
                await page.init();
            } else {
                this.log.error('Page failed or has no name!');
            }
        }

        this.navigation.init();

        this.adapter.subscribeStates(`panels.${this.name}.cmd.*`);
        this.adapter.subscribeStates(`panels.${this.name}.alarm.*`);
        if (this.adapter.config.debugLogPages) {
            this.log.debug(`Panel ${this.name} is initialised!`);
        }

        {
            const currentPage = this.library.readdb(`panels.${this.name}.cmd.mainNavigationPoint`);
            if (currentPage && currentPage.val) {
                this.navigation.setMainPageByName(String(currentPage.val));
            }

            definition.genericStateObjects.panel.panels.cmd.mainNavigationPoint.common.states =
                this.navigation.buildCommonStates();
            const page = this.navigation.getCurrentMainPoint();
            await this.library.writedp(
                `panels.${this.name}.cmd.mainNavigationPoint`,
                page,
                definition.genericStateObjects.panel.panels.cmd.mainNavigationPoint,
            );
        }

        await this.adapter.delay(100);

        const currentScreensaver = this.library.readdb(`panels.${this.name}.cmd.screenSaver.layout`);

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
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaver.layout`,
            this.screenSaver && this.screenSaver.mode ? Screensaver.mapModeToNumber(this.screenSaver.mode) : 0,
            definition.genericStateObjects.panel.panels.cmd.screenSaver.layout,
        );
        state = this.library.readdb(`panels.${this.name}.cmd.screenSaver.rotationTime`);
        let temp: any = 0;
        if (state && typeof state.val === 'number') {
            temp = state.val === 0 ? state.val : state.val < 3 ? 3 : state.val > 3600 ? 3600 : state.val;
            if (this.screenSaver) {
                this.screenSaver.rotationTime = temp * 1000;
            }
        }
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaver.rotationTime`,
            temp,
            definition.genericStateObjects.panel.panels.cmd.screenSaver.rotationTime,
        );

        state = this.library.readdb(`panels.${this.name}.cmd.screenSaver.infoIcon`);
        if (state && typeof state.val === 'string' && this.screenSaver) {
            this.screenSaver.infoIcon = state.val;
        }
        await this.library.writedp(
            `panels.${this.name}.cmd.screenSaver.infoIcon`,
            this.screenSaver?.infoIcon ?? '',
            definition.genericStateObjects.panel.panels.cmd.screenSaver.infoIcon,
        );

        if (this.buttons && this.screenSaver) {
            const entries = Object.entries(this.buttons) as [
                keyof typeof this.buttons,
                (typeof this.buttons)[keyof typeof this.buttons],
            ][];

            const inits: Promise<void>[] = [];

            for (const [key, button] of entries) {
                if (!button) {
                    continue;
                }

                switch (button.mode) {
                    case 'page':
                        break;

                    case 'switch':
                    case 'button': {
                        if (typeof button.state === 'string') {
                            const di = new Dataitem(
                                this.adapter,
                                { type: 'state', dp: button.state },
                                this.screenSaver,
                                this.statesControler,
                            );
                            button.state = di;

                            inits.push(
                                di.isValidAndInit().then(ok => {
                                    if (!ok) {
                                        if (this.buttons) {
                                            this.buttons[key] = null;
                                        }
                                    }
                                }),
                            );
                        }
                        break;
                    }
                }
            }

            await Promise.all(inits);
        }
        state = this.library.readdb(`panels.${this.name}.info.nspanel.bigIconLeft`);
        this.info.nspanel.bigIconLeft = state ? !!state.val : false;
        state = this.library.readdb(`panels.${this.name}.info.nspanel.bigIconRight`);
        this.info.nspanel.bigIconRight = state ? !!state.val : false;
        this.restartLoops();
    };

    private sendToPanelClass: (payload: string, ackForType: boolean, opt?: IClientPublishOptions) => void = () => {};
    protected sendToPanel: (payload: string, ackForType: boolean, opt?: IClientPublishOptions) => void = (
        payload: string,
        ackForType: boolean,
        opt?: IClientPublishOptions,
    ) => {
        this.sendToPanelClass(payload, ackForType, opt);
    };
    /**
     * Activate a page or toggle sleep on the current page.
     *
     * Behavior:
     * - If `_page` is a boolean: `true` wakes the current page, `false` puts it to sleep.
     * - If `_page` is a Page: activates that page; `_notSleep === true` keeps it awake, otherwise it starts asleep.
     *
     * @param _page Target page or boolean toggle for current page
     * @param _notSleep When `_page` is a Page, `true` means not sleeping (visible), `false` means sleeping
     * @returns Promise<void>
     */
    async setActivePage(_page?: Page | boolean, _notSleep?: boolean): Promise<void> {
        if (_page === undefined) {
            return;
        }

        let targetPage: Page | undefined = this._activePage;
        let targetSleep = false;

        if (typeof _page === 'boolean') {
            if (!this._activePage) {
                return;
            }
            targetSleep = !_page;
        } else {
            targetPage = _page;
            targetSleep = _notSleep ?? false;
        }

        if (!this._activePage) {
            if (!targetPage) {
                return;
            }
            targetPage.setLastPage(undefined);
            if (!targetSleep) {
                await targetPage.setVisibility(true);
            }
            targetPage.sleep = targetSleep;
            this._activePage = targetPage;
            return;
        }

        if (targetPage && targetPage !== this._activePage) {
            await this._activePage.setVisibility(false);
            targetPage.setLastPage(this._activePage);
            if (!targetSleep) {
                await targetPage.setVisibility(true);
            }
            targetPage.sleep = targetSleep;
            this._activePage = targetPage;
            return;
        }

        if (targetSleep !== this._activePage.sleep) {
            this._activePage.sleep = targetSleep;
            if (!targetSleep) {
                this._activePage.sendType(true);
                await this._activePage.setVisibility(true);
            }

            return;
        }
        if (!targetSleep) {
            this.log.warn(
                `setActivePage called but nothing changed! Resending active page to panel. Page: ${
                    this._activePage.name
                } - Sleep: ${this._activePage.sleep}`,
            );

            this._activePage.sendType(true);
            await this._activePage.update();
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
        if (this.unload && s) {
            return;
        }
        if (s !== this._isOnline) {
            void this.library.writedp(
                `panels.${this.name}.info.isOnline`,
                s,
                definition.genericStateObjects.panel.panels.info.isOnline,
            );
            if (s) {
                this.log.info('is online!');
            } else {
                //void this.controller.removePanel(this);
                //void this.controller.addPanel(this.options);
                this._activePage && void this._activePage.setVisibility(false);
                this.restartLoops();
                this.log.warn('is offline!');
            }
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
                await fn(topic, message);
            }
        }

        if (topic.endsWith(definition.ReiveTopicAppendix)) {
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
                    this.flashing = msg.Flashing.complete < 99;
                    this.log.info(`Flashing: ${msg.Flashing.complete}%`);
                    await this.library.writedp(
                        `panels.${this.name}.info.nspanel.firmwareUpdate`,
                        msg.Flashing.complete >= 99 ? 100 : msg.Flashing.complete,
                        definition.genericStateObjects.panel.panels.info.nspanel.firmwareUpdate,
                    );
                    return;
                } else if ('nlui_driver_version' in msg) {
                    this.info.nspanel.berryDriverVersion = parseInt(msg.nlui_driver_version);
                    await this.library.writedp(
                        `panels.${this.name}.info.nspanel.berryDriverVersion`,
                        this.info.nspanel.berryDriverVersion,
                        definition.genericStateObjects.panel.panels.info.nspanel.berryDriverVersion,
                    );
                    if (this.unload || this.adapter.unload) {
                        return;
                    }
                    this.adapter.setTimeout(async () => {
                        let result: axios.AxiosResponse<any, any> | undefined = undefined;
                        try {
                            result = await axios.get(
                                'https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json',
                            );
                            if (!result || !result.data) {
                                return;
                            }
                            const version = this.adapter.config.useBetaTFT
                                ? result.data[`berry-beta`].split('_')[0]
                                : result.data.berry.split('_')[0];
                            if (
                                version != this.info.nspanel.berryDriverVersion &&
                                this.info.nspanel.berryDriverVersion != -1
                            ) {
                                const url =
                                    `http://${this.info.tasmota.net.IPAddress}/cm?` +
                                    `${this.adapter.config.useTasmotaAdmin ? `user=admin&password=${this.adapter.config.tasmotaAdminPassword}` : ``}` +
                                    `&cmnd=Backlog UrlFetch https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/tasmota/berry/${version}/autoexec.be; Restart 1`;
                                this.log.info(
                                    `Automatic update of the berry driver version from ${this.info.nspanel.berryDriverVersion} to ${version} on tasmota with IP ${this.info.tasmota.net.IPAddress} and  ${this.info.tasmota.net.Hostname}.`,
                                );
                                await axios.get(url);
                            }
                        } catch {
                            // nothing
                        }
                    }, 1);
                    return;
                }
            }
            //this.log.info(`Receive a message from ${topic} with ${message}`);
        } else if (topic.endsWith('/tele/LWT')) {
            if (message === 'Offline') {
                //this.log.warn('LWT shows offline!');
                // deaktiviert, weils zu falschen offline meldungen bei 1 nutzer kommt
                //this.isOnline = false;
            }
        } else if (topic.endsWith('/tele/INFO1')) {
            this.restartLoops();
        } else {
            const command = (topic.match(/[0-9a-zA-Z]+?\/[0-9a-zA-Z]+$/g) ||
                [])[0] as Types.TasmotaIncomingTopics | null;
            if (command) {
                switch (command) {
                    case 'stat/POWER2': {
                        await this.library.writedp(
                            `panels.${this.name}.cmd.power2`,
                            message === 'ON',
                            definition.genericStateObjects.panel.panels.cmd.power2,
                        );
                        await this.statesControler.setInternalState(`${this.name}/cmd/power2`, message === 'ON', true);
                        break;
                    }
                    case 'stat/POWER1': {
                        await this.library.writedp(
                            `panels.${this.name}.cmd.power1`,
                            message === 'ON',
                            definition.genericStateObjects.panel.panels.cmd.power1,
                        );
                        await this.statesControler.setInternalState(`${this.name}/cmd/power1`, message === 'ON', true);
                        break;
                    }
                    case 'stat/STATUS0': {
                        const data = JSON.parse(message) as Types.STATUS0;
                        if (this.name !== this.library.cleandp(data.StatusNET.Mac, false, true)) {
                            this.log.error(`Receive wrong mac address ${data.StatusNET.Mac}! Update ur config!`);
                        }

                        const o = await this.adapter.getForeignObjectAsync(`system.adapter.${this.adapter.namespace}`);
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

                        await this.library.writedp(
                            `panels.${this.name}.info`,
                            undefined,
                            definition.genericStateObjects.panel.panels.info._channel,
                        );
                        await this.library.writedp(
                            `panels.${this.name}.info.status`,
                            message,
                            definition.genericStateObjects.panel.panels.info.status,
                        );
                        this.info.tasmota.mqttClient = data.StatusMQT.MqttClient;
                        this.info.tasmota.net = data.StatusNET;
                        this.info.tasmota.firmwareversion = data.StatusFWR.Version;
                        this.info.tasmota.safeboot = data.StatusFWR.Version.includes('Safeboot');
                        this.info.tasmota.uptime = data.StatusSTS.Uptime;
                        this.info.tasmota.sts = data.StatusSTS;

                        await this.writeInfo();
                        break;
                    }
                    default: {
                        if (this.adapter.config.debugLogMqtt) {
                            this.log.debug(`Receive other message ${topic} with ${message}`);
                        }
                    }
                }
            }
        }
    };

    sendRules(): void {
        this.sendToTasmota(
            `${this.topic}/cmnd/Rule3`,
            `ON CustomSend DO RuleTimer3 120 ENDON ON Rules#Timer=3 DO CustomSend pageType~pageStartup ENDON${
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
                case 'screenSaver.timeout': {
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
                    if (this.dim.schedule) {
                        this.log.warn('Dim schedule is active - User input ignored!');
                    } else {
                        this.dim.dayMode = !!state.val;
                        this.sendDimmode();
                    }
                    await this.library.writedp(
                        `panels.${this.name}.cmd.dim.dayMode`,
                        this.dim.dayMode,
                        definition.genericStateObjects.panel.panels.cmd.dim.dayMode,
                    );
                    break;
                }
                case 'dim.schedule': {
                    this.dim.schedule = !!state.val;

                    if (this.dim.schedule) {
                        this.sendDimmode();
                    }

                    await this.library.writedp(
                        `panels.${this.name}.cmd.dim.schedule`,
                        this.dim.schedule,
                        definition.genericStateObjects.panel.panels.cmd.dim.schedule,
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

                case 'screenSaver.infoIcon': {
                    if (state && state.val != null && typeof state.val === 'string') {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/screenSaverInfoIcon`,
                            state.val,
                            false,
                        );
                    }
                    break;
                }
                case 'screenSaver.doubleClick': {
                    if (state && state.val != null) {
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
                case 'screenSaver.layout': {
                    if (typeof state.val === 'number' && pages.isScreenSaverModeAsNumber(state.val)) {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/screenSaverLayout`,
                            state.val,
                            false,
                        );
                    }
                    break;
                }
                case 'screenSaver.rotationTime': {
                    if (state && state.val != null && typeof state.val === 'number') {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/screenSaverRotationTime`,
                            parseInt(String(state.val)),
                            false,
                        );
                    }
                    break;
                }
                case 'screenSaver.activateNotification': {
                    if (state && state.val != null) {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/screensaverActivateNotification`,
                            !!state.val,
                            false,
                        );
                    }
                    break;
                }
                case 'screenSaver.headingNotification': {
                    if (state && state.val != null && typeof state.val === 'string') {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/screensaverHeadingNotification`,
                            String(state.val),
                            false,
                        );
                    }
                    break;
                }
                case 'screenSaver.textNotification': {
                    if (state && state.val != null && typeof state.val === 'string') {
                        await this.statesControler.setInternalState(
                            `${this.name}/cmd/screensaverTextNotification`,
                            String(state.val),
                            false,
                        );
                    }
                    break;
                }
                /* case 'hideCards': {
                    if (state && state.val != null) {
                        this.hideCards = !!state.val;
                        await this.library.writedp(
                            `panels.${this.name}.cmd.hideCards`,
                            this.hideCards,
                            definition.genericStateObjects.panel.panels.cmd.hideCards,
                        );
                    }
                    break;
                } */
                case 'hideCards': {
                    if (state && state.val != null) {
                        await this.statesControler.setInternalState(`${this.name}/cmd/hideCards`, !!state.val, false);
                    }
                    break;
                }
                case 'buzzer': {
                    if (state && state.val != null && typeof state.val === 'string' && state.val.trim()) {
                        this.sendToTasmota(`${this.topic}/cmnd/Buzzer`, state.val.trim());
                        // Clear the state after sending command
                        await this.statesControler.setInternalState(`${this.name}/cmd/buzzer`, '', false);
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
    sendScreensaverTimeout(sec: number): void {
        if (this.unload) {
            return;
        }
        this.log.debug(`Set screeensaver timeout to ${sec}s.`);
        this.sendToPanel(`timeout~${sec}`, false);
    }

    sendDimmode(): void {
        const hour = new Date().getHours();
        const oldDayMode = this.dim.dayMode;
        if (this.dim.schedule) {
            if (this.dim.nightHourStart > this.dim.nightHourEnd) {
                if (hour >= this.dim.nightHourStart || hour < this.dim.nightHourEnd) {
                    this.dim.dayMode = false;
                } else {
                    this.dim.dayMode = true;
                }
            } else {
                if (hour >= this.dim.nightHourStart && hour < this.dim.nightHourEnd) {
                    this.dim.dayMode = false;
                } else {
                    this.dim.dayMode = true;
                }
            }
        }
        let cmd = `${Color.rgb_dec565(Color.Black)}~${Color.rgb_dec565(Color.foreground as RGB)}`;
        this.log.debug(
            `set color to RGB ${JSON.stringify(Color.foreground)} -> ${Color.rgb_dec565(Color.foreground as RGB)}`,
        );
        if (this.dim.dayMode) {
            cmd = `dimmode~${this.dim.standby}~${this.dim.active}~${cmd}`;
        } else {
            cmd = `dimmode~${this.dim.nightStandby}~${this.dim.nightActive}~${cmd}`;
        }
        if (this.dim.dayMode !== oldDayMode) {
            void this.library.writedp(
                `panels.${this.name}.cmd.dim.dayMode`,
                this.dim.dayMode,
                definition.genericStateObjects.panel.panels.cmd.dim.dayMode,
            );
        }
        if (this.unload) {
            return;
        }
        this.sendToPanel(cmd, false);
    }

    restartLoops(): void {
        if (this.loopTimeout) {
            this.adapter.clearTimeout(this.loopTimeout);
        }
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.loopTimeout = this.adapter.setTimeout(() => {
            this.loop();
        }, 200);
    }

    loop = (): void => {
        this.pages = this.pages.filter(a => a && !a.unload);
        let t = Math.random() * 30000 + 10000;
        if (!this.isOnline) {
            t = 5000;
            if (!this.flashing) {
                this.sendToPanel('pageType~pageStartup', false, { retain: true });
            }
        }
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.loopTimeout = this.adapter.setTimeout(() => this.loop, t);
    };

    requestStatusTasmota(): void {
        this.sendToTasmota(`${this.topic}/cmnd/STATUS0`, '');
    }

    async delete(): Promise<void> {
        await super.delete();
        this.sendToPanel('pageType~pageStartup', false, { retain: true });
        !this.adapter.unload && (await this.adapter.delay(10));

        if (this.blockStartup) {
            this.adapter.clearTimeout(this.blockStartup);
        }
        this.isOnline = false;
        if (this.loopTimeout) {
            this.adapter.clearTimeout(this.loopTimeout);
        }
        await this.library.writedp(
            `panels.${this.name}.info.isOnline`,
            false,
            definition.genericStateObjects.panel.panels.info.isOnline,
        );
        await this.navigation.delete();
        await this.screenSaver?.delete();
        this.screenSaver = undefined;
        for (const a of this.pages) {
            if (a) {
                await a.delete();
            }
        }
        await this.panelSend.delete();
        this.statesControler.deletePageLoop(this.onInternalCommand);
        this.controller.mqttClient.removeByFunction(this.onMessage);
        this.persistentPageItems = {};
        this.pages = [];
        this._activePage = undefined;
        this.data = {};
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
            definition.genericStateObjects,
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
        if (!event.method) {
            return;
        }
        if (this._activePage && this._activePage.card !== 'cardAlarm' && this.adapter.config.debugLogMqtt) {
            this.log.debug(`Receive message:${JSON.stringify(event)}`);
        }
        this.log.debug(`Receive message:${JSON.stringify(event)}`);
        if (!this.screenSaver) {
            return;
        }
        if (this.isOnline === false && event.method !== 'startup') {
            void this.restartLoops();
            return;
        }

        switch (event.method) {
            case 'startup': {
                if (this.blockStartup || !this.initDone) {
                    return;
                }
                if (this.unload || this.adapter.unload) {
                    return;
                }
                this.blockStartup = this.adapter.setTimeout(() => {
                    this.blockStartup = null;
                }, 10000);
                this.isOnline = true;
                this.info.nspanel.displayVersion = event.opt;
                this.info.nspanel.model = event.action;

                this.requestStatusTasmota();
                this.sendToTasmota(`${this.topic}/cmnd/POWER1`, '');
                this.sendToTasmota(`${this.topic}/cmnd/POWER2`, '');
                this.sendToTasmota(`${this.topic}/cmnd/GetDriverVersion`, '');
                this.sendRules();
                await this.writeInfo();
                // wait 1s to have tasmota time to be ready
                await this.adapter.delay(100);

                this.sendDimmode();

                this.navigation.resetPosition();

                const start = this.navigation.getCurrentMainPage();
                if (start === undefined) {
                    this.log.error('No start page defined!');
                    return;
                }
                if (this._activePage) {
                    await this._activePage.setVisibility(false);
                }

                // set last card to nothing, else the card will not be loaded if it is the same as the last one
                this.lastCard = '';
                await start.setVisibility(true);
                // too be sure, that the page is set correctly
                this._activePage = start;

                if (this.screenSaver) {
                    this.screenSaver.pageItems = await this.screenSaver.createPageItems(
                        this.screenSaver.pageItemConfig,
                    );
                    //this.controller && (await this.controller.statesControler.activateTrigger(this.screenSaver));
                    await this.screenSaver.HandleDate();
                    await this.screenSaver.HandleTime();
                }

                if (start.alwaysOn === 'none') {
                    this.sendScreensaverTimeout(2);
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
                    await this.library.writedp(
                        `panels.${this.name}.cmd.screenSaver.activateNotification`,
                        false,
                        definition.genericStateObjects.panel.panels.cmd.screenSaver.activateNotification,
                    );
                    if (this.screenSaverDoubleClick && this.screenSaver.screensaverSwipe) {
                        switch (event.action) {
                            case 'bExit': {
                                await this.library.writedp(
                                    `panels.${this.name}.buttons.screensaverGesture`,
                                    2,
                                    definition.genericStateObjects.panel.panels.buttons.screensaverGesture,
                                );
                                break;
                            }
                            case 'swipeUp': {
                                await this.library.writedp(
                                    `panels.${this.name}.buttons.screensaverGesture`,
                                    3,
                                    definition.genericStateObjects.panel.panels.buttons.screensaverGesture,
                                );
                                break;
                            }
                            case 'swipeDown': {
                                await this.library.writedp(
                                    `panels.${this.name}.buttons.screensaverGesture`,
                                    4,
                                    definition.genericStateObjects.panel.panels.buttons.screensaverGesture,
                                );
                                break;
                            }
                            case 'swipeLeft': {
                                await this.library.writedp(
                                    `panels.${this.name}.buttons.screensaverGesture`,
                                    5,
                                    definition.genericStateObjects.panel.panels.buttons.screensaverGesture,
                                );
                                break;
                            }
                            case 'swipeRight': {
                                await this.library.writedp(
                                    `panels.${this.name}.buttons.screensaverGesture`,
                                    6,
                                    definition.genericStateObjects.panel.panels.buttons.screensaverGesture,
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
                await this.panelSend.onMessage('/stat/RESULT', `{ "CustomSend": "${event.method}" }`);
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
                        definition.genericStateObjects,
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
                        definition.genericStateObjects,
                        this.info,
                    );
                    break;
                }
                case 'cmd/screenSaverTimeout': {
                    if (typeof state.val !== 'boolean') {
                        // eslint-disable-next-line @typescript-eslint/no-base-to-string
                        const val = parseInt(String(state.val));
                        this.timeout = val;
                        this.sendScreensaverTimeout(this.timeout);
                        await this.statesControler.setInternalState(`${this.name}/cmd/screenSaverTimeout`, val, true);
                        await this.library.writedp(`panels.${this.name}.cmd.screenSaver.timeout`, this.timeout);
                    }
                    break;
                }
                case 'cmd/dimStandby': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dim.standby = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.standby`, this.dim.standby);
                    break;
                }
                case 'cmd/dimActive': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dim.active = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.active`, this.dim.active);
                    break;
                }
                case 'cmd/dimNightActive': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dim.nightActive = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.nightActive`, this.dim.nightActive);
                    break;
                }
                case 'cmd/dimNightStandby': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dim.nightStandby = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.nightStandby`, this.dim.nightStandby);
                    break;
                }
                case 'cmd/dimNightHourStart': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dim.nightHourStart = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.nightHourStart`, this.dim.nightHourStart);
                    break;
                }
                case 'cmd/dimNightHourEnd': {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const val = parseInt(String(state.val));
                    this.dim.nightHourEnd = val;
                    this.sendDimmode();
                    await this.library.writedp(`panels.${this.name}.cmd.dim.nightHourEnd`, this.dim.nightHourEnd);
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
                        await this.library.writedp(`panels.${this.name}.cmd.screenSaver.rotationTime`, val);
                    }
                    break;
                }
                case 'cmd/screenSaverDoubleClick': {
                    if (this.screenSaver && typeof state.val === 'boolean') {
                        this.screenSaverDoubleClick = !!state.val;
                        await this.library.writedp(`panels.${this.name}.cmd.screenSaver.doubleClick`, state.val);
                    }
                    break;
                }
                case 'cmd/screenSaverInfoIcon': {
                    if (this.screenSaver && typeof state.val === 'string') {
                        this.screenSaver.infoIcon = state.val;
                        await this.library.writedp(`panels.${this.name}.cmd.screenSaver.infoIcon`, state.val);
                    }
                    break;
                }
                case 'cmd/screenSaverLayout': {
                    if (typeof state.val === 'number' && pages.isScreenSaverModeAsNumber(state.val)) {
                        if (this.screenSaver) {
                            this.screenSaver.overwriteModel(state.val);
                            await this.library.writedp(`panels.${this.name}.cmd.screenSaver.layout`, state.val);
                        }
                    }
                    break;
                }
                case 'info/PopupInfo': {
                    this.data['info/PopupInfo'] = state.val;
                    break;
                }
                case 'cmd/screensaverActivateNotification': {
                    if (this.screenSaver) {
                        this.screenSaver.sendNotify(!!state.val);
                        await this.library.writedp(
                            `panels.${this.name}.cmd.screenSaver.activateNotification`,
                            !!state.val,
                            definition.genericStateObjects.panel.panels.cmd.screenSaver.activateNotification,
                        );
                    }
                    break;
                }
                case 'cmd/screensaverTextNotification': {
                    if (this.screenSaver && typeof state.val === 'string') {
                        this.screenSaver.textNotification = state.val;
                        const s = this.library.readdb(`panels.${this.name}.cmd.screenSaver.activateNotification`);
                        if (s && s.val) {
                            this.screenSaver.sendNotify(true);
                        }
                        await this.library.writedp(
                            `panels.${this.name}.cmd.screenSaver.textNotification`,
                            state.val,
                            definition.genericStateObjects.panel.panels.cmd.screenSaver.textNotification,
                        );
                    }
                    break;
                }
                case 'cmd/screensaverHeadingNotification': {
                    if (this.screenSaver && typeof state.val === 'string') {
                        this.screenSaver.headingNotification = state.val;
                        const s = this.library.readdb(`panels.${this.name}.cmd.screenSaver.activateNotification`);
                        if (s && s.val) {
                            this.screenSaver.sendNotify(true);
                        }
                        await this.library.writedp(
                            `panels.${this.name}.cmd.screenSaver.headingNotification`,
                            state.val,
                            definition.genericStateObjects.panel.panels.cmd.screenSaver.headingNotification,
                        );
                    }
                    break;
                }
                case 'cmd/hideCards': {
                    if (this.screenSaver && typeof state.val === 'boolean') {
                        this.hideCards = !!state.val;
                        await this.library.writedp(`panels.${this.name}.cmd.hideCards`, state.val);
                    }
                    break;
                }
                case 'cmd/buzzer': {
                    if (typeof state.val === 'string' && state.val.trim()) {
                        this.sendToTasmota(`${this.topic}/cmnd/Buzzer`, state.val.trim());
                        // Clear the state after sending command
                        await this.statesControler.setInternalState(id, '', true);
                        await this.library.writedp(`panels.${this.name}.cmd.buzzer`, '');
                    }
                    break;
                }
            }
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
                return this.dim.standby;
            }
            case 'cmd/dimActive': {
                return this.dim.active;
            }
            case 'cmd/dimNightActive': {
                return this.dim.nightActive;
            }
            case 'cmd/dimNightStandby': {
                return this.dim.nightStandby;
            }
            case 'cmd/dimNightHourStart': {
                return this.dim.nightHourStart;
            }
            case 'cmd/dimNightHourEnd': {
                return this.dim.nightHourEnd;
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
                    return this.screenSaver.rotationTime / 1000;
                }
                break;
            }
            case 'cmd/screenSaverDoubleClick': {
                return this.screenSaverDoubleClick;
            }
            case 'cmd/screenSaverInfoIcon': {
                return this.screenSaver?.infoIcon ?? '';
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
            case 'cmd/hideCards': {
                return this.hideCards;
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
                definition.genericStateObjects.panel.panels.buttons.screensaverGesture,
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
}
