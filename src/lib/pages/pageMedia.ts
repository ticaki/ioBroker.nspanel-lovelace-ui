import { Dataitem, isDataItem } from '../classes/data-item';
import * as Color from '../const/Color';
import { Icons } from '../const/icon_mapping';
import * as pages from '../types/pages';
import { BooleanUnion, ColorEntryType, IncomingEvent } from '../types/types';
import { PageInterface, isMediaButtonActionType, messageItemDefault } from './Page';
import { Page } from './Page';

const PageMediaMessageDefault: pages.PageMediaMessage = {
    event: 'entityUpd',
    headline: '',
    getNavigation: '~~~~~~~~~',
    id: '',
    title: '',
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

const steps = 4;

export class PageMedia extends Page implements pages.PageMediaBase {
    config: pages.PageMediaBase['config'];
    initMode: 'auto' | 'custom';
    dpInit: string;
    items: pages.PageMediaBase['items'];
    writeItems: pages.PageMediaBaseConfigWrite | undefined;
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;

    constructor(config: PageInterface, options: pages.PageMediaBase) {
        super(config);

        this.config = options.config;
        this.writeItems = options.writeItems;
        this.items = options.items;
        this.initMode = options.initMode;
        this.dpInit = options.dpInit;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        const config = { ...this.config };
        // search states for mode auto
        const tempConfig: Partial<pages.PageMediaBase['config']> =
            this.initMode === 'auto' ? await this.panel.readOnlyDB.getDataItemsFromAuto(this.dpInit, config) : {};
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.PageMediaBase['items']> = await this.panel.readOnlyDB.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.PageMediaBase['items'];
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
        const message: Partial<pages.PageMediaMessage> = {};
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
            const maxSize = 44;
            if (message.title.length > maxSize) {
                const s = message.title + '          ';
                this.titelPos = this.titelPos % s.length;
                message.headline = (s + message.title)
                    .substring(this.titelPos++ % (message.title + s).length)
                    .substring(0, 45);
            } else {
                message.headline = message.title;
            }
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
                message.volume = String(v);
            }
        }
        if (item.mediaState) {
            const v = await item.mediaState.getString();
            if (v !== null) {
                message.iconplaypause = !(await this.getMediaState()) ? 'play' : 'pause';
                if (await item.stop) {
                    message.onoffbuttonColor = v.toUpperCase() !== 'STOP' ? '65535' : '1374';
                } else {
                    // no stop control so pause is stop
                    message.onoffbuttonColor = message.iconplaypause !== 'pause' ? '65535' : '1374';
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
                    dislayName: 'next',
                };
            }
        }
        //Logo
        if (item.logo) {
            message.logo = this.getItemMessageMedia(await this.getToolItem(item.logo, 'logo', 5));
        }
        {
        }
        const opts: string[] = [];
        for (const a in message.options) {
            const temp = message.options[a];
            if (typeof temp !== 'string') opts.push(this.getItemMessageMedia(temp));
        }
        const msg: pages.PageMediaMessage = Object.assign(PageMediaMessageDefault, message, {
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
        i: pages.toolboxItemDataItem | undefined,
        id: string,
        iconNumber: number,
    ): Promise<pages.MessageItemMedia | undefined> {
        if (i) {
            if (i.on && i.text && i.color && i.icon) {
                const v = await i.on.getBoolean();
                const color = await getValueFromBoolean(i.color, 'color', !!v);
                const icon = await getValueFromBoolean(i.icon, 'string', !!v);
                const text = await i.text.getString();
                const list = i.list ? await i.list.getString() : null;
                if (list) this.log.debug(JSON.stringify(list));
                if (color && icon && text) {
                    const tool: pages.MessageItemMedia = {
                        intNameEntity: `${id}`,
                        iconNumber: iconNumber as 1 | 2 | 3 | 4 | 5,
                        icon: Icons.GetIcon(icon),
                        iconColor: color,
                        mode: i.action,
                        dislayName: this.adapter.library.getLocalTranslation('media', text),
                    };
                    return tool;
                }
            }
        }
        return undefined;
    }

    private getMessage(message: pages.PageMediaMessage): string {
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
            message.onoffbuttonColor,
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
    private getItemMessageMedia(msg: Partial<pages.MessageItemMedia> | undefined): string {
        if (!msg || !msg.intNameEntity || !msg.icon) return '~~~~~';
        msg.type = msg.type === undefined ? 'input_sel' : msg.type;
        const iconNumber = msg.iconNumber;
        const temp: Partial<pages.MessageItemMedia> = msg;
        temp.optionalValue = msg.optionalValue || 'media0';
        const message: pages.MessageItem = Object.assign(messageItemDefault, temp);

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
        return this.getItemMesssage(message);
    }

    onStateTrigger = async (): Promise<void> => {
        this.update();
    };
    async onButtonEvent(event: IncomingEvent): Promise<void> {
        if (!this.getVisibility()) return;
        //if (event.mode !== 'media') return;
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
            case 'button': {
                if (event.mode === '5' && this.nextArrow) {
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
