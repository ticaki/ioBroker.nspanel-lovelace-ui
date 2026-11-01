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
    normalizeScrollFields,
    type MediaEntry,
} from '../types/adminShareConfig';
import { buildMediaScriptPage } from './admin';
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
