import { isDataItem, type Dataitem } from '../classes/data-item';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import type { ColorEntryType } from '../types/type-pageItem';
import type * as pages from '../types/pages';
import type { BooleanUnion, IncomingEvent } from '../types/types';
import { Page, isMediaButtonActionType } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { getPayload, getPayloadArray, getScaledNumber, setScaledNumber } from '../const/tools';

const PageMediaMessageDefault: pages.PageMediaMessage = {
    event: 'entityUpd',
    headline: '',
    navigation: '~~~~~~~~~',
    id: '',
    name: '',
    titelColor: String(Color.rgb_dec565(Color.White)),
    artist: '',
    artistColor: String(Color.rgb_dec565(Color.White)),
    volume: '',
    iconplaypause: '',
    onoffbuttonColor: '',
    shuffle_icon: '',
    logo: '',
    options: ['', '', '', '', ''],
};

/**
 * Represents a media page in the application.
 * Extends the base Page class to provide media-specific functionality.
 */
export class PageMedia extends Page {
    config: pages.PageBaseConfig['config'];
    items: pages.PageBaseConfig['items'];
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        if (options && options.pageItems) {
            options.pageItems.unshift({
                type: 'button',
                dpInit: '',
                role: 'button',
                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'arrow-right-bold-circle-outline' },
                            color: { type: 'const', constVal: { red: 205, green: 142, blue: 153 } },
                        },
                    },
                    entity1: { value: { type: 'const', constVal: true } },
                },
            });
        }
        super(config, options);

        this.config = options.config;
        if (this.items && this.items.card === 'cardMedia') {
            this.items = options.items;
        }
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.PageBaseConfig['config']> =
            this.enums || this.dpInit
                ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.PageBaseConfig['items']> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        if (tempItem) {
            tempItem.card = 'cardMedia';
        }
        this.items = tempItem as pages.PageBaseConfig['items'];
        await super.init();
    }
    protected async onVisibilityChange(val: boolean): Promise<void> {
        await super.onVisibilityChange(val);
        if (val) {
            this.headlinePos = 0;
            this.titelPos = 0;
        }
    }
    async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        const item = this.items;
        if (item === undefined) {
            return;
        }
        const message: Partial<pages.PageMediaMessage> = {};
        // title
        {
            if (item.card !== 'cardMedia') {
                return;
            }
            const test: Record<string, string> = {};
            test.bla = 'dd';
            let duration = '0:00',
                elapsed = '0:00',
                title = 'unknown';

            if (item.data.title && item.data.title.text) {
                const v = await item.data.title.text.getString();
                if (v !== null) {
                    title = v;
                }
            }
            if (item.data.artist && item.data.artist.text) {
                const v = await item.data.artist.text.getString();
                if (v !== null) {
                    message.artist = v;
                }
            }
            if (item.data.duration && item.data.elapsed) {
                const d = await item.data.duration.getNumber(); // medialength in seconds
                if (d !== null) {
                    const t = new Date().setHours(0, 0, d, 0);
                    duration = new Date(t).toLocaleTimeString('de-DE', { minute: '2-digit', second: '2-digit' });
                }
                if (item.data.elapsed.type === 'string') {
                    const e = await item.data.elapsed.getString();
                    if (e !== null) {
                        elapsed = e;
                    }
                } else if (item.data.elapsed.type === 'number') {
                    const e = await item.data.elapsed.getNumber();
                    if (e !== null) {
                        const t = new Date().setHours(0, 0, e, 0);
                        elapsed = new Date(t).toLocaleTimeString('de-DE', { minute: '2-digit', second: '2-digit' });
                    }
                }
            }

            message.headline = `${title}`;

            {
                const maxSize = 18;
                if (message.headline.length > maxSize) {
                    const s = `${message.headline}        `;
                    this.headlinePos = this.headlinePos % s.length;
                    message.headline = (s + message.headline)
                        .substring(this.headlinePos++ % (message.headline + s).length)
                        .substring(0, 23);
                }
            }

            const maxSize = 35;
            message.name = `(${elapsed}|${duration})`;
            if (item.data.album) {
                const v = await item.data.album.getString();
                if (v !== null) {
                    if (`${v} ${message.name}`.length > maxSize) {
                        const s = `${v}          `;
                        this.titelPos = this.titelPos % s.length;
                        message.name = `${v
                            .substring(this.titelPos++ % `${v} ${message.name}${s}`.length)
                            .substring(0, 35)} ${message.name}`;
                    } else {
                        message.name = `${v} ${message.name}`;
                    }
                }
            }
        }
        message.shuffle_icon = '';
        if (item.data.shuffle && item.data.shuffle.value && item.data.shuffle.value.type) {
            let value: null | true | false = null;
            switch (item.data.shuffle.value.type) {
                case 'string': {
                    const v = await item.data.shuffle.value.getString();
                    if (v !== null) {
                        value = ['OFF', 'FALSE'].indexOf(v.toUpperCase()) === -1;
                    }
                    break;
                }
                case 'number':
                case 'boolean': {
                    value = await item.data.shuffle.value.getBoolean();
                    break;
                }
                case 'object':
                case 'array':
                case 'mixed': {
                    value = null;
                    break;
                }
            }
            if (value !== null) {
                message.shuffle_icon = value ? 'shuffle-variant' : 'shuffle-disabled';
            }
        }
        if (item.data.volume) {
            const v = await getScaledNumber(item.data.volume);
            if (v !== null) {
                message.volume = String(v);
            }
        }
        if (item.data.mediaState) {
            const v = await item.data.mediaState.getString();
            if (v !== null) {
                message.iconplaypause = !(await this.getMediaState()) ? 'play' : 'pause';
                if (item.data.stop) {
                    message.onoffbuttonColor = v.toUpperCase() !== 'STOP' ? '65535' : '1374';
                } else {
                    // no stop control so pause is stop
                    message.onoffbuttonColor = message.iconplaypause !== 'pause' ? '65535' : '1374';
                }
            }
        }

        if (item.data.title && item.data.title.color) {
            const v = await getValueFromBoolean(item.data.title.color, 'color');
            if (v !== null) {
                message.titelColor = v;
            }
        }

        //Logo
        if (item.data.logo) {
            message.logo = '~~~~~'; //await this.getItemMessageMedia(await this.getToolItem(item.logo, 'logo', 0));
        }

        const opts: string[] = ['~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~'];
        if (this.pageItems) {
            const localStep = this.pageItems.length > 6 ? 4 : 5;
            if (this.pageItems.length - 1 <= localStep * (this.step - 1)) {
                this.step = 1;
            }
            // arrow is at index [0]
            const maxSteps = localStep * this.step + 1;
            const minStep = localStep * (this.step - 1) + 1;

            for (let a = minStep; a < maxSteps; a++) {
                const temp = this.pageItems[a];
                if (temp) {
                    opts[a - minStep] = await temp.getPageItemPayload();
                }
            }

            if (localStep === 4) {
                this.nextArrow = true;
                const temp = this.pageItems[0];
                if (temp) {
                    opts[4] = await temp.getPageItemPayload();
                }
            }
        }
        message.navigation = this.getNavigation();
        const msg: pages.PageMediaMessage = Object.assign(PageMediaMessageDefault, message, {
            id: 'media',
            options: opts,
        });
        this.sendToPanel(this.getMessage(msg), false);
        //this.log.warn(JSON.stringify(this.getMessage(msg)));
    }
    private async getMediaState(): Promise<boolean | null> {
        if (!this.items || this.items.card !== 'cardMedia') {
            return null;
        }
        const item = this.items.data.mediaState;
        if (item) {
            const v = await item.getString();
            if (v !== null) {
                return ['PLAY', '1', 'TRUE'].indexOf(v.toUpperCase()) !== -1;
            }
        }
        return null;
    }
    private async getOnOffState(): Promise<boolean | null> {
        if (!this.items || this.items.card !== 'cardMedia') {
            return null;
        }
        const item = this.items.data.mediaState;
        if (item) {
            const v = await item.getString();
            if (v !== null) {
                return ['STOP', '0', 'FALSE'].indexOf(v.toUpperCase()) === -1;
            }
        }
        return null;
    }

    private getMessage(message: pages.PageMediaMessage): string {
        return getPayload(
            'entityUpd',
            message.headline,
            message.navigation,
            message.id,
            message.name,
            message.titelColor,
            message.artist,
            message.artistColor,
            message.volume,
            Icons.GetIcon(message.iconplaypause),
            message.onoffbuttonColor,
            Icons.GetIcon(message.shuffle_icon),
            message.logo, //'~~~~~'
            getPayloadArray(message.options),
        );
    }

    onStateTrigger = async (): Promise<void> => {
        await this.update();
    };
    async reset(): Promise<void> {
        this.step = 0;
        this.headlinePos = 0;
        this.titelPos = 0;
    }
    async onButtonEvent(event: IncomingEvent): Promise<void> {
        if (!this.getVisibility() || this.sleep) {
            return;
        }
        //if (event.mode !== 'media') return;
        if (isMediaButtonActionType(event.action)) {
            this.log.debug(`Receive event: ${JSON.stringify(event)}`);
        } else {
            return;
        }
        const items = this.items;
        if (!items || items.card !== 'cardMedia') {
            return;
        }
        switch (event.action) {
            case 'media-back': {
                items.data.backward && (await items.data.backward.setStateTrue());
                break;
            }
            case 'media-pause': {
                if (items.data.pause && items.data.play) {
                    if (await this.getMediaState()) {
                        await items.data.pause.setStateTrue();
                    } else {
                        await items.data.play.setStateTrue();
                    }
                } else if (items.data.mediaState) {
                    // nothing
                }
                break;
            }
            case 'media-next': {
                items.data.forward && (await items.data.forward.setStateTrue());
                break;
            }
            case 'media-shuffle': {
                items.data.shuffle &&
                    ((items.data.shuffle.set && (await items.data.shuffle.set.setStateFlip())) ||
                        (items.data.shuffle.value && (await items.data.shuffle.value.setStateFlip())));
                break;
            }
            case 'volumeSlider': {
                if (items.data.volume) {
                    const v = parseInt(event.opt);
                    await setScaledNumber(items.data.volume, v);
                } else {
                    this.log.error(`Missing volumen controller. Report to dev`);
                }
                break;
            }
            case 'mode-speakerlist': {
                break;
            }
            case 'mode-playlist': {
                break;
            }
            case 'mode-tracklist': {
                break;
            }
            case 'mode-repeat': {
                break;
            }
            case 'mode-equalizer': {
                break;
            }
            case 'mode-seek': {
                break;
            }
            case 'mode-crossfade': {
                break;
            }
            case 'mode-favorites': {
                break;
            }
            case 'mode-insel': {
                break;
            }
            case 'media-OnOff': {
                if (items.data.stop) {
                    if (await this.getOnOffState()) {
                        await items.data.stop.setStateTrue();
                    }
                }
                break;
            }
            case 'button': {
                if (event.id === '0' && this.nextArrow) {
                    this.step++;
                    await this.update();
                }
                break;
            }
        }
    }
}

type _SelectValueFromBoolean = 'color' | 'string';

/**
 * Retrieves a value based on a boolean condition from a given item.
 *
 * @param item - The item from which to retrieve the value. It can be a record of boolean unions, a change type of keys, or a single data item.
 * @param type - The type of value to select from the boolean condition.
 * @param [value] - The boolean value to determine which value to retrieve. Defaults to true.
 * @returns A promise that resolves to the retrieved value as a string, or null if no value is found.
 */
export async function getValueFromBoolean(
    item:
        | Record<BooleanUnion, Dataitem | undefined>
        | pages.ChangeTypeOfKeys<ColorEntryType, Dataitem | undefined>
        | Dataitem
        | undefined,
    type: _SelectValueFromBoolean,
    value: boolean = true,
): Promise<string | null> {
    if (item) {
        if (isDataItem(item)) {
            const v = await getValueFromData(item, type);
            if (v !== null) {
                return v;
            }
        } else {
            const colorOn = item.true && (await getValueFromData(item.true, type));
            const colorOff = !value && item.false && (await getValueFromData(item.false, type));
            if (colorOff) {
                return colorOff;
            }
            return colorOn || null;
        }
    }
    return null;
}

/**
 * Retrieves a value from a Dataitem based on the specified type.
 *
 * @param item - The data item from which to retrieve the value.
 * @param type - The type of value to retrieve, either 'string' or 'color'.
 * @returns A promise that resolves to the retrieved value as a string, or null if no value is found.
 */
async function getValueFromData(item: Dataitem, type: _SelectValueFromBoolean): Promise<string | null> {
    switch (type) {
        case 'string': {
            return item.getString();
            break;
        }
        case 'color': {
            return item.getRGBDec();
            break;
        }
    }
}
