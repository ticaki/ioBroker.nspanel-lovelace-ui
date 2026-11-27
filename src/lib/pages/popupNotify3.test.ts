/**
 * popupNotify3 (HMI 6.2.0): choice popupNotify / popupNotify3, payload, text fitting and the events of the page.
 */
import { expect } from 'chai';
import adminIcons from '../../../src-admin/src/icons.json';
import popupNotify3IconsJson from '../../../templates/popup-notify3-icons.json';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { textWidth } from '../const/text-width';
import { Panel } from '../controller/panel';
import { PagePopup } from './pagePopup';
import {
    cutUtf8,
    notify3Icon,
    notify3Font,
    notify3Text,
    popupNotify3Buttons,
    popupNotify3Message,
    POPUP_NOTIFY3_ICONS,
    supportsPopupNotify3,
    usePopupNotify3,
    type Notify3Target,
} from './popupNotify3';
import type * as pages from '../types/pages';
import type { NSpanelModel } from '../types/types';

const noop = (): void => undefined;
const EU: Notify3Target = { model: 'eu', isVirtual: false, allowWebExtensions: false, displayVersion: '6.2.0' };

function entry(over: Partial<pages.PagePopupDataDetails> = {}): pages.PagePopupDataDetails {
    return { id: 'n1', priority: 50, type: 'information', headline: 'H', text: 'Unwetter', buttonRight: '', ...over };
}

describe('lib/pages/popupNotify3', () => {
    describe('supportsPopupNotify3 / usePopupNotify3', () => {
        it('hardware: eu, us-l and us-p from TFT 6.2.0 on', () => {
            for (const model of ['eu', 'us-l', 'us-p'] as NSpanelModel[]) {
                expect(
                    supportsPopupNotify3({
                        model,
                        isVirtual: false,
                        allowWebExtensions: false,
                        displayVersion: '6.2.0',
                    }),
                    model,
                ).to.equal(true);
                expect(
                    supportsPopupNotify3({
                        model,
                        isVirtual: false,
                        allowWebExtensions: false,
                        displayVersion: '6.10.1',
                    }),
                    model,
                ).to.equal(true);
                expect(
                    supportsPopupNotify3({
                        model,
                        isVirtual: false,
                        allowWebExtensions: false,
                        displayVersion: '6.1.1',
                    }),
                    model,
                ).to.equal(false);
                expect(
                    supportsPopupNotify3({ model, isVirtual: false, allowWebExtensions: false, displayVersion: '' }),
                    model,
                ).to.equal(false);
            }
        });

        it('web panels and web clones always', () => {
            for (const model of ['eu', 'us-p', 'web-l', 'web-p'] as NSpanelModel[]) {
                expect(
                    supportsPopupNotify3({
                        model,
                        isVirtual: true,
                        allowWebExtensions: false,
                        displayVersion: '1.0.0',
                    }),
                    model,
                ).to.equal(true);
            }
        });

        it('without largeIcon: classic even with an icon, no warning', () => {
            expect(usePopupNotify3(entry({ icon: 'cancel' }), EU)).to.deep.equal({ use: false });
            expect(usePopupNotify3(entry({ icon: 'cancel', largeIcon: false }), EU)).to.deep.equal({ use: false });
            expect(usePopupNotify3(entry({ icon: 'cancel' }), { ...EU, isVirtual: true })).to.deep.equal({
                use: false,
            });
        });

        it('only with largeIcon, on a display with the page', () => {
            expect(usePopupNotify3(entry(), EU)).to.deep.equal({ use: false });
            // largeIcon without icon: the big page with the info icon
            const noIcon = usePopupNotify3(entry({ largeIcon: true, icon: '' }), EU);
            expect(noIcon.use).to.equal(true);
            expect(noIcon.warning).to.contain('showing information-outline');
            expect(usePopupNotify3(undefined, EU)).to.deep.equal({ use: false });
            expect(usePopupNotify3(entry({ largeIcon: true, icon: 'weather-lightning-rainy' }), EU)).to.deep.equal({
                use: true,
            });
            // old TFT: classic with a warning
            const old = usePopupNotify3(entry({ largeIcon: true, icon: 'weather-lightning-rainy' }), {
                ...EU,
                displayVersion: '6.1.1',
            });
            expect(old.use).to.equal(false);
            expect(old.warning).to.contain('TFT 6.2.0');
        });

        it('unknown icon or one without glyph in the big font: information-outline with a warning', () => {
            const unknown = usePopupNotify3(entry({ largeIcon: true, icon: 'no-such-icon' as any }), EU);
            expect(unknown.use).to.equal(true);
            expect(unknown.warning).to.equal(
                "popupNotify3: icon 'no-such-icon' not available for the large notification - showing information-outline",
            );
            expect(notify3Icon(entry({ largeIcon: true, icon: 'no-such-icon' as any }), EU).icon).to.equal(
                'information-outline',
            );
            // lightbulb is a MDI icon, but not in the big icon font of the panel
            expect(notify3Icon(entry({ largeIcon: true, icon: 'lightbulb' }), EU)).to.deep.equal({
                icon: 'information-outline',
                warning:
                    "popupNotify3: icon 'lightbulb' not available for the large notification - showing information-outline",
            });
            expect(notify3Icon(entry({ largeIcon: true, icon: 'cancel' }), EU)).to.deep.equal({ icon: 'cancel' });
            // a web panel with web extensions draws every MDI icon, an unknown name gets the info icon there too
            const web = { ...EU, isVirtual: true, allowWebExtensions: true };
            expect(usePopupNotify3(entry({ largeIcon: true, icon: 'lightbulb' }), web)).to.deep.equal({ use: true });
            expect(notify3Icon(entry({ largeIcon: true, icon: 'lightbulb' }), web)).to.deep.equal({
                icon: 'lightbulb',
            });
            expect(notify3Icon(entry({ largeIcon: true, icon: 'no-such-icon' as any }), web).icon).to.equal(
                'information-outline',
            );
        });

        it('web panel without web extensions: the icons of the hardware panel only', () => {
            for (const model of ['web-l', 'web-p', 'eu'] as NSpanelModel[]) {
                const web: Notify3Target = {
                    model,
                    isVirtual: true,
                    allowWebExtensions: false,
                    displayVersion: '1.0.0',
                };
                expect(notify3Icon(entry({ largeIcon: true, icon: 'lightbulb' }), web), model).to.deep.equal({
                    icon: 'information-outline',
                    warning:
                        "popupNotify3: icon 'lightbulb' not available for the large notification - showing information-outline",
                });
                expect(notify3Icon(entry({ largeIcon: true, icon: 'cancel' }), web), model).to.deep.equal({
                    icon: 'cancel',
                });
            }
            // the option alone does not change a hardware panel
            expect(
                notify3Icon(entry({ largeIcon: true, icon: 'lightbulb' }), { ...EU, allowWebExtensions: true }).icon,
            ).to.equal('information-outline');
        });

        it('every icon of the list is a MDI icon', () => {
            expect(POPUP_NOTIFY3_ICONS).to.have.length(87);
            for (const icon of POPUP_NOTIFY3_ICONS) {
                expect(Icons.iconMap.has(icon), icon).to.equal(true);
            }
        });

        it('the list comes from templates/popup-notify3-icons.json and every icon is in the admin icon tab', () => {
            expect(POPUP_NOTIFY3_ICONS).to.deep.equal(popupNotify3IconsJson);
            expect(new Set(popupNotify3IconsJson).size, 'no duplicates').to.equal(popupNotify3IconsJson.length);
            const adminNames = new Set(adminIcons.map(i => i.name));
            for (const icon of popupNotify3IconsJson) {
                expect(adminNames.has(icon), icon).to.equal(true);
            }
        });
    });

    describe('notify3Font', () => {
        it('maps textSize to the fonts 0/2/3, default 3', () => {
            expect(notify3Font(undefined)).to.equal(3);
            expect(notify3Font('')).to.equal(3);
            expect(notify3Font('x')).to.equal(3);
            expect(notify3Font('0')).to.equal(0);
            expect(notify3Font(0)).to.equal(0);
            expect(notify3Font('1')).to.equal(2);
            expect(notify3Font('2')).to.equal(2);
            expect(notify3Font('3')).to.equal(3);
            expect(notify3Font('5')).to.equal(3);
            expect(notify3Font('8')).to.equal(3);
            expect(notify3Font(8)).to.equal(3);
        });
    });

    describe('notify3Text', () => {
        const long = 'Die Waschmaschine ist fertig und kann ausgeräumt werden';

        it('font 3 and 2: one line cut to 434 px with ellipsis', () => {
            for (const font of [3, 2] as const) {
                const text = notify3Text(long, font, 'eu');
                expect(text).not.to.contain('\r\n');
                expect(text.endsWith('...')).to.equal(true);
                expect(textWidth(text, font, 'eu')).to.be.at.most(434);
            }
            expect(notify3Text('Unwetter', 3, 'eu')).to.equal('Unwetter');
        });

        it('font 3: line breaks of a one line font become spaces', () => {
            expect(notify3Text('WC\nbesetzt', 3, 'eu')).to.equal('WC besetzt');
            expect(notify3Text('WC/r/nbesetzt', 3, 'eu')).to.equal('WC besetzt');
        });

        it('font 0: two lines of at most 434 px joined with CR LF', () => {
            const text = notify3Text(`${long} ${long}`, 0, 'eu');
            const lines = text.split('\r\n');
            expect(lines).to.have.length(2);
            for (const line of lines) {
                expect(textWidth(line, 0, 'eu')).to.be.at.most(434);
            }
            expect(lines[1].endsWith('...')).to.equal(true);
            expect(text).not.to.match(/[^\r]\n/);
        });

        it('us-p: more lines with the portrait width', () => {
            const lines = notify3Text(`${long} ${long}`, 3, 'us-p').split('\r\n');
            expect(lines).to.have.length(2);
            for (const line of lines) {
                expect(textWidth(line, 3, 'us-p')).to.be.at.most(304);
            }
        });

        it('removes ~ and keeps the byte limit of 199', () => {
            expect(notify3Text('a~b', 3, 'eu')).to.equal('a-b');
            expect(Buffer.byteLength(cutUtf8('ä'.repeat(150), 199))).to.equal(198);
            expect(cutUtf8('ab\r\ncd', 3)).to.equal('ab');
            const cjk = notify3Text('漢'.repeat(200), 0, 'web-l');
            expect(Buffer.byteLength(cjk)).to.be.at.most(199);
        });
    });

    describe('buttons', () => {
        it('icons from buttonLeftIcon/buttonRightIcon, none without', () => {
            expect(popupNotify3Buttons(entry(), 1, EU)).to.deep.equal({ left: '', right: '', warnings: [] });
            expect(
                popupNotify3Buttons(entry({ buttonLeftIcon: 'alarm-snooze', buttonRightIcon: 'check-bold' }), 1, EU),
            ).to.deep.equal({ left: 'alarm-snooze', right: 'check-bold', warnings: [] });
        });

        it('a button text without icon and the "Next" of a queue give default icons', () => {
            expect(popupNotify3Buttons(entry({ buttonLeft: 'no', buttonRight: 'ok' }), 1, EU)).to.deep.equal({
                left: 'close-thick',
                right: 'check-bold',
                warnings: [],
            });
            expect(popupNotify3Buttons(entry(), 2, EU).left).to.equal('arrow-right-bold');
        });

        it('an unknown button icon: warning and the default', () => {
            const b = popupNotify3Buttons(entry({ buttonRightIcon: 'nope', buttonRight: 'ok' }), 1, EU);
            expect(b.right).to.equal('check-bold');
            expect(b.warnings[0]).to.contain("unknown buttonRightIcon 'nope'");
            const hidden = popupNotify3Buttons(entry({ buttonLeftIcon: 'nope' }), 1, EU);
            expect(hidden.left).to.equal('');
            expect(hidden.warnings[0]).to.contain('button hidden');
        });

        it('web panels check the button icons like the hardware panel, with and without web extensions', () => {
            // the button font of the templates (eu for web-l, us-p for web-p) is used for the glyph check
            for (const model of ['web-l', 'web-p'] as NSpanelModel[]) {
                for (const allowWebExtensions of [false, true]) {
                    const web: Notify3Target = { model, isVirtual: true, allowWebExtensions, displayVersion: '1.0.0' };
                    expect(
                        popupNotify3Buttons(entry({ buttonLeftIcon: 'alarm-snooze', buttonRightIcon: 'nope' }), 1, web),
                        `${model} ${allowWebExtensions}`,
                    ).to.deep.equal({
                        left: 'alarm-snooze',
                        right: '',
                        warnings: ["popupNotify3: unknown buttonRightIcon 'nope' - button hidden"],
                    });
                }
            }
        });
    });

    describe('popupNotify3Message', () => {
        it('builds the entityUpdateDetail of the HMI', () => {
            const { payload, warnings } = popupNotify3Message({
                id: 'pop',
                details: entry({
                    largeIcon: true,
                    icon: 'weather-lightning-rainy',
                    iconColor: { r: 255, g: 128, b: 0 },
                    text: 'Unwetterwarnung',
                    buttonLeftIcon: 'check-bold',
                    colorButtonLeft: { r: 0, g: 128, b: 0 },
                    buttonRightIcon: 'alarm-snooze',
                }),
                queueLength: 1,
                timeout: 20,
                target: EU,
            });
            expect(warnings).to.deep.equal([]);
            expect(payload.split('~')).to.deep.equal([
                'entityUpdateDetail',
                'pop',
                Icons.GetIcon('weather-lightning-rainy'),
                String(Color.rgb_dec565({ r: 255, g: 128, b: 0 })),
                'Unwetterwarnung',
                '65535',
                '3',
                Icons.GetIcon('check-bold'),
                String(Color.rgb_dec565({ r: 0, g: 128, b: 0 })),
                Icons.GetIcon('alarm-snooze'),
                String(Color.rgb_dec565(Color.Green)),
                '20',
            ]);
        });

        it('hidden buttons: empty icon and color, font 0 with CR LF', () => {
            const { payload } = popupNotify3Message({
                id: 'pop',
                details: entry({
                    largeIcon: true,
                    icon: 'cancel',
                    textSize: '0',
                    text: 'Das WC ist gerade besetzt, bitte warte noch einen Moment bis es wieder frei ist',
                }),
                queueLength: 1,
                timeout: 0,
                target: EU,
            });
            const f = payload.split('~');
            expect(f).to.have.length(12);
            expect(f[3]).to.equal('65535');
            expect(f[4]).to.contain('\r\n');
            expect(f[6]).to.equal('0');
            expect(f.slice(7, 11)).to.deep.equal(['', '', '', '']);
            expect(f[11]).to.equal('0');
            expect(Buffer.byteLength(payload)).to.be.at.most(511);
        });
    });
});

type Sent = { sent: string[]; warnings: string[]; states: string[] };

function popup(
    details: pages.PagePopupDataDetails[],
    panel: Partial<{
        model: NSpanelModel;
        displayVersion: string;
        isVirtual: boolean;
        webExtensionsAllowed: boolean;
        lastCard: string;
    }> = {},
): { page: PagePopup; calls: Sent; basePanel: any } {
    const calls: Sent = { sent: [], warnings: [], states: [] };
    const basePanel: any = {
        name: 'A0',
        lastCard: panel.lastCard ?? 'cardGrid',
        lastSendTypeDate: 0,
        blockTouchEventsForMs: 0,
        timeout: 15,
        isVirtual: panel.isVirtual ?? false,
        webExtensionsAllowed: panel.webExtensionsAllowed ?? false,
        info: { nspanel: { model: panel.model ?? 'eu', displayVersion: panel.displayVersion ?? '6.2.0' } },
        controller: { panels: [] },
        setActivePage: async (): Promise<void> => undefined,
    };
    const state = (name: string): unknown => ({
        setState: async (v: unknown): Promise<void> => {
            calls.states.push(`${name}=${String(v)}`);
        },
    });
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
        detailsArray: details,
        notify3Warnings: new Set<string>(),
        items: { card: 'popupNotify', data: { setStateYes: state('yes'), setStateNo: state('no') } },
        log: { silly: noop, debug: noop, info: noop, warn: (m: string): number => calls.warnings.push(m), error: noop },
        adapter: { unload: false, setTimeout: (): number => 1, clearTimeout: noop },
        library: { getTranslation: (s: string): string => s ?? '' },
        basePanel,
        sendToPanel: (msg: string): void => {
            calls.sent.push(msg);
        },
    });
    // Page.update only arms the refresh timer
    (page as any).refreshInterval = 0;
    return { page, calls, basePanel };
}

describe('lib/pages/pagePopup - popupNotify3', () => {
    it('an entry with icon on TFT 6.2.0 loads popupNotify3 and sends its payload', async () => {
        const { page, calls, basePanel } = popup([entry({ largeIcon: true, icon: 'cancel', text: 'WC besetzt' })]);
        page.sendType();
        await page.update();
        expect(calls.sent[0]).to.equal('pageType~popupNotify3');
        expect(calls.sent[1].startsWith(`entityUpdateDetail~pop~${Icons.GetIcon('cancel')}~`)).to.equal(true);
        expect(calls.sent).to.have.length(2);
        expect(basePanel.lastCard).to.equal('popupNotify3');
    });

    it('old TFT, no largeIcon (also on a web panel) or no icon: classic popupNotify as before', async () => {
        for (const [details, panel] of [
            [entry({ largeIcon: true, icon: 'cancel' }), { displayVersion: '6.1.1' }],
            [entry({ icon: 'cancel' }), {}],
            [entry({ icon: 'cancel' }), { isVirtual: true, model: 'web-l' }],
            [entry(), {}],
        ] as const) {
            const { page, calls, basePanel } = popup([details], panel);
            page.sendType();
            await page.update();
            expect(calls.sent[0]).to.equal('pageType~popupNotify');
            expect(calls.sent[1].split('~')).to.have.length(16);
            expect(basePanel.lastCard).to.equal('popupNotify');
        }
    });

    it('switches the HMI page between entries and warns only once', async () => {
        const { page, calls } = popup(
            [entry({ icon: 'cancel', id: 'a' }), entry({ largeIcon: true, icon: 'lightbulb', id: 'b' })],
            { lastCard: 'popupNotify' },
        );
        await page.update();
        // no largeIcon: classic, the page is loaded already
        expect(calls.sent.filter(s => s.startsWith('pageType'))).to.deep.equal([]);
        (page as any).detailsArray.shift();
        await page.update();
        await page.update();
        expect(calls.sent.filter(s => s.startsWith('pageType'))).to.deep.equal(['pageType~popupNotify3']);
        // lightbulb is not in the big icon font: information-outline, warned once
        const detail = calls.sent.filter(s => s.startsWith('entityUpdateDetail')).pop() ?? '';
        expect(detail.split('~')[2]).to.equal(Icons.GetIcon('information-outline'));
        expect(calls.warnings).to.have.length(1);
    });

    it('web panel: popupNotify3 with the icons of the panel, every MDI icon only with web extensions', async () => {
        for (const webExtensionsAllowed of [false, true]) {
            const { page, calls } = popup([entry({ largeIcon: true, icon: 'lightbulb' })], {
                isVirtual: true,
                model: 'web-p',
                webExtensionsAllowed,
            });
            page.sendType();
            await page.update();
            expect(calls.sent[0]).to.equal('pageType~popupNotify3');
            const detail = calls.sent.filter(s => s.startsWith('entityUpdateDetail')).pop() ?? '';
            expect(detail.split('~')[2]).to.equal(
                Icons.GetIcon(webExtensionsAllowed ? 'lightbulb' : 'information-outline'),
            );
            expect(calls.warnings).to.have.length(webExtensionsAllowed ? 0 : 1);
        }
    });

    it('button3 (right) and button1 (left) behave like popupNotify', async () => {
        const { page, calls } = popup([
            entry({ id: 'a', largeIcon: true, icon: 'cancel', type: 'acknowledge' }),
            entry({ id: 'b', largeIcon: true, icon: 'cancel' }),
        ]);
        await page.onButtonEvent({
            type: 'event',
            method: 'buttonPress2',
            page: 0,
            id: 'pop',
            action: 'notifyAction',
            opt: 'button3',
        } as any);
        expect(calls.states).to.deep.equal(['yes=a']);
        await page.onButtonEvent({
            type: 'event',
            method: 'buttonPress2',
            page: 0,
            id: 'pop',
            action: 'notifyAction',
            opt: 'button1',
        } as any);
        expect(calls.states).to.deep.equal(['yes=a', 'no=b']);
        expect((page as any).detailsArray).to.have.length(0);
    });
});

describe('lib/controller/panel - bExit of popupNotify3', () => {
    for (const id of ['popupNotify', 'popupNotify3']) {
        it(`${id}: back to the page the popup came from, reminder started`, async () => {
            const calls: string[] = [];
            const last = { name: 'grid' };
            const popupPage: any = {
                card: 'popupNotify',
                startReminder: (): number => calls.push('reminder'),
                getLastPage: (): unknown => last,
                removeLastPage: (p: unknown): number => calls.push(`remove:${p === last}`),
            };
            const panel = Object.create(Panel.prototype) as Panel;
            Object.assign(panel, {
                name: 'A0',
                _isOnline: true,
                screenSaver: {},
                _activePage: popupPage,
                log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
                adapter: { config: { debugLogMqtt: false } },
                setActivePage: async (p: unknown): Promise<void> => {
                    calls.push(`active:${p === last ? 'last' : String(p)}`);
                    return Promise.resolve();
                },
            });
            await panel.HandleIncomingMessage({ type: 'event', method: 'buttonPress2', id, action: 'bExit', opt: '' });
            expect(calls).to.deep.equal(['reminder', 'remove:true', 'active:last']);
        });
    }
});
