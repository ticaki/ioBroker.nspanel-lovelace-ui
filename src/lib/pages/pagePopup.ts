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
    private headlinePos: number = 0;
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
        this.minUpdateInterval = 1000;
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
        if (!items) {
            return;
        }
        const details = this.detailsArray[0];
        if (!details) {
            this.detailsArray = [];
            const page = this.getLastPage();
            if (page) {
                await this.basePanel.setActivePage(this.getLastPage());
                this.removeLastPage(page);
            }
            return;
        }
        const convertToDec = (rgb: RGB | undefined | null, def: RGB): string => {
            return String(rgb ? Color.rgb_dec565(rgb) : def ? Color.rgb_dec565(def) : '');
        };
        this.log.debug('update notification page!');

        message.headline = details.headline;
        message.hColor = convertToDec(details.colorHeadline, Color.Yellow);

        message.blText = details.buttonLeft;
        message.blColor = details.buttonLeft ? convertToDec(details.colorButtonLeft, Color.Red) : '';

        message.brText = details.buttonRight;
        message.brColor = details.buttonRight ? convertToDec(details.colorButtonRight, Color.Green) : '';

        message.text = details.text;
        message.textColor = convertToDec(details.colorText, Color.White);

        if (message.text) {
            message.text = message.text.replaceAll('\n', '\r\n').replaceAll('/r/n', '\r\n');
        }
        const maxLineCount = 8;
        let lines = 0;
        if (message.text && (lines = message.text.split('\r\n').length) > maxLineCount) {
            let test = 0;
            let counter = 0;
            let pos = 0;
            this.step = this.step % (lines + 1);

            const currentPos = this.step;
            const text = `${message.text}\r\n` + `\r\n${message.text}`;
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

            message.timeout = /*details.timeout ??*/ 0;
        }
        if (details.icon == null) {
            if (this.card !== 'popupNotify') {
                //@ts-expect-error überschreiben von card type
                this.card = 'popupNotify';
                this.sendType();
            }
            this.sendToPanel(this.getMessage(message), false);
            return;
        }
        if (this.card !== 'popupNotify2') {
            //@ts-expect-error überschreiben von card type
            this.card = 'popupNotify2';
            this.sendType();
        }
        message.fontSet = details.textSize ?? '';
        message.icon = Icons.GetIcon(details.icon);
        message.iconColor = convertToDec(details.iconColor, Color.White);
        this.sendToPanel(this.getMessage2(message), false);
        return;
    }
    private getMessage(message: Partial<pages.PageNotifyMessage>): string {
        return getPayloadRemoveTilde(
            'entityUpdateDetail',
            this.id,
            message.headline ?? '',
            message.hColor ?? '',
            message.blText ?? '',
            message.blColor ?? '',
            message.brText ?? '',
            message.brColor ?? '',
            message.text ?? '',
            message.textColor ?? '',
            String(message.timeout ?? 0),
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
        this.step = 0;
        if (this.rotationTimeout) {
            this.adapter.clearTimeout(this.rotationTimeout);
        }
        this.rotationTimeout = undefined;
        this.log.debug(`state trigge1rd ${_dp}`);
        const detailsArr: pages.PagePopupDataDetails | pages.PagePopupDataDetails[] | null | undefined =
            (await this.items?.data.details?.getObject()) as
                | pages.PagePopupDataDetails
                | pages.PagePopupDataDetails[]
                | null
                | undefined;
        if (detailsArr && Array.isArray(detailsArr)) {
            this.detailsArray = [];
        }
        for (const details of Array.isArray(detailsArr) ? detailsArr : detailsArr ? [detailsArr] : []) {
            if (details) {
                const index = this.detailsArray.findIndex(d => d.id === details.id);
                // wenn priority 0 oder undefined dann entfernen
                if (details.id && (details.priority == undefined || details.priority <= 0)) {
                    this.detailsArray = this.detailsArray.filter(d => d.id !== details.id);

                    // wenn Eintrag aktiv ist dann neues anzeigen
                    if (this.detailsArray.length > 0) {
                        if (!this.reminderTimeout) {
                            this.debouceUpdate(this.detailsArray[0].icon ? 'popupNotify2' : 'popupNotify');
                        }
                        return;
                    }
                    // sonst alles löschen und letzte Seite anzeigen
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
                    this.debouceUpdate();
                    return;
                }

                if (index !== -1) {
                    this.detailsArray[index] = { ...details, priority: details.priority || 50 };
                } else {
                    this.detailsArray.push({ ...details, priority: details.priority || 50 });
                }
                this.detailsArray.splice(10);
                this.detailsArray.sort((a, b) => a.priority - b.priority);
                const index2 = this.detailsArray.findIndex(d => d.id === details.id);
                // wenn neu dann anzeigen, ansonsten sollte ein timeout laufen
                if (index2 == 0 && index !== index2) {
                    if (this.reminderTimeout) {
                        this.adapter.clearTimeout(this.reminderTimeout);
                    }
                    this.reminderTimeout = undefined;
                    this.debouceUpdate(this.detailsArray[0].icon ? 'popupNotify2' : 'popupNotify');
                }
            }
        }
        /*if (_dp.includes('popupNotification'))*/
    }

    debouceUpdate(card?: 'popupNotify' | 'popupNotify2'): void {
        if (card && this.visibility) {
            if (this.card !== card) {
                //@ts-expect-error überschreiben von card type
                this.card = card;
                this.sendType();
            }
        }
        if (this.debouceUpdateTimeout) {
            this.adapter.clearTimeout(this.debouceUpdateTimeout);
        }
        if (this.unload || this.adapter.unload) {
            return;
        }

        if (this.detailsArray.length === 0) {
            const page = this.getLastPage();
            if (page) {
                void this.basePanel.setActivePage(page);
                this.removeLastPage(page);
            }
            return;
        }
        this.debouceUpdateTimeout = this.adapter.setTimeout(async () => {
            if (this.basePanel.getActivePage() !== this) {
                await this.basePanel.setActivePage(this);
            } else {
                await this.update();
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
        switch (_event.opt) {
            case 'yes':
                {
                    const entry = this.detailsArray.shift();
                    if (this.items?.data.setStateID && entry?.id != null) {
                        await this.items.data.setStateID.setState(entry.id);
                    }
                    if (this.items?.data.setStateYes && entry?.id != null) {
                        await this.items.data.setStateYes.setState(entry.id);
                    }
                    await this.update();
                }
                break;
            case 'no':
                {
                    const entry = this.detailsArray.shift();
                    if (entry) {
                        this.detailsArray.push(entry);
                    }
                    if (this.items?.data.setStateID && entry?.id != null) {
                        await this.items.data.setStateID.setState(entry.id);
                    }
                    if (this.items?.data.setStateNo && entry?.id != null) {
                        await this.items.data.setStateNo.setState(entry.id);
                    }
                    await this.update();
                }
                break;
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
        this.reminderTimeout = this.adapter.setTimeout(() => {
            this.debouceUpdate(this.detailsArray[0].icon ? 'popupNotify2' : 'popupNotify');
        }, 60_000);
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
export function isCardPopup2DataItems(obj: any): obj is pages.cardPopup2DataItems {
    return obj && obj.card === 'popupNotify2';
}
