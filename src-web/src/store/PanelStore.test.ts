import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnyCardModule, CardModule } from '../cards/CardContract';
import { defineCard } from '../cards/CardContract';
import { PanelStore } from './PanelStore';

interface TestModel {
    upd: string[][];
    other: string[];
}

function testModule(pageTypes: string[]): AnyCardModule {
    const module: CardModule<TestModel> = {
        pageTypes,
        initial: () => ({ upd: [], other: [] }),
        parseEntityUpd: (args, prev) => ({ ...prev, upd: [...prev.upd, args] }),
        handleCommand: (cmd, args, prev) => (cmd === 'known' ? { ...prev, other: [cmd, ...args] } : undefined),
        Component: () => null,
    };
    return defineCard(module);
}

function makeStore(): { store: PanelStore; sent: string[]; log: string[] } {
    const sent: string[] = [];
    const log: string[] = [];
    const registry: Record<string, AnyCardModule> = {
        pageStartup: testModule(['pageStartup']),
        cardGrid: testModule(['cardGrid']),
        screensaver: testModule(['screensaver']),
        screensaver2: testModule(['screensaver2']),
        popupNotify: testModule(['popupNotify']),
        popupLight: testModule(['popupLight']),
    };
    const store = new PanelStore({
        registry,
        recv: p => sent.push(`recv:${p}`),
        ack: seq => sent.push(seq === undefined ? 'ack' : `ack:${seq}`),
        log: m => log.push(m),
    });
    return { store, sent, log };
}

describe('PanelStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts on pageStartup', () => {
        const { store } = makeStore();
        expect(store.getSnapshot().page.pageType).toBe('pageStartup');
        expect(store.getSnapshot().global.sleeping).toBe(false);
    });

    it('acks every command and answers pageType with renderCurrentPage after the ack', () => {
        const { store, sent } = makeStore();
        store.dispatch('pageType~cardGrid');
        expect(sent).toEqual(['ack', 'recv:event,renderCurrentPage,cardGrid']);
        sent.length = 0;
        store.dispatch('entityUpd~Title~a~b~c~d~e~f~g~h~i~j~k~l');
        expect(sent).toEqual(['ack']);
        const model = store.getSnapshot().page.model as { upd: string[][] };
        expect(model.upd[0][0]).toBe('Title');
    });

    it('does not send renderCurrentPage for popupNotify', () => {
        const { store, sent } = makeStore();
        store.dispatch('pageType~popupNotify');
        expect(sent).toEqual(['ack']);
    });

    it('does not send renderCurrentPage for popupNotify3', () => {
        const { store, sent } = makeStore();
        store.dispatch('pageType~popupNotify3');
        expect(sent).toEqual(['ack']);
    });

    it('sends the startup event after hello (reset) and again on pageType~pageStartup', () => {
        const { store, sent } = makeStore();
        store.reset('us-p', '1.0.0');
        expect(sent).toEqual(['recv:event,startup,55,us-p,1.0.0']);
        expect(store.getSnapshot().page.pageType).toBe('pageStartup');
        expect(store.getSnapshot().global.model).toBe('us-p');
        sent.length = 0;
        store.dispatch('pageType~cardGrid');
        sent.length = 0;
        store.dispatch('pageType~pageStartup');
        expect(sent).toEqual(['ack', 'recv:event,startup,55,us-p,1.0.0']);
        expect(store.getSnapshot().page.pageType).toBe('pageStartup');
    });

    it('takes the extensions flag of the hello, off by default', () => {
        const { store } = makeStore();
        expect(store.getSnapshot().global.extensions).toBe(false);
        store.reset('eu', '1.0.0', true);
        expect(store.getSnapshot().global.extensions).toBe(true);
        store.reset('eu', '1.0.0');
        expect(store.getSnapshot().global.extensions).toBe(false);
    });

    it('acks a numbered frame with its seq', () => {
        const { store, sent } = makeStore();
        store.dispatch('pageType~cardGrid', 17);
        store.dispatch('time~12:00', 18);
        store.dispatch('time~12:01');
        expect(sent).toEqual(['ack:17', 'recv:event,renderCurrentPage,cardGrid', 'ack:18', 'ack']);
    });

    it('acks unknown commands and pages and logs them', () => {
        const { store, sent, log } = makeStore();
        store.dispatch('pageType~cardNope');
        store.dispatch('entityUpd~x');
        store.dispatch('pageType~cardGrid');
        store.dispatch('whatever~1');
        expect(sent.filter(s => s === 'ack').length).toBe(4);
        expect(log.some(l => l.includes('cardNope'))).toBe(true);
        expect(log.some(l => l.includes('whatever'))).toBe(true);
    });

    it('routes other commands to handleCommand', () => {
        const { store } = makeStore();
        store.dispatch('pageType~cardGrid');
        store.dispatch('known~1~2');
        const model = store.getSnapshot().page.model as { other: string[] };
        expect(model.other).toEqual(['known', '1', '2']);
    });

    it('keeps time, date and dimmode in the global state', () => {
        const { store } = makeStore();
        store.dispatch('time~18:17~bell');
        store.dispatch('date~Donnerstag, 25. August 2022');
        store.dispatch('dimmode~10~100~6371~65535~1');
        const g = store.getSnapshot().global;
        expect(g.time).toBe('18:17');
        expect(g.timeIcon).toBe('bell');
        expect(g.date).toBe('Donnerstag, 25. August 2022');
        expect(g.dim).toEqual({ standby: 10, active: 100, background: 6371, text: 65535 });
        expect(store.brightness).toBe(100);
        store.dispatch('pageType~screensaver');
        expect(store.getSnapshot().global.sleeping).toBe(true);
        expect(store.brightness).toBe(10);
    });

    it('sends sleepReached after the timeout without touch, never in the screensaver', () => {
        const { store, sent } = makeStore();
        store.dispatch('timeout~20');
        store.dispatch('pageType~cardGrid');
        sent.length = 0;
        vi.advanceTimersByTime(19_000);
        store.touch();
        vi.advanceTimersByTime(19_000);
        expect(sent).toEqual([]);
        vi.advanceTimersByTime(1_000);
        expect(sent).toEqual(['recv:event,sleepReached,cardGrid']);
        store.dispatch('pageType~screensaver');
        sent.length = 0;
        vi.advanceTimersByTime(60_000);
        expect(sent).toEqual([]);
    });

    it('press builds buttonPress2 and restarts the timeout', () => {
        const { store, sent } = makeStore();
        store.dispatch('timeout~5');
        store.dispatch('pageType~cardGrid');
        sent.length = 0;
        vi.advanceTimersByTime(4_000);
        store.press('light.x', 'OnOff', 1);
        expect(sent).toEqual(['recv:event,buttonPress2,light.x,OnOff,1']);
        vi.advanceTimersByTime(4_000);
        expect(sent.length).toBe(1);
        vi.advanceTimersByTime(1_000);
        expect(sent[1]).toBe('recv:event,sleepReached,cardGrid');
    });

    it('notifies subscribers', () => {
        const { store } = makeStore();
        const listener = vi.fn();
        store.subscribe(listener);
        store.dispatch('time~1:00');
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('opens a popup locally, asks the adapter for its content and returns on bExit', () => {
        const { store, sent } = makeStore();
        store.dispatch('pageType~cardGrid');
        store.dispatch('entityUpd~Grid~~~~~~~~~~~~~light~light.x~~~Lamp~0');
        sent.length = 0;
        store.openPopup('popupLight', 'light.x', 'Lamp', '');
        expect(sent).toEqual(['recv:event,pageOpenDetail,popupLight,light.x']);
        let page = store.getSnapshot().page;
        expect(page.pageType).toBe('popupLight');
        expect(page.pageArgs).toEqual(['light.x', 'Lamp', '', '']);
        // the detail payload goes to the popup, not to the card
        store.dispatch('entityUpdateDetail~light.x~~65535~1~50~disable~disable');
        expect(store.getSnapshot().page.pageType).toBe('popupLight');
        store.press('light.x', 'bExit');
        page = store.getSnapshot().page;
        expect(page.pageType).toBe('cardGrid');
        expect((page.model as TestModel).upd.length).toBe(1);
        expect(sent[sent.length - 1]).toBe('recv:event,buttonPress2,light.x,bExit');
    });

    it('switches on a raw pageOpenDetail event and keeps the page for the same popup', () => {
        const { store, sent } = makeStore();
        store.dispatch('pageType~cardGrid');
        store.send('event,pageOpenDetail,popupInSel,sel.x');
        expect(store.getSnapshot().page.pageType).toBe('popupInSel');
        expect(store.getSnapshot().page.pageArgs).toEqual(['sel.x', '', '', '']);
        store.send('event,pageOpenDetail,popupInSel,sel.x,bModeNext,2');
        expect(store.getSnapshot().page.pageType).toBe('popupInSel');
        expect(sent.filter(s => s.includes('pageOpenDetail')).length).toBe(2);
        // a page sent by the adapter wins over the local popup
        store.dispatch('pageType~screensaver');
        store.press('popupInSel', 'bExit');
        expect(store.getSnapshot().page.pageType).toBe('screensaver');
    });

    it('opens a popup sent by the adapter like the HMI: args to the popup, pageOpenDetail after the ack', () => {
        const { store, sent } = makeStore();
        store.dispatch('timeout~20');
        store.dispatch('pageType~screensaver2');
        sent.length = 0;
        store.dispatch('pageType~popupLight~Wohnzimmer~0?12~\u{F0335}', 4);
        expect(sent).toEqual(['ack:4', 'recv:event,pageOpenDetail,popupLight,0?12']);
        let page = store.getSnapshot().page;
        expect(page.pageType).toBe('popupLight');
        expect(page.pageArgs).toEqual(['0?12', 'Wohnzimmer', '\u{F0335}', '']);
        expect(store.getSnapshot().global.sleeping).toBe(false);
        // the timeout closes it with bExit, the adapter sends the screensaver again
        sent.length = 0;
        vi.advanceTimersByTime(20_000);
        expect(sent).toEqual(['recv:event,buttonPress2,0?12,bExit']);
        store.dispatch('pageType~screensaver2');
        page = store.getSnapshot().page;
        expect(page.pageType).toBe('screensaver2');
    });

    it('shows popupLight2 of the adapter as popupLight without the name, like the HMI page', () => {
        const { store, sent } = makeStore();
        store.dispatch('pageType~popupLight2~Wohnzimmer~0?12~x');
        expect(sent).toEqual(['ack', 'recv:event,pageOpenDetail,popupLight,0?12']);
        expect(store.getSnapshot().page.pageType).toBe('popupLight');
        expect(store.getSnapshot().page.pageArgs).toEqual(['0?12', '', 'x', '']);
    });

    it('stores the icon colour of the entity as pageArgs[3]', () => {
        const { store } = makeStore();
        store.dispatch('pageType~cardGrid');
        store.openPopup('popupSlider', 'number.x', 'Zahl', '\u{F0374}', 2047);
        expect(store.getSnapshot().page.pageArgs).toEqual(['number.x', 'Zahl', '\u{F0374}', '2047']);
        store.press('number.x', 'bExit');
        // no colour -> empty field, the popups fall back to the foreground
        store.openPopup('popupShutter2', 'shutter.x', 'Rollladen', '\u{F011B}');
        expect(store.getSnapshot().page.pageArgs).toEqual(['shutter.x', 'Rollladen', '\u{F011B}', '']);
        store.press('shutter.x', 'bExit');
        store.openPopup('popupShutter2', 'shutter.x', 'Rollladen', '\u{F011B}', Number.NaN);
        expect(store.getSnapshot().page.pageArgs[3]).toBe('');
    });

    describe('screensaver wake and re-dim', () => {
        function sleepingStore(timeout = 20): ReturnType<typeof makeStore> {
            const made = makeStore();
            made.store.dispatch('dimmode~10~100~6371~65535~1');
            made.store.dispatch(`timeout~${timeout}`);
            made.store.dispatch('pageType~screensaver');
            made.sent.length = 0;
            return made;
        }

        it('starts dimmed and is woken by a tap, which is sent as a normal screensaver press', () => {
            const { store, sent } = sleepingStore();
            expect(store.getSnapshot().global.sleeping).toBe(true);
            expect(store.getSnapshot().global.awake).toBe(false);
            expect(store.brightness).toBe(10);
            store.press('screensaver', 'bExit', 1);
            expect(sent).toEqual(['recv:event,buttonPress2,screensaver,bExit,1']);
            expect(store.getSnapshot().global.awake).toBe(true);
            expect(store.brightness).toBe(100);
        });

        it('is woken by a swipe as well', () => {
            const { store } = sleepingStore();
            store.press('screensaver', 'swipeLeft');
            expect(store.getSnapshot().global.awake).toBe(true);
            expect(store.brightness).toBe(100);
        });

        it('dims again after the timeout without sending anything', () => {
            const { store, sent } = sleepingStore(20);
            store.press('screensaver', 'bExit', 1);
            sent.length = 0;
            vi.advanceTimersByTime(19_999);
            expect(store.brightness).toBe(100);
            vi.advanceTimersByTime(1);
            expect(store.getSnapshot().global.awake).toBe(false);
            expect(store.brightness).toBe(10);
            expect(sent).toEqual([]);
        });

        it('restarts the re-dim timer with every interaction', () => {
            const { store } = sleepingStore(20);
            store.press('screensaver', 'bExit', 1);
            vi.advanceTimersByTime(15_000);
            store.press('light.x', 'button');
            vi.advanceTimersByTime(15_000);
            expect(store.brightness).toBe(100);
            // a touch of the stage (pointer down) counts too
            store.touch();
            vi.advanceTimersByTime(19_000);
            expect(store.brightness).toBe(100);
            vi.advanceTimersByTime(1_000);
            expect(store.brightness).toBe(10);
        });

        it('a touch alone does not wake the dimmed screensaver, the event of the gesture does', () => {
            const { store } = sleepingStore();
            store.touch();
            expect(store.getSnapshot().global.awake).toBe(false);
            store.press('screensaver', 'bExit', 1);
            expect(store.getSnapshot().global.awake).toBe(true);
        });

        it('never dims again with timeout 0', () => {
            const { store } = sleepingStore(0);
            store.press('screensaver', 'bExit', 1);
            vi.advanceTimersByTime(3_600_000);
            expect(store.getSnapshot().global.awake).toBe(true);
            expect(store.brightness).toBe(100);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('takes a new timeout while awake', () => {
            const { store } = sleepingStore(20);
            store.press('screensaver', 'bExit', 1);
            store.dispatch('timeout~5');
            vi.advanceTimersByTime(5_000);
            expect(store.brightness).toBe(10);
        });

        it('leaves the awake state and the timer behind on a page change', () => {
            const { store } = sleepingStore(20);
            store.press('screensaver', 'bExit', 1);
            store.dispatch('pageType~cardGrid');
            expect(store.getSnapshot().global.sleeping).toBe(false);
            expect(store.getSnapshot().global.awake).toBe(false);
            expect(store.brightness).toBe(100);
            // only the sleep timer of the card is left
            expect(vi.getTimerCount()).toBe(1);
            store.dispatch('pageType~screensaver');
            expect(store.getSnapshot().global.awake).toBe(false);
            expect(store.brightness).toBe(10);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('clears the re-dim timer on destroy', () => {
            const { store } = sleepingStore(20);
            store.press('screensaver', 'bExit', 1);
            expect(vi.getTimerCount()).toBe(1);
            store.destroy();
            expect(vi.getTimerCount()).toBe(0);
        });
    });

    it('closes a popup with bExit on timeout and leaves popupNotify alone', () => {
        const { store, sent } = makeStore();
        store.dispatch('timeout~5');
        store.dispatch('pageType~cardGrid');
        store.openPopup('popupLight', 'light.x', 'Lamp');
        sent.length = 0;
        vi.advanceTimersByTime(5_000);
        expect(sent).toEqual(['recv:event,buttonPress2,light.x,bExit']);
        expect(store.getSnapshot().page.pageType).toBe('cardGrid');
        store.dispatch('pageType~popupNotify');
        sent.length = 0;
        vi.advanceTimersByTime(60_000);
        expect(sent).toEqual([]);
    });

    it('leaves the own timeout of popupNotify3 to the page', () => {
        const { store, sent } = makeStore();
        store.dispatch('timeout~5');
        store.dispatch('pageType~popupNotify3');
        sent.length = 0;
        vi.advanceTimersByTime(60_000);
        expect(sent).toEqual([]);
    });
});
