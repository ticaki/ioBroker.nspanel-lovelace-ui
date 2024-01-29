import {
    PageAlarm,
    PageChart,
    PageEntities,
    PageGrid,
    PageGrid2,
    PageMedia,
    PagePower,
    PageQR,
    PageThermo,
    PageUnlock,
} from './types';

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
    | 'screensaver2'; //| 'cardBurnRec'

export type PageType =
    | PageChart
    | PageEntities
    | PageGrid
    | PageGrid2
    | PageThermo
    | PageMedia
    | PageUnlock
    | PageQR
    | PageAlarm
    | PagePower;
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
