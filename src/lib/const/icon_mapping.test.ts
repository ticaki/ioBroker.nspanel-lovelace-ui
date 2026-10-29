import { expect } from 'chai';
import { Icons } from './icon_mapping';

describe('lib/const/icon_mapping', () => {
    describe('Icons.GetIcon', () => {
        it('returns the mapped value for a known logo icon', () => {
            // The non-empty mappings at the end of iconMap are media-service logos
            expect(Icons.GetIcon('logo-alexa')).to.equal('logo-alexa');
            expect(Icons.GetIcon('logo-spotify')).to.equal('logo-spotify');
            expect(Icons.GetIcon('logo-sonos')).to.equal('logo-sonos');
            expect(Icons.GetIcon('logo-mpd')).to.equal('logo-mpd');
            expect(Icons.GetIcon('logo-dnla')).to.equal('logo-dnla');
        });
        it('returns a single-character glyph for known material-design icons', () => {
            // Most icons map to a single Private-Use-Area codepoint of the icon font
            const home = Icons.GetIcon('home');
            expect(home).to.have.lengthOf(1);
            const lightbulb = Icons.GetIcon('lightbulb-on');
            expect(lightbulb).to.have.lengthOf(1);
        });
        it('keeps the glyph of existing icons and maps new MDI icons by their codepoint', () => {
            // glyph = MDI codepoint - 0xF0001 + 0xE000, existing glyphs never move
            expect(Icons.GetIcon('account')).to.equal('\ue003');
            expect(Icons.GetIcon('google-home')).to.equal('\ue823');
            // new in MDI 7 (needs HMI 6.0)
            expect(Icons.GetIcon('window-shutter-auto')).to.equal('\ufba2');
            // renamed by MDI - alias on the same glyph
            expect(Icons.GetIcon('lectern')).to.equal(Icons.GetIcon('lecturn'));
            // MDI gave the codepoint of a removed icon to a new one - the new one has a reserved glyph
            expect(Icons.GetIcon('pause-box')).to.not.equal(Icons.GetIcon('book-variant-multiple'));
        });
        it('maps the own icons of script/custom-icons.json to their fixed glyphs', () => {
            expect(Icons.GetIcon('window-tilt-variant')).to.equal('﵀');
            expect(Icons.GetIcon('window-open-hinged-variant')).to.equal('﵁');
            expect(Icons.GetIcon('window-shutter-25')).to.equal('﵂');
            expect(Icons.GetIcon('window-shutter-50')).to.equal('﵃');
            expect(Icons.GetIcon('window-shutter-75')).to.equal('﵄');
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
            expect(Icons.GetIconWithType('home')).to.equal(Icons.GetIcon('home'));
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
            expect(Icons.iconMap.has('logo-dnla')).to.equal(true);
        });
        it('has a substantial number of entries (sanity check)', () => {
            // Guards against accidental clearing of the icon table.
            expect(Icons.iconMap.size).to.be.greaterThan(1000);
        });
    });
});
