import { Color, type RGB } from '../../const/Color';
import type * as pages from '../../types/pages';
import type { ConfigManager } from '../../classes/config-manager';
import * as tools from '../../const/tools';

/**
 * Builds the cardMedia configuration for the ioBroker.squeezeboxrpc adapter (Logitech Media Server).
 *
 * Expected media id: `squeezeboxrpc.<inst>.Players.<PlayerName>` (device object of the player).
 *
 * @param configManager - The config manager instance.
 * @param page - The script page configuration.
 * @param gridItem - The page base to extend.
 * @param messages - Collected messages.
 * @param justCheck - Only validate the id.
 * @returns The extended page base and messages.
 */
export async function getPageSqueezebox(
    configManager: ConfigManager,
    page: ScriptConfig.PageMedia,
    gridItem: pages.PageBase,
    messages: string[],
    justCheck = false,
): Promise<{ gridItem: pages.PageBase; messages: string[] }> {
    const adapter = configManager.adapter;

    const arr = page.media.id.split('.');
    const viewStr = arr.slice(0, 3).join('.');
    const str = arr.slice(0, 4).join('.');
    const devices =
        arr.length >= 4 && arr[2] === 'Players'
            ? await adapter.getObjectViewAsync('system', 'device', {
                  startkey: `${viewStr}.`,
                  endkey: `${viewStr}${String.fromCharCode(0xff_fd)}`,
              })
            : { rows: [] };

    if (
        !devices ||
        !devices.rows ||
        devices.rows.length == 0 ||
        devices.rows.findIndex(row => row && row.value && row.id === str) === -1
    ) {
        const msg = `${page.uniqueName}: Media page id ${page.media.id} is not a valid squeezeboxrpc player (expected squeezeboxrpc.X.Players.<name>)!`;
        messages.push(msg);
        adapter.log.warn(msg);
        return { gridItem, messages };
    }

    if (justCheck) {
        return { gridItem, messages: ['done'] };
    }
    const reg = tools.getRegExp(`${str}.`, { startsWith: true });
    gridItem.dpInit = reg ? reg : str;
    gridItem = {
        ...gridItem,
        config: {
            ...gridItem.config,
            ident: str,
            card: 'cardMedia',
            logo: {
                type: 'number',
                data: {
                    text: { true: { type: 'const', constVal: 'media.seek' } },
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'logo-dlna' },
                            color: { type: 'const', constVal: { r: 250, b: 250, g: 0 } },
                        },
                    },
                    // slider range is 0..duration in seconds
                    entity1: {
                        value: {
                            mode: 'auto',
                            type: 'triggered',
                            role: 'media.elapsed',
                            regexp: /\.Time$/,
                            dp: '',
                            read: `return val != null ? Math.round(val) : val;`,
                        },
                        set: {
                            mode: 'auto',
                            type: 'state',
                            writeable: true,
                            regexp: /\.cmdGoTime$/,
                            dp: '',
                            write: `return val != null ? String(Math.round(val)) : val;`,
                        },
                    },
                    minValue1: { type: 'const', constVal: 0 },
                    maxValue1: {
                        mode: 'auto',
                        type: 'triggered',
                        role: 'media.duration',
                        regexp: /\.Duration$/,
                        dp: '',
                        read: `return val ? Math.round(val) : null;`,
                    },
                },
            },
            data: {
                headline: page.media.name ? await configManager.getFieldAsDataItemConfig(page.media.name) : undefined,

                album: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.album',
                    regexp: /\.Album$/,
                    dp: '',
                },
                title: {
                    value: {
                        mode: 'auto',
                        type: 'triggered',
                        role: 'media.title',
                        regexp: /\.Title$/,
                        dp: '',
                    },

                    true: page.media.colorMediaTitle
                        ? {
                              color: await configManager.getIconColor(page.media.colorMediaTitle),
                          }
                        : undefined,
                },
                duration: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.duration',
                    regexp: /\.Duration$/,
                    dp: '',
                    read: `return val ? val*1000 : val;`,
                },
                station: {
                    mode: 'auto',
                    type: 'triggered',
                    regexp: /\.RadioName$/,
                    dp: '',
                },
                onOffColor: {
                    true: page.media.colorMediaIcon
                        ? { color: await configManager.getIconColor(page.media.colorMediaIcon) }
                        : { color: { type: 'const', constVal: Color.on } },
                    false: page.media.colorMediaIcon ? undefined : { color: { type: 'const', constVal: Color.off } },
                },
                elapsed: {
                    mode: 'auto',
                    type: 'triggered',
                    commonType: 'number',
                    role: ['media.elapsed'],
                    regexp: /\.Time$/,
                    dp: '',
                    read: `return val != null ? val*1000 : val;`,
                },
                volume: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: ['level.volume'],
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.Volume$/,
                        dp: '',
                        // LMS reports a negative volume while muted
                        read: `return typeof val === 'number' && val < 0 ? 0 : val;`,
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: ['level.volume'],
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.Volume$/,
                        dp: '',
                    },
                },
                // group volume is handled in PageMedia (relative change for all sync members)
                useGroupVolume: {
                    mode: 'auto',
                    type: 'triggered',
                    regexp: /\.SyncSlaves$/,
                    dp: '',
                    read: `return typeof val === 'string' && val.trim() !== '';`,
                },
                artist: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.artist',
                        regexp: /\.Artist$/,
                        dp: '',
                    },
                    true: page.media.colorMediaArtist
                        ? {
                              color: await configManager.getIconColor(page.media.colorMediaArtist),
                          }
                        : undefined,
                },
                // 0 = off, 1 = songs, 2 = albums - cycled in PageMedia
                shuffle: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.mode.shuffle',
                        regexp: /\.PlaylistShuffle$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.mode.shuffle',
                        regexp: /\.PlaylistShuffle$/,
                        dp: '',
                    },
                },
                icon: {
                    type: 'const',
                    constVal: 'dialpad',
                },
                // state: 0 = pause, 1 = play, 2 = stop
                play: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.state',
                    regexp: /\.state$/,
                    dp: '',
                    write: 'return 1;',
                },
                pause: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.state',
                    regexp: /\.state$/,
                    dp: '',
                    write: 'return 0;',
                },
                stop: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.state',
                    regexp: /\.state$/,
                    dp: '',
                    write: 'return 2;',
                },
                isPlaying: {
                    mode: 'auto',
                    type: 'triggered',
                    role: 'media.state',
                    regexp: /\.Mode$/,
                    dp: '',
                    read: `return val === 'play';`,
                },
                power: {
                    mode: 'auto',
                    type: 'triggered',
                    regexp: /\.Power$/,
                    dp: '',
                    read: 'return !!val;',
                    write: 'return val ? 1 : 0;',
                },
                forward: {
                    mode: 'auto',
                    type: 'state',
                    regexp: /\.btnForward$/,
                    dp: '',
                },
                backward: {
                    mode: 'auto',
                    type: 'state',
                    regexp: /\.btnRewind$/,
                    dp: '',
                },
            },
        },

        items: undefined,
        uniqueID: page.uniqueName,
        pageItems: [],
    };
    gridItem.pageItems = gridItem.pageItems || [];

    // online
    if (!page.media.deactivateDefaultItems?.online) {
        gridItem.pageItems.push({
            role: '',
            type: 'text',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'wifi' },
                        color: await configManager.getIconColor(page.media.itemsColorOn?.online, Color.good),
                    },
                    false: {
                        value: { type: 'const', constVal: 'wifi-off' },
                        color: await configManager.getIconColor(page.media.itemsColorOff?.online, Color.attention),
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        mode: 'auto',
                        type: 'triggered',
                        regexp: /\.Connected$/,
                        dp: '',
                        read: 'return !!val;',
                    },
                },

                enabled: {
                    mode: 'auto',
                    type: 'triggered',
                    regexp: /\.Connected$/,
                    dp: '',
                    read: 'return !val;',
                },
            },
        });
    }

    // speaker select (sync groups)
    if (!page.media.deactivateDefaultItems?.speakerList) {
        const list = page.media.speakerList;
        const names = devices.rows
            .filter(v => v && v.id && v.id.split('.').length === 4)
            .map(v => tools.getStringFromStringOrTranslated(adapter, v.value.common.name))
            .filter(n => !list || list.length === 0 || list.includes(n));
        if (names.length > 1) {
            gridItem.pageItems.push({
                role: 'SqueezeboxSpeaker',
                type: 'button',

                data: {
                    entity1: {
                        value: {
                            type: 'triggered',
                            dp: `${str}.SyncSlaves`,
                            read: `return typeof val === 'string' && val.trim() !== '';`,
                        },
                    },
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'speaker-multiple' },
                            color: await configManager.getIconColor(page.media.itemsColorOn?.speakerList, Color.good),
                        },
                        false: {
                            value: { type: 'const', constVal: 'speaker-multiple' },
                            color: await configManager.getIconColor(page.media.itemsColorOff?.speakerList, Color.bad),
                        },
                    },
                    /**
                     * Für role selectGrid ist entity3 die Liste der möglichen Werte
                     */
                    entity3: {
                        value: {
                            type: 'const',
                            constVal: JSON.stringify(page.media.speakerList || []),
                        },
                    },
                    enabled: {
                        type: 'const',
                        constVal: true,
                    },
                },
            });
        }
    }

    // favorite select - list is read from squeezeboxrpc.X.Favorites.* at runtime
    if (!page.media.deactivateDefaultItems?.favoriteList) {
        gridItem.pageItems.push({
            role: 'squeezebox-favorites',
            type: 'input_sel',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'playlist-star' },
                        color: await configManager.getIconColor(page.media.itemsColorOn?.favoriteList, Color.activated),
                    },
                },
                entityInSel: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        regexp: /\.cmdPlayFavorite$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        regexp: /\.cmdPlayFavorite$/,
                        dp: '',
                    },
                },
                valueList: {
                    type: 'const',
                    constVal: JSON.stringify(page.media.favoriteList || []),
                },
                headline: {
                    type: 'const',
                    constVal: 'favoriteList',
                },
            },
        });
    }

    // time
    if (!page.media.deactivateDefaultItems?.clock) {
        gridItem.pageItems.push({
            template: 'text.clock',
            dpInit: '',
            data: {
                icon: {
                    true: {
                        color: page.media.itemsColorOn?.clock
                            ? await configManager.getIconColor(page.media.itemsColorOn?.clock)
                            : undefined,
                    },
                },
            },
        });
    }

    if (page.media.volumePresets) {
        gridItem.pageItems.push({
            role: '',
            type: 'input_sel',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'volume-source' },
                        color: await configManager.getIconColor(
                            page.media.itemsColorOn?.volumePresets,
                            Color.activated,
                        ),
                    },
                },
                entityInSel: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: ['level.volume'],
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.Volume$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: ['level.volume'],
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.Volume$/,
                        dp: '',
                    },
                },
                valueList: {
                    type: 'const',
                    constVal: JSON.stringify(page.media.volumePresets || []),
                },

                headline: {
                    type: 'const',
                    constVal: 'volumePresets',
                },
            },
        });
    }

    // tracklist - current queue as JSON array, PlaylistCurrentIndex is a 0-based string
    if (page.media.deactivateDefaultItems?.trackList !== true) {
        gridItem.pageItems.push({
            role: 'spotify-tracklist',
            type: 'input_sel',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'animation-play-outline' },
                        color: await configManager.getIconColor(page.media.itemsColorOn?.playList, Color.activated),
                    },
                },
                entityInSel: {
                    value: {
                        mode: 'auto',
                        type: 'triggered',
                        regexp: /\.PlaylistCurrentIndex$/,
                        dp: '',
                        read: `
                            const n = parseInt(val);
                            return Number.isNaN(n) ? null : n + 1;`,
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        regexp: /\.PlaylistCurrentIndex$/,
                        dp: '',
                        // the adapter expects a string
                        write: `return String(parseInt(val) - 1);`,
                    },
                },
                valueList: {
                    type: 'const',
                    constVal: JSON.stringify([]),
                },
                valueList2: {
                    mode: 'auto',
                    type: 'triggered',
                    regexp: /\.Playlist$/,
                    dp: '',
                    read: `
                        let data = val;
                        if (typeof val === 'string') {
                            try {
                                data = JSON.parse(val);
                            } catch {
                                return [];
                            }
                        }
                        if (!Array.isArray(data)) {
                            return [];
                        }
                        return data.map(item => ({
                            id: item.id,
                            title: item.title || item.RadioName || item.url || '',
                        }));`,
                },

                headline: {
                    type: 'const',
                    constVal: 'trackList',
                },
            },
        });
    }

    // repeat: 0 = off, 1 = song, 2 = playlist
    if (!page.media.deactivateDefaultItems?.repeat) {
        const tempOn = await configManager.getIconColor(page.media.itemsColorOn?.repeat);
        const tempOff = await configManager.getIconColor(page.media.itemsColorOff?.repeat);
        let colorOn: RGB | undefined;
        let colorOff: RGB | undefined;
        if (tempOn && tempOn.type === 'const' && Color.isRGB(tempOn.constVal)) {
            colorOn = tempOn.constVal;
        }
        if (tempOff && tempOff.type === 'const' && Color.isRGB(tempOff.constVal)) {
            colorOff = tempOff.constVal;
        }

        gridItem.pageItems.push({
            role: 'repeatValue',
            type: 'button',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: {
                            mode: 'auto',
                            type: 'state',
                            role: 'media.mode.repeat',
                            regexp: /\.PlaylistRepeat$/,
                            dp: '',
                            read: `switch (val) {
                                    case 1:
                                        return 'repeat-once';
                                    case 2:
                                        return 'repeat-variant';
                                }
                                return 'repeat';`,
                        },
                        color: {
                            mode: 'auto',
                            type: 'state',
                            role: 'media.mode.repeat',
                            regexp: /\.PlaylistRepeat$/,
                            dp: '',
                            read: `switch (val) {
                                    case 1:
                                        return ${colorOn ? JSON.stringify(colorOn) : 'Color.option4'};
                                    case 2:
                                        return ${colorOn ? JSON.stringify(colorOn) : 'Color.activated'};
                                }
                                return ${colorOff ? JSON.stringify(colorOff) : 'Color.deactivated'};`,
                        },
                    },
                },
                entity1: {
                    value: {
                        mode: 'auto',
                        type: 'triggered',
                        role: 'media.mode.repeat',
                        regexp: /\.PlaylistRepeat$/,
                        dp: '',
                        read: `
                            switch (val) {
                                case 1:
                                    return 'ONE';
                                case 2:
                                    return 'ALL';
                            }
                            return 'OFF';
                        `,
                    },
                    // cycle OFF -> ALL -> ONE -> OFF
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.mode.repeat',
                        regexp: /\.PlaylistRepeat$/,
                        dp: '',
                        write: `
                            switch (val) {
                                case 'OFF':
                                    return 2;
                                case 'ALL':
                                    return 1;
                            }
                            return 0;`,
                    },
                },
            },
        });
    }

    return { gridItem, messages };
}
