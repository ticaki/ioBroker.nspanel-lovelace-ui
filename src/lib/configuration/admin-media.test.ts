import { expect } from 'chai';
import {
    emptyMediaEntry,
    mediaBackendOf,
    mediaVisibleToolbarItems,
    normalizeScrollFields,
    type MediaEntry,
} from '../types/adminShareConfig';
import { buildMediaScriptPage } from './admin';

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
