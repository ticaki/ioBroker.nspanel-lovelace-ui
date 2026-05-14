import { expect } from 'chai';
import { Icons } from './icon_mapping';

describe('lib/const/icon_mapping', () => {
    describe('Icons.GetIcon', () => {
        it('returns the mapped value for a known logo icon', () => {
            // The 4 non-empty mappings at the end of iconMap are media-service logos
            expect(Icons.GetIcon('logo-alexa')).to.equal('logo-alexa');
            expect(Icons.GetIcon('logo-spotify')).to.equal('logo-spotify');
            expect(Icons.GetIcon('logo-sonos')).to.equal('logo-sonos');
            expect(Icons.GetIcon('logo-mpd')).to.equal('logo-mpd');
        });
        it('returns a single-character glyph for known material-design icons', () => {
            // Most icons map to a single Private-Use-Area codepoint of the icon font
            const home = Icons.GetIcon('home');
            expect(home).to.have.lengthOf(1);
            const lightbulb = Icons.GetIcon('lightbulb-on');
            expect(lightbulb).to.have.lengthOf(1);
        });
        it('returns the input as fallback for unknown icons', () => {
            const garbage = 'definitely-not-an-icon-xyz-12345';
            expect(Icons.GetIcon(garbage)).to.equal(garbage);
        });
        it('returns empty string for empty input', () => {
            expect(Icons.GetIcon('')).to.equal('');
        });
        it('returns empty string for null/undefined inputs', () => {
            expect(Icons.GetIcon(null as unknown as string)).to.equal('');
            expect(Icons.GetIcon(undefined as unknown as string)).to.equal('');
        });
        it('trims whitespace before lookup', () => {
            expect(Icons.GetIcon('  logo-alexa  ')).to.equal('logo-alexa');
        });
        it('does not throw on unusual inputs', () => {
            expect(() => Icons.GetIcon(123 as unknown as string)).to.not.throw();
        });
    });

    describe('Icons.GetIconWithType', () => {
        it('behaves identically to GetIcon for known icons', () => {
            expect(Icons.GetIconWithType('logo-alexa' as any)).to.equal('logo-alexa');
            expect(Icons.GetIconWithType('home' as any)).to.equal(Icons.GetIcon('home'));
        });
    });

    describe('Icons.isIcon', () => {
        it('is a trivial guard that always returns true', () => {
            // Source: trivial type guard, mirrors isStateRole behavior
            expect(Icons.isIcon('home')).to.equal(true);
            expect(Icons.isIcon('totally-fake-icon')).to.equal(true);
        });
    });

    describe('Icons.iconMap', () => {
        it('contains the documented logo mappings', () => {
            expect(Icons.iconMap.has('logo-alexa')).to.equal(true);
            expect(Icons.iconMap.has('logo-mpd')).to.equal(true);
            expect(Icons.iconMap.has('logo-sonos')).to.equal(true);
            expect(Icons.iconMap.has('logo-spotify')).to.equal(true);
        });
        it('has a substantial number of entries (sanity check)', () => {
            // Guards against accidental clearing of the icon table.
            expect(Icons.iconMap.size).to.be.greaterThan(1000);
        });
    });
});
