import { Color } from '../../const/Color';
import type * as pages from '../../types/pages';
import type { ConfigManager } from '../../classes/config-manager';
import { addMediaToolbarItem, orderMediaToolbarItems, type MediaToolbarEntry } from './mediaToolbar';

export async function getPageMpd(
    configManager: ConfigManager,
    page: ScriptConfig.PageMedia,
    gridItem: pages.PageBase,
    messages: string[],
    justCheck = false,
): Promise<{ gridItem: pages.PageBase; messages: string[] }> {
    //const adapter = configManager.adapter;
    if (justCheck) {
        return { gridItem, messages: ['done'] };
    }
    gridItem.dpInit = `/^${page.media.id.split('.').slice(0, 2).join('\\.')}\\./`;
    gridItem = {
        ...gridItem,
        uniqueID: page.uniqueName,
        config: {
            ...gridItem.config,
            ident: page.media.id,
            card: 'cardMedia',
            logo: {
                type: 'button',
                data: {
                    text1: { true: { type: 'const', constVal: '2' } },
                    text: { true: { type: 'const', constVal: '1' } },
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'logo-mpd' },
                            color: { type: 'const', constVal: { r: 250, b: 250, g: 0 } },
                        },
                    },
                    entity1: {
                        value: {
                            type: 'const',
                            constVal: 3,
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
                    regexp: /\.album$/,
                    dp: '',
                },
                title: {
                    value: {
                        mode: 'auto',
                        type: 'triggered',
                        role: 'media.title',
                        regexp: /\.title$/,
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
                    regexp: /\.current_duration_s$/,
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
                    role: 'media.elapsed',
                    regexp: /\.elapsed$/,
                    dp: '',
                    read: `return val ? val*1000 : val;`,
                },
                volume: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: 'level.volume',
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.volume$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: '',
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.setvol$/,
                        dp: '',
                    },
                },
                artist: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.artist',
                        regexp: /\.artist$/,
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
                        type: 'triggered',
                        role: 'media.mode.shuffle',
                        regexp: /\.random$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: 'media.mode.shuffle',
                        regexp: /\.random$/,
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
                    role: 'button.play',
                    regexp: /\.play$/,
                    dp: '',
                },
                isPlaying: {
                    mode: 'auto',
                    type: 'triggered',
                    role: 'media.state',
                    regexp: /\.state$/,
                    dp: '',
                    read: `return val === 'play';`,
                },
                mediaState: {
                    mode: 'auto',
                    type: 'triggered',
                    role: 'media.state',
                    regexp: /\.state$/,
                    dp: '',
                },
                stop: {
                    mode: 'auto',
                    type: 'state',
                    role: 'button.stop',
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
                    regexp: /\.previous$/,
                    dp: '',
                },
            },
        },
        items: undefined,
        pageItems: [],
    };
    gridItem.pageItems = gridItem.pageItems || [];
    /** standard items of the bar, put in the order of itemsOrder at the end */
    const toolbar: MediaToolbarEntry[] = [];

    // Connection status
    if (page.media.deactivateDefaultItems?.online !== true) {
        addMediaToolbarItem(toolbar, 'online', {
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
                        role: 'indicator.connected',
                        regexp: /\.info\.connection$/,
                        dp: '',
                    },
                },
                enabled: {
                    mode: 'auto',
                    type: 'triggered',
                    role: 'indicator.connected',
                    regexp: /\.info\.connection$/,
                    dp: '',
                    read: 'return !val;',
                },
            },
        });
    }

    // Repeat mode
    if (page.media.deactivateDefaultItems?.repeat !== true) {
        addMediaToolbarItem(toolbar, 'repeat', {
            role: '',
            type: 'button',
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

    // time
    if (!page.media.deactivateDefaultItems?.clock) {
        addMediaToolbarItem(toolbar, 'clock', {
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
        addMediaToolbarItem(toolbar, 'volumePresets', {
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
                        role: 'level.volume',
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.volume$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: '',
                        scale: { min: page.media.minValue ?? 0, max: page.media.maxValue ?? 100 },
                        regexp: /\.setvol$/,
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
    if (page.media.deactivateDefaultItems?.crossfade !== true) {
        addMediaToolbarItem(toolbar, 'crossfade', {
            role: '',
            type: 'number',
            dpInit: '',
            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'shuffle' },
                        color: await configManager.getIconColor(page.media.itemsColorOn?.repeat, Color.activated),
                    },
                    false: {
                        value: { type: 'const', constVal: 'shuffle' },
                        color: await configManager.getIconColor(page.media.itemsColorOff?.repeat, Color.deactivated),
                    },
                },
                entity1: {
                    value: {
                        mode: 'auto',
                        type: 'triggered',
                        regexp: /\.crossfade$/,
                        dp: '',
                    },
                    set: {
                        mode: 'auto',
                        type: 'triggered',
                        regexp: /\.crossfade$/,
                        dp: '',
                    },
                },
                heading1: {
                    type: 'const',
                    constVal: 'crossfade',
                },
                minValue1: { type: 'const', constVal: 0 },
                maxValue1: { type: 'const', constVal: 8 },
                steps1: { type: 'const', constVal: 0.5 },
            },
        });
    }

    gridItem.pageItems.push(...orderMediaToolbarItems(toolbar, page.media.itemsOrder));

    return { gridItem, messages };
}
