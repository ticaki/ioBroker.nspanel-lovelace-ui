import * as Definition from '../const/definition';
import * as Types from '../types/types';
import { Icons } from '../const/icon_mapping';

//import dayjs from 'dayjs';
//import moment from 'moment';
//import parseFormat from 'moment-parseformat';
import { Page } from '../classes/Page';
import * as pages from '../types/pages';
import * as tools from '../const/tools';
import { PageItem } from './pageItem';
import type { PageInterface } from '../classes/PageInterface';
import type { BaseClassTriggerd } from '../classes/baseClassPage';
import type { PageItemDataItemsOptions } from '../types/type-pageItem';

export type ScreensaverConfigType = {
    momentLocale: string;
    locale: string; //Intl.DateTimeFormat;
    iconBig1: boolean;
    iconBig2: boolean;
};

export class Screensaver extends Page {
    items: undefined;
    private step: number = 0;
    private blockButtons: ioBroker.Timeout | undefined;
    rotationTime: number = 300000;
    public screensaverIndicatorButtons: boolean = false;
    public screensaverSwipe: boolean = false;
    private _infoIcon: any = '';
    private timeoutRotation: ioBroker.Timeout | undefined = undefined;
    public headingNotification: string = '';
    public textNotification: string = '';
    //readonly mode: Types.ScreensaverModeType = 'standard';
    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        if (
            !options.config ||
            (options.config.card !== 'screensaver' &&
                options.config.card !== 'screensaver2' &&
                options.config.card !== 'screensaver3')
        ) {
            config.adapter.log.error(
                `Invalid card for screensaver: ${options ? JSON.stringify(options) : 'undefined'}`,
            );
            return;
        }
        switch (options.config.mode) {
            case 'standard':
            case 'alternate': {
                config.card = 'screensaver';
                break;
            }
            case 'advanced': {
                config.card = 'screensaver2';
                break;
            }
            case 'easyview': {
                config.card = 'screensaver3';
                break;
            }
        }
        config.alwaysOn = 'none';
        super(config, options);
        this.screensaverIndicatorButtons = options.config.screensaverIndicatorButtons ?? false;
        this.screensaverSwipe = options.config.screensaverSwipe ?? false;
        this.rotationTime =
            options.config.rotationTime !== 0 && options.config.rotationTime < 3
                ? 3000
                : options.config.rotationTime * 1000;
        this.neverDeactivateTrigger = true;
    }

    async init(): Promise<void> {
        await super.init();
        this.pageItems = await this.createPageItems(this.pageItemConfig);
        await this.basePanel.setScreensaverSwipe(this.screensaverSwipe);
        if (this.pageItems) {
            const indicators = this.pageItems.filter(x => x && x.config && x.config.modeScr === 'indicator');
            for (let a = 0; a < indicators.length; a++) {
                await this.library.writedp(
                    `panels.${this.basePanel.name}.buttons.indicator-${a + 1}`,
                    undefined,
                    Definition.genericStateObjects.panel.panels.buttons.indicator,
                );
            }
        }
    }

    async getData(places: Types.ScreenSaverPlaces[]): Promise<pages.screensaverMessage | null> {
        const config = this.config;
        if (
            !config ||
            (config.card !== 'screensaver' && config.card !== 'screensaver2' && config.card !== 'screensaver3')
        ) {
            return null;
        }
        if (!pages.isScreenSaverCardType(config.card)) {
            pages.exhaustiveCheck(config.card);
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            this.log.error(`Invalid card: ${config.card}`);
        }
        const message: pages.screensaverMessage = {
            options: {
                indicator: [],
                left: [],
                time: [],
                date: [],
                bottom: [],
                mricon: [],
                favorit: [],
                alternate: [],
            },
        };
        const overwrite: Record<Types.ScreenSaverPlaces, string[]> = {
            indicator: [],
            left: [],
            time: [],
            date: [],
            bottom: [],
            mricon: [],
            favorit: [],
            alternate: [],
        };

        if (this.pageItems) {
            const model = config.model;
            const layout = this.mode;
            for (let a = 0; a < this.pageItems.length; a++) {
                const pageItems: PageItem | undefined = this.pageItems[a];
                const options = message.options;
                if (pageItems && pageItems.config && pageItems.config.modeScr) {
                    if (pageItems.config.modeScr === 'alternate' && this.mode !== 'alternate') {
                        continue;
                    }
                    const place = pageItems.config.modeScr;
                    const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
                    if (max === 0) {
                        continue;
                    }
                    if (places.indexOf(place) === -1) {
                        continue;
                    }
                    const enabled = await pageItems.dataItems?.data?.enabled?.getNumber();
                    if (enabled != null) {
                        if (enabled >= 0) {
                            overwrite[place][enabled] = await pageItems.getPageItemPayload();
                        }
                        continue;
                    }
                    const enabled2 = await pageItems.dataItems?.data?.enabled?.getBoolean();
                    if (enabled2 === false) {
                        continue;
                    }

                    const arr = options[place] || [];
                    arr.push(await pageItems.getPageItemPayload());
                    options[place] = arr;
                }
            }
            for (const x in message.options) {
                const place = x as Types.ScreenSaverPlaces;
                message.options[place] = Object.assign(message.options[place], overwrite[place]);
            }
            for (const x in message.options) {
                const place = x as Types.ScreenSaverPlaces;
                if (places.indexOf(place) === -1) {
                    continue;
                }
                let items = message.options[place];
                if (items) {
                    const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
                    if (items.length > Definition.ScreenSaverConst[layout][place].maxEntries[model]) {
                        let f = items.length / Definition.ScreenSaverConst[layout][place].maxEntries[model];
                        f = this.step % Math.ceil(f);
                        message.options[place] = items.slice(max * f, max * (f + 1));
                    }
                    items = message.options[place];
                    for (let i = 0; i < max; i++) {
                        const msg = items[i];
                        if (!msg) {
                            items[i] = tools.getPayload('', '', '', '', '', '');
                        } else {
                            const arr = items[i].split('~');
                            arr[0] = '';
                            if (place !== 'indicator') {
                                arr[1] = '';
                            }
                            items[i] = tools.getPayloadArray(arr);
                        }
                    }
                }
            }
        }
        return message;
    }
    sendNotify(enabled: boolean): void {
        if (!this.basePanel.isOnline) {
            return;
        }
        if (enabled) {
            const msg = tools.getPayload('notify', this.headingNotification, this.textNotification);
            this.sendToPanel(msg, false);
        } else {
            const msg = tools.getPayload('notify', '', '');
            this.sendToPanel(msg, false);
        }
    }

    get infoIcon(): string {
        return this._infoIcon;
    }
    set infoIcon(infoIcon: string) {
        this._infoIcon = infoIcon;
        void this.HandleTime();
    }

    async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }

        const message = await this.getData(['left', 'bottom', 'indicator', 'alternate', 'favorit']);
        if (message === null) {
            return;
        }
        if (message.options.alternate.length > 0) {
            message.options.alternate.unshift(tools.getPayload('', '', '', '', '', ''));
        }
        const arr: string[] = message.options.favorit.concat(
            message.options.left,
            message.options.bottom,
            message.options.alternate,
            message.options.indicator,
        );
        const msg = tools.getPayload('weatherUpdate', tools.getPayloadArray(arr));

        this.sendToPanel(msg, false);
        await this.HandleScreensaverStatusIcons();
    }
    public async createPageItems(
        pageItemsConfig: (PageItemDataItemsOptions | undefined)[] | undefined,
    ): Promise<(PageItem | undefined)[] | undefined> {
        return await super.createPageItems(pageItemsConfig);
    }

    async onVisibilityChange(v: boolean): Promise<void> {
        //await super.onVisibilityChange(v);
        this.step = 0;
        if (v) {
            this.sendType();
            //await this.update();
            await this.restartRotationLoop();
            await this.HandleTime();
        } else {
            if (this.timeoutRotation) {
                this.adapter.clearTimeout(this.timeoutRotation);
            }
        }
    }
    async restartRotationLoop(): Promise<void> {
        if (this.timeoutRotation) {
            this.adapter.clearTimeout(this.timeoutRotation);
        }
        await this.rotationLoop();
    }
    rotationLoop = async (): Promise<void> => {
        // only use this if screensaver is activated
        if (!this.visibility) {
            return;
        }
        await this.update();

        if (this.rotationTime === 0) {
            this.step = 0;
            return;
        }
        this.step = this.step > 10000 ? 0 : this.step + 1;
        if (this.unload) {
            return;
        }
        this.timeoutRotation = this.adapter.setTimeout(
            this.rotationLoop,
            this.rotationTime < 3000 ? 3000 : this.rotationTime,
        );
    };

    /**
     * ..
     *
     * @param _dp - the dp that triggered the state
     * @param from - the class that triggered the state
     */
    onStateTrigger = async (_dp: string, from: BaseClassTriggerd): Promise<void> => {
        const config = this.config;
        if (
            !config ||
            (config.card !== 'screensaver' && config.card !== 'screensaver2' && config.card !== 'screensaver3')
        ) {
            return;
        }
        if (from instanceof PageItem && this.pageItems) {
            const index = parseInt(from.id.split('?')[1]);
            const item = this.pageItems[index];
            if (item && item.config) {
                const place = item.config.modeScr;
                if (place !== undefined) {
                    switch (place) {
                        case 'left':
                        case 'bottom':
                        case 'indicator':
                        case 'alternate':
                        case 'favorit': {
                            await this.update();
                            break;
                        }
                        case 'mricon': {
                            await this.HandleScreensaverStatusIcons();
                            break;
                        }
                        case 'time': {
                            await this.HandleTime();
                            break;
                        }
                        case 'date': {
                            await this.HandleDate();
                            break;
                        }
                    }
                }
            }
        }
    };
    async HandleTime(): Promise<void> {
        if (this.basePanel.isOnline === false) {
            return;
        }
        const message = await this.getData(['time']);

        if (message === null || !message.options.time[0]) {
            this.log.debug('HandleTime: no message, no time or panel is offline');
            return;
        }

        this.sendToPanel(
            `time~${message.options.time[0].split('~')[5]}${this.infoIcon ? `~${Icons.GetIcon(this.infoIcon)}` : ''}`,
            false,
        );
    }
    async HandleDate(): Promise<void> {
        if (this.basePanel.isOnline === false) {
            return;
        }
        const message = await this.getData(['date']);
        if (message === null || !message.options.date[0]) {
            this.log.debug('HandleDate: no message, no date or panel is offline');
            return;
        }
        this.sendToPanel(`date~${message.options.date[0].split('~')[5]}`, false);
    }

    async HandleScreensaverStatusIcons(): Promise<void> {
        if (!this.visibility) {
            return;
        }

        const message = await this.getData(['mricon']);
        if (message === null) {
            return;
        }
        const mrIcon1 = message.options.mricon[0].split('~');
        const mrIcon2 = message.options.mricon[1].split('~');
        const msgArray: string[] = [
            'statusUpdate',
            mrIcon1[2] ?? '',
            mrIcon1[3] ?? '',
            mrIcon2[2] ?? '',
            mrIcon2[3] ?? '',
            this.basePanel.info.nspanel.bigIconLeft ? '1' : '',
            this.basePanel.info.nspanel.bigIconRight ? '1' : '',
        ];
        const msg = tools.getPayloadArray(msgArray);
        this.sendToPanel(msg, false);
    }

    async onButtonEvent(event: Types.IncomingEvent): Promise<void> {
        if (event.page && event.id && this.pageItems && this.pageItems[event.id as any]) {
            if (this.blockButtons) {
                return;
            }
            const indicators = this.pageItems.filter(x => x && x.config && x.config.modeScr === 'indicator');
            for (let a = 0; a < indicators.length; a++) {
                if (indicators[a] === this.pageItems[event.id as any]) {
                    await this.library.writedp(
                        `panels.${this.basePanel.name}.buttons.indicator-${a + 1}`,
                        true,
                        Definition.genericStateObjects.panel.panels.buttons.indicator,
                    );
                }
            }
            await this.pageItems[event.id as any]!.onCommand(event.action, event.opt);
            if (this.unload) {
                return;
            }
            this.blockButtons = this.adapter.setTimeout(() => {
                this.blockButtons = undefined;
            }, 500);
        }
    }

    async delete(): Promise<void> {
        await super.delete();
        if (this.timeoutRotation) {
            this.adapter.clearTimeout(this.timeoutRotation);
        }
        if (this.blockButtons) {
            this.adapter.clearTimeout(this.blockButtons);
        }
    }
    goLeft(): void {}
    goRight(): void {}

    get mode(): Types.ScreensaverModeType {
        if (
            !this.config ||
            (this.config.card !== 'screensaver' &&
                this.config.card !== 'screensaver2' &&
                this.config.card !== 'screensaver3')
        ) {
            return 'standard';
        }
        return this.config.mode;
    }
    set mode(mode: Types.ScreensaverModeType) {
        if (
            !this.config ||
            (this.config.card !== 'screensaver' &&
                this.config.card !== 'screensaver2' &&
                this.config.card !== 'screensaver3')
        ) {
            return;
        }
        if (pages.isScreenSaverMode(mode)) {
            this.config.mode = mode;
        } else {
            pages.exhaustiveCheck(mode);
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            this.log.error(`Invalid mode: ${mode}`);
        }
    }

    overwriteModel(mode: Types.ScreensaverModeTypeAsNumber, init: boolean = false): void {
        if (mode === Screensaver.mapModeToNumber(this.mode)) {
            return;
        }
        switch (mode) {
            case 0:
            case 1: {
                // overwrite readonly property
                (this.card as any) = 'screensaver';
                if (this.config) {
                    this.config.card = 'screensaver';
                }
                break;
            }
            case 2: {
                // overwrite readonly property
                (this.card as any) = 'screensaver2';
                if (this.config) {
                    this.config.card = 'screensaver2';
                }
                break;
            }
            case 3: {
                // overwrite readonly property
                (this.card as any) = 'screensaver3';
                if (this.config) {
                    this.config.card = 'screensaver3';
                }
                break;
            }
            default: {
                pages.exhaustiveCheck(mode);
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                this.log.error(`Invalid mode: ${mode}`);
                return;
            }
        }
        this.mode = Screensaver.mapNumberToMode(mode);
        if (!init && this.visibility) {
            this.sendType();
            void this.update();
        }
    }

    static mapModeToNumber(mode: Types.ScreensaverModeType): Types.ScreensaverModeTypeAsNumber {
        const index = Types.arrayOfScreensaverModes.findIndex(x => x === mode);
        return Math.min(
            Math.max(index, 0),
            Types.arrayOfScreensaverModes.length - 1,
        ) as Types.ScreensaverModeTypeAsNumber;
    }

    static mapNumberToMode(mode: Types.ScreensaverModeTypeAsNumber): Types.ScreensaverModeType {
        return Types.arrayOfScreensaverModes[mode];
    }
}
