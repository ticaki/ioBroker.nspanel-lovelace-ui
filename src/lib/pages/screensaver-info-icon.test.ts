/**
 * The info icon next to the clock of the screensaver (TFT 6.2.0 and web panels, `buttonPress2,bInfo,button,<taps>`):
 * an icon of the adapter opens a popup with its explanation, the icon of the user writes `buttons.infoIcon` and opens
 * the popup with `cmd.screenSaver.infoText` only when that text is set. Standby brightness 0: the first touch only
 * wakes the display.
 */
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { Screensaver } from './screensaver';
import {
    SCREENSAVER_INFO_ICON_ID,
    SCREENSAVER_INFO_ICON_TEXTS,
    SCREENSAVER_INFO_NOTIFY_ID,
    screensaverInfoNotification,
} from './screensaver-info-icon';
import type * as Types from '../types/types';

const noop = (): void => undefined;

type Fixture = {
    saver: Screensaver;
    writes: string[];
    popups: Record<string, unknown>[];
    internal: string[];
};

/**
 * A bare screensaver that shows the given info icon
 *
 * @param icon the shown icon, undefined: none
 * @param icon.name MDI name
 * @param icon.user true: the icon of the user
 * @param standby active standby brightness
 * @param infoText text of the user icon
 */
function setup(icon: { name: string; user: boolean } | undefined, standby = 10, infoText = ''): Fixture {
    const writes: string[] = [];
    const popups: Record<string, unknown>[] = [];
    const internal: string[] = [];
    const s = Object.create(Screensaver.prototype) as Screensaver;
    Object.assign(s, {
        unload: false,
        name: '#scr',
        id: '0',
        infoText,
        shownInfoIcon: icon,
        activeNotification: false,
        notifyHidden: false,
        wakeTapRun: false,
        lastSent: new Map(),
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        adapter: { unload: false },
        library: {
            writedp: async (id: string, val: unknown): Promise<void> => {
                writes.push(`${id}=${String(val)}`);
                return Promise.resolve();
            },
            getTranslation: (key: string): string => `t:${key}`,
        },
        basePanel: {
            name: 'A0',
            dim: { dayMode: true, standby, nightStandby: 50 },
            statesControler: {
                setInternalState: async (id: string, val: string): Promise<void> => {
                    internal.push(id);
                    popups.push(JSON.parse(val));
                    return Promise.resolve();
                },
            },
        },
    });
    return { saver: s, writes, popups, internal };
}

const tap = (opt: string): Types.IncomingEvent => ({
    type: 'event',
    method: 'buttonPress2',
    id: SCREENSAVER_INFO_ICON_ID,
    action: 'button',
    opt,
});

describe('lib/pages/screensaver - tap on the info icon', () => {
    it('an icon of the adapter: popup with the small icon and the translated explanation, no state', async () => {
        for (const [name, key] of Object.entries(SCREENSAVER_INFO_ICON_TEXTS)) {
            const f = setup({ name, user: false });
            await f.saver.onInfoIconTap(tap('2'));
            expect(f.writes, name).to.deep.equal([]);
            expect(f.internal, name).to.deep.equal(['A0/cmd/popupNotificationCustom']);
            expect(f.popups[0], name).to.include({
                id: SCREENSAVER_INFO_NOTIFY_ID,
                type: 'information',
                text: `t:${key}`,
                icon: name,
                largeIcon: false,
                headline: '',
            });
        }
    });

    it('the five icons of the adapter: timer running/paused/expired, development firmware, update', () => {
        expect(Object.keys(SCREENSAVER_INFO_ICON_TEXTS)).to.have.members([
            'timer-sand',
            'timer-pause',
            'timer-alert',
            'cog-refresh-outline',
            'wrench-clock',
        ]);
    });

    it('the icon of the user with a text: buttons.infoIcon and the popup with the text', async () => {
        const f = setup({ name: 'alarm', user: true }, 10, 'Die Waschmaschine ist fertig');
        await f.saver.onInfoIconTap(tap('1'));
        expect(f.writes).to.deep.equal(['panels.A0.buttons.infoIcon=true']);
        expect(f.popups).to.have.length(1);
        expect(f.popups[0]).to.include({ text: 'Die Waschmaschine ist fertig', icon: 'alarm', largeIcon: false });
    });

    it('the icon of the user without a text: only buttons.infoIcon', async () => {
        const f = setup({ name: 'alarm', user: true });
        await f.saver.onInfoIconTap(tap('1'));
        expect(f.writes).to.deep.equal(['panels.A0.buttons.infoIcon=true']);
        expect(f.popups).to.deep.equal([]);
    });

    it('standby brightness 0: the first touch only wakes the display, the second one works', async () => {
        for (const user of [false, true]) {
            const f = setup({ name: user ? 'alarm' : 'timer-sand', user }, 0, 'Text');
            await f.saver.onInfoIconTap(tap('1'));
            expect(f.writes, String(user)).to.deep.equal([]);
            expect(f.popups, String(user)).to.deep.equal([]);
            await f.saver.onInfoIconTap(tap('2'));
            expect(f.popups, String(user)).to.have.length(1);
        }
    });

    it('no icon shown (the HMI sends the tap only with an icon): nothing', async () => {
        const f = setup(undefined);
        await f.saver.onInfoIconTap(tap('2'));
        expect(f.writes).to.deep.equal([]);
        expect(f.popups).to.deep.equal([]);
    });

    it('the notification closes like an information: no buttons, no buzzer, not always on', () => {
        expect(screensaverInfoNotification('wrench-clock', 'x')).to.deep.equal({
            id: SCREENSAVER_INFO_NOTIFY_ID,
            priority: 50,
            type: 'information',
            global: false,
            alwaysOn: false,
            headline: '',
            text: 'x',
            buttonLeft: '',
            buttonMid: '',
            buttonRight: '',
            largeIcon: false,
            buzzer: false,
            icon: 'wrench-clock',
        });
    });

    it('every explanation is translated in all 11 languages', () => {
        const dir = path.join(__dirname, '../../../admin/i18n');
        const keys = [
            ...Object.values(SCREENSAVER_INFO_ICON_TEXTS),
            'StateObjects.buttons.infoIcon',
            'StateObjects.screenSaver.infoText',
            'StateObjects.screenSaver.clockBlink',
        ];
        const langs = fs.readdirSync(dir);
        expect(langs).to.have.length(11);
        for (const lang of langs) {
            const t = JSON.parse(fs.readFileSync(path.join(dir, lang, 'translations.json'), 'utf8')) as Record<
                string,
                string
            >;
            for (const key of keys) {
                expect(t[key], `${lang} ${key}`).to.be.a('string').and.not.equal('');
            }
        }
    });
});
