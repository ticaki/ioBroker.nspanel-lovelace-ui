import { expect } from 'chai';
import { NOTIFY_BACKGROUND_MIN_VERSION, Screensaver, screensaverNotifyPayload } from './screensaver';
import { Color, type ColorThemenInterface, type RGB } from '../const/Color';

/**
 * Colors of the notification on the screensaver: `notify~<head>~<text>~<head color>~<text color>~<background>`
 * (fields 3/4 read by every TFT, field 5 from TFT 6.2.0 on and by the web panel).
 */
describe('screensaver notification colors', () => {
    const dec = (rgb: RGB): string => String(Color.rgb_dec565(rgb));
    const colors = { head: Color.White, text: Color.Yellow, background: Color.NotifyGray };

    describe('screensaverNotifyPayload', () => {
        it('sends headline, text and the three colors as RGB565', () => {
            expect(screensaverNotifyPayload('Head', 'Text', colors, true)).to.equal(
                `notify~Head~Text~65535~${dec(Color.Yellow)}~14791`,
            );
        });
        it('RGB 56/56/56 is 14791', () => {
            expect(dec(Color.NotifyGray)).to.equal('14791');
        });
        it('leaves the background out for a TFT without field 5', () => {
            expect(screensaverNotifyPayload('Head', 'Text', colors, false)).to.equal(
                `notify~Head~Text~65535~${dec(Color.Yellow)}`,
            );
        });
        it('keeps a field empty when the theme has no color for it, empty fields at the end are left out', () => {
            const noText = { ...colors, text: 'default.color.from.start.fgNotifyText' };
            expect(screensaverNotifyPayload('H', 'T', noText, true)).to.equal('notify~H~T~65535~~14791');
            const none = { head: undefined, text: 'x', background: 'default.color.from.start.bgNotify' };
            expect(screensaverNotifyPayload('H', 'T', none, true)).to.equal('notify~H~T');
        });
        it('replaces a ~ in headline and text', () => {
            expect(screensaverNotifyPayload('a~b', 'c~d', colors, false)).to.match(/^notify~a-b~c-d~/);
        });
    });

    describe('theme defaults', () => {
        const themes: [string, ColorThemenInterface, RGB][] = [
            ['default', Color.defaultTheme, { r: 56, g: 56, b: 56 }],
            ['topical', Color.topicalTheme, Color.NotifyOcean],
            ['technical', Color.technicalTheme, Color.NotifySlate],
            ['sunset', Color.sunsetTheme, Color.NotifyUmber],
            ['volcano', Color.volcanoTheme, Color.LavaDeep],
        ];
        for (const [name, theme, background] of themes) {
            it(`${name}: headline and text white (as the HMI), background set off`, () => {
                expect(theme.fgNotifyHead).to.deep.equal(Color.White);
                expect(theme.fgNotifyText).to.deep.equal(Color.White);
                expect(theme.bgNotify).to.deep.equal(background);
            });
        }
        it('the custom theme takes the three colors of the screensaver group', () => {
            const theme = Color.buildCustomTheme({
                colorScreensaver: [{ colFgNotifyHead: '#010203', colFgNotifyText: '#040506', colBgNotify: '#070809' }],
            });
            expect(theme.fgNotifyHead).to.deep.equal({ r: 1, g: 2, b: 3 });
            expect(theme.fgNotifyText).to.deep.equal({ r: 4, g: 5, b: 6 });
            expect(theme.bgNotify).to.deep.equal({ r: 7, g: 8, b: 9 });
        });
        it('the custom theme without them falls back to the default theme', () => {
            const theme = Color.buildCustomTheme({ colorScreensaver: [{ colFgNotifyHead: '', colBgNotify: ' ' }] });
            expect(theme.fgNotifyHead).to.deep.equal(Color.defaultTheme.fgNotifyHead);
            expect(theme.bgNotify).to.deep.equal(Color.defaultTheme.bgNotify);
        });
        it('the default keys resolve to the theme colors', () => {
            const saved = [Color.fgNotifyHead, Color.fgNotifyText, Color.bgNotify];
            try {
                // only the three keys - setTheme would change every color for the following tests
                Color.fgNotifyHead = Color.volcanoTheme.fgNotifyHead ?? '';
                Color.bgNotify = Color.volcanoTheme.bgNotify ?? '';
                expect(Color.getColorFromDefaultOrReturn('default.color.from.start.bgNotify')).to.deep.equal(
                    Color.LavaDeep,
                );
                expect(Color.getColorFromDefaultOrReturn('default.color.from.start.fgNotifyHead')).to.deep.equal(
                    Color.White,
                );
            } finally {
                [Color.fgNotifyHead, Color.fgNotifyText, Color.bgNotify] = saved;
            }
        });
    });

    describe('version gate of field 5', () => {
        const saved = [Color.fgNotifyHead, Color.fgNotifyText, Color.bgNotify];
        before(() => {
            Color.fgNotifyHead = Color.White;
            Color.fgNotifyText = Color.White;
            Color.bgNotify = Color.NotifyGray;
        });
        after(() => {
            [Color.fgNotifyHead, Color.fgNotifyText, Color.bgNotify] = saved;
        });

        function payload(isVirtual: boolean, version: string, enabled = true): string {
            const saver = Object.create(Screensaver.prototype) as Screensaver;
            Object.assign(saver, {
                basePanel: {
                    isVirtual,
                    meetsVersion: (v: string): boolean =>
                        !!version && version.localeCompare(v, undefined, { numeric: true }) >= 0,
                },
            });
            return (saver as any).notifyPayload(enabled, 'Head', 'Text');
        }

        it(`a hardware panel gets the background from TFT ${NOTIFY_BACKGROUND_MIN_VERSION} on`, () => {
            expect(payload(false, '6.2.0')).to.equal('notify~Head~Text~65535~65535~14791');
            expect(payload(false, '6.3.1')).to.equal('notify~Head~Text~65535~65535~14791');
        });
        it('an older TFT gets headline and text color only', () => {
            for (const version of ['6.1.1', '4.5.1', '']) {
                expect(payload(false, version), version).to.equal('notify~Head~Text~65535~65535');
            }
        });
        it('a web panel gets the background', () => {
            expect(payload(true, '')).to.equal('notify~Head~Text~65535~65535~14791');
        });
        it('clearing stays notify~~', () => {
            expect(payload(true, '6.2.0', false)).to.equal('notify~~');
        });
    });
});
