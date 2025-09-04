import { isDataItem, type Dataitem } from '../classes/data-item';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import type { ColorEntryType } from '../types/type-pageItem';
import type * as pages from '../types/pages';
import type { BooleanUnion, IncomingEvent } from '../types/types';
import { type PageInterface } from '../classes/PageInterface';
import * as tools from '../const/tools';

import type { ConfigManager } from '../classes/config-manager';
import { PageMenu } from './pageMenu';
import { isMediaButtonActionType } from '../classes/Page';
import { getPageSpotify } from './tools/getSpotify';
import { getPageAlexa } from './tools/getAlexa';
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
export class PageMedia extends PageMenu {
    config: pages.cardMediaDataItemOptions;
    items: pages.cardMediaDataItems[] = [];
    currentItems: pages.cardMediaDataItems | undefined;
    protected step: number = 0;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private artistPos: number = 0;
    private playerName: string = '';
    public currentPlayer: string | RegExp;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        this.config = options.config as pages.cardMediaDataItemOptions;
        this.currentPlayer = this.config.ident ?? '';
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        if (this.config?.card === 'cardMedia') {
            const i = await this.createMainItems(this.config, this.enums, this.dpInit);
            i.ident = this.config.ident ?? '';
            this.items.push(i);
        }
        await super.init();
    }
    async createMainItems(
        c: pages.cardMediaDataItemOptions,
        enums: string | string[],
        dpInit: string | RegExp,
    ): Promise<pages.cardMediaDataItems> {
        const config = structuredClone(c);
        // search states for mode auto
        const tempConfig: Partial<pages.PageBaseConfig['config']> =
            enums || dpInit
                ? await this.basePanel.statesControler.getDataItemsFromAuto(dpInit, config, undefined, enums)
                : config;

        const tempItem: Partial<pages.PageBaseConfig['items']> = await this.basePanel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        if (tempItem) {
            tempItem.card = 'cardMedia';
        }
        return {
            ...(tempItem as pages.cardMediaDataItems),
            dpInit: typeof dpInit === 'string' ? dpInit : dpInit.toString(),
        };
    }
    protected async onVisibilityChange(val: boolean): Promise<void> {
        await super.onVisibilityChange(val);
        if (val) {
            this.headlinePos = 0;
            this.titelPos = 0;
        }
    }

    async updateCurrentPlayer(dp: string, name: string): Promise<void> {
        if (this.currentPlayer === dp) {
            return;
        }
        let index = this.items.findIndex(i => i.ident === dp);
        if (index === -1) {
            if (this.config?.card === 'cardMedia') {
                const reg = tools.getRegExp(`/^${dp.split('.').join('\\.')}/`) || dp;
                this.items.push(await this.createMainItems(this.config, '', reg));
                index = this.items.length - 1;
                this.items[index].ident = dp;
                await this.controller.statesControler.activateTrigger(this);
            }
        }
        if (index === 0) {
            this.playerName = '';
        } else {
            this.playerName = name;
        }
        this.currentItems = this.items[index];
        this.currentPlayer = dp;
        await this.update();
    }

    async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        let index = this.items.findIndex(i => i.ident === this.currentPlayer);
        index = index === -1 ? 0 : index;
        if (index === 0) {
            this.playerName = '';
        }
        this.currentItems = this.items[index];
        const item = this.currentItems;
        if (item === undefined) {
            return;
        }
        const message: Partial<pages.PageMediaMessage> = {};
        // title
        {
            const test: Record<string, string> = {};
            test.bla = 'dd';
            let duration = '',
                elapsed = '',
                title = '',
                album = '',
                artist = '';

            {
                const v = await tools.getValueEntryString(item.data.title);
                if (v !== null) {
                    title = v;
                }
            }
            {
                const v = item.data.headline && (await item.data.headline.getString());
                message.headline = v != null ? v : this.playerName ? `${this.playerName}: ${title}` : title;
            }
            {
                const v = await tools.getValueEntryString(item.data.artist);
                if (v !== null) {
                    artist = v;
                }
            }
            if (item.data.duration && item.data.elapsed) {
                const d = await item.data.duration.getNumber(); // medialength in seconds
                if (d) {
                    const t = new Date().setHours(0, 0, d, 0);
                    duration = new Date(t).toLocaleTimeString('de-DE', { minute: 'numeric', second: '2-digit' });
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
                        elapsed = new Date(t).toLocaleTimeString('de-DE', { minute: 'numeric', second: '2-digit' });
                    }
                }
            }

            if (item.data.album) {
                const v = await item.data.album.getString();
                if (v !== null) {
                    album = v;
                }
            }
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

            const maxSize = 38;

            message.name = `|${elapsed}${duration ? `-${duration}` : ''}`;

            const { text, nextPos } = tools.buildScrollingText(title, {
                maxSize, // wie bisher: 35
                suffix: message.name, // der feste rechte Block (elapsed|duration)
                sep: ' ', // Trenner zwischen Titel und Suffix
                pos: this.titelPos, // aktuelle Scrollposition übernehmen
            });

            message.name = text;
            this.titelPos = nextPos;
            if (album || artist) {
                const div = album && artist ? ' | ' : '';
                const scrollText = album + div + artist;

                const { text, nextPos } = tools.buildScrollingText(scrollText, {
                    maxSize, // Gesamtbreite wie gehabt
                    pos: this.artistPos, // eigene Scrollposition für Artist/Album
                });

                message.artist = text;
                this.artistPos = nextPos;
            }
        }

        message.shuffle_icon = '';
        if (item.data.shuffle && item.data.shuffle.value && item.data.shuffle.value.type) {
            let value: null | true | false = null;
            if (!item.data.shuffle.enabled || (await item.data.shuffle.enabled.getBoolean()) === true) {
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
            }
            if (value !== null) {
                message.shuffle_icon = value ? 'shuffle-variant' : 'shuffle-disabled';
            }
        }
        if (item.data.volume) {
            const v = await tools.getScaledNumber(item.data.volume);
            if (v !== null) {
                message.volume = String(v);
            }
        }
        if (item.data.mediaState) {
            const v = await item.data.mediaState.getString();
            if (v !== null) {
                message.iconplaypause = !(await this.getMediaState()) ? 'play' : 'pause';
                if (item.data.stop || item.data.pause) {
                    message.onoffbuttonColor = v.toUpperCase() !== 'STOP' ? '65535' : '1374';
                } else {
                    // no stop control so pause is stop
                    message.onoffbuttonColor = message.iconplaypause !== 'pause' ? '65535' : '1374';
                }
            }
        } else if (item.data.isPlaying) {
            const v = await item.data.isPlaying.getBoolean();
            if (v !== null) {
                message.iconplaypause = v ? 'pause' : 'play';
                if (item.data.stop || item.data.pause) {
                    message.onoffbuttonColor = v ? '65535' : '1374';
                } else {
                    // no stop control so pause is stop
                    message.onoffbuttonColor = message.iconplaypause !== 'pause' ? '65535' : '1374';
                }
            }
        }

        if (item.data.title) {
            const v = await tools.getIconEntryColor(item.data.title, await this.isPlaying(), Color.Red, Color.Gray);
            if (v !== null) {
                message.titelColor = v;
            }
        }

        if (item.data.artist) {
            const v = await tools.getIconEntryColor(item.data.artist, await this.isPlaying(), Color.White, Color.Gray);
            if (v !== null) {
                message.artistColor = v;
            }
        }

        //Logo
        if (item.data.logo) {
            message.logo = tools.getPayload(
                `media-OnOff`,
                `${this.name}-logo`,
                item.data.logo.icon && 'true' in item.data.logo.icon && item.data.logo.icon.true
                    ? ((await item.data.logo.icon.true.getString()) ?? '')
                    : '',
                '4',
                '5',
                '6',
            ); //await this.getItemMessageMedia(await this.getToolItem(item.logo, 'logo', 0));
        }
        if (item.data.onOffColor) {
            const v = await tools.getIconEntryColor(item.data.onOffColor, await this.isPlaying(), Color.White);
            if (v !== null) {
                message.onoffbuttonColor = v;
            } else {
                message.onoffbuttonColor = 'disable';
            }
        }

        const opts: string[] = ['~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~'];
        const pageItems = (await this.getOptions([])).slice(0, this.maxItems);
        message.navigation = this.getNavigation();
        const msg: pages.PageMediaMessage = Object.assign(PageMediaMessageDefault, message, {
            id: 'media',
            options: pageItems.concat(opts).slice(0, 5),
        });

        this.sendToPanel(this.getMessage(msg), false);
    }
    private async getMediaState(): Promise<boolean | null> {
        if (!this.currentItems) {
            return null;
        }
        const item = this.currentItems.data.mediaState;
        if (item) {
            const v = await item.getString();
            if (v !== null) {
                return ['PLAY', '1', 'TRUE'].indexOf(v.toUpperCase()) !== -1;
            }
            const b = await item.getBoolean();
            if (b !== null) {
                return b;
            }
        }
        return null;
    }
    private async getOnOffState(): Promise<boolean | null> {
        if (!this.currentItems) {
            return null;
        }
        const item = this.currentItems.data.mediaState;
        if (item) {
            const v = await item.getString();
            if (v !== null) {
                return ['STOP', '0', 'FALSE'].indexOf(v.toUpperCase()) === -1;
            }
        }
        return null;
    }

    private getMessage(message: pages.PageMediaMessage): string {
        return tools.getPayload(
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
            tools.getPayloadArray(message.options),
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
        await super.onButtonEvent(event);
        //if (event.mode !== 'media') return;
        if (isMediaButtonActionType(event.action)) {
            this.log.debug(`Receive event: ${JSON.stringify(event)}`);
        } else {
            return;
        }
        const items = this.currentItems;
        if (!items) {
            return;
        }
        switch (event.action) {
            case 'media-back': {
                items.data.backward && (await items.data.backward.setStateTrue());
                break;
            }
            case 'media-pause': {
                if (items.data.pause && items.data.play) {
                    if (await this.isPlaying()) {
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
                    await tools.setScaledNumber(items.data.volume, v);
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
                if (event.id === `${this.name}-logo`) {
                    const onoff = await this.isPlaying();
                    if (items.data.mediaState) {
                        if (items.data.mediaState.common.write === true) {
                            await items.data.mediaState.setState(!onoff);
                            break;
                        }
                    }
                    if (onoff) {
                        if (items.data.stop) {
                            await items.data.stop.setStateTrue();
                        } else if (items.data.pause) {
                            await items.data.pause.setStateTrue();
                        }
                    } else if (items.data.play) {
                        await items.data.play.setStateTrue();
                    }
                }
                break;
            }
        }
    }

    static async getPage(
        configManager: ConfigManager,
        page: ScriptConfig.PageMedia,
        gridItem: pages.PageBaseConfig,
        messages: string[],
    ): Promise<{ gridItem: pages.PageBaseConfig; messages: string[] }> {
        const adapter = configManager.adapter;
        if (page.type !== 'cardMedia' || !gridItem.config || gridItem.config.card !== 'cardMedia') {
            const msg = `Error in page ${page.uniqueName}: Not a media page!`;
            messages.push(msg);
            adapter.log.warn(msg);
            return { gridItem, messages };
        }
        // check if id valid
        if (!page.media.id || configManager.validStateId(page.media.id) === false) {
            const msg = configManager.validStateId(page.media.id)
                ? `${page.uniqueName}: Media page has no device id!`
                : `${page.uniqueName}: Media page id ${page.media.id} is not valid!`;
            messages.push(msg);
            adapter.log.warn(msg);
            return { gridItem, messages };
        }

        // check if instance exist
        const view = await adapter.getObjectViewAsync('system', 'instance', {
            startkey: `system.adapter.${page.media.id.split('.').slice(0, 1).join('.')}.`,
            endkey: `system.adapter.${page.media.id.split('.').slice(0, 1).join('.')}.\u9999`,
        });
        if (
            !view ||
            !view.rows ||
            view.rows.length === 0 ||
            view.rows.findIndex(v => v.id === `system.adapter.${page.media.id.split('.').slice(0, 1).join('.')}`) === -1
        ) {
            const msg = `${page.uniqueName}: Media page id - adapter: ${page.media.id.split('.').slice(0, 1).join('.')} has no instance - not exist - wrong id?!`;
            messages.push(msg);
            adapter.log.error(msg);
            return { gridItem, messages };
        }

        gridItem.config.card = 'cardMedia';

        if (page.media.id.startsWith('spotify-premium.')) {
            return await getPageSpotify(configManager, page, gridItem, messages);
        }
        if (page.media.id.startsWith('alexa2.')) {
            return await getPageAlexa(configManager, page, gridItem, messages);
        }

        const msg = `${page.uniqueName}: Media page id ${page.media.id} is not supported - only alexa2 and spotify-premium!`;
        messages.push(msg);
        adapter.log.warn(msg);

        return { gridItem, messages };
    }
    public async isPlaying(): Promise<boolean> {
        return (await this.currentItems?.data.isPlaying?.getBoolean()) ?? false;
    }

    async delete(): Promise<void> {
        await super.delete();
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
        }
        case 'color': {
            return item.getRGBDec();
        }
    }
}
