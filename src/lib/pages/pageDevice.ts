import { Page } from '../classes/Page';
import type { PageInterface } from '../classes/PageInterface';
import { getPayload, getPayloadRemoveTilde } from '../const/tools';
import {
    DEVICE_PAGE_LAYOUTS,
    DEVICE_PAGE_STATUS_INTERVAL_MS,
    DEVICE_PAGE_STATUS_SLOTS,
    devicePageExtraSlotKinds,
    devicePageStageOf,
    type DevicePageLayout,
    type DevicePageSlotKind,
    type DevicePageStatusStage,
} from '../types/deviceDetails';
import type * as pages from '../types/pages';
import type * as types from '../types/types';
import type { PageItem } from './pageItem';
import {
    DEVICE_PAGE_EMPTY_ELEMENT,
    devicePageChannelElement,
    devicePageClampElement,
    devicePageIconsMessage,
    devicePageInfoElement,
    devicePageOfModel,
    devicePagePayload,
    devicePageSlotItemIndex,
    devicePageStatusIconElement,
    devicePageStatusItemIndex,
    devicePageStatusMessage,
    isCardDeviceConfig,
    layoutOfCardDevice,
    optionalValueOf,
    splitDevicePageStatus,
} from './device-page';

/**
 * The device page of a device item (device-page.ts): main, the slots of the layout and info as elements of the HMI
 * pages cardDevice1..3. A normal page of the panel: its page items come from its configuration (buildDevicePage) and
 * are created only while the page is shown (Page.onVisibilityChange), a tap on an element is the tap of a cardGrid
 * cell; an empty page item is an empty element. A long press (`buttonPress3`) runs the long press action of a
 * slot, anything else does nothing - it never acts like the tap.
 *
 * A web model (`web-l`, `web-p`) shows the extra slots of the layout (DEVICE_PAGE_EXTRA_SLOTS): their elements are
 * appended behind info, always all of them (an empty one as the empty element), and they act like a slot of the
 * layout of the same kind. Their page items stand behind the status item (devicePageSlotItemIndex). An HMI model
 * gets the message without them and has no page items for them (devicePageOfModel).
 *
 * cardDevice1 and cardDevice3 with a stage (devicePageStageOf) have the status icon grid: its places are page items
 * behind the status item (devicePageStatusItemIndex), their cells go with `devIcons~…` (devicePageIconsMessage) right
 * behind every `entityUpd` that is sent; when only a status icon changed (the `entityUpd` is the same as the last one),
 * `devIcons` goes alone - and only when it differs from the last one. Stage 0 sends no `devIcons` (the HMI shows no
 * grid).
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
    /** the stage of the status icon grid, 0 = none */
    private readonly statusStage: DevicePageStatusStage;
    /** the last `devIcons` sent since the page became visible, '' = none */
    private lastIcons: string = '';
    /** the status text the parts were made of; undefined until the page has sent one since it became visible */
    private statusText: string | undefined = undefined;
    /** the parts of the status text, shown one after the other */
    private statusParts: string[] = [''];
    /** the part that is shown */
    private statusIndex: number = 0;
    /** the interval that shows the next part; only while there is more than one */
    private statusTimer: ioBroker.Interval | undefined = undefined;

    constructor(config: PageInterface, pageConfig: pages.PageBase) {
        // a panel that shows no extra slots gets no page items for them
        const options = devicePageOfModel(pageConfig, config.panel.info.nspanel.model);
        super(config, options);
        const card = options.config;
        if (!isCardDeviceConfig(card)) {
            throw new Error('PageDevice: invalid config card');
        }
        this.layout = layoutOfCardDevice(card.card);
        const headline = card.data.headline;
        this.headline = headline.type === 'const' && typeof headline.constVal === 'string' ? headline.constVal : '';
        this.slotCount = DEVICE_PAGE_LAYOUTS[this.layout].length;
        this.channelSlots = new Set(card.channelSlots ?? []);
        this.statusStage = devicePageStageOf(this.layout, card.statusStage);
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
     * @returns the kinds of the extra slots this panel shows behind info: those of the layout on a web model, none on
     * an HMI model
     */
    private extraKinds(): readonly DevicePageSlotKind[] {
        return devicePageExtraSlotKinds(this.layout, this.basePanel.info.nspanel.model);
    }

    /**
     * The element of a slot: a status icon never shows name or value, field 6 of an alias channel follows the kind of
     * its slot; names and values are cut to the text buffers of the HMI.
     *
     * @param slot index of the slot (0 = slot 1, the extra slots follow the slots of the layout)
     * @param kind the kind of the slot
     * @param onOff the text of on (true) / off (false) in the language of the panel
     * @returns the element
     */
    private async slotElement(slot: number, kind: DevicePageSlotKind, onOff: (on: boolean) => string): Promise<string> {
        let element = await this.elementAt(devicePageSlotItemIndex(this.layout, slot));
        if (this.channelSlots.has(slot)) {
            element = devicePageChannelElement(kind, element, onOff);
        }
        return kind === 'status' ? devicePageStatusIconElement(element) : devicePageClampElement(element);
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
        this.lastIcons = '';
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
        // the slots of the layout, info, then - on a web model only - the extra slots (always all of them)
        const elements: string[] = [];
        const kinds = DEVICE_PAGE_LAYOUTS[this.layout];
        const onOff = (on: boolean): string => this.library.getTranslation(on ? 'on' : 'off');
        for (let slot = 0; slot < this.slotCount; slot++) {
            elements.push(await this.slotElement(slot, kinds[slot], onOff));
        }
        // info carries the stage of the status icon grid
        const infoItem = this.itemAt(this.slotCount + 1);
        elements.push(
            devicePageInfoElement(infoItem ? await infoItem.getPageItemPayload() : '', this.layout, this.statusStage),
        );
        const extraKinds = this.extraKinds();
        for (let extra = 0; extra < extraKinds.length; extra++) {
            elements.push(await this.slotElement(this.slotCount + extra, extraKinds[extra], onOff));
        }
        // the status line shows the current part of the status text; it gives way to keep the message inside the
        // buffer of the HMI page (a web model has none)
        const entityUpd = devicePagePayload(
            getPayload(
                getPayloadRemoveTilde('entityUpd', this.shortHeadline(this.library.getTranslation(this.headline))),
                this.getNavigation(),
            ),
            mainItem ? await mainItem.getPageItemPayload() : '',
            elements,
            this.statusPartOf(status),
            this.layout,
            this.basePanel.info.nspanel.model,
        );
        const icons = await this.iconsMessage();
        if (!this.isLastMessage(entityUpd)) {
            this.sendToPanel(entityUpd, false);
            // the HMI draws the grid of the stage of this entityUpd: the cells always follow it
            if (icons) {
                this.sendIcons(icons);
            }
        } else if (icons && icons !== this.lastIcons) {
            // only a status icon changed
            this.sendIcons(icons);
        }
    }

    /**
     * @returns the `devIcons` message of the status icon grid, '' without grid (stage 0, cardDevice2)
     */
    private async iconsMessage(): Promise<string> {
        const count = DEVICE_PAGE_STATUS_SLOTS[this.layout];
        if (this.statusStage === 0 || count === 0) {
            return '';
        }
        const cells: string[] = [];
        for (let place = 0; place < count; place++) {
            cells.push(
                devicePageStatusIconElement(await this.elementAt(devicePageStatusItemIndex(this.layout, place))),
            );
        }
        return devicePageIconsMessage(cells, this.layout);
    }

    /**
     * Sends the cells of the status icon grid the way `devStatus` goes (not through sendToPanel: the duplicate filter
     * keeps comparing with the last entityUpd).
     *
     * @param icons the `devIcons` message
     */
    private sendIcons(icons: string): void {
        this.lastIcons = icons;
        this.sendToPanelClass(icons, false);
    }

    /**
     * A long press on an element: a slot (also an extra slot of a web model, a status icon) runs the long press of its
     * page item (the
     * action configured for the slot, a channel item what it does on cardGrid). main and the info icon have none -
     * they keep the device part of the item, whose long press would open the detail page from here. Without an action
     * nothing happens: the press is always handled, the caller (Panel) never treats it as a tap.
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
        // the items of the extra slots stand behind info and the status item
        const firstExtra = devicePageSlotItemIndex(this.layout, this.slotCount);
        const isSlot = index >= 1 && index <= this.slotCount;
        const firstStatus = devicePageStatusItemIndex(this.layout, 0);
        const isStatusIcon = index >= firstStatus && index < firstStatus + DEVICE_PAGE_STATUS_SLOTS[this.layout];
        const isExtraSlot = index >= firstExtra && index < firstExtra + this.extraKinds().length;
        if (isSlot || isStatusIcon || isExtraSlot) {
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
