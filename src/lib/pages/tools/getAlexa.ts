import { Color } from '../../const/Color';
import type * as pages from '../../types/pages';
import type { ConfigManager } from '../../classes/config-manager';
import * as tools from '../../const/tools';

export async function getPageAlexa(
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
            const msg = `${page.uniqueName}: Media page id ${page.media.id} is not a valid alexa2 device!`;
            messages.push(msg);
            adapter.log.warn(msg);
            return { gridItem, messages };
        }
    }
    if (justCheck) {
        return { gridItem, messages: ['done'] };
    }
    gridItem.dpInit = tools.getRegExp(`/^${str.split('.').join('\\.')}/`) || str;
    gridItem = {
        ...gridItem,
        config: {
            ...gridItem.config,
            ident: str,
            card: 'cardMedia',
            data: {
                headline: page.media.name ? await configManager.getFieldAsDataItemConfig(page.media.name) : undefined,

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
                    regexp: /.?\.Player\..?/,
                    dp: '',
                    read: `return val != null ? val*1000 : val;`,
                },
                volume: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: ['level.volume'],
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: ['level.volume'],
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
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
                              color: await configManager.getIconColor(page.media.colorMediaArtist),
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
        uniqueID: page.uniqueName,
        pageItems: [],
    };
    gridItem.pageItems = gridItem.pageItems || [];

    //reminder
    if (!page.media.deactivateDefaultItems?.reminder) {
        gridItem.pageItems.push({
            role: 'text.list',
            type: 'text',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'reminder' },
                        color: await configManager.getIconColor(page.media.itemsColorOff?.reminder, Color.attention),
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
        });
    }
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
        });
    }
    //speaker select
    if (!page.media.deactivateDefaultItems?.speakerList) {
        gridItem.pageItems.push({
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
        });
    }
    //playlist select
    if (!page.media.deactivateDefaultItems?.playList) {
        gridItem.pageItems.push({
            role: 'alexa-playlist',
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
    //equalizer
    if (!page.media.deactivateDefaultItems?.equalizer) {
        gridItem.pageItems.push({
            role: '',
            type: 'number',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'equalizer-outline' },
                        color: await configManager.getIconColor(page.media.itemsColorOn?.equalizer, Color.activated),
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
        });
    }

    return { gridItem, messages };
}
