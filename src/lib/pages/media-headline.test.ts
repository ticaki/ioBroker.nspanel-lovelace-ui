import { expect } from 'chai';
import { mediaHeadline, mediaServiceLabel, type MediaHeadlineInput } from './media-headline';

const alexa = 'alexa2.0.Echo-Devices.G123';

function input(patch: Partial<MediaHeadlineInput>): MediaHeadlineInput {
    return {
        title: '',
        ident: alexa,
        playerName: '',
        originalName: 'Schlafzimmer rosa',
        deviceName: 'Schlafzimmer rosa',
        ...patch,
    };
}

describe('lib/pages/media-headline', () => {
    describe('mediaServiceLabel', () => {
        it('names the known services and falls back to the adapter name', () => {
            expect(mediaServiceLabel(alexa)).to.equal('Alexa');
            expect(mediaServiceLabel('spotify-premium.0.player')).to.equal('Spotify');
            expect(mediaServiceLabel('mpd.0')).to.equal('MPD');
            expect(mediaServiceLabel('sonos.0.root.192_168_1_20')).to.equal('Sonos');
            expect(mediaServiceLabel('squeezeboxrpc.0.Players.Bad')).to.equal('Squeezebox');
            expect(mediaServiceLabel('foo.0.bar')).to.equal('foo');
            expect(mediaServiceLabel('')).to.equal('');
        });
    });

    describe("mode 'title' (default)", () => {
        it('shows the song title', () => {
            expect(mediaHeadline(input({ title: 'Song' }))).to.equal('Song');
            expect(mediaHeadline(input({ mode: 'title', title: 'Song' }))).to.equal('Song');
        });

        it('shows service and start device without title', () => {
            expect(mediaHeadline(input({}))).to.equal('Alexa: Schlafzimmer rosa');
            expect(mediaHeadline(input({ originalName: '' }))).to.equal('Alexa');
        });

        it('puts the chosen device in front after switching', () => {
            expect(mediaHeadline(input({ playerName: 'Küche', title: 'Song' }))).to.equal('Küche: Song');
            expect(mediaHeadline(input({ playerName: 'Küche' }))).to.equal('Küche: Alexa');
        });

        it('stays empty without title and id', () => {
            expect(mediaHeadline(input({ ident: '' }))).to.equal('');
        });
    });

    describe("mode 'device'", () => {
        it('shows the start device regardless of the title', () => {
            expect(mediaHeadline(input({ mode: 'device', title: 'Song' }))).to.equal('Schlafzimmer rosa');
            expect(mediaHeadline(input({ mode: 'device' }))).to.equal('Schlafzimmer rosa');
        });

        it('shows the chosen device after switching', () => {
            expect(
                mediaHeadline(input({ mode: 'device', title: 'Song', playerName: 'Küche', deviceName: '' })),
            ).to.equal('Küche');
        });

        it('shows the group coordinator of Sonos/Squeezebox', () => {
            expect(
                mediaHeadline(
                    input({
                        mode: 'device',
                        ident: 'sonos.0.root.192_168_1_21',
                        title: 'Song',
                        deviceName: 'Wohnzimmer',
                    }),
                ),
            ).to.equal('Wohnzimmer');
        });

        it('falls back to the service without a name', () => {
            expect(mediaHeadline(input({ mode: 'device', title: 'Song', originalName: '', deviceName: '' }))).to.equal(
                'Alexa',
            );
        });
    });
});
