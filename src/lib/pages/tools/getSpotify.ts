import { Color } from '../../const/Color';
import type * as pages from '../../types/pages';
import type { ConfigManager } from '../../classes/config-manager';

export async function getPageSpotify(
    configManager: ConfigManager,
    page: ScriptConfig.PageMedia,
    gridItem: pages.PageBaseConfig,
    messages: string[],
): Promise<{ gridItem: pages.PageBaseConfig; messages: string[] }> {
    //const adapter = configManager.adapter;

    gridItem.dpInit = `/^${page.media.id.split('.').slice(0, 2).join('\\.')}\\./`;
    gridItem = {
        ...gridItem,
        config: {
            ...gridItem.config,
            ident: page.media.id,
            card: 'cardMedia',
            data: {
                headline: page.media.name ? await configManager.getFieldAsDataItemConfig(page.media.name) : undefined,

                album: {
                    mode: 'auto',
                    type: 'state',
                    role: '',
                    regexp: /.?\.player\.album$/,
                    dp: '',
                },
                title: {
                    value: {
                        mode: 'auto',
                        type: 'triggered',
                        role: '',
                        regexp: /.?\.player\.trackName$/,
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
                    role: '',
                    regexp: /.?\.player\.durationMs/,
                    dp: '',
                },
                onOffColor: {
                    true: page.media.colorMediaIcon
                        ? { color: await configManager.getIconColor(page.media.colorMediaIcon) }
                        : undefined,
                },
                elapsed: {
                    mode: 'auto',
                    type: 'triggered',
                    role: '',
                    regexp: /.?\.player\.progress$/,
                    dp: '',
                },
                volume: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: '',
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /.?\.player\.volume$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: '',
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /.?\.player\.volume$/,
                        dp: '',
                    },
                },
                artist: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: '',
                        regexp: /.?\.player\.artistName/,
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
                        role: '',
                        regexp: /.?\.player\.shuffle$/,
                        dp: '',
                        read: `return val == 'on' || val == 'ON';`,
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: '',
                        regexp: /.?\.player\.shuffle$/,
                        dp: '',
                        write: `return val === 'ON' || val === true  ? 'on' : 'off';`,
                    },
                    /*enabled: {
                                    mode: 'auto',
                                    type: 'triggered',
                                    role: 'indicator',
                                    regexp: /.?\.Player\.allowShuffle$/,
                                    dp: '',
                                },*/
                },
                icon: {
                    type: 'const',
                    constVal: 'dialpad',
                },
                play: {
                    mode: 'auto',
                    type: 'state',
                    role: '',
                    regexp: /.?\.player\.play$/,
                    dp: '',
                },
                isPlaying: {
                    mode: 'auto',
                    type: 'triggered',
                    role: '',
                    regexp: /.?\.player\.isPlaying$/,
                    dp: '',
                },
                /*mediaState: {
                                mode: 'auto',
                                type: 'triggered',
                                role: ['media.state'],
                                regexp: /.?\.Player\..?/,
                                dp: '',
                            },*/
                /*stop: {
                                mode: 'auto',
                                type: 'state',
                                role: ['button.stop'],
                                regexp: /.?\.Player\..?/,
                                dp: '',
                            },*/
                pause: {
                    mode: 'auto',
                    type: 'state',
                    role: '',
                    regexp: /.?\.player\.pause$/,
                    dp: '',
                },
                forward: {
                    mode: 'auto',
                    type: 'state',
                    role: '',
                    regexp: /.?\.player\.skipPlus$/,
                    dp: '',
                },
                backward: {
                    mode: 'auto',
                    type: 'state',
                    role: '',
                    regexp: /.?\.player\.skipMinus$/,
                    dp: '',
                },
                logo: {
                    on: {
                        type: 'const',
                        constVal: true,
                    },
                    text: { type: 'const', constVal: '1' },
                    icon: { true: { type: 'const', constVal: 'logo-spotify' } },
                    color: { type: 'const', constVal: { r: 250, b: 250, g: 0 } },
                    list: undefined,
                    action: 'cross',
                },
            },
        },
        items: undefined,
        pageItems: [
            // online
            {
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
                            role: '',
                            regexp: /.?\.info\.connection/,
                            dp: '',
                        },
                    },

                    enabled: {
                        mode: 'auto',
                        type: 'triggered',
                        role: '',
                        regexp: /.?\.info\.connection/,
                        dp: '',
                        read: 'return !val;',
                    },
                },
            },
            //speaker select
            {
                role: 'spotify-speaker',
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
                            regexp: /.?\.devices\.deviceList$/,
                            dp: '',
                        },
                        set: {
                            mode: 'auto',
                            type: 'state',
                            regexp: /.?\.devices\.deviceList$/,
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
            },
            //playlist select
            {
                role: 'spotify-playlist',
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
                            mode: 'auto',
                            type: 'triggered',
                            regexp: /.?\.playlists\.playlistList$/,
                            dp: '',
                        },
                        set: {
                            mode: 'auto',
                            type: 'state',
                            regexp: /.?\.playlists\.playlistList$/,
                            dp: '',
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
            },
            {
                role: 'spotify-tracklist',
                type: 'input_sel',
                dpInit: '',

                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'animation-play-outline' },
                            color: await configManager.getIconColor(page.media.itemsColorOn?.playList, Color.on),
                        },
                    },
                    entityInSel: {
                        value: {
                            mode: 'auto',
                            type: 'triggered',
                            regexp: /.?\.player\.playlist\.trackList$/,
                            dp: '',
                        },
                        set: {
                            mode: 'auto',
                            type: 'state',
                            regexp: /.?\.player\.playlist\.trackList$/,
                            dp: '',
                        },
                    },
                    valueList: {
                        type: 'const',
                        constVal: JSON.stringify([]),
                    },

                    headline: {
                        type: 'const',
                        constVal: 'playList',
                    },
                },
            },
            //equalizer
            /*{
                role: '',
                type: 'number',
                dpInit: '',

                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'equalizer-outline' },
                            color: await configManager.getIconColor(
                                page.media.itemsColorOn?.equalizer,
                                Color.activated,
                            ),
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
            },*/
            // repeat
            {
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
                            color: await configManager.getIconColor(
                                page.media.itemsColorOff?.repeat,
                                Color.deactivated,
                            ),
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
            },
        ],

        uniqueID: page.uniqueName,
    };

    return { gridItem, messages };
}
