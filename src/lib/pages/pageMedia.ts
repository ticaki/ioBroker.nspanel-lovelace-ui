import { isDataItem, type Dataitem } from '../classes/data-item';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import type { ColorEntryType } from '../types/type-pageItem';
import type * as pages from '../types/pages';
import * as types from '../types/types';
import { type PageInterface } from '../classes/PageInterface';
import * as tools from '../const/tools';
import type { ConfigManager } from '../classes/config-manager';
import { PageMenu } from './pageMenu';
import { isMediaButtonActionType } from '../classes/Page';
import { getPageSpotify } from './tools/getSpotify';
import { getPageAlexa } from './tools/getAlexa';
import { getPageMpd } from './tools/getMpd';
import { getPageSonos } from './tools/getSonos';
import { PageItem } from './pageItem';
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
    logo: '~~~~~',
    options: ['', '', '', '', ''],
};

/**
 * Represents a media page in the application.
 * Extends the base Page class to provide media-specific functionality.
 */
export class PageMedia extends PageMenu {
    config: pages.cardMediaDataItemOptions;
    items: pages.cardMediaDataItems[] = [];
    currentItem: pages.cardMediaDataItems | undefined;
    protected step: number = 0;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private artistPos: number = 0;
    private originalName: string = '';
    private playerName: string = '';
    public currentPlayer: string | RegExp;
    get logo(): PageItem | undefined {
        return this.currentItem?.logoItem;
    }

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

            const id = this.config.ident ?? '';

            const o = id ? await this.controller.adapter.getForeignObjectAsync(id) : null;

            this.originalName =
                (o?.common &&
                    o.common?.name &&
                    (typeof o.common.name === 'object' ? o.common.name.de || o.common.name.en : o?.common?.name)) ||
                '';
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

        const tempItems: pages.cardMediaDataItems['data'] = await this.basePanel.statesControler.createDataItems(
            tempConfig?.data,
            this,
        );
        const logo = await this.initPageItems(config.logo);

        return {
            card: 'cardMedia',
            ident: config.ident ?? '',
            logo,
            logoItem: undefined,
            dpInit,
            data: tempItems,
        };
    }
    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            let index = this.items.findIndex(i => i.ident === this.currentPlayer);
            index = index === -1 ? 0 : index;
            if (index === 0) {
                this.playerName = '';
            }

            this.currentItem = this.items[index];
            if (this.currentItem && this.currentItem.logo) {
                if (!this.currentItem.logoItem) {
                    const logoItems = await this.createPageItems(this.currentItem.logo, 'logo');

                    this.currentItem.logoItem = logoItems && logoItems.length > 0 ? logoItems[0] : undefined;
                    if (this.currentItem.logoItem) {
                        this.currentItem.logoItem.canBeHidden = true;
                    }
                }
            }
            this.headlinePos = 0;
            this.titelPos = 0;
            this.artistPos = 0;
        } else {
            for (const item of this.items) {
                if (item.logoItem) {
                    await item.logoItem.delete();
                    item.logoItem = undefined;
                }
            }
        }
        await super.onVisibilityChange(val);
    }

    async updateCurrentPlayer(dp: string, name: string): Promise<void> {
        if (this.currentPlayer === dp) {
            return;
        }
        let index = this.items.findIndex(i => i.ident === dp);
        let newOne = false;
        if (index === -1) {
            if (this.config?.card === 'cardMedia') {
                const reg = tools.getRegExp(`/^${dp.split('.').join('\\.')}/`) || dp;
                this.items.push(await this.createMainItems(this.config, '', reg));
                index = this.items.length - 1;
                this.items[index].ident = dp;
                await this.controller.statesControler.activateTrigger(this);
                newOne = true;
            }
        }
        if (index === 0) {
            this.playerName = '';
        } else {
            this.playerName = name;
        }
        this.currentItem = this.items[index];
        if (newOne) {
            if (this.currentItem && this.currentItem.logo) {
                if (!this.currentItem.logoItem) {
                    const logoItems = await this.createPageItems(this.currentItem.logo, 'logo');
                    this.currentItem.logoItem = logoItems && logoItems.length > 0 ? logoItems[0] : undefined;
                    if (this.currentItem.logoItem) {
                        this.currentItem.logoItem.canBeHidden = true;
                    }
                }
            }
        }
        this.currentPlayer = dp;
        await this.update();
    }

    async update(): Promise<void> {
        if (!this.visibility || this.sleep) {
            return;
        }

        // Find current item by player ident, fallback to first item
        let index = this.items.findIndex(i => i.ident === this.currentPlayer);
        index = index === -1 ? 0 : index;
        if (index === 0) {
            this.playerName = '';
        }

        this.currentItem = this.items[index];
        const item = this.currentItem;
        if (!item) {
            return;
        }

        const message: Partial<pages.PageMediaMessage> = {};

        // ---------------------
        // Collect metadata
        // ---------------------
        let duration = '',
            elapsed = '',
            title = '',
            album = '',
            artist = '';

        const isPlaying = await this.isPlaying();
        // Title string
        {
            const v = await tools.getValueEntryString(item.data.title);
            if (v !== null) {
                title = v;
            }
        }

        // Headline: fallback to playerName if needed
        {
            const v = item.data.headline && (await item.data.headline.getString());
            let headline = v ?? '';

            if (!headline) {
                let suffix = title;

                if (!suffix && this.currentItem.ident) {
                    const first = this.currentItem.ident.split('.')[0];
                    switch (first) {
                        case 'alexa2':
                            suffix = 'Alexa';
                            break;
                        case 'spotify-premium':
                            suffix = 'Spotify';
                            break;
                        case 'mpd':
                            suffix = 'MPD';
                            break;
                        case 'sonos':
                            suffix = 'Sonos';
                            break;
                        default:
                            suffix = first;
                            break;
                    }
                    if (!this.playerName && this.originalName) {
                        suffix += `: ${this.originalName}`;
                    }
                }

                headline = this.playerName ? `${this.playerName}: ${suffix}` : suffix;
            }
            message.headline = headline;
        }

        // Artist string
        {
            const v = await tools.getValueEntryString(item.data.artist);
            if (v !== null) {
                artist = v;
            }
        }

        // Duration + elapsed
        if (item.data.duration && item.data.elapsed) {
            const d = await item.data.duration.getNumber(); // media length in ms
            if (d) {
                duration = tools.formatHMS(d);
            }

            if (item.data.elapsed.type === 'string') {
                const e = await item.data.elapsed.getString();
                if (e !== null) {
                    elapsed = e;
                }
            } else if (item.data.elapsed.type === 'number') {
                const e = await item.data.elapsed.getNumber();
                if (e != null) {
                    elapsed = tools.formatHMS(e);
                }
            }
        }

        // Album string
        if (item.data.album) {
            const v = await item.data.album.getString();
            if (v !== null) {
                album = v;
            }
        }

        // ---------------------
        // Headline scrolling
        // ---------------------
        if (message.headline) {
            const { text, nextPos } = tools.buildScrollingText(message.headline, {
                maxSize: 28,
                pos: this.headlinePos,
            });
            message.headline = text;
            this.headlinePos = nextPos;
        }

        // ---------------------
        // Title scrolling with duration/elapsed suffix
        // ---------------------
        {
            const suffix = `| ${elapsed}${duration ? `-${duration}` : ''}`;
            const { text, nextPos } = tools.buildScrollingText(title, {
                maxSize: 37,
                suffix,
                sep: ' ',
                pos: this.titelPos,
            });
            message.name = text;
            this.titelPos = nextPos;
        }

        // ---------------------
        // Artist/Album scrolling
        // ---------------------
        if (album || artist) {
            const div = album && artist ? ' | ' : '';
            const scrollText = album + div + artist;

            const { text, nextPos } = tools.buildScrollingText(scrollText, {
                maxSize: 37,
                pos: this.artistPos,
            });

            message.artist = text;
            this.artistPos = nextPos;
        }

        // ---------------------
        // Shuffle icon
        // ---------------------
        message.shuffle_icon = '';
        if (item.data.shuffle?.value?.type) {
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
                    default: {
                        value = null;
                    }
                }
            }
            if (value !== null) {
                message.shuffle_icon = value ? 'shuffle-variant' : 'shuffle-disabled';
            }
        }

        // ---------------------
        // Volume
        // ---------------------
        if (item.data.volume) {
            const v = await tools.getScaledNumber(item.data.volume);
            if (v !== null) {
                message.volume = String(v);
            }
        }

        // ---------------------
        // Play/Pause state (mediaState preferred, fallback isPlaying)
        // ---------------------
        if (item.data.mediaState) {
            const v = await item.data.mediaState.getString();
            if (v !== null) {
                message.iconplaypause = !(await this.getMediaState()) ? 'play' : 'pause';
                if (item.data.stop || item.data.pause) {
                    message.onoffbuttonColor = v.toUpperCase() !== 'STOP' ? '65535' : '1374';
                } else {
                    message.onoffbuttonColor = message.iconplaypause !== 'pause' ? '65535' : '1374';
                }
            }
        } else {
            message.iconplaypause = isPlaying ? 'pause' : 'play';
            if (item.data.stop || item.data.pause) {
                message.onoffbuttonColor = isPlaying ? '65535' : '1374';
            } else {
                message.onoffbuttonColor = message.iconplaypause !== 'pause' ? '65535' : '1374';
            }
        }

        // ---------------------
        // Colors (title, artist, onOff)
        // ---------------------
        if (item.data.title) {
            const v = await tools.getIconEntryColor(item.data.title, isPlaying, Color.Red, Color.Gray);
            if (v !== null) {
                message.titelColor = v;
            }
        }
        if (item.data.artist) {
            const v = await tools.getIconEntryColor(item.data.artist, isPlaying, Color.White, Color.Gray);
            if (v !== null) {
                message.artistColor = v;
            }
        }
        if (item.data.onOffColor) {
            const v = await tools.getIconEntryColor(item.data.onOffColor, isPlaying, Color.White);
            message.onoffbuttonColor = v !== null ? v : 'disable';
        }

        // ---------------------
        // Logo
        // ---------------------
        if (item.logoItem) {
            message.logo = tools.getPayload(await item.logoItem.getPageItemPayload());
        }

        // ---------------------
        // Options / Navigation
        // ---------------------
        const opts: string[] = ['~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~'];
        const pageItems = (await this.getOptions([])).slice(0, this.maxItems);
        message.navigation = this.getNavigation();

        const msg: pages.PageMediaMessage = {
            ...PageMediaMessageDefault,
            ...message,
            id: 'media',
            options: pageItems
                .concat(opts)
                .slice(0, 5)
                .map(o => (o ? o : '~~~~~')) as [string, string, string, string, string],
        };

        this.sendToPanel(this.getMessage(msg), false);
    }

    private async getMediaState(): Promise<boolean | null> {
        if (!this.currentItem) {
            return null;
        }
        const item = this.currentItem.data.mediaState;
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
        if (!this.currentItem) {
            return null;
        }
        const item = this.currentItem.data.mediaState;
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
    async onButtonEvent(event: types.IncomingEvent): Promise<void> {
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
        const items = this.currentItem;
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
                if (items.data.shuffle?.set?.writeable) {
                    await items.data.shuffle.set.setStateFlip();
                } else if (items.data.shuffle?.value?.writeable) {
                    await items.data.shuffle.value.setStateFlip();
                } else {
                    this.log.error(`Missing shuffle controller. Report to dev`);
                }
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
                const onoff = await this.isPlaying();
                if (items.data.mediaState) {
                    if (items.data.mediaState.writeable) {
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

                break;
            }
        }
    }

    static async getPage(
        configManager: ConfigManager,
        page: ScriptConfig.PageMedia,
        gridItem: pages.PageBaseConfig,
        messages: string[],
        justCheck: boolean = false,
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
        const parts = page.media.id.split('.');
        const adapterName = parts[0];

        // View aller Instanzen des Adapters holen
        const view = await adapter.getObjectViewAsync('system', 'instance', {
            startkey: `system.adapter.${adapterName}.`,
            endkey: `system.adapter.${adapterName}.\u9999`,
        });

        if (!view || !view.rows || view.rows.length === 0) {
            const msg = `${page.uniqueName}: Media page id - adapter: ${adapterName} has no instance - not exist - wrong id?!`;
            messages.push(msg);
            if (!justCheck) {
                adapter.log.error(msg);
            }
            return { gridItem, messages };
        }

        // Falls keine Instanznummer angegeben wurde (z. B. "alexa2"), wähle die kleinste gefundene
        if (parts.length === 1) {
            const instanceNums = view.rows
                .map(r => r.id.split('.').pop())
                .filter(n => n && /^\d+$/.test(n))
                .map(n => parseInt(n!, 10))
                .sort((a, b) => a - b);

            if (instanceNums.length > 0) {
                const chosen = String(instanceNums[0]);
                page.media.id = `${adapterName}.${chosen}`;
                adapter.log.debug(
                    `${page.uniqueName}: No instance in media id provided, using lowest available: ${page.media.id}`,
                );
                // parts für nachfolgende Checks aktualisieren
                parts.push(chosen);
            } else {
                const msg = `${page.uniqueName}: No numeric instance found for adapter ${adapterName}.`;
                messages.push(msg);
                if (!justCheck) {
                    adapter.log.error(msg);
                }
                return { gridItem, messages };
            }
        }

        // Sicherstellen, dass die gewählte/angegebene Instanz auch wirklich existiert
        const instanceId = `system.adapter.${parts.slice(0, 2).join('.')}`;
        if (view.rows.findIndex(v => v.id === instanceId) === -1) {
            const msg = `${page.uniqueName}: Media page id - adapter: ${parts.slice(0, 2).join('.')} has no instance - not exist - wrong id?!`;
            messages.push(msg);
            if (!justCheck) {
                adapter.log.error(msg);
            }
            return { gridItem, messages };
        }

        gridItem.config.card = 'cardMedia';

        if (page.media.id.startsWith('spotify-premium.')) {
            return await getPageSpotify(configManager, page, gridItem, messages, justCheck);
        }
        if (page.media.id.startsWith('alexa2.')) {
            return await getPageAlexa(configManager, page, gridItem, messages, justCheck);
        }
        if (page.media.id.startsWith('mpd.')) {
            return await getPageMpd(configManager, page, gridItem, messages, justCheck);
        }
        if (page.media.id.startsWith('sonos.')) {
            return await getPageSonos(configManager, page, gridItem, messages, justCheck);
        }

        const msg = `${page.uniqueName}: Media page id ${page.media.id} is not supported - only alexa2, spotify-premium, mpd, and sonos!`;
        messages.push(msg);
        adapter.log.warn(msg);

        return { gridItem, messages };
    }
    public async isPlaying(): Promise<boolean> {
        return (await this.currentItem?.data.isPlaying?.getBoolean()) ?? false;
    }
    /**
     * Handles a popup request.
     *
     * @param id - The ID of the item.
     * @param popup - The popup type.
     * @param action - The action to be performed.
     * @param value - The value associated with the action.
     * @param _event - The incoming event.
     * @returns A promise that resolves when the popup request is handled.
     */
    public async onPopupRequest(
        id: number | string,
        popup: types.PopupType | undefined,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        action: types.ButtonActionType | undefined | string,
        value: string | undefined,
        _event: types.IncomingEvent | null = null,
    ): Promise<void> {
        if (!this.pageItems || id == '') {
            this.log.debug(
                `onPopupRequest: No pageItems or id this is only a warning if u used a pageitem except: 'arrow': ${id}`,
            );
            return;
        }
        let item: PageItem | undefined;
        if (isNaN(Number(id)) && typeof id === 'string') {
            if (id === 'media') {
                return;
            }

            if (!(id in this)) {
                return;
            }
            const temp = (this as any)[id];
            if (!(temp instanceof PageItem)) {
                this.log.error(`onPopupRequest: id ${id} is not a PageItem!`);
                return;
            }
            item = temp;
        } else {
            await super.onPopupRequest(id, popup, action, value, _event);
            return;
        }
        if (!item) {
            this.log.error(`onPopupRequest: Cannot find PageItem for id ${id}`);
            return;
        }
        let msg: string | null = null;
        if (action && value !== undefined && (await item.onCommand(action, value))) {
            return;
        } else if (types.isPopupType(popup) && action !== 'bExit') {
            this.basePanel.lastCard = '';
            await this.basePanel.setActivePage(false);
            msg = await item.GeneratePopup(popup);
            this.sleep = false;
        }
        if (msg !== null) {
            this.sleep = true;
            this.sendToPanel(msg, false);
        }
    }

    async delete(): Promise<void> {
        await super.delete();
        for (const item of this.items) {
            if (item.logoItem) {
                await item.logoItem.delete();
                item.logoItem = undefined;
            }
        }
        this.items = [];
        this.currentItem = undefined;
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
        | Record<types.BooleanUnion, Dataitem | undefined>
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
