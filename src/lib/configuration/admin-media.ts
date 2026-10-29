import { ConfigManager } from '../classes/config-manager';
import { getStringFromStringOrTranslated } from '../const/tools';
import { PageMedia } from '../pages/pageMedia';
import { mediaBackendOf, type MediaListKind, type MediaPlayerInfo } from '../types/adminShareConfig';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type { PageBase } from '../types/pages';

/**
 * Names of the objects of one type directly below a folder (`<prefix>.<name>`).
 *
 * @param adapter Adapter instance.
 * @param type Object type of the view, `device` or `channel`.
 * @param prefix Folder, e.g. `sonos.0.root`.
 * @returns The common names, sorted and without repeats.
 */
async function childNames(adapter: NspanelLovelaceUi, type: 'device' | 'channel', prefix: string): Promise<string[]> {
    const depth = prefix.split('.').length + 1;
    const view = await adapter.getObjectViewAsync('system', type, {
        startkey: `${prefix}.`,
        endkey: `${prefix}.香`,
    });
    const names = (view?.rows ?? [])
        .filter(row => row?.id && row.id.split('.').length === depth && row.value)
        .map(row => getStringFromStringOrTranslated(adapter, row.value.common.name, row.id.split('.').pop()));
    return [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

/**
 * Texts of the `common.states` of a state (the spotify lists keep their entries there).
 *
 * @param adapter Adapter instance.
 * @param id State id.
 * @returns The texts, empty when the state has none.
 */
async function stateTexts(adapter: NspanelLovelaceUi, id: string): Promise<string[]> {
    const obj = await adapter.getForeignObjectAsync(id);
    const states: unknown = obj?.common && 'states' in obj.common ? obj.common.states : undefined;
    if (Array.isArray(states)) {
        return states.filter((s): s is string => typeof s === 'string' && !!s);
    }
    if (states && typeof states === 'object') {
        return Object.values(states).filter((s): s is string => typeof s === 'string' && !!s);
    }
    if (typeof states === 'string') {
        return states
            .split(';')
            .map(s => s.split(':').slice(1).join(':'))
            .filter(Boolean);
    }
    return [];
}

/**
 * Names of the audio favorites of a squeezeboxrpc instance (`<inst>.Favorites.<id>.Name`, `isaudio`).
 *
 * @param adapter Adapter instance.
 * @param inst Instance, e.g. `squeezeboxrpc.0`.
 * @returns The favorite names.
 */
async function squeezeboxFavorites(adapter: NspanelLovelaceUi, inst: string): Promise<string[]> {
    const states = await adapter.getForeignStatesAsync(`${inst}.Favorites.*`);
    const favorites: Record<string, { name?: string; audio?: boolean }> = {};
    for (const id in states) {
        const parts = id.split('.');
        if (parts.length !== 5) {
            continue;
        }
        const fav = (favorites[parts[3]] = favorites[parts[3]] ?? {});
        const val = states[id]?.val;
        if (parts[4] === 'Name' && typeof val === 'string') {
            fav.name = val;
        } else if (parts[4] === 'isaudio') {
            fav.audio = val === 1 || val === '1' || val === true;
        }
    }
    return Object.values(favorites)
        .filter(f => f.audio && f.name)
        .map(f => f.name as string);
}

/**
 * Saved playlists of the Logitech Media Server behind a squeezeboxrpc instance.
 *
 * @param adapter Adapter instance.
 * @param inst Instance, e.g. `squeezeboxrpc.0`.
 * @returns The playlist names, empty when the server does not answer.
 */
async function squeezeboxPlaylists(adapter: NspanelLovelaceUi, inst: string): Promise<string[]> {
    let response: unknown;
    try {
        response = await adapter.sendToAsync(
            inst,
            'cmdGeneral',
            { playerid: '', cmdArray: ['playlists', '0', '999', 'tags:u'] },
            { timeout: 3000 },
        );
    } catch {
        return [];
    }
    const loopOf = (data: unknown): unknown =>
        !data || typeof data !== 'object'
            ? undefined
            : 'playlists_loop' in data
              ? data.playlists_loop
              : 'result' in data
                ? loopOf(data.result)
                : undefined;
    const loop = loopOf(response);
    if (!Array.isArray(loop)) {
        return [];
    }
    return loop
        .map((entry: unknown) =>
            entry && typeof entry === 'object' && 'playlist' in entry && typeof entry.playlist === 'string'
                ? entry.playlist
                : '',
        )
        .filter(Boolean);
}

/**
 * Names the admin offers for the lists of a media player - what the backend would show without a list.
 *
 * @param adapter Adapter instance.
 * @param id Player id, already checked.
 * @returns Speakers, playlists and favorites; a list the backend cannot read stays empty.
 */
async function mediaListOptions(adapter: NspanelLovelaceUi, id: string): Promise<Record<MediaListKind, string[]>> {
    const parts = id.split('.');
    const inst = parts.slice(0, 2).join('.');
    const options: Record<MediaListKind, string[]> = { speakerList: [], playList: [], favoriteList: [] };
    switch (mediaBackendOf(id)) {
        case 'alexa2':
            options.speakerList = await childNames(adapter, 'device', `${inst}.Echo-Devices`);
            break;
        case 'sonos': {
            options.speakerList = await childNames(adapter, 'channel', `${inst}.root`);
            const fav = await adapter.getForeignStateAsync(`${parts.slice(0, 4).join('.')}.favorites_list`);
            if (typeof fav?.val === 'string') {
                options.favoriteList = fav.val
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
            }
            break;
        }
        case 'spotify-premium':
            options.speakerList = await stateTexts(adapter, `${inst}.devices.deviceList`);
            options.playList = await stateTexts(adapter, `${inst}.playlists.playlistList`);
            break;
        case 'squeezeboxrpc':
            options.speakerList = await childNames(adapter, 'device', `${inst}.Players`);
            options.favoriteList = await squeezeboxFavorites(adapter, inst);
            options.playList = await squeezeboxPlaylists(adapter, inst);
            break;
        case 'mpd':
        case undefined:
            break;
    }
    return options;
}

/**
 * Answer of the sendTo `getMediaPlayer`: checks a player id the way the media page does and reads
 * the names the admin offers for its lists.
 *
 * @param adapter Adapter instance.
 * @param rawId Player id from the admin.
 * @returns Result of the check and the list names.
 */
export async function mediaPlayerInfo(adapter: NspanelLovelaceUi, rawId: unknown): Promise<MediaPlayerInfo> {
    const id = typeof rawId === 'string' ? rawId.trim() : '';
    const options: Record<MediaListKind, string[]> = { speakerList: [], playList: [], favoriteList: [] };
    const backend = mediaBackendOf(id);
    if (!backend) {
        return { ok: false, messages: [], options };
    }
    const page = {
        type: 'cardMedia' as const,
        uniqueName: 'admin-check',
        heading: '',
        media: { id },
        items: [],
    };
    const gridItem: PageBase = {
        uniqueID: 'admin-check',
        dpInit: '',
        template: undefined,
        alwaysOn: 'none',
        pageItems: [],
        config: { card: 'cardMedia', data: {} },
    };
    let messages: string[] = [];
    try {
        ({ messages } = await PageMedia.getPage(new ConfigManager(adapter), page, gridItem, [], true));
    } catch (e) {
        messages = [String(e)];
    }
    const ok = messages[0] === 'done';
    return {
        ok,
        backend,
        messages: ok ? [] : messages,
        options: ok ? await mediaListOptions(adapter, page.media.id) : options,
    };
}
