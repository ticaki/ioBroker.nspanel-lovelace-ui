import * as Types from './types';
import { Dataitem } from '../classes/data-item';
import { RGB } from './Color';
import { ColorEntryType, IconBoolean, PageItemDataItemsOptions, TextEntryType, ValueEntryType } from './type-pageItem';
import { MediaToolBoxAction } from './type-pageItem';

export type PageTypeCards =
    | 'cardChart'
    | 'cardLChart'
    | 'cardEntities'
    | 'cardGrid'
    | 'cardGrid2'
    | 'cardThermo'
    | 'cardMedia'
    | 'cardUnlock'
    | 'cardQR'
    | 'cardAlarm'
    | 'cardPower'
    | 'screensaver'
    | 'screensaver2'
    | 'cardBurnRec'
    | 'cardItemSpecial'; // besonders, interne Card zum verwalten von pageItems

/*export type PageType =
    | Types.PageChart
    | Types.PageEntities
    | Types.PageGrid
    | Types.PageGrid2
    | Types.PageThermo
    | Types.PageMedia
    | Types.PageUnlock
    | Types.PageQR
    | Types.PageAlarm
    | Types.PagePower;
*/
export type PageRole = PageMediaRoles;

export type PageMediaRoles =
    | 'button.play'
    | 'button.pause'
    | 'button.next'
    | 'button.prev'
    | 'button.stop'
    | 'button.volume.up'
    | 'button.volume.down'
    | 'media.seek' // (common.type=number) %
    | 'media.mode.shuffle' //(common.type=number) 0 - none, 1 - all, 2 - one
    | 'media.mode.repeat' //(common.type=boolean)
    | 'media.state' //['play','stop','pause'] or [0 - pause, 1 - play, 2 - stop] or [true - playing/false - pause]
    | 'media.artist'
    | 'media.album'
    | 'media.title'
    | 'media.duration'
    | 'media.elapsed.text'
    | 'media.elapsed'
    | 'media.mute'
    | 'level.volume'
    | 'media.album'
    | 'media.playlist';

export function isPageRole(F: string | PageRole): F is PageRole {
    switch (F as PageRole) {
        case 'button.play':
        case 'button.pause':
        case 'button.next':
        case 'button.prev':
        case 'button.stop':
        case 'button.volume.up':
        case 'button.volume.down':
        case 'media.seek':
        case 'media.mode.shuffle':
        case 'media.mode.repeat':
        case 'media.state':
        case 'media.artist':
        case 'media.album':
        case 'media.title':
        case 'media.duration':
        case 'media.elapsed.text':
        case 'media.elapsed':
        case 'media.mute':
        case 'level.volume':
        case 'media.playlist':
            return true;
        default:
            return false;
    }
}
export function isButtonActionType(F: string | Types.ButtonActionType): F is Types.ButtonActionType {
    switch (F) {
        case 'bExit':
        case 'bUp':
        case 'bNext':
        case 'bSubNext':
        case 'bPrev':
        case 'bSubPrev':
        case 'bHome':
        case 'notifyAction':
        case 'OnOff':
        case 'button':
        case 'up':
        case 'stop':
        case 'down':
        case 'positionSlider':
        case 'tiltOpen':
        case 'tiltStop':
        case 'tiltSlider':
        case 'tiltClose':
        case 'brightnessSlider':
        case 'colorTempSlider':
        case 'colorWheel':
        case 'tempUpd':
        case 'tempUpdHighLow':
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
        case 'timer-start':
        case 'timer-pause':
        case 'timer-cancle':
        case 'timer-finish':
        case 'hvac_action':
        case 'mode-modus1':
        case 'mode-modus2':
        case 'mode-modus3':
        case 'number-set':
        case 'mode-preset_modes':
        case 'A1':
        case 'A2':
        case 'A3':
        case 'A4':
        case 'D1':
        case 'U1':
            return true;
        default:
            console.info(F + ' is not isButtonActionType!');
            return false;
    }
}
export function convertToEvent(msg: string): Types.IncomingEvent | null {
    msg = (JSON.parse(msg) || {}).CustomRecv;
    if (msg === undefined) return null;
    const temp = msg.split(',');
    if (!Types.isEventType(temp[0])) return null;
    if (!Types.isEventMethod(temp[1])) return null;
    let popup: undefined | string = undefined;
    if (temp[1] === 'pageOpenDetail') popup = temp.splice(2, 1)[0];
    const arr = String(temp[2]).split('?');
    if (arr[2])
        return {
            type: temp[0],
            method: temp[1],
            page: parseInt(arr[0]),
            subPage: parseInt(arr[1]),
            popup: popup,
            id: arr[2],
            action: isButtonActionType(temp[3]) ? temp[3] : '',
            opt: temp[4] ?? '',
        };
    else if (arr[1])
        return {
            type: temp[0],
            method: temp[1],
            page: parseInt(arr[0]),
            popup: popup,
            id: arr[1],
            action: isButtonActionType(temp[3]) ? temp[3] : '',
            opt: temp[4] ?? '',
        };
    else
        return {
            type: temp[0],
            method: temp[1],
            popup: popup,
            id: arr[0],
            action: isButtonActionType(temp[3]) ? temp[3] : '',
            opt: temp[4] ?? '',
        };
}
export type PageBaseConfig = {
    //    type: PlayerType;
    card: Exclude<PageTypeCards, 'screensaver' | 'screensaver2'>;
    initMode: 'auto' | 'custom';
    dpInit: string; // '' and initMode 'auto' throw an error
    alwaysOn: 'none' | 'always' | 'action';
    pageItems: PageItemDataItemsOptions[];

    //    mediaNamespace: string;
    config:
        | undefined
        | (ChangeTypeOfKeys<PageMediaBaseConfig, Types.DataItemsOptions | undefined> & {
              toolbox: (toolboxItem | undefined)[];
          } & { logo: toolboxItem | undefined });
    items:
        | (ChangeTypeOfKeys<PageMediaBaseConfig, Dataitem | undefined> & {
              toolbox: (toolboxItemDataItem | undefined)[];
          } & { logo: toolboxItemDataItem | undefined })
        | undefined;
    writeItems: PageMediaBaseConfigWrite | undefined;
};
export type ChangeTypeOfKeys<Obj, N> = Obj extends
    | object
    | listItem
    | PageTypeCards
    | IconBoolean
    | TextEntryType
    | ValueEntryType
    | RGB
    | ColorEntryType
    | Types.IconScaleElement
    | PageMediaBaseConfig
    | Types.SerialTypePageElements
    ? Obj extends RGB | Types.IconScaleElement
        ? N
        : {
              [K in keyof Obj]: ChangeTypeOfKeys<Obj[K], N>;
          }
    : N;
type PageMediaBaseConfig = {
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
export function isColorEntryType(F: object | ColorEntryType): F is ColorEntryType {
    if ('true' in F && 'false' in F && 'scale' in F) return true;
    return false;
}
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
    name: string;
    titelColor: string;
    artist: string;
    artistColor: string;
    volume: string;
    iconplaypause: AllIcons;
    onoffbuttonColor: string;
    shuffle_icon: AllIcons;
    logo: string;
    options: [string?, string?, string?, string?, string?];
};

export type PageGridMessage = {
    event: 'entityUpd';
    headline: string;
    getNavigation: string;
    options: [string?, string?, string?, string?, string?, string?, string?, string?];
};

type writeItem = { dp: string } | undefined;
export type listItem =
    | {
          on: string;
          text: string;
          color: ColorEntryType | string | undefined;
          icon: IconBoolean | string | undefined;
          list: string | undefined;
      }
    | undefined; // mean string start with getState(' and end with ').val
export type toolboxItem = ChangeTypeOfKeys<listItem, Types.DataItemsOptions | undefined> & {
    action: MediaToolBoxAction;
};
export type toolboxItemDataItem = ChangeTypeOfKeys<listItem, Dataitem | undefined> & { action: MediaToolBoxAction };
