import { Dataitem, isDataItem } from '../classes/data-item';
import { AdapterClassDefinition } from '../classes/library';
import { White, rgb_dec565 } from '../const/color';
import { Icons } from '../const/icon_mapping';
import { Panel } from '../controller/panel';
import { PageTypeCards } from '../types/pages';
import { BooleanUnion, ColorEntryType, DataItemsOptions, IncomingEvent, RGB } from '../types/types';
import { Page } from './Page';

export const commands = {
    cardMedia: {
        on: '1374',
        pause: '65535',
    },
};
/*type PageMediaConfigInterface = ChangeTypeOfKeys<
    Alexa | Sonos | Squeezeboxrpc | SpotifyPremium | Volumio | Bose,
    DataItemsOptions
>;*/
export type PageMediaDataInterface = PageMediaBase; //Alexa | Sonos | Squeezeboxrpc | SpotifyPremium | Volumio | Bose;

const PageMediaMessageDefault: PageMediaMessage = {
    event: 'entityUpd',
    headline: '',
    getNavigation: '~~~~~~~~~',
    id: '',
    title: '',
    titelColor: String(rgb_dec565(White)),
    artist: '',
    artistColor: String(rgb_dec565(White)),
    volume: '',
    iconplaypause: '',
    onoffbutton: '',
    shuffle_icon: '',
    logo: '',
    options: ['', '', '', '', ''],
};
/*export interface Alexa extends PageMediaBase {
    type: 'alexa2';
    config: PageMediaBase['config'] & { device: string };
}
export interface Sonos extends PageMediaBase {
    type: 'sonos';
    dp: string;
    config: PageMediaBase['config'] & { device: string };
}
export interface Squeezeboxrpc extends PageMediaBase {
    type: 'squeezeboxrpc';
    config: PageMediaBase['config'] & { device: string };
}
export interface SpotifyPremium extends PageMediaBase {
    type: 'spotify-premium';
}
export interface Volumio extends PageMediaBase {
    type: 'volumio';
}
export interface Bose extends PageMediaBase {
    type: 'bosesoundtouch';
}*/
type PageMediaBase = {
    //    type: PlayerType;
    initMode: 'auto' | 'custom';
    dpInit: string; // '' and initMode 'auto' throw an error
    //    mediaNamespace: string;
    config: ChangeTypeOfKeys<PageMediaBaseConfig, DataItemsOptions | undefined> & {
        toolbox: (toolboxItem | undefined)[];
    } & { logo: toolboxItem | undefined };
    items:
        | (ChangeTypeOfKeys<PageMediaBaseConfig, Dataitem | undefined> & {
              toolbox: (toolboxItemDataItem | undefined)[];
          } & { logo: toolboxItemDataItem | undefined })
        | undefined;
    writeItems: PageMediaBaseConfigWrite | undefined;
};

type ChangeTypeOfKeys<Obj, N> = Obj extends object | listItem | PageTypeCards | iconBoolean | ColorEntryType
    ? Obj extends RGB
        ? N
        : { [K in keyof Obj]-?: ChangeTypeOfKeys<Obj[K], N> }
    : N;

type PageMediaBaseConfig = {
    card: PageTypeCards;
    heading: string;
    alwaysOnDisplay: boolean;
    album: string;
    titel: listItem;
    duration: string;
    elapsed: string;
    artist: listItem;
    shuffle: string;
    volume: number;
    icon: string;
    play: string;
    mediaState: string;
    stop: string;
    pause: string;
    forward: string;
    backward: string;
};

type toolboxItem = ChangeTypeOfKeys<listItem, DataItemsOptions | undefined> & { action: MediaToolBoxAction };

type toolboxItemDataItem = ChangeTypeOfKeys<listItem, Dataitem | undefined> & { action: MediaToolBoxAction };

export type PageMediaBaseConfigWrite = {
    pplay: writeItem;
    pause: writeItem;
    forward: writeItem;
    backward: writeItem;
    stop: writeItem;
    off: writeItem;
    shuffle: writeItem;
    tracklist: writeItem;
    playlist: writeItem;
    equalizerList: writeItem;
    repeat: writeItem;
    toolstring: writeItem;
};
export type PageMediaMessage = {
    event: 'entityUpd';
    headline: string;
    getNavigation: string;
    id: string;
    title: string;
    titelColor: string;
    artist: string;
    artistColor: string;
    volume: string;
    iconplaypause: string;
    onoffbutton: string;
    shuffle_icon: string;
    logo: string;
    options: [
        (messageItem | string)?,
        (messageItem | string)?,
        (messageItem | string)?,
        (messageItem | string)?,
        (messageItem | string)?,
    ];
};
type writeItem = { dp: string } | undefined;
type listItem =
    | {
          on: string;
          text: string;
          color: ColorEntryType | string | undefined;
          icon: iconBoolean | string | undefined;
          list: string | undefined;
      }
    | undefined;

export type iconBoolean = Record<BooleanUnion, string | undefined>;
export type messageItem = {
    event?: 'input_sel' | '' | 'button';
    pageId: string;
    iconNumber: 0 | 1 | 2 | 3 | 4 | 5; // media0 usw.
    mode: MediaToolBoxAction;
    icon: string;
    color: string;
    name: string;
    ident?: string;
};

type MediaToolBoxAction =
    | 'speaker'
    | 'play'
    | 'tool'
    | 'track'
    | 'favor'
    | 'equal'
    | 'repeat'
    | 'seek'
    | 'cross'
    | 'nexttool';

const messageItemDefault: Required<Omit<messageItem, 'iconNumber' | 'mode'>> = {
    event: 'input_sel',
    pageId: '',
    icon: '',
    color: '',
    name: '',
    ident: '',
};

const ArrayPlayerTypeWithMediaDevice = ['alexa2', 'sonos', 'squeezeboxrpc'] as const;
const ArrayPlayerTypeWithOutMediaDevice = ['spotify-premium', 'volumio', 'bosesoundtouch'] as const;

export type PlayerType =
    | (typeof ArrayPlayerTypeWithMediaDevice)[number]
    | (typeof ArrayPlayerTypeWithOutMediaDevice)[number]
    | 'sonstiges';
const steps = 4;
export class PageMedia1 extends Page implements PageMediaDataInterface {
    config: PageMediaDataInterface['config'];
    initMode: 'auto' | 'custom';
    dpInit: string;
    panel: Panel;
    items: PageMediaDataInterface['items'];
    writeItems: PageMediaBaseConfigWrite | undefined;
    private step: number = 0;
    private headlinePos: number = 0;
    private volume: number = 0;

    constructor(adapter: AdapterClassDefinition, panel: Panel, options: PageMediaDataInterface, name: string) {
        super(adapter, panel.panelSend, options.config.card, name);
        this.config = options.config;
        this.panel = panel;
        this.writeItems = options.writeItems;
        this.items = options.items;
        this.initMode = options.initMode;
        this.dpInit = options.dpInit;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        const config = { ...this.config };
        // search states for mode auto
        const tempConfig: Partial<PageMediaDataInterface['config']> =
            this.initMode === 'auto' ? await this.panel.readOnlyDB.getDataItemsFromAuto(this.dpInit, config) : {};
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<PageMediaDataInterface['items']> = await this.panel.readOnlyDB.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as PageMediaDataInterface['items'];
        //check if command dps are valid
        for (const g in this.writeItems) {
            const d = g as keyof typeof this.writeItems;
            const item = this.writeItems[d];
            if (item === undefined) continue;
            if (!item.dp || !(await this.panel.readOnlyDB.existsState(item.dp))) {
                this.log.warn(`State ${item.dp} was not found!`);
                this.writeItems[d] = undefined;
            }
        }
    }
    sendType(): void {
        this.sendToPanel('pageType~cardMedia');
    }
    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            this.sendType();
            this.update();
        }
    }
    async update(): Promise<void> {
        const item = this.items;
        if (item === undefined) return;
        const message: Partial<PageMediaMessage> = {};
        // title
        {
            let duration = '0:00',
                elapsed = '0:00',
                title = 'unknown';
            if (item.album) {
                const v = await item.album.getString();
                if (v !== null) {
                    const maxSize = 18;
                    if (v.length > maxSize) {
                        const s = v + '          ';
                        this.headlinePos = this.headlinePos % s.length;
                        message.headline = (s + v).substring(this.headlinePos++ % (v + s).length).substring(0, 23);
                    } else {
                        message.headline = v;
                    }
                }
            }
            if (item.titel && item.titel.text) {
                const v = await item.titel.text.getString();
                if (v !== null) {
                    title = v;
                }
            }
            if (item.artist && item.artist.text) {
                const v = await item.artist.text.getString();
                if (v !== null) {
                    message.artist = v;
                }
            }
            if (item.duration && item.elapsed) {
                const d = await item.duration.getNumber(); // medialength in seconds
                if (d !== null) {
                    const t = new Date().setHours(0, 0, d, 0);
                    duration = new Date(t).toLocaleTimeString('de-DE', { minute: '2-digit', second: '2-digit' });
                }
                if (item.elapsed.type === 'string') {
                    const e = await item.elapsed.getString();
                    if (e !== null) {
                        elapsed = e;
                    }
                } else if (item.elapsed.type === 'number') {
                    const e = await item.elapsed.getNumber();
                    if (e !== null) {
                        const t = new Date().setHours(0, 0, e, 0);
                        elapsed = new Date(t).toLocaleTimeString('de-DE', { minute: '2-digit', second: '2-digit' });
                    }
                }
            }
            message.title = `${title} (${elapsed}|${duration})`;
        }
        message.shuffle_icon = '';
        if (item.shuffle && item.shuffle.type) {
            let value: null | true | false = null;
            switch (item.shuffle.type) {
                case 'string': {
                    const v = await item.shuffle.getString();
                    if (v !== null) {
                        value = ['OFF', 'FALSE'].indexOf(v.toUpperCase()) !== -1;
                    }
                    break;
                }
                case 'number':
                case 'boolean': {
                    value = await item.shuffle.getBoolean();
                    break;
                }
                case 'undefined':
                case 'object':
                case 'array':
                case 'mixed':
                case 'file': {
                    value = null;
                    break;
                }
            }
            if (value !== null) {
                message.shuffle_icon = value ? 'shuffle-variant' : 'shuffle-disabled';
            }
        }
        if (item.volume) {
            const v = await item.volume.getNumber();
            if (v !== null) {
                this.volume = v;
                message.volume = String(v);
            }
        }
        if (item.mediaState) {
            const v = await item.mediaState.getString();
            if (v !== null) {
                message.iconplaypause = (await this.getMediaState()) ? 'play' : 'pause';
                if (await item.stop) {
                    message.onoffbutton = v.toUpperCase() === 'STOP' ? '65535' : '1374';
                } else {
                    // no stop control so pause is stop
                    message.onoffbutton = message.iconplaypause;
                }
            }
        }

        if (item.titel && item.titel.color) {
            const v = await getValueFromBoolean(item.titel.color, 'color');
            if (v !== null) message.titelColor = v;
        }

        message.options = [undefined, undefined, undefined, undefined, undefined];
        if (item.toolbox && Array.isArray(item.toolbox)) {
            const localStep = item.toolbox.length > 5 ? steps : 5;
            if (item.toolbox.length > localStep * this.step) this.step = 1;
            const maxSteps = localStep * this.step;

            for (let a = maxSteps - localStep; a < maxSteps; a++) {
                message.options[a] = await this.getToolItem(item.toolbox[a], String(a), (a % localStep) + 1);
            }
            if (localStep === 4) {
                const color = String(rgb_dec565(White));
                const icon = 'arrow-right';
                message.options[4] = {
                    pageId: `5`,
                    iconNumber: 5,
                    icon: Icons.GetIcon(icon),
                    color,
                    mode: 'nexttool',
                    name: 'next',
                };
            }
        }
        //Logo
        if (item.logo) {
            message.logo = this.getBottomMessages(await this.getToolItem(item.logo, 'logo', 5));
        }
        {
        }
        const opts: string[] = [];
        for (const a in message.options) {
            const temp = message.options[a];
            if (typeof temp === 'object') opts.push(this.getBottomMessages(temp));
        }
        const msg: PageMediaMessage = Object.assign(PageMediaMessageDefault, message, {
            getNavigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
            id: 'media',
            options: opts,
        });
        this.sendToPanel(this.getMessage(msg));
        //this.log.warn(JSON.stringify(this.getMessage(msg)));
    }
    private async getMediaState(): Promise<boolean | null> {
        if (!this.items) return null;
        const item = this.items.mediaState;
        if (item) {
            const v = await item.getString();
            if (v !== null) {
                return ['PLAY', '1', 'TRUE'].indexOf(v.toUpperCase()) !== -1;
            }
        }
        return null;
    }
    private async getOnOffState(): Promise<boolean | null> {
        if (!this.items) return null;
        const item = this.items.mediaState;
        if (item) {
            const v = await item.getString();
            if (v !== null) {
                return ['STOP', '0', 'FALSE'].indexOf(v.toUpperCase()) === -1;
            }
        }
        return null;
    }
    private async getToolItem(
        i: toolboxItemDataItem | undefined,
        id: string,
        iconNumber: number,
    ): Promise<messageItem | undefined> {
        if (i) {
            if (i.on && i.text && i.color && i.icon) {
                const v = await i.on.getBoolean();
                const color = await getValueFromBoolean(i.color, 'color', !!v);
                const icon = await getValueFromBoolean(i.icon, 'string', !!v);
                const text = await i.text.getString();
                const list = i.list ? await i.list.getString() : null;
                if (list) this.log.debug(JSON.stringify(list));
                if (color && icon && text) {
                    const tool: messageItem = {
                        pageId: `${id}`,
                        iconNumber: iconNumber as 1 | 2 | 3 | 4 | 5,
                        icon: Icons.GetIcon(icon),
                        color,
                        mode: i.action,
                        name: this.adapter.library.getLocalTranslation('media', text),
                    };
                    return tool;
                }
            }
        }
        return undefined;
    }

    private getMessage(message: PageMediaMessage): string {
        return this.getPayload(
            'entityUpd',
            message.headline,
            message.getNavigation,
            message.id,
            message.title,
            message.titelColor,
            message.artist,
            message.artistColor,
            message.volume,
            Icons.GetIcon(message.iconplaypause),
            Icons.GetIcon(message.onoffbutton),
            Icons.GetIcon(message.shuffle_icon),
            message.logo, //'~~~~~'
            this.getPayloadArray(message.options),
        );
    }
    /**
     * Create a part of the panel messsage for bottom icons. if event === '' u get '~~~~~~'.
     * default for event: input_sel
     * @param msg
     * @returns string
     */
    private getBottomMessages(
        msg:
            | (Partial<messageItem> & { iconNumber: messageItem['iconNumber']; pageId: messageItem['pageId'] })
            | undefined,
    ): string {
        if (!msg || !msg.pageId || !msg.icon || msg.event === '') return '~~~~~';
        msg.event = msg.event === undefined ? 'input_sel' : msg.event;
        msg.pageId = `${this.id}?${msg.pageId}?${msg.mode}`;
        const iconNumber = msg.iconNumber;
        const temp: Partial<messageItem> = msg;
        delete temp.mode;
        delete temp.iconNumber;
        msg.ident = msg.ident || 'media0';
        const message: typeof messageItemDefault = Object.assign(messageItemDefault, temp);

        switch (iconNumber) {
            case 0: {
                message.ident = 'media0';
                break;
            }
            case 1: {
                message.ident = 'media1';
                break;
            }
            case 2: {
                message.ident = 'media2';
                break;
            }
            case 3: {
                message.ident = 'media3';
                break;
            }
            case 4: {
                message.ident = 'media4';
                break;
            }
            case 5: {
                message.ident = 'media5';
                break;
            }
        }
        return this.getPayload(message.event, message.pageId, message.icon, message.color, message.name, message.ident);
    }
    onStateTrigger = async (): Promise<void> => {
        this.update();
    };
    async onButtonEvent(event: IncomingEvent): Promise<void> {
        if (event.mode !== 'media') return;
        if (isMediaButtonActionType(event.command)) {
            this.log.debug('Receive event: ' + JSON.stringify(event));
        } else return;
        const items = this.items;
        if (!items) return;
        switch (event.command) {
            case 'media-back': {
                items.backward && (await items.backward.setStateTrue());
                break;
            }
            case 'media-pause': {
                if (items.pause && items.play) {
                    if (await this.getMediaState()) await items.pause.setStateTrue();
                    else await items.play.setStateTrue();
                } else if (items.mediaState) {
                }
                break;
            }
            case 'media-next': {
                items.forward && (await items.forward.setStateTrue());
                break;
            }
            case 'media-shuffle': {
                items.shuffle && (await items.shuffle.setStateTrue());
                break;
            }
            case 'volumeSlider': {
                if (items.volume) {
                    let v = parseInt(event.opt);
                    if (v > 100) v = 100;
                    else if (v < 0) v = 0;
                    await items.volume.setStateAsync(v);
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
                if (items.stop) {
                    if (await this.getOnOffState()) await items.stop.setStateTrue();
                }

                break;
            }
        }
    }
}
export const testConfigMedia: PageMediaDataInterface = {
    //type: 'sonstiges',
    dpInit: 'alexa2.0.Echo-Devices.G091EV0704641J8R.Player',
    initMode: 'auto',
    config: {
        card: 'cardMedia',
        heading: {
            type: 'const',
            constVal: 'test',
        },
        alwaysOnDisplay: {
            type: 'const',
            constVal: 'test',
        },
        album: {
            mode: 'auto',
            type: 'state',
            role: 'media.album',
            dp: '',
        },
        titel: {
            on: {
                type: 'const',
                constVal: true,
            },
            text: {
                mode: 'auto',
                type: 'triggered',
                role: 'media.title',
                dp: '',
            },
            color: {
                type: 'const',
                constVal: { red: 250, green: 2, blue: 3 },
            },
            icon: undefined,
            list: undefined,
        },
        duration: {
            mode: 'auto',
            type: 'state',
            role: 'media.duration',
            dp: '',
        },
        elapsed: {
            mode: 'auto',
            type: 'triggered',
            role: ['media.elapsed', 'media.elapsed.text'],
            dp: '',
        },
        volume: {
            mode: 'auto',
            type: 'triggered',
            role: ['level.volume'],
            dp: '',
        },
        artist: {
            on: {
                type: 'const',
                constVal: true,
            },
            text: {
                mode: 'auto',
                type: 'state',
                role: 'media.artist',
                dp: '',
            },
            color: undefined,
            icon: {
                type: 'const',
                constVal: 'diameter',
            },
            list: undefined,
        },
        shuffle: {
            mode: 'auto',
            type: 'state',
            role: 'media.mode.shuffle',
            dp: '',
        },
        icon: {
            type: 'const',
            constVal: 'dialpad',
        },
        play: {
            mode: 'auto',
            type: 'state',
            role: ['button.play'],
            dp: '',
        },
        mediaState: {
            mode: 'auto',
            type: 'triggered',
            role: ['media.state'],
            dp: '',
        },
        stop: {
            mode: 'auto',
            type: 'state',
            role: ['button.stop'],
            dp: '',
        },
        pause: {
            mode: 'auto',
            type: 'state',
            role: 'button.pause',
            dp: '',
        },
        forward: {
            mode: 'auto',
            type: 'state',
            role: 'button.next',
            dp: '',
        },
        backward: {
            mode: 'auto',
            type: 'state',
            role: 'button.prev',
            dp: '',
        },
        logo: {
            on: {
                type: 'const',
                constVal: true,
            },
            text: { type: 'const', constVal: '1' },
            icon: { type: 'const', constVal: 'home' },
            color: { type: 'const', constVal: { red: 250, blue: 250, green: 0 } },
            list: undefined,
            action: 'cross',
        },
        toolbox: [
            {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: 'Repeat' },
                icon: { type: 'const', constVal: 'repeat' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: { type: 'state', dp: '', mode: 'auto', role: 'media.playlist' },
                action: 'cross',
            },
            {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },
            {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },
            {
                on: {
                    type: 'const',
                    constVal: false,
                },
                text: { type: 'const', constVal: '1' },
                icon: { true: { type: 'const', constVal: 'reply' }, false: { type: 'const', constVal: 'replay' } },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },
            {
                on: {
                    type: 'const',
                    constVal: false,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },
            /*{
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },*/
        ],
    },
    items: undefined,
    writeItems: undefined,
};

type _selectValueFromBoolean = 'color' | 'string';
export async function getValueFromBoolean(
    item:
        | Record<BooleanUnion, Dataitem | undefined>
        | ChangeTypeOfKeys<ColorEntryType, Dataitem | undefined>
        | Dataitem
        | undefined,
    type: _selectValueFromBoolean,
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
            } else {
                return colorOn || null;
            }
        }
    }
    return null;
}
async function getValueFromData(item: Dataitem, type: _selectValueFromBoolean): Promise<string | null> {
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
function isMediaButtonActionType(F: MediaButtonActionType | string): F is MediaButtonActionType {
    switch (F) {
        case 'media-back':
        case 'media-pause':
        case 'media-next':
        case 'media-shuffle':
        case 'volumeSlider':
        case 'mode-speakerlist':
        case 'mode-playlist':
        case 'mode-tracklist':
        case 'mode-repeat':
        case 'mode-equalizer':
        case 'mode-seek':
        case 'mode-crossfade':
        case 'mode-favorites':
        case 'mode-insel':
        case 'media-OnOff':
            return true;
    }
    console.error(`${F} isMediaButtonActionType === false`);
    return false;
}
type MediaButtonActionType = Extract<
    ButtonActionType,
    | 'media-back'
    | 'media-pause'
    | 'media-next'
    | 'media-shuffle'
    | 'volumeSlider'
    | 'mode-speakerlist'
    | 'mode-playlist'
    | 'mode-tracklist'
    | 'mode-repeat'
    | 'mode-equalizer'
    | 'mode-seek'
    | 'mode-crossfade'
    | 'mode-favorites'
    | 'mode-insel'
    | 'media-OnOff'
>;

export type ButtonActionType =
    | 'bExit'
    | 'bUp'
    | 'bNext'
    | 'bSubNext'
    | 'bPrev'
    | 'bSubPrev'
    | 'bHome'
    | 'notifyAction'
    | 'OnOff'
    | 'button'
    | 'up'
    | 'stop'
    | 'down'
    | 'positionSlider'
    | 'tiltOpen'
    | 'tiltStop'
    | 'tiltSlider'
    | 'tiltClose'
    | 'brightnessSlider'
    | 'colorTempSlider'
    | 'colorWheel'
    | 'tempUpd'
    | 'tempUpdHighLow'
    | 'media-back'
    | 'media-pause'
    | 'media-next'
    | 'media-shuffle'
    | 'volumeSlider'
    | 'mode-speakerlist'
    | 'mode-playlist'
    | 'mode-tracklist'
    | 'mode-repeat'
    | 'mode-equalizer'
    | 'mode-seek'
    | 'mode-crossfade'
    | 'mode-favorites'
    | 'mode-insel'
    | 'media-OnOff'
    | 'timer-start'
    | 'timer-pause'
    | 'timer-cancle'
    | 'timer-finish'
    | 'hvac_action'
    | 'mode-modus1'
    | 'mode-modus2'
    | 'mode-modus3'
    | 'number-set'
    | 'mode-preset_modes'
    | 'A1'
    | 'A2'
    | 'A3'
    | 'A4'
    | 'D1'
    | 'U1';
