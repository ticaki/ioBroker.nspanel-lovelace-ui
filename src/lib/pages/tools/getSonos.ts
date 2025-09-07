import { Color } from '../../const/Color';
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

    const arr = page.media.id.split('.').slice(0, 4);
    const viewStr = arr.join('.');
    const str = page.media.id.split('.').slice(0, 4).join('.');
    const devices =
        viewStr && arr.length === 4
            ? await configManager.adapter.getObjectViewAsync('system', 'device', {
                  startkey: `${viewStr}.`,
                  endkey: `${viewStr}${String.fromCharCode(0xfffd)}`,
              })
            : { rows: [] };

    if (devices && devices.rows && devices.rows.length > 0) {
        if (
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
                            value: { type: 'const', constVal: 'speaker' },
                            color: { type: 'const', constVal: { r: 250, b: 250, g: 0 } },
                        },
                    },
                    entity1: {
                        value: {
                            mode: 'auto',
                            type: 'triggered',
                            role: 'media.elapsed',
                            regexp: /\.current_elapsed$/,
                            dp: '',
                            read: `return val != null ? val*1000 : val;`,
                        },
                        set: {
                            mode: 'auto',
                            type: 'state',
                            writeable: true,
                            role: 'media.seek',
                            regexp: /\.seek$/,
                            dp: '',
                            write: `return val != null ? Math.round(val/1000) : val;`,
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
                        : undefined,
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
    if (!page.media.deactivateDefaultItems?.speakerList) {
        gridItem.pageItems.push({
            role: '',
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
                        color: await configManager.getIconColor(page.media.itemsColorOn?.speakerList, Color.good),
                    },
                    false: {
                        value: { type: 'const', constVal: 'speaker-multiple' },
                        color: await configManager.getIconColor(page.media.itemsColorOff?.speakerList, Color.bad),
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'const',
                        constVal: 'Sonos Speaker',
                    },
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
        });
    }
    // time
    if (!page.media.deactivateDefaultItems?.clock) {
        gridItem.pageItems.push({
            template: 'text.clock',
            dpInit: '',
        });
    }
    // repeat
    if (!page.media.deactivateDefaultItems?.repeat) {
        gridItem.pageItems.push({
            role: '',
            type: 'text',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'repeat-variant' },
                        color: await configManager.getIconColor(page.media.itemsColorOn?.repeat, Color.activated),
                    },
                    false: {
                        value: { type: 'const', constVal: 'repeat' },
                        color: await configManager.getIconColor(page.media.itemsColorOff?.repeat, Color.deactivated),
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
                        regexp: /\.repeat$/,
                        dp: '',
                    },
                },
            },
        });
    }

    return { gridItem, messages };
}
