import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import type { RGB } from '../const/Color';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { getPayloadRemoveTilde, setTriggeredToState } from '../const/tools';
import type * as pages from '../types/pages';
import type { IncomingEvent } from '../types/types';
import type { PageItem } from './pageItem';

// siehe typ PopupNotificationValue in src/lib/types/types.ts
export class PagePopup extends Page {
    config: pages.PageBase['config'];
    private lastpage: Page[] = [];
    private step: number = 0;
    private rotationTimeout: ioBroker.Timeout | undefined;
    private detailsArray: pages.PagePopupDataDetails[] = [];
    private reminderTimeout: ioBroker.Timeout | undefined;
    private debouceUpdateTimeout: ioBroker.Timeout | undefined;
    tempItem: PageItem | undefined;
    items: pages.cardPopupDataItems | undefined;

    constructor(config: PageInterface, options: pages.PageBase) {
        super(config, options);
        this.config = options.config;
        if (options.items && isCardPopupDataItems(options.items)) {
            this.items = options.items;
        }
        this.minUpdateInterval = 0;
        this.neverDeactivateTrigger = true;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardNotifyDataItemOptions> =
            this.enums || this.dpInit
                ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        setTriggeredToState(tempConfig, ['entity1', 'optionalValue']);
        // create Dataitems

        const tempItem: Partial<pages.cardPopupDataItems> = await this.basePanel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as any;
        if (!this.items?.data) {
            throw new Error(`PopupNotification page ${this.name} has no data items configured`);
        }
        // set card because we lose it
        this.items.card = this.card as any;
        await super.init();
        await this.basePanel.statesControler.activateTrigger(this);
    }

    setLastPage(p: Page | undefined): void {
        if (p !== this) {
            if (p !== undefined) {
                this.lastpage.push(p);
            } else {
                this.lastpage = [];
            }
        }
    }
    removeLastPage(_p: Page | undefined): void {
        this.lastpage = this.lastpage.filter(a => a !== _p);
        this.lastpage.forEach(a => a.removeLastPage(_p));
    }

    /**
     *
     * @returns Build the view for nspanel.
     */
    public async update(): Promise<void> {
        const message: Partial<pages.PageNotifyMessage> = {};
        const items = this.items;
        if (!items || !this.visibility) {
            return;
        }
        const details = this.detailsArray[0];
        if (!details) {
            this.detailsArray = [];
            const page = this.getLastPage();
            if (page) {
                await this.basePanel.setActivePage(page);
                this.removeLastPage(page);
            }
            return;
        }
        if (details.buzzer) {
            if (this.basePanel.isBuzzerAllowed) {
                this.basePanel.sendToTasmota(
                    `${this.basePanel.topic}/cmnd/Buzzer`,
                    details.buzzer === true ? '1,2,3,0xF54' : details.buzzer,
                );
            }
            details.buzzer = false;
        }

        const convertToDec = (rgb: RGB | undefined | null, def: RGB): string => {
            return String(rgb ? Color.rgb_dec565(rgb) : def ? Color.rgb_dec565(def) : '');
        };
        this.log.debug('update notification page!');

        message.headline = details.headline;
        message.hColor = convertToDec(details.colorHeadline, Color.Yellow);
        const blText = details.buttonLeft || (this.detailsArray.length > 1 ? 'Next' : '');
        message.blText = this.library.getTranslation(blText);
        message.blColor = blText ? convertToDec(details.colorButtonLeft, Color.Yellow) : '';

        message.bmText = this.library.getTranslation(details.buttonMid);
        message.bmColor = details.buttonMid ? convertToDec(details.colorButtonMid, Color.Red) : '';

        message.brText = this.library.getTranslation(details.buttonRight);
        message.brColor = details.buttonRight ? convertToDec(details.colorButtonRight, Color.Green) : '';

        message.text = details.text;
        message.textColor = convertToDec(details.colorText, Color.White);
        message.timeout = details.alwaysOn ? 0 : this.basePanel.timeout;

        if (message.text) {
            message.text = message.text.replaceAll('\n', '\r\n').replaceAll('/r/n', '\r\n');
        }
        // 0 -> 7
        // 1 -> 5
        // 2 -> 5
        // 3 -> 4
        // 4 -> 2
        // 5 -> 1
        let maxLineCount = 7;
        switch (details.textSize) {
            case '0':
                maxLineCount = 7;
                break;
            case '1':
                maxLineCount = 5;
                break;
            case '2':
                maxLineCount = 5;
                break;
            case '3':
                maxLineCount = 4;
                break;
            case '4':
                maxLineCount = 2;
                break;
            case '5':
                maxLineCount = 1;
                break;
            default:
                maxLineCount = 7;
                break;
        }
        let lines = 0;
        if (message.text && (lines = message.text.split('\r\n').length) > maxLineCount) {
            let test = 0;
            let counter = 0;
            let pos = 0;
            this.step = this.step % (lines + 1);

            const currentPos = this.step;
            const text = `${message.text}\r\n` + `${message.text}`;
            message.text = '';
            while (test++ < 100) {
                const pos2 = text.indexOf('\r\n', pos) + 2;
                if (pos2 == -1) {
                    message.text += text.slice(pos);
                    break;
                }
                if (counter >= currentPos) {
                    message.text = message.text + text.slice(pos, pos2);
                }
                counter++;
                if (counter >= currentPos + maxLineCount) {
                    break;
                }
                pos = pos2;
            }
            if (!this.rotationTimeout) {
                if (this.unload || this.adapter.unload) {
                    return;
                }
                this.rotationTimeout = this.adapter.setTimeout(this.rotation, 3000);
            }
        }
        message.fontSet = details.textSize ?? '';
        if (!Icons.GetIcon(this.detailsArray[0].icon || '')) {
            this.sendToPanel(this.getMessage(message), false);
            return;
        }
        message.icon = Icons.GetIcon(details.icon || '');
        message.iconColor = convertToDec(details.iconColor, Color.White);
        this.sendToPanel(this.getMessage(message), false);
    }
    private getMessage(message: Partial<pages.PageNotifyMessage>): string {
        return getPayloadRemoveTilde(
            'entityUpdateDetail',
            this.id,
            message.headline ?? '',
            message.hColor ?? '',
            message.blText ?? '',
            message.blColor ?? '',
            message.bmText ?? '',
            message.bmColor ?? '',
            message.brText ?? '',
            message.brColor ?? '',
            message.text ?? '',
            message.textColor ?? '',
            String(message.timeout ?? 0),
            message.fontSet ?? '0',
            message.icon ?? '',
            message.iconColor ?? '',
        );
    }
    private getMessage2(message: Partial<pages.PageNotifyMessage>): string {
        return getPayloadRemoveTilde(
            'entityUpdateDetail',
            this.id,
            message.headline ?? '',
            message.hColor ?? '',
            message.blText ?? '',
            message.blColor ?? '',
            message.bmText ?? '',
            message.bmColor ?? '',
            message.brText ?? '',
            message.brColor ?? '',
            message.text ?? '',
            message.textColor ?? '',
            String(message.timeout ?? 0),
            message.fontSet ?? '0',
            message.icon ?? '',
            message.iconColor ?? '',
        );
    }

    /**
     * Rotate text in view
     *
     * @returns void
     */
    private rotation = async (): Promise<void> => {
        if (!this.visibility) {
            this.rotationTimeout = undefined;
            return;
        }
        this.step++;
        await this.update();
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.rotationTimeout = this.adapter.setTimeout(this.rotation, 1500);
    };

    async delete(): Promise<void> {
        await super.delete();
        if (this.rotationTimeout) {
            this.adapter.clearTimeout(this.rotationTimeout);
        }
        this.rotationTimeout = undefined;
        if (this.reminderTimeout) {
            this.adapter.clearTimeout(this.reminderTimeout);
        }
        this.reminderTimeout = undefined;
        if (this.debouceUpdateTimeout) {
            this.adapter.clearTimeout(this.debouceUpdateTimeout);
        }
        this.debouceUpdateTimeout = undefined;
    }

    protected async onStateTrigger(_dp: string): Promise<void> {
        if (!this.items?.data.details?.options.dp || !_dp.endsWith(this.items.data.details.options.dp)) {
            return;
        }
        this.step = 0;
        if (this.rotationTimeout) {
            this.adapter.clearTimeout(this.rotationTimeout);
        }
        this.rotationTimeout = undefined;
        this.log.debug(`state triggerd ${_dp}`);
        const detailsArr: pages.PagePopupDataDetails | pages.PagePopupDataDetails[] | null | undefined =
            (await this.items?.data.details?.getObject()) as any;
        if (detailsArr && Array.isArray(detailsArr)) {
            this.detailsArray = [];
        }
        for (const details of Array.isArray(detailsArr) ? detailsArr : detailsArr ? [detailsArr] : []) {
            if (details) {
                const index = this.detailsArray.findIndex(d => d.id === details.id);
                // wenn priority 0 oder undefined dann entfernen
                if (details.id && (details.priority == undefined || details.priority <= 0)) {
                    const id = details.id;
                    if (id && details.priority != undefined && details.priority <= -100) {
                        this.detailsArray = this.detailsArray.filter(d => !d.id?.startsWith(id));
                        this.log.debug(`remove notification id start with ${details.id}`);
                    } else {
                        this.detailsArray = this.detailsArray.filter(d => d.id !== details.id);
                        this.log.debug(`remove notification id ${details.id}`);
                    }

                    // wenn Eintrag aktiv ist dann neues anzeigen
                    if (this.detailsArray.length > 0) {
                        if (!this.reminderTimeout) {
                            this.debouceUpdate();
                        }
                        return;
                    }
                    // sonst gehe in den alles löschen zweig und letzte Seite anzeigen
                    details.id = '';
                }
                // wenn keine id dann alles löschen und letzte Seite anzeigen
                if (!details.id) {
                    this.log.debug('clear all notifications');
                    if (this.reminderTimeout) {
                        this.adapter.clearTimeout(this.reminderTimeout);
                    }
                    this.reminderTimeout = undefined;
                    this.detailsArray = [];
                    if (this.visibility) {
                        this.debouceUpdate();
                    }
                    return;
                }
                if (details.type === 'acknowledge') {
                    details.buttonRight = details.buttonRight || 'ok';
                }
                if (index !== -1) {
                    this.log.debug(`update notification id ${details.id}`);
                    this.detailsArray[index] = { ...details, priority: details.priority || 50 };
                } else {
                    this.log.debug(`add notification id ${details.id}`);
                    this.detailsArray.unshift({ ...details, priority: details.priority || 50 });
                }
                this.detailsArray.sort((a, b) => a.priority - b.priority);
                this.detailsArray.splice(10);
                const index2 = this.detailsArray.findIndex(d => d.id === details.id);
                // wenn neu dann anzeigen, ansonsten sollte ein timeout laufen
                if (index2 == 0) {
                    this.log.debug(`notification id ${details.id} is first in queue, updating view`);
                    if (this.reminderTimeout) {
                        this.adapter.clearTimeout(this.reminderTimeout);
                    }
                    this.reminderTimeout = undefined;
                    this.debouceUpdate();
                } else {
                    this.log.debug(`notification id ${details.id} not first in queue (${index2}), not updating view`);
                }
            }
        }
        /*if (_dp.includes('popupNotification'))*/
    }

    showPopup(): boolean {
        if (this.detailsArray.length > 0) {
            if (this.reminderTimeout) {
                this.adapter.clearTimeout(this.reminderTimeout);
            }
            this.reminderTimeout = undefined;
            this.debouceUpdate();
            return true;
        }
        return false;
    }

    debouceUpdate(goLastPage?: boolean): void {
        if (this.debouceUpdateTimeout) {
            this.adapter.clearTimeout(this.debouceUpdateTimeout);
        }
        if (this.unload || this.adapter.unload) {
            return;
        }

        if (goLastPage || this.detailsArray.length === 0) {
            let page = this.getLastPage();
            if (!page) {
                page = this.basePanel.navigation.getCurrentMainPage();
            }
            void this.basePanel.setActivePage(page);
            this.removeLastPage(page);

            return;
        }
        this.debouceUpdateTimeout = this.adapter.setTimeout(async () => {
            try {
                // this.basePanel.getActivePage() can be undefined if the panel is not ready yet
                // in this case we get an error here, so we catch it and do nothing
                if (this.basePanel.getActivePage() !== this) {
                    //await this.basePanel.setActivePage(this.basePanel.navigation.getCurrentMainPage());
                    await this.basePanel.setActivePage(this);
                } else {
                    await this.update();
                }
            } catch {
                // do nothing
            }
        }, 200);
    }

    /**
     * Handle button events for the notify popup.
     *
     * Behavior:
     * - Only processes events when this page is a `popupNotify`.
     * - Reacts to `action === "notifyAction"`.
     *   - If `setValue2` exists: writes `true` to `setValue1` on "yes", otherwise to `setValue2`.
     *   - Else: writes boolean to `setValue1` based on `opt === "yes"`.
     * - Evaluates optional `closingBehaviour`:
     *   - "none"  → keep popup open
     *   - "both"  → close always
     *   - "yes" / "no" → close only if it matches `opt`
     * - When closing, returns to the last page (stack) or the current navigation page.
     *
     * Side effects:
     * - May write states via Dataitem setters.
     * - May change the active page on the panel.
     *
     * @param _event Incoming event from the panel (must contain `action`, may contain `opt`).
     * @returns Promise that resolves when the event has been handled.
     */
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        this.log.debug(`Popup notify button event: ${JSON.stringify(_event)}`);
        if (_event.action !== 'notifyAction') {
            return;
        }
        this.step = 0;
        if (this.rotationTimeout) {
            this.adapter.clearTimeout(this.rotationTimeout);
        }
        this.rotationTimeout = undefined;
        switch (_event.opt) {
            case 'button3':
                {
                    const entry = this.detailsArray.shift();
                    if (this.items?.data.setStateID && entry?.id != null) {
                        await this.items.data.setStateID.setState(entry.id);
                        if (entry?.global && this.items?.data.setGlobalID) {
                            await this.items.data.setGlobalID.setState(`${this.basePanel.name}.${entry.id}`);
                        }
                    }
                    if (this.items?.data.setStateYes && entry?.id != null) {
                        await this.items.data.setStateYes.setState(entry.id);
                        if (entry?.global && this.items?.data.setGlobalYes) {
                            await this.items.data.setGlobalYes.setState(`${entry.id}`);
                        }
                    }
                    if (entry?.global) {
                        const panels = this.basePanel.controller.panels;
                        for (const panel of panels) {
                            if (panel === this.basePanel || panel.unload) {
                                continue;
                            }
                            await this.basePanel.statesControler.setInternalState(
                                `${panel.name}/cmd/popupNotificationCustom`,
                                JSON.stringify({ id: entry.id, priority: -1 }),
                                false,
                            );
                        }
                    }
                    this.log.debug(
                        `Popup notify '${this.name}' yes pressed, remaining entries: ${this.detailsArray.length}`,
                    );
                    this.debouceUpdate();
                }
                break;
            case 'button2':
                {
                    const entry = this.detailsArray.shift();
                    if (this.items?.data.setStateID && entry?.id != null) {
                        await this.items.data.setStateID.setState(entry.id);
                        if (entry?.global && this.items?.data.setGlobalID) {
                            await this.items.data.setGlobalID.setState(`${this.basePanel.name}.${entry.id}`);
                        }
                    }
                    if (this.items?.data.setStateMid && entry?.id != null) {
                        await this.items.data.setStateMid.setState(entry.id);
                        if (entry?.global && this.items?.data.setGlobalMid) {
                            await this.items.data.setGlobalMid.setState(`${entry.id}`);
                        }
                    }

                    this.log.debug(
                        `Popup notify '${this.name}' yes pressed, remaining entries: ${this.detailsArray.length}`,
                    );
                    this.debouceUpdate(true);
                }
                break;
            case 'button1':
                {
                    // aktuell ein weiterschalten im array
                    const entry = this.detailsArray.shift();
                    if (entry && entry.type !== 'information') {
                        this.detailsArray.push(entry);
                    } else if (entry) {
                        await this.removeGlobalNotifications(entry);
                    }
                    if (this.items?.data.setStateID && entry?.id != null) {
                        await this.items.data.setStateID.setState(entry.id);
                        if (entry?.global) {
                            await this.items.data.setStateID.setState(`${this.basePanel.name}.${entry.id}`);
                        }
                    }
                    if (this.items?.data.setStateNo && entry?.id != null) {
                        await this.items.data.setStateNo.setState(entry.id);
                        if (entry?.global && this.items?.data.setGlobalNo) {
                            await this.items.data.setGlobalNo.setState(`${entry.id}`);
                        }
                    }
                    this.log.debug(
                        `Popup notify '${this.name}' no pressed, remaining entries: ${this.detailsArray.length}`,
                    );
                    this.debouceUpdate();
                }
                break;
        }
    }

    async removeGlobalNotifications(entry: pages.PagePopupDataDetails): Promise<void> {
        if (entry?.global) {
            const panels = this.basePanel.controller.panels;
            for (const panel of panels) {
                if (panel === this.basePanel || panel.unload) {
                    continue;
                }
                await this.basePanel.statesControler.setInternalState(
                    `${panel.name}/cmd/popupNotificationCustom`,
                    JSON.stringify({ id: entry.id, priority: -1 }),
                    false,
                );
            }
        }
    }

    public startReminder(): void {
        if (this.reminderTimeout) {
            this.adapter.clearTimeout(this.reminderTimeout);
        }
        if (this.detailsArray?.[0]?.type === 'information') {
            this.detailsArray.shift();
            if (this.detailsArray.length === 0) {
                return;
            }
        }
        const remind = this.detailsArray[0]?.alwaysOn && this.detailsArray[0]?.type === 'acknowledge';

        if (remind) {
            this.reminderTimeout = this.adapter.setTimeout(() => {
                this.debouceUpdate();
            }, 300_000);
        }
    }

    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            if (!this.pageItems || this.pageItems.length === 0) {
                this.pageItems = await this.createPageItems(this.pageItemConfig);
            }
            this.sendType();
            await this.update();
        }
    }

    getLastPage(): Page | undefined {
        return this.lastpage.length > 0 ? this.lastpage[this.lastpage.length - 1] : undefined;
    }
}

export function isCardPopupDataItems(obj: any): obj is pages.cardPopupDataItems {
    return obj && obj.card === 'popupNotify';
}
