/**
 * The popup of the info icon of the screensaver on the panel: small icon in the color of the screensaver, font 2
 * (one size above the default font 0 of popupNotify), the text of the user in `cmd.screenSaver.infoTextFont`, and
 * the text wrapped at word borders for the text field of popupNotify (the Nextion breaks inside a word).
 */
import { expect } from 'chai';
import { Color, type RGB } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { textWidth } from '../const/text-width';
import { genericStateObjects } from '../const/definition';
import { panelSettingStates } from '../types/panelConfigExport';
import { panelSettingDefaults } from '../types/panelConfigImport';
import type { PagePopupDataDetails } from '../types/pages';
import type * as Types from '../types/types';
import { PagePopup } from './pagePopup';
import { Screensaver } from './screensaver';
import {
    POPUP_NOTIFY_TEXT_WIDTH,
    SCREENSAVER_INFO_FONT_DEFAULT,
    SCREENSAVER_INFO_FONT_STATES,
    SCREENSAVER_INFO_ICON_ID,
    screensaverInfoFont,
    screensaverInfoText,
} from './screensaver-info-icon';

const noop = (): void => undefined;
const DEV_TEXT = 'Auf dem Display läuft eine Entwickler-Firmware.';

/**
 * A bare screensaver that shows the icon; returns the details it writes to cmd/popupNotificationCustom
 *
 * @param icon shown icon
 * @param icon.name MDI name
 * @param icon.user true: the icon of the user
 * @param opts infoText, font state, timer status and model
 * @param opts.infoText text of the user icon
 * @param opts.font value of cmd.screenSaver.infoTextFont
 * @param opts.timer status of the clock timer
 * @param opts.model panel model
 */
async function tapDetails(
    icon: { name: string; user: boolean },
    opts: { infoText?: string; font?: unknown; timer?: string; model?: Types.NSpanelModel } = {},
): Promise<PagePopupDataDetails> {
    const popups: PagePopupDataDetails[] = [];
    const s = Object.create(Screensaver.prototype) as Screensaver;
    Object.assign(s, {
        unload: false,
        name: '#scr',
        id: '0',
        infoText: opts.infoText ?? '',
        _infoTextFont: SCREENSAVER_INFO_FONT_DEFAULT,
        shownInfoIcon: icon,
        timerSelection: opts.timer ? { status: opts.timer } : undefined,
        activeNotification: false,
        notifyHidden: false,
        wakeTapRun: false,
        lastSent: new Map(),
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        adapter: { unload: false },
        library: {
            writedp: async (): Promise<void> => Promise.resolve(),
            getTranslation: (): string => DEV_TEXT,
        },
        basePanel: {
            name: 'A0',
            info: { nspanel: { model: opts.model ?? 'eu' } },
            dim: { dayMode: true, standby: 10, nightStandby: 50 },
            statesControler: {
                setInternalState: async (_id: string, val: string): Promise<void> => {
                    popups.push(JSON.parse(val));
                    return Promise.resolve();
                },
            },
        },
    });
    if (opts.font !== undefined) {
        s.setInfoTextFont(opts.font);
    }
    await s.onInfoIconTap({
        type: 'event',
        method: 'buttonPress2',
        id: SCREENSAVER_INFO_ICON_ID,
        action: 'button',
        opt: '1',
    });
    expect(popups).to.have.length(1);
    return popups[0];
}

/**
 * The payload of the classic popupNotify for an entry
 *
 * @param details the entry
 * @param model panel model
 */
async function payload(details: PagePopupDataDetails, model: Types.NSpanelModel = 'eu'): Promise<string[]> {
    const sent: string[] = [];
    const page = Object.create(PagePopup.prototype) as PagePopup;
    Object.assign(page, {
        card: 'popupNotify',
        id: 'pop',
        name: 'pop',
        unload: false,
        visibility: true,
        lastMessage: '',
        filterDuplicateMessages: true,
        lastCardCounter: 0,
        step: 0,
        lastpage: [],
        detailsArray: [details],
        notify3Warnings: new Set<string>(),
        items: { card: 'popupNotify', data: {} },
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        adapter: { unload: false, setTimeout: (): number => 1, clearTimeout: noop },
        library: { getTranslation: (s: string): string => s ?? '' },
        basePanel: {
            name: 'A0',
            lastCard: 'popupNotify',
            timeout: 20,
            isVirtual: false,
            webExtensionsAllowed: false,
            info: { nspanel: { model, displayVersion: '6.2.0' } },
            controller: { panels: [] },
        },
        sendToPanel: (msg: string): void => {
            sent.push(msg);
        },
        refreshInterval: 0,
    });
    await page.update();
    expect(sent).to.have.length(1);
    return sent[0].split('~');
}

const dec = (rgb: RGB): string => String(Color.rgb_dec565(rgb));

describe('lib/pages/screensaver - popup of the info icon on the panel', () => {
    it('the payload carries the small icon (field 14) in the color of the info icon (field 15)', async () => {
        for (const name of ['timer-sand', 'timer-pause', 'timer-alert', 'cog-refresh-outline', 'wrench-clock']) {
            const timer = name === 'timer-alert' ? 'expired' : name === 'timer-pause' ? 'paused' : 'running';
            const isTimer = name.startsWith('timer');
            const fields = await payload(await tapDetails({ name, user: false }, { timer: isTimer ? timer : '' }));
            expect(fields[14], name).to.equal(Icons.GetIcon(name)).and.not.equal('');
            const color = !isTimer ? (Color.fgTimeAdd as RGB) : timer === 'expired' ? Color.Red : Color.Orange;
            expect(fields[15], name).to.equal(dec(color));
        }
    });

    it('the icon of the user: its icon and the color of the screensaver', async () => {
        const fields = await payload(await tapDetails({ name: 'alarm', user: true }, { infoText: 'Tür offen' }));
        expect(fields[14]).to.equal(Icons.GetIcon('alarm'));
        expect(fields[15]).to.equal(dec(Color.fgTimeAdd as RGB));
        expect(fields[10]).to.equal('Tür offen');
    });

    it('an unknown icon of the user: no icon, the text gets the full width', async () => {
        const details = await tapDetails({ name: 'no-such-icon', user: true }, { infoText: DEV_TEXT });
        const fields = await payload(details);
        expect(fields[14]).to.equal('');
        expect(details.text).to.equal(screensaverInfoText(DEV_TEXT, 2, 'eu', false));
    });

    it('font: the adapter texts always font 2, the text of the user from infoTextFont', async () => {
        expect(SCREENSAVER_INFO_FONT_DEFAULT).to.equal(2);
        for (const font of [0, 3, 5, 'x']) {
            const adapter = await payload(await tapDetails({ name: 'wrench-clock', user: false }, { font }));
            expect(adapter[13], String(font)).to.equal('2');
        }
        for (const [font, expected] of [
            [0, '0'],
            [1, '1'],
            [4, '4'],
            [5, '5'],
            [undefined, '2'],
            [null, '2'],
            ['', '2'],
            ['abc', '2'],
            [6, '2'],
            [8, '2'],
            [-1, '2'],
            [1.5, '2'],
            ['3', '3'],
        ] as const) {
            const user = await payload(await tapDetails({ name: 'alarm', user: true }, { infoText: 'x', font }));
            expect(user[13], String(font)).to.equal(expected);
        }
    });

    it('screensaverInfoFont: 0..5, everything else the default', () => {
        expect([0, 1, 2, 3, 4, 5].map(screensaverInfoFont)).to.deep.equal([0, 1, 2, 3, 4, 5]);
        for (const v of [undefined, null, '', ' ', 'abc', 6, 7, 8, 9, -1, 2.5, Number.NaN, true, {}]) {
            expect(screensaverInfoFont(v), JSON.stringify(v)).to.equal(2);
        }
        expect(screensaverInfoFont('4')).to.equal(4);
    });

    it('the state cmd.screenSaver.infoTextFont: number 0..5 with states, default 2, in export and import', () => {
        const common = genericStateObjects.panel.panels.cmd.screenSaver.infoTextFont.common;
        expect(common).to.include({ type: 'number', write: true, def: 2, min: 0, max: 5 });
        expect(Object.keys(common.states ?? {})).to.deep.equal(['0', '1', '2', '3', '4', '5']);
        expect(common.states).to.deep.equal(SCREENSAVER_INFO_FONT_STATES);
        expect(panelSettingStates).to.deep.include({ id: 'screenSaver.infoTextFont', type: 'number' });
        expect(panelSettingDefaults['screenSaver.infoTextFont']).to.equal(2);
    });

    it('wraps at word borders: "Entwickler-Firmware." stays one word (eu, font 2, next to the icon)', async () => {
        const details = await tapDetails({ name: 'cog-refresh-outline', user: false });
        const lines = (details.text ?? '').split('\n');
        expect(lines).to.deep.equal(['Auf dem Display läuft', 'eine', 'Entwickler-Firmware.']);
        for (const line of lines) {
            expect(textWidth(line, 2, 'eu')).to.be.at.most(POPUP_NOTIFY_TEXT_WIDTH.eu.withIcon);
        }
        // on the panel the lines are joined with CR LF, not wrapped again
        const fields = await payload(details);
        expect(fields[10]).to.equal(lines.join('\r\n'));
    });

    it('the width of the text field per model and font, every line fits', () => {
        const text = 'Die Waschmaschine im Keller ist seit zehn Minuten fertig und wartet auf das Ausräumen.';
        for (const model of ['eu', 'us-l', 'us-p', 'web-l', 'web-p'] as const) {
            for (const font of [0, 1, 2, 3, 4, 5] as const) {
                for (const withIcon of [false, true]) {
                    const width = withIcon
                        ? POPUP_NOTIFY_TEXT_WIDTH[model].withIcon
                        : POPUP_NOTIFY_TEXT_WIDTH[model].text;
                    const lines = screensaverInfoText(text, font, model, withIcon).split('\n');
                    for (const line of lines) {
                        expect(textWidth(line, font, model), `${model} ${font} ${line}`).to.be.at.most(width);
                    }
                    // nothing lost (a word too wide on its own is broken inside, font 4/5)
                    expect(lines.join('').replace(/\s+/g, '')).to.equal(text.replace(/\s+/g, ''));
                    if (font <= 3) {
                        // words stay whole
                        expect(lines.join(' ')).to.equal(text);
                    }
                }
            }
        }
    });

    it('widths of the HMI 6.2.0 text fields: eu/us-l 397/285, us-p 307/306', () => {
        expect(POPUP_NOTIFY_TEXT_WIDTH.eu).to.deep.equal({ text: 397, withIcon: 285 });
        expect(POPUP_NOTIFY_TEXT_WIDTH['us-l']).to.deep.equal({ text: 397, withIcon: 285 });
        expect(POPUP_NOTIFY_TEXT_WIDTH['us-p']).to.deep.equal({ text: 307, withIcon: 306 });
    });

    it('line breaks of the text of the user are kept, longer texts are rotated by the popup', async () => {
        const details = await tapDetails(
            { name: 'alarm', user: true },
            { infoText: 'Zeile 1\nZeile 2\nZeile 3\nZeile 4\nZeile 5\nZeile 6', font: 2 },
        );
        expect(details.text).to.equal('Zeile 1\nZeile 2\nZeile 3\nZeile 4\nZeile 5\nZeile 6');
        // font 2 shows 5 lines: the popup sends 5 of them
        const fields = await payload(details);
        expect(fields[10].split('\r\n').filter(l => l !== '')).to.have.length(5);
    });
});
