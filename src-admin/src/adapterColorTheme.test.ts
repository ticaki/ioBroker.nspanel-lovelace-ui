import { expect } from 'chai';
import { Color } from '../../src/lib/const/Color';
import {
    type ColorThemeSocket,
    loadAdapterColorTheme,
    resolveThemeColor,
    rgbToHex,
    themeColorHex,
} from './adapterColorTheme';

describe('adapterColorTheme', () => {
    describe('loadAdapterColorTheme', () => {
        const socketWith = (native: Record<string, unknown>, ids: string[] = []): ColorThemeSocket => ({
            getObject: id => {
                ids.push(id);
                return Promise.resolve({ native });
            },
        });

        it('returns the default theme without a socket', async () => {
            expect(await loadAdapterColorTheme(undefined)).to.equal(Color.defaultTheme);
        });
        it('returns the default theme when reading fails', async () => {
            const socket = { getObject: (): Promise<null> => Promise.reject(new Error('no rights')) };
            expect(await loadAdapterColorTheme(socket)).to.equal(Color.defaultTheme);
        });
        it('reads the object of the given instance', async () => {
            const ids: string[] = [];
            await loadAdapterColorTheme(socketWith({}, ids), 'nspanel-lovelace-ui', 2);
            expect(ids).to.deep.equal(['system.adapter.nspanel-lovelace-ui.2']);
        });
        it('returns the theme of the index', async () => {
            expect(await loadAdapterColorTheme(socketWith({ colorTheme: 3 }))).to.equal(Color.sunsetTheme);
        });
        it('builds the custom theme', async () => {
            const theme = await loadAdapterColorTheme(
                socketWith({ colorTheme: 5, colorStates: [{ colOn: '#010203' }] }),
            );
            expect(theme.on).to.deep.equal({ r: 1, g: 2, b: 3 });
        });
    });

    describe('resolveThemeColor', () => {
        it('prefers a key of the theme', () => {
            expect(resolveThemeColor(Color.defaultTheme, 'on')).to.equal(Color.defaultTheme.on);
        });
        it('finds a named color', () => {
            expect(resolveThemeColor(Color.defaultTheme, 'Yellow')).to.equal(Color.Yellow);
        });
        it('returns null for anything else', () => {
            expect(resolveThemeColor(Color.defaultTheme, 'noSuchColor')).to.equal(null);
            expect(resolveThemeColor(Color.defaultTheme, 'name')).to.equal(null);
        });
    });

    describe('hex helpers', () => {
        it('pads the channels', () => {
            expect(rgbToHex({ r: 1, g: 2, b: 255 })).to.equal('#0102ff');
        });
        it('uses the fallback for an unknown key', () => {
            expect(themeColorHex(Color.defaultTheme, 'noSuchColor', { r: 0, g: 0, b: 16 })).to.equal('#000010');
        });
    });
});
