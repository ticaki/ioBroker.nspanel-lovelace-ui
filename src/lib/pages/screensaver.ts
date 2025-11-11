import * as Definition from '../const/definition';
import type * as Types from '../types/types';
import * as globals from '../types/function-and-const';
import { Icons } from '../const/icon_mapping';

//import dayjs from 'dayjs';
//import moment from 'moment';
//import parseFormat from 'moment-parseformat';
import { Page } from '../classes/Page';
import type * as pages from '../types/pages';
import * as tools from '../const/tools';
import { PageItem } from './pageItem';
import type { PageInterface } from '../classes/PageInterface';
import type { BaseTriggeredPage } from '../classes/baseClassPage';
import { Color, type RGB } from '../const/Color';
import type { NSPanel } from '../types/NSPanel';

export class Screensaver extends Page {
    items: undefined;
    private step: number = 0;
    private blockButtons: ioBroker.Timeout | undefined;
    rotationTime: number = 300_000;
    public screensaverIndicatorButtons: boolean = false;
    public screensaverSwipe: boolean = false;
    private _infoIcon: any = '';
    private timeoutRotation: ioBroker.Timeout | undefined = undefined;
    public headingNotification: string = '';
    public textNotification: string = '';
    public customNotification: boolean = false;
    private activeNotification: boolean = false;
    private activeNotifyId: string = '';
    //readonly mode: Types.ScreensaverModeType = 'standard';
    constructor(config: PageInterface, options: pages.PageBase) {
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
        options.alwaysOn = 'none';
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

    /**
     * Build the screensaver message for requested places (order-preserving, parallel).
     *
     * - Runs only for screensaver cards.
     * - Keeps configured order by collecting (place, index, payload) and sorting by index per place.
     * - Numeric `enabled` → overwrite by index; boolean `enabled=false` → skip.
     *
     * @param places Places to include in the message.
     */
    async getData(places: NSPanel.ScreenSaverPlaces[]): Promise<pages.screensaverMessage | null> {
        const config = this.config;
        if (!config || !globals.isScreenSaverCardType(config.card)) {
            return null;
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
                notify: [],
            },
        };
        const overwrite: Record<NSPanel.ScreenSaverPlaces, string[]> = {
            indicator: [],
            left: [],
            time: [],
            date: [],
            bottom: [],
            mricon: [],
            favorit: [],
            alternate: [],
            notify: [],
        };

        if (!this.pageItems) {
            return message;
        }

        const model = 'model' in config ? config.model : 'eu';
        const layout = this.mode;

        type AppendResult = { kind: 'append'; place: NSPanel.ScreenSaverPlaces; idx: number; payload: string };
        type OverwriteResult = {
            kind: 'overwrite';
            place: NSPanel.ScreenSaverPlaces;
            enabledIndex: number;
            payload: string;
        };
        type Result = AppendResult | OverwriteResult | null;

        // Collect results in parallel, but tagged with original index
        const results: Result[] = await Promise.all(
            this.pageItems.map(async (pageItem, idx): Promise<Result> => {
                const place = pageItem?.config?.modeScr;
                if (!place) {
                    return null;
                }

                if (place === 'alternate' && this.mode !== 'alternate') {
                    return null;
                }
                if (!places.includes(place)) {
                    return null;
                }

                const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
                if (max === 0) {
                    return null;
                }

                // Overwrite via numeric enabled index
                if (place !== 'notify') {
                    const enabledNum = await tools.getEnabledNumber(pageItem.dataItems?.data?.enabled);
                    if (enabledNum != null) {
                        if (enabledNum >= 0) {
                            const payload = await pageItem.getPageItemPayload();
                            if (payload !== '') {
                                return { kind: 'overwrite', place, enabledIndex: enabledNum, payload };
                            }
                        }
                        return null;
                    }
                }

                // Skip via boolean enabled=false
                const enabledBool = await pageItem.isEnabled();
                if (enabledBool === false) {
                    return null;
                }

                // Default: append with original index
                const payload = await pageItem.getPageItemPayload();
                return { kind: 'append', place, idx, payload };
            }),
        );

        // Apply overwrites and collect appends grouped by place
        const appendsByPlace: Record<NSPanel.ScreenSaverPlaces, Array<{ idx: number; payload: string }>> = {
            indicator: [],
            left: [],
            time: [],
            date: [],
            bottom: [],
            mricon: [],
            favorit: [],
            alternate: [],
            notify: [],
        };

        for (const r of results) {
            if (!r) {
                continue;
            }
            if (r.kind === 'overwrite') {
                overwrite[r.place][r.enabledIndex] = r.payload;
            } else {
                appendsByPlace[r.place].push({ idx: r.idx, payload: r.payload });
            }
        }

        // Build message.options per place in original order, then apply overwrites
        for (const key in message.options) {
            const place = key as NSPanel.ScreenSaverPlaces;
            if (!places.includes(place)) {
                continue;
            }

            // Stable order: sort by original index
            const ordered = appendsByPlace[place].sort((a, b) => a.idx - b.idx).map(e => e.payload);
            message.options[place].push(...ordered);

            // Apply overwrites (sparse assignment is fine)
            Object.assign(message.options[place], overwrite[place]);

            // Windowing/paging
            let max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
            if (max == null) {
                max = Definition.ScreenSaverConst[layout][place].maxEntries.eu;
            }
            if (place === 'notify') {
                message.options[place] = message.options[place].filter(n => n && n !== '~~~~~');
                max = message.options[place].length;
            }
            let items = message.options[place] || [];
            if (items.length > max) {
                const windows = Math.ceil(items.length / max);
                const windowIdx = this.step % windows;
                items = items.slice(max * windowIdx, max * (windowIdx + 1));
                message.options[place] = items;
            }

            // Normalize payload fields per slot
            for (let i = 0; i < max; i++) {
                const msg = message.options[place][i];
                if (!msg) {
                    message.options[place][i] = tools.getPayload('', '', '', '', '', '');
                } else {
                    const arr = msg.split('~');
                    arr[0] = '';
                    if (place !== 'indicator' && place !== 'notify') {
                        arr[1] = '';
                    }
                    message.options[place][i] = tools.getPayloadArrayRemoveTilde(arr);
                }
            }
        }

        return message;
    }

    /**
     * Send (or clear) a screensaver notification to the panel if the panel is online.
     *
     * @param enabled When true, send heading + text; otherwise clear the notify.
     */
    public sendNotify(enabled: boolean): void {
        if (!this.basePanel.isOnline) {
            return;
        }
        this.customNotification = enabled && (this.headingNotification !== '' || this.textNotification !== '');

        void this.HandleNotification();
    }

    #sendNotify(enabled: boolean, heading: string = '', text: string = ''): void {
        if (!this.basePanel.isOnline) {
            return;
        }
        this.activeNotification = enabled && (heading !== '' || text !== '');

        const msg = this.activeNotification
            ? tools.getPayloadRemoveTilde('notify', heading, text)
            : tools.getPayload('notify', '', '');

        this.sendToPanel(msg, false);
    }

    /** Current info icon (readonly property wrapper). */
    get infoIcon(): string {
        return this._infoIcon;
    }

    /**
     * Update the info icon and trigger time handling refresh.
     */
    set infoIcon(infoIcon: string) {
        this._infoIcon = infoIcon;
        void this.HandleTime();
    }

    /**
     * Update the screensaver view with data for selected places and refresh status icons.
     * - Prepends an empty payload to 'alternate' if it contains entries
     * - Sends a 'weatherUpdate' payload with concatenated place arrays
     */
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

        const arr: string[] = [
            ...(message.options.favorit || []),
            ...(message.options.left || []),
            ...(message.options.bottom || []),
            ...(message.options.alternate || []),
            ...(message.options.indicator || []),
        ];

        const msg = tools.getPayload('weatherUpdate', tools.getPayloadArray(arr));
        this.sendToPanel(msg, false);
        this.sendColors();
        await this.HandleScreensaverStatusIcons();
        await this.HandleNotification();
    }

    public async createPageItems(
        pageItemsConfig: (NSPanel.PageItemDataItemsOptions | undefined)[] | undefined,
    ): Promise<(PageItem | undefined)[] | undefined> {
        return await super.createPageItems(pageItemsConfig);
    }

    public sendColors(): void {
        const colorPayload = `color~${Color.rgb_dec565(Color.background as RGB)}~${
            Color.rgb_dec565(Color.fgTime as RGB) // tTime
        }~${
            Color.rgb_dec565(Color.fgTimeAmPm as RGB) // timeAMPM
        }~${
            Color.rgb_dec565(Color.fgDate as RGB) // tDate
        }~${
            Color.rgb_dec565(Color.fgMain as RGB) // tMainText
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast1
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast2
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast3
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast4
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast1Val
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast2Val
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast3Val
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast4Val
        }~${
            Color.rgb_dec565(Color.fgBar as RGB) // bar
        }~${
            Color.rgb_dec565(Color.fgMainAlt as RGB) // tMainTextAlt2
        }~${
            Color.rgb_dec565(Color.fgTimeAdd as RGB) // tTimeAdd
        }`;
        this.sendToPanel(colorPayload, false);
    }
    async onVisibilityChange(v: boolean): Promise<void> {
        //await super.onVisibilityChange(v);
        this.step = 0;
        if (v) {
            this.sendType();
            //await this.update();
            await this.HandleTime();
            await this.restartRotationLoop();
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
        this.step = this.step > 10_000 ? 0 : this.step + 1;
        if (this.unload || this.adapter.unload) {
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
    onStateTrigger = async (_dp: string, from: BaseTriggeredPage): Promise<void> => {
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
                        case 'notify': {
                            await this.HandleNotification();
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
        let icon = `${this.infoIcon ? `~${Icons.GetIcon(this.infoIcon)}` : ''}`;
        if (this.basePanel.info.nspanel.displayVersion === '0.0.0') {
            // only for development firmware
            if (!this.adapter.config.hideDeveloperSymbols) {
                icon = `~${Icons.GetIcon('cog-refresh-outline')}`;
            }
        } else if (!icon && this.basePanel.info.nspanel.onlineVersion !== this.basePanel.info.nspanel.displayVersion) {
            // only for newer firmwares
            icon = `~${Icons.GetIcon('wrench-clock')}`;
        }

        this.sendToPanel(`time~${message.options.time[0].split('~')[5]}${icon}`, false);
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
        const msg = tools.getPayloadArrayRemoveTilde(msgArray);
        this.sendToPanel(msg, false);
    }

    async HandleNotification(): Promise<void> {
        if (this.basePanel.isOnline === false) {
            return;
        }
        const message = await this.getData(['notify']);
        if (message === null) {
            return;
        }
        // only use valid notify entries
        // format: type~int~icon~color~heading<sp!it>prio~text
        // lower prio = higher priority
        const notifyList = message.options.notify
            .map(n => n.split('~'))
            .filter(n => n[4] !== '' || n[5] !== '')
            .map(n => {
                const s = n[5].split('<sp!it>');
                const text = n[4];
                const prio = !isNaN(parseInt(s[1], 10)) ? parseInt(s[1], 10) : 99;
                const buzzer = s[2];
                const heading = `${n[2]} ${s[0]}`.trim();
                const id = n[1];
                return { heading, text, prio, id, buzzer };
            })
            .sort((a, b) => (a.prio === b.prio ? 0 : a.prio > b.prio ? 1 : -1));

        if (this.customNotification === true) {
            this.#sendNotify(this.customNotification, this.headingNotification, this.textNotification);
        } else if (notifyList.length > 0) {
            const heading = notifyList[0].heading;
            const text = notifyList[0].text;
            if (heading !== '' || text !== '') {
                if (
                    this.activeNotifyId != notifyList[0].id &&
                    notifyList[0].buzzer &&
                    this.basePanel.dim.dayMode &&
                    this.basePanel.isBuzzerAllowed
                ) {
                    this.basePanel.sendToTasmota(`${this.basePanel.topic}/cmnd/Buzzer`, notifyList[0].buzzer.trim());
                }
                this.activeNotifyId = notifyList[0].id;
                this.#sendNotify(true, heading, text);
            }
        } else if (this.activeNotification) {
            this.activeNotifyId = '';
            this.#sendNotify(false);
        }
    }

    async setGlobalNotificationDismiss(id: string): Promise<void> {
        if (!id) {
            return;
        }
        for (const item of this.pageItems || []) {
            if (item && item.config?.role === 'isDismissiblePerEvent') {
                const gId = item.getGlobalDismissibleID();
                if (gId === id && (await item.isEnabled())) {
                    item.setDismissiblePerEvent();
                }
            }
        }
        await this.HandleNotification();
    }

    async deactivateNotify(): Promise<boolean> {
        if (this.activeNotifyId) {
            const id = this.activeNotifyId.split('?')[1];
            if (id && !isNaN(parseInt(id, 10))) {
                const item = this.pageItems?.[parseInt(id, 10)];
                if (item && item.config?.role === 'isDismissiblePerEvent') {
                    item.setDismissiblePerEvent();
                    const globalId = item.getGlobalDismissibleID();
                    if (globalId) {
                        await this.controller.setGlobalNotificationDismiss(globalId);
                    }
                }
            }
            this.activeNotifyId = '';
            await this.HandleNotification();
            return true;
        }
        return false;
    }

    async onScreensaverTap(): Promise<boolean> {
        const result = await this.deactivateNotify();
        if (result) {
            return true;
        }
        return false;
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
            if (this.unload || this.adapter.unload) {
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
        if (globals.isScreenSaverMode(mode)) {
            this.config.mode = mode;
        } else {
            globals.exhaustiveCheck(mode);
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
                globals.exhaustiveCheck(mode);
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
        const index = globals.arrayOfScreensaverModes.findIndex(x => x === mode);
        return Math.min(
            Math.max(index, 0),
            globals.arrayOfScreensaverModes.length - 1,
        ) as Types.ScreensaverModeTypeAsNumber;
    }

    static mapNumberToMode(mode: Types.ScreensaverModeTypeAsNumber): Types.ScreensaverModeType {
        return globals.arrayOfScreensaverModes[mode];
    }
}
