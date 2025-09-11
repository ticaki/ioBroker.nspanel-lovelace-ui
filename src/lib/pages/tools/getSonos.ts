import { Color, type RGB } from '../../const/Color';
import type * as pages from '../../types/pages';
import type { ConfigManager } from '../../classes/config-manager';
import * as tools from '../../const/tools';

export async function getPageSonos(
    configManager: ConfigManager,
    page: ScriptConfig.PageMedia,
    gridItem: pages.PageBaseConfig,
    messages: string[],
    justCheck = false,
): Promise<{ gridItem: pages.PageBaseConfig; messages: string[] }> {
    const adapter = configManager.adapter;

    const arr = page.media.id.split('.').slice(0, 3);
    const viewStr = arr.join('.');
    const str = page.media.id.split('.').slice(0, 4).join('.');
    const devices =
        viewStr && arr.length === 3
            ? await configManager.adapter.getObjectViewAsync('system', 'channel', {
                  startkey: `${viewStr}.`,
                  endkey: `${viewStr}${String.fromCharCode(0xfffd)}`,
              })
            : { rows: [] };

    if (
        !devices ||
        !devices.rows ||
        devices.rows.length == 0 ||
        devices.rows.findIndex(row => {
            if (row && row.value && row.id && row.id.split('.').length === 4) {
                return str === row.id;
            }
        }) === -1
    ) {
        const msg = `${page.uniqueName}: Media page id ${page.media.id} is not a valid sonos device!`;
        messages.push(msg);
        adapter.log.warn(msg);
        return { gridItem, messages };
    }

    if (justCheck) {
        return { gridItem, messages: ['done'] };
    }
    const reg = tools.getRegExp(str, { startsWith: true });
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
                            value: { type: 'const', constVal: 'logo-sonos' },
                            color: { type: 'const', constVal: { r: 250, b: 250, g: 0 } },
                        },
                    },
                    entity1: {
                        value: {
                            mode: 'auto',
                            type: 'triggered',
                            role: 'media.seek',
                            regexp: /\.seek$/,
                            dp: '',
                            read: `return val != null ? Math.round(val) : val;`,
                        },
                        set: {
                            mode: 'auto',
                            type: 'state',
                            writeable: true,
                            role: 'media.seek',
                            regexp: /\.seek$/,
                            dp: '',
                            write: `return val != null ? Math.round(val) : val;`,
                        },
                    },
                },
            },
            data: {
                headline: page.media.name ? await configManager.getFieldAsDataItemConfig(page.media.name) : undefined,

                album: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.album',
                    regexp: /\.current_album$/,
                    dp: '',
                },
                title: {
                    value: {
                        mode: 'auto',
                        type: 'triggered',
                        role: 'media.title',
                        regexp: /\.current_title$/,
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
                    regexp: /\.current_duration$/,
                    dp: '',
                    read: `return val ? val*1000 : val;`,
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
                    regexp: /\.current_elapsed$/,
                    dp: '',
                    read: `return val != null ? val*1000 : val;`,
                },
                volume: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: ['level.volume'],
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.volume$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: ['level.volume'],
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.volume$/,
                        dp: '',
                    },
                },
                useGroupVolume: {
                    mode: 'auto',
                    type: 'triggered',
                    regexp: /.?\.members$/,
                    dp: '',
                    read: `
                        if (typeof val === 'string') {
                            const t = val.split(',');
                            return t.length > 1;
                        };
                        return false;`,
                },
                volumeGroup: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: ['level.volume.group'],
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.group_volume$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: ['level.volume.group'],
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.group_volume$/,
                        dp: '',
                    },
                },

                artist: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.artist',
                        regexp: /\.current_artist$/,
                        dp: '',
                    },
                    true: page.media.colorMediaArtist
                        ? {
                              color: await configManager.getIconColor(page.media.colorMediaArtist),
                          }
                        : undefined,
                },
                shuffle: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.mode.shuffle',
                        regexp: /\.shuffle$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.mode.shuffle',
                        regexp: /\.shuffle$/,
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
                    regexp: /\.play$/,
                    dp: '',
                },
                isPlaying: {
                    mode: 'auto',
                    type: 'triggered',
                    role: ['media.state'],
                    regexp: /\.state_simple$/,
                    dp: '',
                },
                mediaState: {
                    mode: 'auto',
                    type: 'triggered',
                    role: ['media.state'],
                    regexp: /\.state_simple$/,
                    dp: '',
                },
                stop: {
                    mode: 'auto',
                    type: 'state',
                    role: ['button.stop'],
                    regexp: /\.stop$/,
                    dp: '',
                },
                pause: {
                    mode: 'auto',
                    type: 'state',
                    role: 'button.pause',
                    regexp: /\.pause$/,
                    dp: '',
                },
                forward: {
                    mode: 'auto',
                    type: 'state',
                    role: 'button.next',
                    regexp: /\.next$/,
                    dp: '',
                },
                backward: {
                    mode: 'auto',
                    type: 'state',
                    role: 'button.prev',
                    regexp: /\.prev$/,
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
                        role: 'indicator.reachable',
                        regexp: /\.alive$/,
                        dp: '',
                    },
                },

                enabled: {
                    mode: 'auto',
                    type: 'triggered',
                    role: 'indicator.reachable',
                    regexp: /\.alive$/,
                    dp: '',
                    read: 'return !val;',
                },
            },
        });
    }

    //speaker select
    if (
        !page.media.deactivateDefaultItems?.speakerList &&
        Array.isArray(page.media.speakerList) &&
        page.media.speakerList.length > 1
    ) {
        gridItem.pageItems.push({
            role: 'selectGrid',
            type: 'button',

            data: {
                entity1: {
                    value: {
                        mode: 'auto',
                        type: 'triggered',
                        regexp: /.?\.members$/,
                        dp: '',
                        read: `
                        let data = val;
                        if (typeof val === 'string') {
                        const t = val.split(',').map(i => i.trim());
                            return t.length < 2 || t[0] !==('${page.media.speakerList[0]}');
                        };
                        return true;`,
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
    //favorite select
    if (!page.media.deactivateDefaultItems?.favoriteList) {
        gridItem.pageItems.push({
            role: '2valuesIsValue',
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
                        type: 'triggered',
                        regexp: /.?\.favorites_set$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        regexp: /.?\.favorites_set$/,
                        dp: '',
                    },
                },
                valueList: {
                    type: 'const',
                    constVal: JSON.stringify(page.media.favoriteList || []),
                },
                valueList2: {
                    mode: 'auto',
                    type: 'state',
                    regexp: /.?\.favorites_list_array$/,
                    dp: '',
                },

                headline: {
                    type: 'const',
                    constVal: 'favoriteList',
                },
                enabled: {
                    mode: 'auto',
                    type: 'triggered',
                    regexp: /.?\.favorites_list_array$/,
                    dp: '',
                    read: `
                    let data = val;
                    if (typeof val === 'string') {
                        try {
                            data = JSON.parse(val);
                        } catch {
                            return false;
                        }
                    }
                    if (Array.isArray(data)) {
                        return data.length !== 0;
                    }
                    return false;`,
                },
            },
        });
    }
    //playlist select
    if (!page.media.deactivateDefaultItems?.playList) {
        gridItem.pageItems.push({
            role: '',
            type: 'input_sel',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'playlist-play' },
                        color: await configManager.getIconColor(page.media.itemsColorOn?.playList, Color.activated),
                    },
                },
                entityInSel: Array.isArray(page.media.playList)
                    ? {
                          set: {
                              mode: 'auto',
                              type: 'state',
                              regexp: /.?\.playlist_set$/,
                              dp: '',
                              write: Array.isArray(page.media.playList)
                                  ? `return ${JSON.stringify(page.media.playList)}.length > val ? ${JSON.stringify(page.media.playList)}[val]: ''`
                                  : undefined,
                          },
                      }
                    : undefined,
                valueList: Array.isArray(page.media.playList)
                    ? {
                          type: 'const',
                          constVal: JSON.stringify(page.media.playList),
                      }
                    : undefined,
                headline: {
                    type: 'const',
                    constVal: 'playList',
                },
                enabled: {
                    type: 'const',
                    constVal: Array.isArray(page.media.playList) ? page.media.playList.length > 0 : false,
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
    //tracklist
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
                        regexp: /.?\.current_track_number$/,
                        dp: '',
                        read: `return val != null && parseInt(val) > 0? (parseInt(val)-1) : val;`,
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        regexp: /.?\.current_track_number$/,
                        dp: '',
                        write: `return parseInt(val)+1;`,
                    },
                },
                valueList: {
                    mode: 'auto',
                    type: 'state',
                    regexp: /.?\.queue$/,
                    dp: '',
                    read: `
                        let data = val;
                        if (typeof val === 'string') {
                            data = data.split(',');
                            return data.map(item => {
                                item = item.trim();
                                let result = item.split(' - ')[1];
                                if (!result) {
                                    result = item;
                                }
                                return result;
                            });
                        }
                        return [];`,
                },

                headline: {
                    type: 'const',
                    constVal: 'trackList',
                },
            },
        });
    }
    // repeat
    if (!page.media.deactivateDefaultItems?.repeat) {
        const tempOn = await configManager.getIconColor(page.media.itemsColorOn?.repeat);
        const tempOff = await configManager.getIconColor(page.media.itemsColorOff?.repeat);
        let colorOn: RGB | undefined;
        let colorOff: RGB | undefined;
        if (tempOn && tempOn.type === 'const') {
            colorOn = tempOn.constVal as RGB;
        }
        if (tempOff && tempOff.type === 'const') {
            colorOff = tempOff.constVal as RGB;
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
                            regexp: /\.repeat$/,
                            dp: '',
                            read: `switch (val) {
                                    case 0:
                                        return 'repeat';
                                    case 2:
                                        return 'repeat-once';
                                    case 1:
                                        return 'repeat-variant';
                                }`,
                        },
                        color: {
                            mode: 'auto',
                            type: 'state',
                            role: 'media.mode.repeat',
                            regexp: /\.repeat$/,
                            dp: '',
                            read: `switch (val) {
                                    case 0:
                                        return ${colorOff ? JSON.stringify(colorOff) : 'Color.deactivated'};
                                    case 1:
                                        return ${colorOn ? JSON.stringify(colorOn) : 'Color.activated'};
                                    case 2:
                                        return ${colorOn ? JSON.stringify(colorOn) : 'Color.option4'};
                                }`,
                        },
                    },
                },
                entity1: {
                    value: {
                        mode: 'auto',
                        type: 'triggered',
                        role: 'media.mode.repeat',
                        regexp: /\.repeat$/,
                        dp: '',
                        read: `
                            switch (val) {
                                case 0:
                                    return 'OFF';
                                case 1:
                                    return 'ALL';
                                case 2:
                                    return 'ONE';
                            }
                            return 'OFF';
                        `,
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.mode.repeat',
                        regexp: /\.repeat$/,
                        dp: '',
                        write: `
                            switch (val) {
                                case 'OFF':
                                    return 1;
                                case 'ALL':
                                    return 2;
                                case 'ONE':
                                    return 0;
                            }
                            return 0;`,
                    },
                },
            },
        });
    }
    // crossfade
    if (!page.media.deactivateDefaultItems?.crossfade) {
        gridItem.pageItems.push({
            role: '',
            type: 'button',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'shuffle' },
                        color: await configManager.getIconColor(page.media.itemsColorOn?.crossfade, Color.activated),
                    },
                    false: {
                        value: { type: 'const', constVal: 'shuffle' },
                        color: await configManager.getIconColor(page.media.itemsColorOff?.crossfade, Color.deactivated),
                    },
                },
                entity1: {
                    value: {
                        mode: 'auto',
                        type: 'triggered',
                        role: 'media.mode.crossfade',
                        regexp: /\.crossfade$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.mode.crossfade',
                        regexp: /\.crossfade$/,
                        dp: '',
                    },
                },
            },
        });
    }

    return { gridItem, messages };
}
