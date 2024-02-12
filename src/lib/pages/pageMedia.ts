import { Dataitem, isDataItem } from '../classes/data-item';
import * as Color from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { MessageItemMedia, ColorEntryType } from '../types/type-pageItem';
import * as pages from '../types/pages';
import { BooleanUnion, IncomingEvent } from '../types/types';
import { PageInterface, isMediaButtonActionType } from '../classes/Page';
import { Page } from '../classes/Page';
import { PageItem } from './pageItem';
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

//const steps = 4;

export class PageMedia extends Page {
    config: pages.PageBaseConfig['config'];
    initMode: 'auto' | 'custom';
    dpInit: string;
    items: pages.PageBaseConfig['items'];
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    tempItem: PageItem | undefined;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options.pageItems);

        this.config = options.config;
        if (this.items && this.items.card === 'cardMedia') this.items = options.items;
        this.initMode = options.initMode;
        this.dpInit = options.dpInit;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        const config = { ...this.config };
        // search states for mode auto
        const tempConfig: Partial<pages.PageBaseConfig['config']> =
            this.initMode === 'auto'
                ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.PageBaseConfig['items']> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        if (tempItem) tempItem.card = this.config && this.config.card;
        this.items = tempItem as pages.PageBaseConfig['items'];
    }
    protected async onVisibilityChange(val: boolean): Promise<void> {
        await super.onVisibilityChange(val);
        if (val) {
            this.headlinePos = 0;
            this.titelPos = 0;
        }
    }
    async update(): Promise<void> {
        const item = this.items;
        if (item === undefined) return;
        const message: Partial<pages.PageMediaMessage> = {};
        // title
        {
            if (item.card !== 'cardMedia') return;
            const test: Record<string, string> = {};
            test.bla = 'dd';
            let duration = '0:00',
                elapsed = '0:00',
                title = 'unknown';

            if (item.data.titel && item.data.titel.text) {
                const v = await item.data.titel.text.getString();
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
                    const s = message.headline + '        ';
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
                        const s = v + '          ';
                        this.titelPos = this.titelPos % s.length;
                        message.name =
                            v.substring(this.titelPos++ % (`${v} ${message.name}` + s).length).substring(0, 35) +
                            ` ${message.name}`;
                    } else {
                        message.name = `${v} ${message.name}`;
                    }
                }
            }
        }
        message.shuffle_icon = '';
        if (item.data.shuffle && item.data.shuffle.type) {
            let value: null | true | false = null;
            switch (item.data.shuffle.type) {
                case 'string': {
                    const v = await item.data.shuffle.getString();
                    if (v !== null) {
                        value = ['OFF', 'FALSE'].indexOf(v.toUpperCase()) !== -1;
                    }
                    break;
                }
                case 'number':
                case 'boolean': {
                    value = await item.data.shuffle.getBoolean();
                    break;
                }
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
                if (await item.data.stop) {
                    message.onoffbuttonColor = v.toUpperCase() !== 'STOP' ? '65535' : '1374';
                } else {
                    // no stop control so pause is stop
                    message.onoffbuttonColor = message.iconplaypause !== 'pause' ? '65535' : '1374';
                }
            }
        }

        if (item.data.titel && item.data.titel.color) {
            const v = await getValueFromBoolean(item.data.titel.color, 'color');
            if (v !== null) message.titelColor = v;
        }

        /*message.options = [undefined, undefined, undefined, undefined, undefined];
        if (item.toolbox && Array.isArray(item.toolbox)) {
            const localStep = item.toolbox.length > 5 ? steps : 5;
            if (item.toolbox.length <= localStep * (this.step - 1)) this.step = 1;
            const maxSteps = localStep * this.step;
            const minStep = localStep * (this.step - 1);

            for (let a = minStep; a < maxSteps; a++) {
                message.options[a - minStep] = await this.getToolItem(item.toolbox[a], String(a), (a % localStep) + 1);
            }
            if (localStep === 4) {
                this.nextArrow = true;
                const color = String(Color.rgb_dec565(Color.White));
                const icon = 'arrow-right';
                message.options[4] = {
                    intNameEntity: `5`,
                    iconNumber: 5,
                    icon: Icons.GetIcon(icon),
                    iconColor: color,
                    mode: 'nexttool',
                    type: 'button',
                    displayName: 'next',
                };
            }
        }*/
        //Logo
        if (item.data.logo) {
            message.logo = '~~~~~'; //await this.getItemMessageMedia(await this.getToolItem(item.logo, 'logo', 0));
        }
        {
        }
        const opts: string[] = ['~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~'];
        if (this.pageItems) {
            for (let a = 0; a < 5; a++) {
                const temp = this.pageItems[a];
                if (temp) opts[a] = await temp.getPageItemPayload();
            }
        }
        message.navigation = this.getNavigation();
        const msg: pages.PageMediaMessage = Object.assign(PageMediaMessageDefault, message, {
            id: 'media',
            options: opts,
        });
        this.sendToPanel(this.getMessage(msg));
        //this.log.warn(JSON.stringify(this.getMessage(msg)));
    }
    private async getMediaState(): Promise<boolean | null> {
        if (!this.items || this.items.card !== 'cardMedia') return null;
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
        if (!this.items || this.items.card !== 'cardMedia') return null;
        const item = this.items.data.mediaState;
        if (item) {
            const v = await item.getString();
            if (v !== null) {
                return ['STOP', '0', 'FALSE'].indexOf(v.toUpperCase()) === -1;
            }
        }
        return null;
    }
    private async getToolItem(
        i: pages.toolboxItemDataItem | undefined,
        id: string,
        iconNumber: number,
    ): Promise<MessageItemMedia | undefined> {
        if (i) {
            if (i.on && i.text && i.color && i.icon) {
                const v = await i.on.getBoolean();
                const color = await getValueFromBoolean(i.color, 'color', !!v);
                const icon = await getValueFromBoolean(i.icon, 'string', !!v);
                const text = await i.text.getString();
                const list = i.list ? await i.list.getString() : null;
                if (list) this.log.debug(JSON.stringify(list));
                if (color && icon && text) {
                    const tool: MessageItemMedia = {
                        intNameEntity: `${this.id}?${id}`,
                        iconNumber: iconNumber as 1 | 2 | 3 | 4 | 5,
                        icon: Icons.GetIcon(icon),
                        iconColor: color,
                        mode: i.action,
                        type: 'button',
                        displayName: this.adapter.library.getLocalTranslation('media', text),
                    };
                    return tool;
                }
            }
        }
        return undefined;
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
    /**
     * Create a part of the panel messsage for bottom icons. if event === '' u get '~~~~~~'.
     * default for event: input_sel
     * @param msg
     * @returns string

    private async getItemMessageMedia(msg: Partial<MessageItemMedia> | undefined): Promise<string> {
        if (!msg || !msg.intNameEntity || !msg.icon) return '~~~~~';
        msg.type = msg.type === undefined ? 'input_sel' : msg.type;
        const iconNumber = msg.iconNumber;
        const temp: Partial<MessageItemMedia> = msg;
        temp.optionalValue = msg.optionalValue || 'media0';
        const message: MessageItem = Object.assign(messageItemDefault, temp);

        switch (iconNumber) {
            case 0: {
                message.optionalValue = 'media0';
                break;
            }
            case 1: {
                message.optionalValue = 'media1';
                break;
            }
            case 2: {
                message.optionalValue = 'media2';
                break;
            }
            case 3: {
                message.optionalValue = 'media3';
                break;
            }
            case 4: {
                message.optionalValue = 'media4';
                break;
            }
            case 5: {
                message.optionalValue = 'media5';
                break;
            }
        }
        if (!this.tempItem) {
            const config: PageInterface = {
                card: 'cardItemSpecial',
                name: 'test',
                adapter: this.adapter,
                panelSend: this.panelSend,
                panel: this.panel,
                id: 'irgendwas',
            };
            const options: PageItemDataItemsOptions = {
                role: 'text.list',
                type: 'input_sel',
                dpInit: undefined,
                initMode: 'custom',
                data: {
                    color: {
                        true: {
                            type: 'const',
                            constVal: Color.HMIOn,
                        },
                        false: undefined,
                        scale: undefined,
                    },
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'home' },
                            color: { type: 'const', constVal: Color.Green },
                        },
                        false: {
                            value: { type: 'const', constVal: 'fan' },
                            color: { type: 'const', constVal: Color.Red },
                        },
                        scale: undefined,
                        maxBri: undefined,
                        minBri: undefined,
                    },
                    entity1: {
                        value: {
                            type: 'const',
                            constVal: true,
                        },
                        decimal: undefined,
                        factor: undefined,
                        unit: undefined,
                    },
                    text1: undefined,
                    setValue1: undefined,
                    useColor: undefined,
                },
            };
            this.tempItem = new PageItem(config, options);
            await this.tempItem.init();
        }
        return await this.tempItem.getPageItemPayload('test');
        //return this.getItemMesssage(message);
    }*/

    onStateTrigger = async (): Promise<void> => {
        this.update();
    };
    async onButtonEvent(event: IncomingEvent): Promise<void> {
        if (!this.getVisibility()) return;
        //if (event.mode !== 'media') return;
        if (isMediaButtonActionType(event.action)) {
            this.log.debug('Receive event: ' + JSON.stringify(event));
        } else return;
        const items = this.items;
        if (!items || items.card !== 'cardMedia') return;
        switch (event.action) {
            case 'media-back': {
                items.data.backward && (await items.data.backward.setStateTrue());
                break;
            }
            case 'media-pause': {
                if (items.data.pause && items.data.play) {
                    if (await this.getMediaState()) await items.data.pause.setStateTrue();
                    else await items.data.play.setStateTrue();
                } else if (items.data.mediaState) {
                }
                break;
            }
            case 'media-next': {
                items.data.forward && (await items.data.forward.setStateTrue());
                break;
            }
            case 'media-shuffle': {
                items.data.shuffle && (await items.data.shuffle.setStateTrue());
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
                    if (await this.getOnOffState()) await items.data.stop.setStateTrue();
                }
                break;
            }
            case 'button': {
                if (event.id === '5' && this.nextArrow) {
                    this.step++;
                    this.update();
                }
                break;
            }
        }
    }
}
type _SelectValueFromBoolean = 'color' | 'string';
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
            } else {
                return colorOn || null;
            }
        }
    }
    return null;
}
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
