import { expect } from 'chai';
import { Screensaver } from './screensaver';
import {
    applyScreensaverNotify,
    mergeScreensaverNotify,
    parseScreensaverNotifyDetails,
    SCREENSAVER_NOTIFY_QUEUE_MAX,
    type ScreensaverNotifyCandidate,
    type ScreensaverNotifyDetails,
    type ScreensaverNotifyQueueEntry,
} from './screensaver-notify-queue';
import type * as pages from '../types/pages';
import type { PageInterface } from '../classes/PageInterface';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { Controller } from '../controller/controller';

/**
 * sendTo `screensaverNotify` with an `id`: a queue of notifications per panel (fields of `setPopupNotification`),
 * mixed with the notifications of the admin list. Without `id` the old single notification stays as it was.
 */

function details(message: Record<string, unknown>): ScreensaverNotifyDetails {
    const d = parseScreensaverNotifyDetails(message);
    if (!d) {
        throw new Error('no details');
    }
    return d;
}

function apply(messages: Record<string, unknown>[]): ScreensaverNotifyQueueEntry[] {
    let queue: ScreensaverNotifyQueueEntry[] = [];
    let seq = 0;
    for (const m of messages) {
        queue = applyScreensaverNotify(queue, details(m), ++seq);
    }
    return queue;
}

describe('lib/pages/screensaver-notify-queue - fields', () => {
    it('reads the fields of setPopupNotification and ignores the ones of the popup', () => {
        const d = details({
            id: 'a',
            headline: 'Washer',
            text: 'done',
            icon: 'washing-machine',
            buzzer: true,
            colorHeadline: '#ff0000',
            colorText: { r: 0, g: 255, b: 0 },
            backgroundBlink: '#0000ff',
            type: 'acknowledge',
            buttonLeft: 'x',
            largeIcon: true,
        });
        expect(d).to.deep.equal({
            id: 'a',
            priority: 50,
            enabled: true,
            headline: 'Washer',
            text: 'done',
            icon: 'washing-machine',
            buzzer: '1,2,3,0xF54',
            colorHeadline: { r: 255, g: 0, b: 0, a: 1 },
            colorText: { r: 0, g: 255, b: 0 },
            backgroundBlink: '#0000ff',
            type: 'acknowledge',
            global: true,
        });
    });

    it('takes heading as alias of headline, headline wins', () => {
        expect(details({ id: 'a', heading: 'H' }).headline).to.equal('H');
        expect(details({ id: 'a', heading: 'H', headline: 'X' }).headline).to.equal('X');
    });

    it('has no details without an id', () => {
        expect(parseScreensaverNotifyDetails({ heading: 'H', enabled: true })).to.equal(undefined);
        expect(parseScreensaverNotifyDetails({ id: '' })).to.equal(undefined);
        expect(parseScreensaverNotifyDetails('x')).to.equal(undefined);
    });

    it('reads its own JSON again unchanged', () => {
        const d = details({ id: 'a', headline: 'H', colorHeadline: '#ff0000', buzzer: '2,3,4', global: false });
        expect(parseScreensaverNotifyDetails(JSON.parse(JSON.stringify(d)))).to.deep.equal(d);
    });

    it('drops an invalid blink color', () => {
        expect(details({ id: 'a', backgroundBlink: 'red' }).backgroundBlink).to.equal(undefined);
    });
});

describe('lib/pages/screensaver-notify-queue - queue', () => {
    it('adds, replaces in place and sorts by priority, older first', () => {
        const q = apply([
            { id: 'a', headline: 'A', priority: 50 },
            { id: 'b', headline: 'B', priority: 50 },
            { id: 'c', headline: 'C', priority: 10 },
            { id: 'a', headline: 'A2', priority: 50 },
        ]);
        expect(q.map(e => `${e.id}:${e.heading}`)).to.deep.equal(['c:C', 'a:A2', 'b:B']);
    });

    it('removes the id with priority <= 0 and with enabled false', () => {
        expect(apply([{ id: 'a' }, { id: 'b' }, { id: 'a', priority: 0 }]).map(e => e.id)).to.deep.equal(['b']);
        expect(apply([{ id: 'a' }, { id: 'b' }, { id: 'b', enabled: false }]).map(e => e.id)).to.deep.equal(['a']);
    });

    it('removes all ids with the prefix with priority <= -100', () => {
        const q = apply([{ id: 'x.1' }, { id: 'x.2' }, { id: 'y.1' }, { id: 'x.', priority: -100 }]);
        expect(q.map(e => e.id)).to.deep.equal(['y.1']);
        // -1 removes only the exact id
        expect(apply([{ id: 'x.1' }, { id: 'x.', priority: -1 }]).map(e => e.id)).to.deep.equal(['x.1']);
    });

    it(`keeps at most ${SCREENSAVER_NOTIFY_QUEUE_MAX} entries, the less important go`, () => {
        const messages = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, priority: 50 }));
        messages.push({ id: 'top', priority: 1 });
        const q = apply(messages);
        expect(q).to.have.length(SCREENSAVER_NOTIFY_QUEUE_MAX);
        expect(q[0].id).to.equal('top');
        expect(q.at(-1)?.id).to.equal('n8');
    });

    it('puts the icon in front of the headline and converts the blink color', () => {
        const [e] = apply([{ id: 'a', headline: 'Washer', icon: 'washing-machine', backgroundBlink: '#ff0000' }]);
        expect(e.heading).to.equal(`${Icons.GetIcon('washing-machine')} Washer`);
        expect(e.blink).to.equal(Color.rgb_dec565({ r: 255, g: 0, b: 0 }));
    });

    it('mixes with the admin list: priority, tie goes to the queue, older first in the queue', () => {
        const c = (id: string, prio: number): ScreensaverNotifyCandidate => ({ id, heading: id, text: '', prio });
        const merged = mergeScreensaverNotify(
            [c('q1', 50), c('q2', 50), c('q3', 99)],
            [c('a1', 10), c('a2', 50), c('a3', 50), c('a4', 99)],
        );
        expect(merged.map(m => m.id)).to.deep.equal(['a1', 'q1', 'q2', 'a2', 'a3', 'q3', 'a4']);
    });
});

describe('lib/pages/screensaver - queue of the sendTo on the panel', () => {
    type Fixture = {
        saver: any;
        sent: string[];
        buzzer: string[];
        internal: { id: string; val: unknown }[];
        /** notify entries of the admin list (getData) */
        admin: string[];
    };

    function setup(): Fixture {
        const sent: string[] = [];
        const buzzer: string[] = [];
        const internal: Fixture['internal'] = [];
        const admin: string[] = [];
        const noop = (): void => undefined;
        const log = { debug: noop, info: noop, warn: noop, error: noop };
        const adapter = {
            namespace: 'nspanel-lovelace-ui.0',
            unload: false,
            log,
            library: {},
            controller: { statesControler: {} },
            setTimeout: (): unknown => ({}),
            clearTimeout: noop,
        };
        const panel = {
            name: 'p',
            friendlyName: 'Panel',
            topic: 't',
            isOnline: true,
            isVirtual: true,
            isBuzzerAllowed: true,
            info: { nspanel: {} },
            dim: { dayMode: true, standby: 10, nightStandby: 10 },
            panelSend: { addMessage: (payload: string): void => void sent.push(payload) },
            sendToTasmota: (_topic: string, payload: string): void => void buzzer.push(payload),
            controller: {
                panels: [
                    { name: 'p', unload: false },
                    { name: 'q', unload: false },
                ],
            },
            statesControler: {
                setInternalState: async (id: string, val: unknown): Promise<boolean> => {
                    internal.push({ id, val });
                    return Promise.resolve(true);
                },
            },
        };
        const config = {
            card: 'screensaver',
            id: '0',
            name: 'scr',
            dpInit: '',
            adapter,
            panel,
        } as unknown as PageInterface;
        const page = {
            uniqueID: 'scr',
            alwaysOn: 'none',
            pageItems: [],
            config: { card: 'screensaver', mode: 'standard', rotationTime: 0, model: 'eu', data: undefined },
        } as unknown as pages.PageBase;
        const saver: any = new Screensaver(config, page);
        saver.log = log;
        saver.library = { writedp: async (): Promise<void> => Promise.resolve() };
        saver.getData = async (): Promise<unknown> => Promise.resolve({ options: { notify: admin } });
        return { saver, sent, buzzer, internal, admin };
    }

    /**
     * an admin entry as the page item sends it
     *
     * @param id id of the page item
     * @param heading headline
     * @param text text
     * @param prio priority
     * @param buzzer tone sequence, empty = none
     */
    const adminEntry = (id: string, heading: string, text: string, prio: number, buzzer = ''): string =>
        `~${id}~~~${text}~${heading}<sp!it>${prio}<sp!it>${buzzer}<sp!it>`;
    const notifies = (sent: string[]): string[] => sent.filter(m => m.startsWith('notify~'));
    const lines = (m: string | undefined): string => (m ?? '').split('~').slice(1, 3).join('~');

    it('the old single notification still covers everything', async () => {
        const f = setup();
        await f.saver.setQueuedNotify(details({ id: 'a', headline: 'Q', text: 'queue', priority: 1 }));
        f.saver.headingNotification = 'Old';
        f.saver.textNotification = 'single';
        f.saver.sendNotify(true);
        await new Promise(resolve => setImmediate(resolve));
        expect(lines(notifies(f.sent).at(-1))).to.equal('Old~single');
        f.saver.sendNotify(false);
        await new Promise(resolve => setImmediate(resolve));
        expect(lines(notifies(f.sent).at(-1))).to.equal('Q~queue');
    });

    it('a tie with the admin list goes to the queue, a more important admin entry wins', async () => {
        const f = setup();
        f.admin.push(adminEntry('scr?1', 'Admin', 'a', 50));
        await f.saver.setQueuedNotify(details({ id: 'a', headline: 'Q', text: 'queue' }));
        expect(lines(notifies(f.sent).at(-1))).to.equal('Q~queue');
        f.admin.push(adminEntry('scr?2', 'Urgent', 'u', 49));
        await f.saver.HandleNotification();
        expect(lines(notifies(f.sent).at(-1))).to.equal('Urgent~u');
    });

    it('removing the shown entry shows the next one, the older first', async () => {
        const f = setup();
        await f.saver.setQueuedNotify(details({ id: 'a', headline: 'A', text: '1' }));
        await f.saver.setQueuedNotify(details({ id: 'b', headline: 'B', text: '2' }));
        expect(lines(notifies(f.sent).at(-1))).to.equal('A~1');
        await f.saver.setQueuedNotify(details({ id: 'a', priority: 0 }));
        expect(lines(notifies(f.sent).at(-1))).to.equal('B~2');
        await f.saver.setQueuedNotify(details({ id: 'b', enabled: false }));
        expect(notifies(f.sent).at(-1)).to.equal('notify~~');
    });

    it('sends the colors of the entry instead of the theme and buzzes once', async () => {
        const f = setup();
        await f.saver.setQueuedNotify(
            details({ id: 'a', headline: 'A', text: '1', colorHeadline: '#ff0000', buzzer: '1,2' }),
        );
        const fields = (notifies(f.sent).at(-1) ?? '').split('~');
        expect(fields[3]).to.equal(String(Color.rgb_dec565({ r: 255, g: 0, b: 0 })));
        expect(f.buzzer).to.deep.equal(['1,2']);
        await f.saver.HandleNotification();
        expect(f.buzzer).to.deep.equal(['1,2']);
    });

    it('a tap removes an acknowledge entry (global: all panels), an information entry stays', async () => {
        const f = setup();
        await f.saver.setQueuedNotify(details({ id: 'info', headline: 'I', text: 'i', priority: 60 }));
        expect(await f.saver.deactivateNotify()).to.equal(false);
        expect(f.internal).to.deep.equal([]);

        await f.saver.setQueuedNotify(details({ id: 'ack', headline: 'K', text: 'k', type: 'acknowledge' }));
        expect(lines(notifies(f.sent).at(-1))).to.equal('K~k');
        expect(await f.saver.deactivateNotify()).to.equal(true);
        expect(lines(notifies(f.sent).at(-1))).to.equal('I~i');
        expect(f.internal).to.deep.equal([
            { id: 'p/cmd/screensaverNotificationCustom', val: JSON.stringify({ id: 'ack', priority: -1 }) },
            { id: 'q/cmd/screensaverNotificationCustom', val: JSON.stringify({ id: 'ack', priority: -1 }) },
        ]);
    });

    it('a tap removes a not global acknowledge entry only on panels with this name', async () => {
        const f = setup();
        await f.saver.setQueuedNotify(details({ id: 'ack', headline: 'K', type: 'acknowledge', global: false }));
        expect(await f.saver.deactivateNotify()).to.equal(true);
        expect(f.internal.map(i => i.id)).to.deep.equal(['p/cmd/screensaverNotificationCustom']);
    });
});

describe('lib/controller/controller - sendTo screensaverNotify', () => {
    type Write = { id: string; val: unknown };

    function setup(): { controller: Controller; writes: Write[]; warn: string[] } {
        const writes: Write[] = [];
        const warn: string[] = [];
        const controller = Object.create(Controller.prototype) as Controller;
        const panel = (name: string, friendlyName: string, topic: string): unknown => ({
            name,
            friendlyName,
            topic,
            screenSaver: {},
        });
        Object.assign(controller, {
            log: {
                debug: (): void => undefined,
                warn: (m: string): void => void warn.push(m),
                error: (): void => undefined,
            },
            // the web clone of kitchen shares its name
            panels: [
                panel('kitchen', 'Küche', 'nspanel/kitchen'),
                panel('kitchen', 'Küche (web)', 'web/kitchen'),
                panel('hall', 'Flur', 'nspanel/hall'),
            ],
            statesControler: {
                setInternalState: async (id: string, val: unknown): Promise<boolean> => {
                    writes.push({ id, val });
                    return Promise.resolve(true);
                },
            },
        });
        return { controller, writes, warn };
    }

    it('without id writes the old states of the panel found by topic, as before', async () => {
        const f = setup();
        const ok = await f.controller.screensaverNotify({
            panel: 'nspanel/hall',
            heading: 'H',
            text: 'T',
            enabled: true,
        });
        expect(ok).to.equal(true);
        expect(f.writes).to.deep.equal([
            { id: 'hall/cmd/screensaverHeadingNotification', val: 'H' },
            { id: 'hall/cmd/screensaverTextNotification', val: 'T' },
            { id: 'hall/cmd/screensaverActivateNotification', val: true },
        ]);
    });

    it('without id takes headline as alias, heading wins; enabled missing = off', async () => {
        const f = setup();
        await f.controller.screensaverNotify({ panel: 'Flur', headline: 'X' });
        await f.controller.screensaverNotify({ panel: 'hall', headline: 'X', heading: 'H' });
        expect(f.writes).to.deep.equal([
            { id: 'hall/cmd/screensaverHeadingNotification', val: 'X' },
            { id: 'hall/cmd/screensaverActivateNotification', val: false },
            { id: 'hall/cmd/screensaverHeadingNotification', val: 'H' },
            { id: 'hall/cmd/screensaverActivateNotification', val: false },
        ]);
    });

    it('with id goes to the queue of every panel once per name, global with more than one', async () => {
        const f = setup();
        expect(await f.controller.screensaverNotify({ id: 'a', headline: 'H', type: 'acknowledge' })).to.equal(true);
        expect(f.writes.map(w => w.id)).to.deep.equal([
            'kitchen/cmd/screensaverNotificationCustom',
            'hall/cmd/screensaverNotificationCustom',
        ]);
        expect(JSON.parse(String(f.writes[0].val))).to.include({ id: 'a', headline: 'H', global: true });
    });

    it('with id to one panel is not global', async () => {
        const f = setup();
        await f.controller.screensaverNotify({ id: 'a', headline: 'H', panel: ['Küche (web)'] });
        expect(f.writes.map(w => w.id)).to.deep.equal(['kitchen/cmd/screensaverNotificationCustom']);
        expect(JSON.parse(String(f.writes[0].val))).to.include({ global: false });
    });

    it('setPopupNotification: global only with more than one panel name, topic finds the panel', async () => {
        const f = setup();
        await f.controller.setPopupNotification({ id: 'a', headline: 'H', panel: 'nspanel/hall' });
        await f.controller.setPopupNotification({ id: 'b', headline: 'H' });
        expect(f.writes.map(w => w.id)).to.deep.equal([
            'hall/cmd/popupNotificationCustom',
            'kitchen/cmd/popupNotificationCustom',
            'hall/cmd/popupNotificationCustom',
        ]);
        expect(f.writes.map(w => JSON.parse(String(w.val)).global)).to.deep.equal([false, true, true]);
    });

    it('answers with an error when no panel is found', async () => {
        const f = setup();
        expect(await f.controller.screensaverNotify({ panel: 'nope', heading: 'H' })).to.equal(false);
        expect(f.writes).to.deep.equal([]);
        expect(f.warn).to.deep.equal(['Panel nope not exists!']);
    });
});
