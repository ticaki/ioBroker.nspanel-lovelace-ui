import { BaseClassPanelSend, PanelSend } from './panel-message';

import dayjs from 'dayjs';
import * as Screensaver from '../pages/screensaver';
import * as NSPanel from '../types/types';
import { Controller } from './panel-controller';
import { AdapterClassDefinition } from '../classes/library';
import { callbackMessageType } from '../classes/mqtt';
import { ReiveTopicAppendix, SendTopicAppendix } from '../const/definition';

export interface panelConfigPartial extends Partial<panelConfigTop> {
    format?: Partial<Intl.DateTimeFormatOptions>;
    screenSaverConfig: Screensaver.ScreensaverConfig;
    Controler: Controller;
    topic: string;
    name: string;
}
export function isPanelConfig(F: object | panelConfig): F is panelConfig {
    if ((F as panelConfig).Controler === undefined) return false;
    if ((F as panelConfig).screenSaverConfig === undefined) return false;
    if ((F as panelConfig).topic === undefined) return false;
    if ((F as panelConfig).name === undefined) return false;
    return true;
}
type panelConfig = panelConfigTop & {
    format: Intl.DateTimeFormatOptions;
    screenSaverConfig: Screensaver.ScreensaverConfig;
    Controler: Controller;
    topic: string;
    name: string;
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
    timeout: 3,
};

type panelConfigTop = { CustomFormat: string; locale: Intl.LocalesArgument; timeout: number };
export class Panel extends BaseClassPanelSend {
    private minuteLoopTimeout: ioBroker.Timeout | undefined;
    private dateUpdateTimeout: ioBroker.Timeout | undefined;
    options: panelConfig;
    screenSaver: Screensaver.Screensaver;
    reivCallbacks: callbackMessageType[] = [];
    _isOnline = false;

    constructor(adapter: AdapterClassDefinition, options: panelConfigPartial) {
        super(
            adapter,
            new PanelSend(adapter, {
                name: `${options.name}-SendClass`,
                mqttClient: options.Controler.mqttClient,
                topic: options.topic,
            }),
            options.name,
        );
        this.panelSend.panel = this;
        const format = Object.assign(DefaultOptions.format, options.format);
        this.options = Object.assign(DefaultOptions, options, { format: format });
        this.screenSaver = new Screensaver.Screensaver(
            adapter,
            options.screenSaverConfig,
            this.panelSend,
            this.options.Controler.readOnlyDB,
        );
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
        this.options.Controler.mqttClient.subscript(this.options.topic, this.onMessage);
        this.sendToPanel('pageType~pageStartup', { retain: true });
    };
    registerOnMessage(fn: callbackMessageType): void {
        if (this.reivCallbacks.indexOf(fn) === -1) {
            this.reivCallbacks.push(fn);
        }
    }
    onMessage: callbackMessageType = async (topic: string, message: string) => {
        if (topic.endsWith(SendTopicAppendix)) {
            this.log.debug(`Receive ${topic} with ${message}`);
            return;
        }
        for (const fn of this.reivCallbacks) {
            if (fn) fn(topic, message);
        }
        if (topic.endsWith(ReiveTopicAppendix)) {
            this.log.debug(`Receive ${topic} with ${message}`);
            const event: NSPanel.IncomingEvent | null = NSPanel.convertToEvent(message);
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
        this.sendToPanel(`timeout~${sec}`);
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
            this.options.CustomFormat != ''
                ? dayjs().format(this.options.CustomFormat)
                : new Date().toLocaleDateString(this.options.locale, this.options.format);

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

    HandleIncomingMessage(event: NSPanel.IncomingEvent): void {
        switch (event.method) {
            case 'startup': {
                this.isOnline = true;
                this.screenSaver.init();
                if (this.minuteLoopTimeout) this.adapter.clearTimeout(this.minuteLoopTimeout);
                if (this.dateUpdateTimeout) this.adapter.clearTimeout(this.dateUpdateTimeout);
                this.minuteLoop();
                this.dateUpdateLoop();
                this.sendScreeensaverTimeout(this.options.timeout);
                this.sendToPanel('dimmode~10~100~6371');

                this.sendToPanel('pageType~cardGrid');
                this.sendToPanel(
                    'entityUpd~Menü~button~bPrev~~65535~~~button~bNext~~65535~~~button~navigate.SensorGrid~21.1~26095~Obergeschoss~PRESS~button~navigate.ObergeschossWindow~~64332~Obergeschoss~Obergeschoss~button~navigate.ogLightsGrid~~65363~Obergeschoss ACTUAL~PRESS~button~navigate.Alexa~~65222~test~PRESS',
                );
                // sendPage
                break;
            }
            case 'sleepReached': {
                this.screenSaver.sendType();
                this.screenSaver.update();
                break;
            }
            case 'pageOpenDetail': {
                break;
            }
            case 'buttonPress2': {
                break;
            }
            case 'renderCurrentPage': {
                break;
            }
            case 'button1': {
                break;
            }
            case 'button2': {
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
