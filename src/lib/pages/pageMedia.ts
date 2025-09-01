import { isDataItem, type Dataitem } from '../classes/data-item';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import type { ColorEntryType } from '../types/type-pageItem';
import type * as pages from '../types/pages';
import type { BooleanUnion, IncomingEvent } from '../types/types';
import { Page, isMediaButtonActionType } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import * as tools from '../const/tools';

import type { ConfigManager } from '../classes/config-manager';
import type { PageItem } from './pageItem';
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
    items: pages.cardMediaDataItems[] = [];
    currentItems: pages.cardMediaDataItems | undefined;
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private artistPos: number = 0;
    private nextArrow: boolean = false;
    private playerName: string = '';
    private tempItems: (PageItem | undefined)[] | undefined;
    public currentPlayer: string;

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
        if (typeof this.dpInit !== 'string') {
            throw new Error('Media page must have a dpInit string');
        }
        this.currentPlayer = this.dpInit;
        this.config = options.config;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        if (this.config?.card === 'cardMedia') {
            this.items.push(await this.createMainItems(this.config, this.enums, this.dpInit));
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
        } else {
            this.tempItems = [];
        }
    }

    async updateCurrentPlayer(dp: string, name: string): Promise<void> {
        if (this.currentPlayer === dp) {
            return;
        }
        let index = this.items.findIndex(i => i.dpInit === dp);
        if (index === -1) {
            if (this.config?.card === 'cardMedia') {
                this.items.push(await this.createMainItems(this.config, '', dp));
                index = this.items.length - 1;
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
        let index = this.items.findIndex(i => i.dpInit === this.currentPlayer);
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
                title = 'unknown',
                album = '',
                artist = '';

            {
                const v = await tools.getValueEntryString(item.data.title);
                if (v !== null) {
                    title = v;
                }
            }
            message.headline =
                (item.data.headline && (await item.data.headline.getString())) || this.playerName
                    ? `${this.playerName}: ${title}`
                    : title;

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
                if (item.data.stop) {
                    message.onoffbuttonColor = v.toUpperCase() !== 'STOP' ? '65535' : '1374';
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
        if (!this.tempItems || this.step <= 1) {
            this.tempItems = await this.getEnabledPageItems();
        }
        if (this.tempItems) {
            const localStep = this.tempItems.length > 6 ? 4 : 5;
            if (this.tempItems.length - 1 <= localStep * (this.step - 1)) {
                this.step = 1;
            }
            // arrow is at index [0]
            const maxSteps = localStep * this.step + 1;
            const minStep = localStep * (this.step - 1) + 1;
            let b = minStep;
            for (let a = minStep; a < maxSteps; a++) {
                const temp = this.tempItems[b++];
                if (temp && !temp.unload) {
                    if (!this.visibility) {
                        return;
                    }
                    const msg = await temp.getPageItemPayload();
                    if (msg) {
                        opts[a - minStep] = msg;
                    } else {
                        a--;
                    }
                } else {
                    opts[a - minStep] = '~~~~~';
                }
            }

            if (localStep === 4) {
                this.nextArrow = true;
                const temp = this.tempItems[0];
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
        this.step = 1;
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
                if (event.id === '0' && this.nextArrow) {
                    this.step++;
                    await this.update();
                } else if (event.id === `${this.name}-logo`) {
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
        if (!page.media.id) {
            const msg = `${page.uniqueName}: Media page has no device id!`;
            messages.push(msg);
            adapter.log.warn(msg);
            return { gridItem, messages };
        }
        gridItem.config.card = 'cardMedia';
        let o;
        try {
            o = await adapter.getForeignObjectAsync(page.media.id);
        } catch {
            //nothing
        }
        if (!o) {
            const msg = `${page.uniqueName}: Media page id ${page.media.id} has no object!`;
            messages.push(msg);
            adapter.log.warn(msg);
            return { gridItem, messages };
        }
        gridItem.dpInit = page.media.id;
        gridItem = {
            ...gridItem,
            config: {
                card: 'cardMedia',
                data: {
                    headline: page.media.name
                        ? await configManager.getFieldAsDataItemConfig(page.media.name)
                        : undefined,

                    album: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.album',
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },
                    title: {
                        value: {
                            mode: 'auto',
                            type: 'triggered',
                            role: 'media.title',
                            regexp: /.?\.Player\..?/,
                            dp: '',
                        },

                        true: page.media.colorMediaArtist
                            ? {
                                  color: await configManager.getFieldAsDataItemConfig(page.media.colorMediaArtist),
                              }
                            : undefined,
                    },
                    duration: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.duration',
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },
                    onOffColor: {
                        true: page.media.colorMediaIcon
                            ? { color: await configManager.getFieldAsDataItemConfig(page.media.colorMediaIcon) }
                            : undefined,
                    },
                    elapsed: {
                        mode: 'auto',
                        type: 'triggered',
                        role: ['media.elapsed', 'media.elapsed.text'],
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },
                    volume: {
                        value: {
                            mode: 'auto',
                            type: 'state',
                            role: ['level.volume'],
                            scale: { min: 0, max: 100 },
                            regexp: /.?\.Player\..?/,
                            dp: '',
                        },
                        set: {
                            mode: 'auto',
                            type: 'state',
                            role: ['level.volume'],
                            scale: { min: 0, max: 100 },
                            regexp: /.?\.Player\..?/,
                            dp: '',
                        },
                    },
                    artist: {
                        value: {
                            mode: 'auto',
                            type: 'state',
                            role: 'media.artist',
                            regexp: /.?\.Player\..?/,
                            dp: '',
                        },
                        true: page.media.colorMediaArtist
                            ? {
                                  color: await configManager.getFieldAsDataItemConfig(page.media.colorMediaArtist),
                              }
                            : undefined,
                    },
                    shuffle: {
                        value: {
                            mode: 'auto',
                            type: 'state',
                            role: 'media.mode.shuffle',
                            regexp: /.?\.Player\..?/,
                            dp: '',
                        },
                        set: {
                            mode: 'auto',
                            type: 'state',
                            role: 'media.mode.shuffle',
                            regexp: /.?\.Player\..?/,
                            dp: '',
                        },
                        enabled: {
                            mode: 'auto',
                            type: 'triggered',
                            role: 'indicator',
                            regexp: /.?\.Player\.allowShuffle$/,
                            dp: '',
                        },
                    },
                    icon: {
                        type: 'const',
                        constVal: 'dialpad',
                    },
                    play: {
                        mode: 'auto',
                        type: 'state',
                        role: ['button.play'],
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },
                    isPlaying: {
                        mode: 'auto',
                        type: 'triggered',
                        role: ['media.state'],
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },
                    mediaState: {
                        mode: 'auto',
                        type: 'triggered',
                        role: ['media.state'],
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },
                    stop: {
                        mode: 'auto',
                        type: 'state',
                        role: ['button.stop'],
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },
                    pause: {
                        mode: 'auto',
                        type: 'state',
                        role: 'button.pause',
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },
                    forward: {
                        mode: 'auto',
                        type: 'state',
                        role: 'button.next',
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },
                    backward: {
                        mode: 'auto',
                        type: 'state',
                        role: 'button.prev',
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },
                    logo: {
                        on: {
                            type: 'const',
                            constVal: true,
                        },
                        text: { type: 'const', constVal: '1' },
                        icon: { true: { type: 'const', constVal: 'logo-alexa' } },
                        color: { type: 'const', constVal: { r: 250, b: 250, g: 0 } },
                        list: undefined,
                        action: 'cross',
                    },
                },
            },
            items: undefined,
            pageItems: [
                {
                    //reminder
                    role: 'text.list',
                    type: 'text',
                    dpInit: '',

                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'reminder' },
                                color: { type: 'const', constVal: Color.attention },
                            },
                        },
                        entity1: {
                            value: {
                                type: 'const',
                                constVal: true,
                            },
                        },
                        enabled: {
                            mode: 'auto',
                            type: 'triggered',
                            role: 'value',
                            regexp: /.?\.Reminder\.triggered$/,
                            dp: '',
                            read: 'return (val != null && lc <= Date.now() + 120000 ? true : false);',
                        },
                    },
                },
                {
                    // online
                    role: '',
                    type: 'text',
                    dpInit: '',

                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'wifi' },
                                color: { type: 'const', constVal: Color.good },
                            },
                            false: {
                                value: { type: 'const', constVal: 'wifi-off' },
                                color: { type: 'const', constVal: Color.attention },
                            },
                            scale: undefined,
                            maxBri: undefined,
                            minBri: undefined,
                        },
                        entity1: {
                            value: {
                                mode: 'auto',
                                type: 'triggered',
                                role: 'indicator.reachable',
                                regexp: /.?\.online$/,
                                dp: '',
                            },
                        },

                        enabled: {
                            mode: 'auto',
                            type: 'triggered',
                            role: 'indicator.reachable',
                            regexp: /.?\.online$/,
                            dp: '',
                            read: 'return !val;',
                        },
                    },
                },
                {
                    //speaker select
                    role: 'alexa-speaker',
                    type: 'input_sel',

                    data: {
                        color: {
                            true: {
                                type: 'const',
                                constVal: Color.HMIOn,
                            },
                            false: undefined,
                        },
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'speaker-multiple' },
                                color: { type: 'const', constVal: Color.good },
                            },
                            false: {
                                value: { type: 'const', constVal: 'speaker-multiple' },
                                color: { type: 'const', constVal: Color.bad },
                            },
                            scale: undefined,
                            maxBri: undefined,
                            minBri: undefined,
                        },
                        entityInSel: {
                            value: {
                                mode: 'auto',
                                type: 'triggered',
                                regexp: /.?\.Info\.name$/,
                                dp: '',
                            },
                            set: {
                                mode: 'auto',
                                type: 'state',
                                regexp: /.?\.Commands\.textCommand$/,
                                dp: '',
                            },
                            decimal: undefined,
                            factor: undefined,
                            unit: undefined,
                        },
                        headline: {
                            type: 'const',
                            constVal: 'speakerList',
                        },
                        /**
                         * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                         */
                        valueList: {
                            type: 'const',
                            constVal: JSON.stringify(page.media.speakerList || []),
                        },
                        /**
                         * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                         */
                        setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
                    },
                },
                {
                    role: 'alexa-playlist',
                    type: 'input_sel',
                    dpInit: '',

                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'playlist-play' },
                                color: { type: 'const', constVal: Color.activated },
                            },
                        },
                        entityInSel: {
                            value: {
                                type: 'const',
                                constVal: 'My Playlist',
                            },
                        },
                        valueList: {
                            type: 'const',
                            constVal: JSON.stringify(page.media.playList || []),
                        },
                        headline: {
                            type: 'const',
                            constVal: 'playList',
                        },
                    },
                },
                {
                    //equalizer
                    role: '',
                    type: 'number',
                    dpInit: '',

                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'equalizer-outline' },
                                color: { type: 'const', constVal: Color.activated },
                            },

                            scale: undefined,
                            maxBri: undefined,
                            minBri: undefined,
                        },
                        heading1: {
                            type: 'const',
                            constVal: 'treble',
                        },
                        heading2: {
                            type: 'const',
                            constVal: 'midrange',
                        },
                        heading3: {
                            type: 'const',
                            constVal: 'bass',
                        },
                        zero1: {
                            type: 'const',
                            constVal: 6,
                        },
                        zero2: {
                            type: 'const',
                            constVal: 6,
                        },
                        zero3: {
                            type: 'const',
                            constVal: 6,
                        },
                        entity1: {
                            value: {
                                mode: 'auto',
                                type: 'state',
                                regexp: /.?\.Preferences\.equalizerTreble$/,
                                dp: '',
                            },
                            minScale: {
                                type: 'const',
                                constVal: -6,
                            },
                            maxScale: {
                                type: 'const',
                                constVal: 6,
                            },
                            decimal: {
                                type: 'const',
                                constVal: 0,
                            },
                        },
                        minValue1: {
                            type: 'const',
                            constVal: 0,
                        },
                        maxValue1: {
                            type: 'const',
                            constVal: 12,
                        },

                        entity2: {
                            value: {
                                mode: 'auto',
                                type: 'state',
                                regexp: /.?\.Preferences\.equalizerMidRange$/,
                                dp: '',
                            },
                            minScale: {
                                type: 'const',
                                constVal: -6,
                            },
                            maxScale: {
                                type: 'const',
                                constVal: 6,
                            },
                            decimal: {
                                type: 'const',
                                constVal: 0,
                            },
                        },
                        minValue2: {
                            type: 'const',
                            constVal: 0,
                        },
                        maxValue2: {
                            type: 'const',
                            constVal: 12,
                        },
                        entity3: {
                            value: {
                                mode: 'auto',
                                type: 'state',
                                regexp: /.?\.Preferences\.equalizerBass$/,
                                dp: '',
                            },
                            minScale: {
                                type: 'const',
                                constVal: -6,
                            },
                            maxScale: {
                                type: 'const',
                                constVal: 6,
                            },
                            decimal: {
                                type: 'const',
                                constVal: 0,
                            },
                        },
                        minValue3: {
                            type: 'const',
                            constVal: 0,
                        },
                        maxValue3: {
                            type: 'const',
                            constVal: 12,
                        },
                        text: {
                            true: {
                                type: 'const',
                                constVal: 'equalizer',
                            },
                        },
                    },
                },
                {
                    // repeat
                    role: '',
                    type: 'text',
                    dpInit: '',

                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'repeat-variant' },
                                color: { type: 'const', constVal: Color.activated },
                            },
                            false: {
                                value: { type: 'const', constVal: 'repeat' },
                                color: { type: 'const', constVal: Color.deactivated },
                            },
                            scale: undefined,
                            maxBri: undefined,
                            minBri: undefined,
                        },
                        entity1: {
                            value: {
                                mode: 'auto',
                                type: 'triggered',
                                role: 'media.mode.repeat',
                                regexp: /\.Player\.controlRepeat$/,
                                dp: '',
                            },
                        },

                        enabled: {
                            mode: 'auto',
                            type: 'triggered',
                            role: 'indicator',
                            regexp: /\.Player\.allowRepeat$/,
                            dp: '',
                        },
                    },
                },
            ],
            uniqueID: page.uniqueName,
        };

        return { gridItem, messages };
    }
    public async isPlaying(): Promise<boolean> {
        return (await this.currentItems?.data.isPlaying?.getBoolean()) ?? false;
    }

    async delete(): Promise<void> {
        await super.delete();
        this.tempItems = undefined;
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
