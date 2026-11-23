import { Page } from '../classes/Page';
import type { PageInterface } from '../classes/PageInterface';
import { getPayload, getPayloadArray, getPayloadRemoveTilde } from '../const/tools';
import { DEVICE_PAGE_LAYOUTS, isDevicePageLayout, type DevicePageLayout } from '../types/deviceDetails';
import type * as pages from '../types/pages';
import type * as types from '../types/types';
import {
    DEVICE_PAGE_EMPTY_ELEMENT,
    devicePageMainElement,
    devicePageStatusIconElement,
    fitDevicePageStatus,
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
 * a tap on an element is the tap of a cardGrid cell. There is no long press: a `buttonPress3` acts like the tap.
 */
export class PageDevice extends Page {
    private readonly headline: string;
    private readonly slotCount: number;
    private readonly layout: DevicePageLayout;

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
        const statusIndex = this.slotCount + 2;
        const statusItem = this.pageItems?.[statusIndex];
        const status = statusItem
            ? fitDevicePageStatus(
                  optionalValueOf(await statusItem.getPageItemPayload()),
                  this.layout,
                  this.basePanel.info.nspanel.model,
              )
            : '';
        const mainItem = this.pageItems?.[0];
        const elements = [devicePageMainElement(mainItem ? await mainItem.getPageItemPayload() : '', status)];
        // slots and info; a status icon never shows name or value
        const kinds = DEVICE_PAGE_LAYOUTS[this.layout];
        for (let index = 1; index <= this.slotCount + 1; index++) {
            const element = await this.elementAt(index);
            elements.push(kinds[index - 1] === 'status' ? devicePageStatusIconElement(element) : element);
        }
        this.sendToPanel(
            getPayload(
                getPayloadRemoveTilde('entityUpd', this.shortHeadline(this.library.getTranslation(this.headline))),
                this.getNavigation(),
                getPayloadArray(elements),
            ),
            false,
        );
    }

    /**
     * No long press on the device page: the caller (Panel) treats the press as a tap.
     *
     * @returns false
     */
    public async onButtonPress3(): Promise<boolean> {
        return Promise.resolve(false);
    }

    async onButtonEvent(_event: types.IncomingEvent): Promise<void> {
        // the taps of the elements are handled by onPopupRequest
    }

    protected async onStateTrigger(): Promise<void> {
        await this.update();
    }
}
