import { Page } from '../classes/Page';
import type { PageInterface } from '../classes/PageInterface';
import { getPayload, getPayloadRemoveTilde } from '../const/tools';
import { DEVICE_PAGE_LAYOUTS, isDevicePageLayout, type DevicePageLayout } from '../types/deviceDetails';
import type * as pages from '../types/pages';
import type * as types from '../types/types';
import {
    DEVICE_PAGE_EMPTY_ELEMENT,
    devicePageChannelElement,
    devicePageClampElement,
    devicePagePayload,
    devicePageStatusIconElement,
    optionalValueOf,
} from './device-page';

/**
 * @param config the configuration of a page
 * @returns true for the configuration of a device page
 */
function isCardDeviceConfig(config: pages.PageBase['config']): config is pages.cardDeviceDataItemOptions {
    return (
        !!config &&
        (config.card === 'cardDevice1' || config.card === 'cardDevice2' || config.card === 'cardDevice3') &&
        'elements' in config
    );
}

/**
 * The generated device page of a device item (device-page.ts): main, the slots of the layout and info as elements of
 * the HMI pages cardDevice1..3. The page items are created only while the page is shown (Page.onVisibilityChange),
 * a tap on an element is the tap of a cardGrid cell. A long press (`buttonPress3`) runs the long press action of a
 * slot, anything else does nothing - it never acts like the tap.
 */
export class PageDevice extends Page {
    private readonly headline: string;
    private readonly slotCount: number;
    private readonly layout: DevicePageLayout;
    /** index of the slots (0 = slot 1) that show an alias channel */
    private readonly channelSlots: ReadonlySet<number>;

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
        this.slotCount = card.slotCount;
        this.channelSlots = new Set(card.channelSlots ?? []);
        this.pageItemConfig = [...card.elements];
        this.minUpdateInterval = 1000;
    }

    /**
     * @param index number of a page item
     * @returns its payload as element, the empty element without item
     */
    private async elementAt(index: number): Promise<string> {
        const item = this.pageItems?.[index];
        if (!item) {
            return DEVICE_PAGE_EMPTY_ELEMENT;
        }
        return (await item.getPageItemPayload()) || DEVICE_PAGE_EMPTY_ELEMENT;
    }

    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        await super.update();
        const statusItem = this.pageItems?.[this.slotCount + 2];
        const status = statusItem ? optionalValueOf(await statusItem.getPageItemPayload()) : '';
        const mainItem = this.pageItems?.[0];
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
        // the status line stands, scrolls or gives way to keep the message inside the buffer of the HMI page
        this.sendToPanel(
            devicePagePayload(
                getPayload(
                    getPayloadRemoveTilde('entityUpd', this.shortHeadline(this.library.getTranslation(this.headline))),
                    this.getNavigation(),
                ),
                mainItem ? await mainItem.getPageItemPayload() : '',
                elements,
                status,
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
