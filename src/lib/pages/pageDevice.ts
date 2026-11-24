import { Page } from '../classes/Page';
import type { PageInterface } from '../classes/PageInterface';
import { getPayload, getPayloadRemoveTilde } from '../const/tools';
import {
    DEVICE_PAGE_LAYOUTS,
    DEVICE_PAGE_STATUS_INTERVAL_MS,
    isDevicePageLayout,
    type DevicePageLayout,
} from '../types/deviceDetails';
import type * as pages from '../types/pages';
import type * as types from '../types/types';
import type { PageItem } from './pageItem';
import {
    DEVICE_PAGE_EMPTY_ELEMENT,
    devicePageChannelElement,
    devicePageClampElement,
    devicePagePayload,
    devicePageStatusIconElement,
    devicePageStatusMessage,
    optionalValueOf,
    splitDevicePageStatus,
} from './device-page';

/**
 * @param config the configuration of a page
 * @returns true for the configuration of a device page
 */
function isCardDeviceConfig(config: pages.PageBase['config']): config is pages.cardDeviceDataItemOptions {
    return (
        !!config && (config.card === 'cardDevice1' || config.card === 'cardDevice2' || config.card === 'cardDevice3')
    );
}

/**
 * The device page of a device item (device-page.ts): main, the slots of the layout and info as elements of the HMI
 * pages cardDevice1..3. A normal page of the panel: its page items come from its configuration (buildDevicePage) and
 * are created only while the page is shown (Page.onVisibilityChange), a tap on an element is the tap of a cardGrid
 * cell; an empty page item is an empty element. A long press (`buttonPress3`) runs the long press action of a
 * slot, anything else does nothing - it never acts like the tap.
 *
 * A status text that does not fit the status line is split into parts (splitDevicePageStatus). The `entityUpd`
 * carries the part that is shown; while the page is visible and there is more than one part, the next one follows
 * every DEVICE_PAGE_STATUS_INTERVAL_MS as `devStatus~<text>`, round and round. Another status text starts with its
 * first part again, an `entityUpd` for any other reason leaves the rotation alone.
 */
export class PageDevice extends Page {
    private readonly headline: string;
    private readonly slotCount: number;
    private readonly layout: DevicePageLayout;
    /** index of the slots (0 = slot 1) that show an alias channel */
    private readonly channelSlots: ReadonlySet<number>;
    /** the status text the parts were made of; undefined until the page has sent one since it became visible */
    private statusText: string | undefined = undefined;
    /** the parts of the status text, shown one after the other */
    private statusParts: string[] = [''];
    /** the part that is shown */
    private statusIndex: number = 0;
    /** the interval that shows the next part; only while there is more than one */
    private statusTimer: ioBroker.Interval | undefined = undefined;

    constructor(config: PageInterface, options: pages.PageBase) {
        super(config, options);
        const card = options.config;
        if (!isCardDeviceConfig(card)) {
            throw new Error('PageDevice: invalid config card');
        }
        const layout = Number(card.card.slice('cardDevice'.length));
        this.layout = isDevicePageLayout(layout) ? layout : 1;
        const headline = card.data.headline;
        this.headline = headline.type === 'const' && typeof headline.constVal === 'string' ? headline.constVal : '';
        this.slotCount = DEVICE_PAGE_LAYOUTS[this.layout].length;
        this.channelSlots = new Set(card.channelSlots ?? []);
        this.minUpdateInterval = 1000;
    }

    /**
     * @param index number of a page item
     * @returns its payload as element, the empty element without item or for an empty item
     */
    private async elementAt(index: number): Promise<string> {
        const item = this.itemAt(index);
        if (!item) {
            return DEVICE_PAGE_EMPTY_ELEMENT;
        }
        return (await item.getPageItemPayload()) || DEVICE_PAGE_EMPTY_ELEMENT;
    }

    /**
     * @param index number of a page item
     * @returns the page item, undefined when there is none or it is empty (empty slot, no info, no status line)
     */
    private itemAt(index: number): PageItem | undefined {
        const item = this.pageItems?.[index];
        return item && item.config?.type !== 'empty' ? item : undefined;
    }

    /** Stops the rotation of the parts of the status text. */
    private stopStatusRotation(): void {
        if (this.statusTimer) {
            this.adapter.clearInterval(this.statusTimer);
            this.statusTimer = undefined;
        }
    }

    /**
     * Takes the status text of an update: another text than before is split anew, starts with its first part and
     * restarts the rotation (stopped when one part is enough); the same text changes nothing.
     *
     * @param status the status text
     * @returns the part to show
     */
    private statusPartOf(status: string): string {
        if (status !== this.statusText) {
            this.statusText = status;
            this.statusParts = splitDevicePageStatus(status, this.layout, this.basePanel.info.nspanel.model);
            this.statusIndex = 0;
            this.stopStatusRotation();
            if (this.statusParts.length > 1 && !this.unload && !this.adapter.unload) {
                this.statusTimer = this.adapter.setInterval(
                    () => this.showNextStatusPart(),
                    DEVICE_PAGE_STATUS_INTERVAL_MS,
                );
            }
        }
        return this.statusParts[this.statusIndex] ?? '';
    }

    /**
     * The next part of the status text, sent as the short message that only replaces the status line. Nothing is sent
     * (and the part stays) while the page is not shown: hidden, or a popup is open on it (sleep).
     */
    private showNextStatusPart(): void {
        if (this.unload || this.adapter.unload) {
            this.stopStatusRotation();
            return;
        }
        if (!this.visibility || this.sleep || this.statusParts.length < 2) {
            return;
        }
        this.statusIndex = (this.statusIndex + 1) % this.statusParts.length;
        // not through sendToPanel: the duplicate filter keeps comparing with the last entityUpd
        this.sendToPanelClass(devicePageStatusMessage(this.statusParts[this.statusIndex]), false);
    }

    /**
     * A hidden page stops the rotation; shown again it starts with the first part of the status text.
     *
     * @param val true: the page becomes visible
     */
    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (!val) {
            this.stopStatusRotation();
        }
        this.statusText = undefined;
        await super.onVisibilityChange(val);
    }

    async delete(): Promise<void> {
        this.stopStatusRotation();
        await super.delete();
    }

    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        await super.update();
        const statusItem = this.itemAt(this.slotCount + 2);
        const status = statusItem ? optionalValueOf(await statusItem.getPageItemPayload()) : '';
        const mainItem = this.itemAt(0);
        // slots and info; a status icon never shows name or value, field 6 of an alias channel follows the kind of
        // its slot; names and values are cut to the text buffers of the HMI
        const elements: string[] = [];
        const kinds = DEVICE_PAGE_LAYOUTS[this.layout];
        const onOff = (on: boolean): string => this.library.getTranslation(on ? 'on' : 'off');
        for (let index = 1; index <= this.slotCount + 1; index++) {
            let element = await this.elementAt(index);
            const kind = kinds[index - 1];
            if (kind && this.channelSlots.has(index - 1)) {
                element = devicePageChannelElement(kind, element, onOff);
            }
            elements.push(kind === 'status' ? devicePageStatusIconElement(element) : devicePageClampElement(element));
        }
        // the status line shows the current part of the status text; it gives way to keep the message inside the
        // buffer of the HMI page
        this.sendToPanel(
            devicePagePayload(
                getPayload(
                    getPayloadRemoveTilde('entityUpd', this.shortHeadline(this.library.getTranslation(this.headline))),
                    this.getNavigation(),
                ),
                mainItem ? await mainItem.getPageItemPayload() : '',
                elements,
                this.statusPartOf(status),
                this.layout,
                this.basePanel.info.nspanel.model,
            ),
            false,
        );
    }

    /**
     * A long press on an element: a slot runs the long press of its page item (the action configured for the slot, a
     * channel item what it does on cardGrid). main and the info icon have none - they keep the device part of the
     * item, whose long press would open the detail page from here. Without an action nothing happens: the press is
     * always handled, the caller (Panel) never treats it as a tap.
     *
     * @param id number of the element
     * @param popup popup of the event
     * @param action action of the event
     * @param value value of the event
     * @param event the event
     * @returns true
     */
    public async onButtonPress3(
        id: number | string,
        popup: types.PopupType | undefined,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        action: types.ButtonActionType | undefined | string,
        value: string | undefined,
        event: types.IncomingEvent | null = null,
    ): Promise<boolean> {
        const index = typeof id === 'number' ? id : parseInt(id);
        if (index >= 1 && index <= this.slotCount) {
            await super.onButtonPress3(id, popup, action, value, event);
        }
        return true;
    }

    async onButtonEvent(_event: types.IncomingEvent): Promise<void> {
        // the taps of the elements are handled by onPopupRequest
    }

    protected async onStateTrigger(): Promise<void> {
        await this.update();
    }
}
