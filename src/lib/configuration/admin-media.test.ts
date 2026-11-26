import { expect } from 'chai';
import {
    emptyMediaEntry,
    isSelectableMediaPlayer,
    mediaBackends,
    mediaPlayerDefinitions,
    mediaPlayerIdOf,
    parseMediaPlayerDefinitions,
    toMediaPlayerDefinition,
    mediaBackendOf,
    mediaVisibleToolbarItems,
    mediaToolbarOrder,
    mediaToolbarOrderToStore,
    normalizeScrollFields,
    findAlexaPlaylistState,
    parseAlexaPlaylistEntry,
    type MediaEntry,
} from '../types/adminShareConfig';
import { buildMediaScriptPage } from './admin';
import { mediaListOptions } from './admin-media';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import mediaPlayersJson from '../../../templates/media-players.json';

describe('lib/configuration - buildMediaScriptPage', () => {
    it('leaves everything to the adapter for a bare player', () => {
        const page = buildMediaScriptPage({ ...emptyMediaEntry('radio'), mediaId: ' sonos.0.root.192_168_1_20 ' });

        expect(page).to.deep.equal({
            type: 'cardMedia',
            uniqueName: 'radio',
            heading: '',
            media: { id: 'sonos.0.root.192_168_1_20' },
            items: [],
        });
    });

    it('turns the standard items into the script fields', () => {
        const entry: MediaEntry = {
            ...emptyMediaEntry('alexa'),
            mediaId: 'alexa2.0.Echo-Devices.G123',
            toolbar: {
                equalizer: { enabled: false },
                speakerList: { colorOn: '#ff0000', colorOff: '#0000ff' },
                clock: { enabled: true, colorOn: 'red' },
                volumePresets: { enabled: false, colorOn: '#00ff00', colorOff: '#000000' },
            },
        };
        const { media } = buildMediaScriptPage(entry);

        expect(media.deactivateDefaultItems).to.deep.equal({ equalizer: true });
        expect(media.itemsColorOn).to.deep.equal({
            speakerList: { red: 255, green: 0, blue: 0 },
            volumePresets: { red: 0, green: 255, blue: 0 },
        });
        expect(media.itemsColorOff).to.deep.equal({ speakerList: { red: 0, green: 0, blue: 255 } });
    });

    it('switches the alexa2 timer item on only with enabled: true (opt-in)', () => {
        const base: MediaEntry = { ...emptyMediaEntry('alexa'), mediaId: 'alexa2.0.Echo-Devices.G123' };
        expect(buildMediaScriptPage(base).media).to.not.have.property('activateDefaultItems');
        const off = buildMediaScriptPage({ ...base, toolbar: { timer: { enabled: false } } }).media;
        expect(off).to.not.have.property('activateDefaultItems');
        expect(off).to.not.have.property('deactivateDefaultItems');
        const on = buildMediaScriptPage({
            ...base,
            toolbar: { timer: { enabled: true, colorOn: '#ff0000', colorOff: '#0000ff' } },
        }).media;
        expect(on.activateDefaultItems).to.deep.equal({ timer: true });
        expect(on).to.not.have.property('deactivateDefaultItems');
        expect(on.itemsColorOn).to.deep.equal({ timer: { red: 255, green: 0, blue: 0 } });
        expect(on).to.not.have.property('itemsColorOff');
    });

    it('writes the order of the editor as itemsOrder, the order of the backend is left out', () => {
        const base: MediaEntry = { ...emptyMediaEntry('mpd'), mediaId: 'mpd.0' };
        expect(buildMediaScriptPage(base).media).to.not.have.property('itemsOrder');
        expect(
            buildMediaScriptPage({ ...base, toolbarOrder: ['online', 'repeat', 'clock', 'volumePresets', 'crossfade'] })
                .media,
        ).to.not.have.property('itemsOrder');
        expect(
            buildMediaScriptPage({ ...base, toolbarOrder: ['clock', 'equalizer', 'clock'] }).media.itemsOrder,
        ).to.deep.equal(['clock', 'online', 'repeat', 'volumePresets', 'crossfade']);
    });

    it('cleans the lists and clamps the presets to the volume range', () => {
        const entry: MediaEntry = {
            ...emptyMediaEntry('box'),
            mediaId: 'squeezeboxrpc.0.Players.Kueche',
            minValue: 60,
            maxValue: 10,
            speakerList: [' Bad ', '', 'Bad', 'Kueche'],
            playList: [],
            volumePresets: [
                { name: 'leise', value: 2 },
                { name: ' laut ', value: 95.4 },
                { name: '', value: 30 },
            ],
            colorMediaTitle: '#102030',
        };
        const { media } = buildMediaScriptPage(entry);

        expect(media.minValue).to.equal(10);
        expect(media.maxValue).to.equal(60);
        expect(media.speakerList).to.deep.equal(['Bad', 'Kueche']);
        expect(media).to.not.have.property('playList');
        expect(media.volumePresets).to.deep.equal(['leise?10', 'laut?60']);
        expect(media.colorMediaTitle).to.deep.equal({ red: 16, green: 32, blue: 48 });
    });

    it("passes the headline mode 'device' on and leaves the default out", () => {
        const base = { ...emptyMediaEntry('m'), mediaId: 'mpd.0' };
        expect(buildMediaScriptPage({ ...base, headlineMode: 'device' }).media.headlineMode).to.equal('device');
        expect(buildMediaScriptPage({ ...base, headlineMode: 'title' }).media).to.not.have.property('headlineMode');
        expect(buildMediaScriptPage(base).media).to.not.have.property('headlineMode');
    });

    it('keeps a lower volume limit of 0', () => {
        const { media } = buildMediaScriptPage({ ...emptyMediaEntry('m'), mediaId: 'mpd.0', minValue: 0 });
        expect(media.minValue).to.equal(0);
        expect(media).to.not.have.property('maxValue');
    });
});

describe('lib/types/adminShareConfig - media helpers', () => {
    it('detects the backend from the first segment', () => {
        expect(mediaBackendOf('spotify-premium.0')).to.equal('spotify-premium');
        expect(mediaBackendOf('mpd')).to.equal('mpd');
        expect(mediaBackendOf('alias.0.media')).to.equal(undefined);
        expect(mediaBackendOf(undefined)).to.equal(undefined);
    });

    it('shows the standard items of the backend that are not switched off', () => {
        const entry: MediaEntry = {
            ...emptyMediaEntry('m'),
            mediaId: 'mpd.0',
            toolbar: { repeat: { enabled: false } },
        };
        expect(mediaVisibleToolbarItems(entry, 'mpd')).to.deep.equal(['online', 'clock', 'crossfade']);
        entry.volumePresets = [{ name: 'a', value: 1 }];
        expect(mediaVisibleToolbarItems(entry, 'mpd')).to.deep.equal(['online', 'clock', 'volumePresets', 'crossfade']);
    });

    it('sorts the standard items by the stored order, unknown and repeated entries ignored, missing ones behind', () => {
        const items = ['online', 'repeat', 'clock', 'volumePresets', 'crossfade'] as const;
        expect(mediaToolbarOrder(undefined, items)).to.deep.equal([...items]);
        expect(mediaToolbarOrder([], items)).to.deep.equal([...items]);
        expect(mediaToolbarOrder('clock', items)).to.deep.equal([...items]);
        expect(mediaToolbarOrder(['crossfade', 'x', 'timer', 'crossfade', 7, 'clock'], items)).to.deep.equal([
            'crossfade',
            'clock',
            'online',
            'repeat',
            'volumePresets',
        ]);
        expect(mediaToolbarOrderToStore(['online', 'repeat'], items)).to.equal(undefined);
        expect(mediaToolbarOrderToStore(['repeat'], items)).to.deep.equal([
            'repeat',
            'online',
            'clock',
            'volumePresets',
            'crossfade',
        ]);
    });

    it('the preview follows the stored order', () => {
        const entry: MediaEntry = { ...emptyMediaEntry('m'), mediaId: 'mpd.0', toolbarOrder: ['crossfade', 'clock'] };
        expect(mediaVisibleToolbarItems(entry, 'mpd')).to.deep.equal(['crossfade', 'clock', 'online', 'repeat']);
    });

    it('shows the alexa2 timer item only when switched on', () => {
        const entry: MediaEntry = { ...emptyMediaEntry('m'), mediaId: 'alexa2.0.Echo-Devices.G123' };
        expect(mediaVisibleToolbarItems(entry, 'alexa2')).to.not.include('timer');
        entry.toolbar = { timer: { colorOn: '#ff0000' } };
        expect(mediaVisibleToolbarItems(entry, 'alexa2')).to.not.include('timer');
        entry.toolbar = { timer: { enabled: true } };
        expect(mediaVisibleToolbarItems(entry, 'alexa2')).to.include('timer');
        expect(mediaVisibleToolbarItems(entry, 'sonos')).to.not.include('timer');
    });
});

describe('lib/types/adminShareConfig - normalizeScrollFields', () => {
    it('defaults to classic paging by full pages', () => {
        expect(normalizeScrollFields({}, 'cardEntities')).to.deep.equal({
            scrollPresentation: 'classic',
            scrollType: 'page',
        });
    });

    it('drops half paging where the card cannot do it', () => {
        expect(normalizeScrollFields({ scrollType: 'half' }, 'cardMedia').scrollType).to.equal('page');
        expect(normalizeScrollFields({ scrollType: 'half' }, 'cardGrid').scrollType).to.equal('half');
    });

    it('gives auto a timing', () => {
        expect(normalizeScrollFields({ scrollPresentation: 'auto' }, 'cardGrid')).to.deep.equal({
            scrollPresentation: 'auto',
            scrollType: 'page',
            scrollAutoTiming: 15,
        });
        expect(normalizeScrollFields({ scrollPresentation: 'auto', scrollAutoTiming: 5 }, 'cardGrid')).to.include({
            scrollAutoTiming: 5,
        });
        expect(
            normalizeScrollFields({ scrollPresentation: 'arrow', scrollAutoTiming: 5 }, 'cardGrid'),
        ).to.not.have.property('scrollAutoTiming');
    });
});

describe('lib/types - media player definitions (templates/media-players.json)', () => {
    it('has exactly one valid definition per backend of mediaBackends', () => {
        const raw: unknown[] = mediaPlayersJson.players;
        expect(raw.map(e => toMediaPlayerDefinition(e))).to.not.include(undefined);
        expect(mediaPlayerDefinitions.map(d => d.backend)).to.have.members([...mediaBackends]);
        expect(mediaPlayerDefinitions).to.have.length(mediaBackends.length);
    });

    it('rejects invalid entries', () => {
        expect(toMediaPlayerDefinition({ backend: 'hue', kind: 'instance' })).to.equal(undefined);
        expect(toMediaPlayerDefinition({ backend: 'sonos', kind: 'node', folder: 'root' })).to.equal(undefined);
        expect(
            toMediaPlayerDefinition({ backend: 'sonos', kind: 'node', folder: 'a.b', objectType: 'channel' }),
        ).to.equal(undefined);
        expect(
            toMediaPlayerDefinition({ backend: 'sonos', kind: 'node', folder: 'root', objectType: 'enum' }),
        ).to.equal(undefined);
        expect(toMediaPlayerDefinition({ backend: 'mpd', kind: 'other' })).to.equal(undefined);
        expect(toMediaPlayerDefinition(null)).to.equal(undefined);
        expect(parseMediaPlayerDefinitions({ players: 'x' })).to.deep.equal([]);
        expect(
            parseMediaPlayerDefinitions({
                players: [
                    { backend: 'mpd', kind: 'instance' },
                    { backend: 'mpd', kind: 'node', folder: 'x', objectType: 'device' },
                ],
            }),
        ).to.deep.equal([{ backend: 'mpd', kind: 'instance' }]);
    });
});

describe('lib/types - isSelectableMediaPlayer / mediaPlayerIdOf', () => {
    it('accepts only the player nodes of alexa2, sonos and squeezeboxrpc', () => {
        expect(isSelectableMediaPlayer('alexa2.0.Echo-Devices.G090XX', 'device')).to.equal(true);
        expect(isSelectableMediaPlayer('sonos.1.root.192_168_1_20', 'channel')).to.equal(true);
        expect(isSelectableMediaPlayer('squeezeboxrpc.0.Players.Kitchen', 'device')).to.equal(true);
        expect(isSelectableMediaPlayer('sonos.1.root.192_168_1_20')).to.equal(true);

        expect(isSelectableMediaPlayer('alexa2.0.Echo-Devices', 'folder')).to.equal(false);
        expect(isSelectableMediaPlayer('alexa2.0.Echo-Devices.G090XX.Player', 'channel')).to.equal(false);
        expect(isSelectableMediaPlayer('alexa2.0.Echo-Devices.G090XX', 'channel')).to.equal(false);
        expect(isSelectableMediaPlayer('alexa2.0.Contacts.G090XX', 'device')).to.equal(false);
        expect(isSelectableMediaPlayer('sonos.x.root.192_168_1_20', 'channel')).to.equal(false);
        expect(isSelectableMediaPlayer('sonos.0.root.192_168_1_20', 'state')).to.equal(false);
        expect(isSelectableMediaPlayer('hue.0.root.lamp', 'channel')).to.equal(false);
    });

    it('accepts a spotify-premium / mpd instance and any object below it, cut to the instance', () => {
        expect(isSelectableMediaPlayer('spotify-premium.0')).to.equal(true);
        expect(isSelectableMediaPlayer('spotify-premium.0.player.playbackInfo', 'state')).to.equal(true);
        expect(isSelectableMediaPlayer('mpd.1.state', 'state')).to.equal(true);
        expect(isSelectableMediaPlayer('mpd.1.', 'state')).to.equal(false);
        expect(isSelectableMediaPlayer('mpd.a.state', 'state')).to.equal(false);
        expect(isSelectableMediaPlayer('mpd', 'state')).to.equal(false);

        expect(mediaPlayerIdOf('spotify-premium.0.player.playbackInfo')).to.equal('spotify-premium.0');
        expect(mediaPlayerIdOf('mpd.1.state')).to.equal('mpd.1');
        expect(mediaPlayerIdOf('sonos.0.root.192_168_1_20')).to.equal('sonos.0.root.192_168_1_20');
    });
});

describe('lib/configuration - mediaListOptions (alexa2)', () => {
    const echo = 'alexa2.0.Echo-Devices.G090XX';
    const objects: Record<string, ioBroker.ObjectType> = {
        'alexa2.0.Echo-Devices.G090XX': 'device',
        'alexa2.0.Echo-Devices.G0KITCHEN': 'device',
        'alexa2.0.Echo-Devices.G090XX.Music-Provider.TuneIn-Station': 'state',
        'alexa2.0.Echo-Devices.G090XX.Music-Provider.Amazon-Music-Playlist': 'state',
        'alexa2.0.Echo-Devices.G090XX.Music-Provider.Amazon-Music': 'state',
        'alexa2.0.Echo-Devices.G090XX.Music-Provider.Deep.Nested': 'state',
        'alexa2.0.Echo-Devices.G0KITCHEN.Music-Provider.Other-Provider': 'state',
        'alexa2.0.Echo-Devices.G090XX.Player.volume': 'state',
    };
    const adapter = {
        language: 'en',
        getObjectViewAsync: async (
            _design: string,
            search: string,
            params: { startkey: string; endkey: string },
        ): Promise<{ rows: { id: string; value: { common: { name: string } } }[] }> => ({
            rows: Object.keys(objects)
                .filter(id => objects[id] === search && id >= params.startkey && id <= params.endkey)
                .map(id => ({ id, value: { common: { name: id.split('.').pop() ?? '' } } })),
        }),
    } as unknown as NspanelLovelaceUi;

    it('offers the states directly below Music-Provider of the echo as playlists', async () => {
        const options = await mediaListOptions(adapter, echo);
        expect(options.playList).to.deep.equal(['Amazon-Music', 'Amazon-Music-Playlist', 'TuneIn-Station']);
        expect(options.speakerList).to.deep.equal(['G090XX', 'G0KITCHEN']);
        expect(options.favoriteList).to.deep.equal([]);
    });
});

describe('lib/types/adminShareConfig - alexa2 playlist entries', () => {
    it('splits an entry at the first dot and rejects empty parts', () => {
        expect(parseAlexaPlaylistEntry('Amazon-Music-Playlist.Rock')).to.deep.equal({
            state: 'Amazon-Music-Playlist',
            label: 'Rock',
        });
        expect(parseAlexaPlaylistEntry(' TuneIn-Station . Radio 1.2 ')).to.deep.equal({
            state: 'TuneIn-Station',
            label: 'Radio 1.2',
        });
        expect(parseAlexaPlaylistEntry('Rock')).to.equal(undefined);
        expect(parseAlexaPlaylistEntry('.Rock')).to.equal(undefined);
        expect(parseAlexaPlaylistEntry('Amazon-Music-Playlist.')).to.equal(undefined);
        expect(parseAlexaPlaylistEntry(' . ')).to.equal(undefined);
    });

    it('prefers the state whose last segment equals the token', () => {
        const ids = [
            'alexa2.0.Echo-Devices.G090XX.Music-Provider.Amazon-Music-Playlist',
            'alexa2.0.Echo-Devices.G090XX.Music-Provider.Amazon-Music',
        ];
        expect(findAlexaPlaylistState(ids, 'Amazon-Music')).to.equal(ids[1]);
        expect(findAlexaPlaylistState(ids, 'Amazon-Music-Playlist')).to.equal(ids[0]);
        expect(findAlexaPlaylistState(ids, 'Playlist')).to.equal(ids[0]);
        expect(findAlexaPlaylistState(ids, 'TuneIn')).to.equal(undefined);
    });
});
