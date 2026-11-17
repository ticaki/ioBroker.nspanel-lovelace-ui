/**
 * Long press of a screensaver indicator that opens the popup of its channel (TFT 6.0.9+): the screensaver sends
 * `pageType~<popup>~<name>~<id>~<icon>`, answers the `pageOpenDetail` of the HMI with the internal page item, keeps its
 * own messages back while the popup lies on top and draws everything again when it is shown again (`bExit`).
 */
import { expect } from 'chai';
import { Screensaver } from './screensaver';
import { BaseTriggeredPage } from '../classes/baseClassPage';
import { Panel } from '../controller/panel';
import type { PageItem } from './pageItem';
import type * as Types from '../types/types';

const noop = (): void => undefined;

type Calls = { sent: string[]; queued: string[]; writes: string[]; commands: string[]; warnings: string[] };

/**
 * A fake page item: the indicator or the internal item of a popup
 *
 * @param id id of the item (`<page>?<index>`)
 * @param config config of the item
 * @param payload payload the item sends for the list
 * @param calls receives the commands and popups
 */
function fakeItem(id: string, config: Record<string, unknown>, payload: string, calls: Calls): PageItem {
    const item: any = {
        id,
        config,
        dataItems: { type: config.type, role: config.role, data: {} },
        lastPopupType: undefined,
        getPageItemPayload: async (): Promise<string> => payload,
        onCommand: async (action: string, value: string): Promise<boolean> => {
            calls.commands.push(`${id}:${action}:${value}`);
            return true;
        },
        onCommandLongPress: async (): Promise<boolean> => {
            calls.commands.push(`${id}:long`);
            return true;
        },
        GeneratePopup: async (mode: string): Promise<string> => {
            item.lastPopupType = mode;
            return `entityUpdateDetail~${id}~${mode}`;
        },
    };
    return item;
}

/**
 * Screensaver with a text item, an indicator (index 1) and the item of its popup (index 2, no place)
 *
 * @param popupPayload payload of the popup item (its first field is the type)
 * @param role role of the popup item
 */
function setup(
    popupPayload = 'light~0?2~ICON~65535~Licht Küche~1',
    role = 'light',
): { saver: Screensaver; calls: Calls; indicator: PageItem; popupItem: PageItem; basePanel: any } {
    const calls: Calls = { sent: [], queued: [], writes: [], commands: [], warnings: [] };
    const indicator = fakeItem(
        '0?1',
        { modeScr: 'indicator', type: 'button', longPressPopup: 2 },
        'button~0?1~I~1~x~1',
        calls,
    );
    const popupItem = fakeItem('0?2', { type: popupPayload.split('~')[0], role }, popupPayload, calls);
    const basePanel: any = {
        name: 'A0',
        lastCard: 'screensaver2',
        panelSend: { addMessage: (payload: string): number => calls.queued.push(payload) },
    };
    const saver = Object.create(Screensaver.prototype) as Screensaver;
    Object.assign(saver, {
        pageItems: [fakeItem('0?0', { modeScr: 'bottom', type: 'text' }, 'text~0?0~~~~', calls), indicator, popupItem],
        unload: false,
        sleep: false,
        card: 'screensaver2',
        name: '#scr',
        id: '0',
        lastSent: new Map(),
        log: { silly: noop, debug: noop, info: noop, warn: (m: string): number => calls.warnings.push(m), error: noop },
        adapter: { unload: false, setTimeout: (): number => 1, clearTimeout: noop },
        library: {
            writedp: async (id: string, val: unknown): Promise<void> => {
                calls.writes.push(`${id}=${String(val)}`);
            },
        },
        basePanel,
        sendToPanel: (msg: string): void => {
            calls.sent.push(msg);
            // the real sendToPanel hands every message on to sendToPanelClass
            (saver as any).sendToPanelClass(msg, false);
        },
    });
    return { saver, calls, indicator, popupItem, basePanel };
}

const longPress: Types.IncomingEvent = {
    type: 'event',
    method: 'buttonPress3',
    page: 0,
    id: '1',
    action: 'button',
    opt: '1',
};

describe('lib/pages/screensaver - indicator long press opens a popup', () => {
    it('sends the pageType of the popup with name, id and icon of the page item and sleeps below it', async () => {
        const { saver, calls, basePanel } = setup();
        expect(saver.hasIndicatorLongPress(saver.pageItems![1])).to.equal(true);
        expect(await saver.onIndicatorLongPress(longPress)).to.equal(true);
        expect(calls.sent).to.deep.equal(['pageType~popupLight~Licht Küche~0?2~ICON']);
        expect(calls.queued).to.deep.equal(['pageType~popupLight~Licht Küche~0?2~ICON']);
        expect(calls.writes).to.deep.equal(['panels.A0.buttons.indicatorLong-1=true']);
        expect(saver.sleep).to.equal(true);
        expect(basePanel.lastCard).to.equal('');
        // no long press of its own ran
        expect(calls.commands).to.deep.equal([]);
    });

    const popups: [string, string][] = [
        ['light2', 'popupLight2'],
        ['shutter', 'popupShutter'],
        ['shutter2', 'popupShutter2'],
        ['fan', 'popupFan'],
        ['input_sel', 'popupInSel'],
        ['timer', 'popupTimer'],
    ];
    for (const [type, popup] of popups) {
        it(`type ${type}: ${popup}`, async () => {
            const { saver, calls } = setup(`${type}~0?2~I~1~Name~0`);
            await saver.onIndicatorLongPress(longPress);
            expect(calls.sent).to.deep.equal([`pageType~${popup}~Name~0?2~I`]);
        });
    }

    it('a page item without popup: a warning, the long press acts like a tap', async () => {
        const { saver, calls } = setup('text~0?2~I~1~Name~0');
        expect(await saver.onIndicatorLongPress(longPress)).to.equal(false);
        expect(calls.sent).to.deep.equal([]);
        expect(saver.sleep).to.equal(false);
        expect(calls.warnings).to.have.length(1);
    });

    it('an index that points to an item with a place is no popup', async () => {
        const { saver, calls } = setup();
        (saver.pageItems![1] as any).config.longPressPopup = 0;
        expect(saver.longPressPopupItem(saver.pageItems![1])).to.equal(undefined);
        expect(saver.hasIndicatorLongPress(saver.pageItems![1])).to.equal(false);
        expect(await saver.onIndicatorLongPress(longPress)).to.equal(false);
        expect(calls.sent).to.deep.equal([]);
    });

    it('keeps its own messages back while the popup lies on top, the content of the popup goes through', async () => {
        const { saver, calls } = setup();
        await saver.onIndicatorLongPress(longPress);
        calls.queued.length = 0;
        (saver as any).sendToPanelClass('weatherUpdate~a~b', false);
        (saver as any).sendToPanelClass('time~12:00', false);
        (saver as any).sendToPanelClass('entityUpdateDetail~0?2~x', false);
        expect(calls.queued).to.deep.equal(['entityUpdateDetail~0?2~x']);
        // bExit: Panel.setActivePage(true) wakes the page before it sends the pageType
        saver.sleep = false;
        (saver as any).sendToPanelClass('pageType~screensaver2', true);
        expect(calls.queued).to.deep.equal(['entityUpdateDetail~0?2~x', 'pageType~screensaver2']);
    });

    it('pageOpenDetail and the commands of the popup go to the page item once, also for a blind', async () => {
        const { saver, calls } = setup('shutter2~0?2~I~1~Rollladen~0', 'blind');
        await saver.onIndicatorLongPress(longPress);
        calls.sent.length = 0;
        // event,pageOpenDetail,popupShutter2,0?2
        await saver.onPopupRequest('2', 'popupShutter2', undefined, undefined, null);
        expect(calls.sent).to.deep.equal(['entityUpdateDetail~0?2~popupShutter2']);
        // event,buttonPress2,0?2,positionSlider,40 - Panel runs onPopupRequest and onButtonEvent
        const event: Types.IncomingEvent = {
            type: 'event',
            method: 'buttonPress2',
            page: 0,
            id: '2',
            action: 'positionSlider',
            opt: '40',
        };
        await saver.onPopupRequest(event.id, undefined, event.action, event.opt, event);
        await saver.onButtonEvent(event);
        expect(calls.commands).to.deep.equal(['0?2:positionSlider:40']);
    });

    it('a blind shown on the screensaver itself still opens no shutter popup', async () => {
        const { saver, calls } = setup();
        (saver.pageItems![0] as any).dataItems.role = 'blind';
        await saver.onPopupRequest('0', 'popupShutter', undefined, undefined, null);
        expect(calls.sent).to.deep.equal([]);
    });

    it('shown again: the page item no longer draws the popup and the screensaver is drawn completely', async () => {
        const { saver, calls, popupItem } = setup();
        const redraw: string[] = [];
        Object.assign(saver, {
            sendType: (force?: boolean): number => redraw.push(`sendType:${String(force)}`),
            restartRotationLoop: async (): Promise<void> => {
                redraw.push('update');
            },
            timeAfterRender: false,
        });
        await saver.onIndicatorLongPress(longPress);
        await saver.onPopupRequest('2', 'popupLight', undefined, undefined, null);
        expect(popupItem.lastPopupType).to.equal('popupLight');
        saver.sleep = false;
        await saver.onVisibilityChange(true);
        expect(popupItem.lastPopupType).to.equal(undefined);
        expect(redraw).to.deep.equal(['sendType:undefined', 'update']);
        // nothing is kept back any more
        calls.queued.length = 0;
        saver.sleep = true;
        (saver as any).sendToPanelClass('weatherUpdate~a', false);
        expect(calls.queued).to.deep.equal(['weatherUpdate~a']);
    });
});

/** a page that only records what the panel does with it */
class RecordingPage extends BaseTriggeredPage {
    calls: string[] = [];

    constructor() {
        const adapter: any = {
            log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
            controller: { statesControler: { activateTrigger: async (): Promise<void> => undefined } },
            library: { writedp: async (): Promise<void> => undefined },
            unload: false,
            setTimeout: (): number => 1,
            clearTimeout: noop,
        };
        super({
            adapter,
            name: 'scr',
            panel: { isOnline: true, name: 'A0', info: { nspanel: {} }, sendScreensaverTimeout: noop, timeout: 15 },
        });
    }

    sendType(force?: boolean): void {
        this.calls.push(`sendType:${String(force)}`);
    }

    protected async onVisibilityChange(v: boolean): Promise<void> {
        this.calls.push(`visible:${String(v)}`);
        return Promise.resolve();
    }
}

describe('lib/controller/panel - back from the popup of an indicator (bExit)', () => {
    it('setActivePage(true) loads the sleeping screensaver again and runs its visibility change', async () => {
        const page = new RecordingPage();
        await page.setVisibility(true);
        // the popup lies on top: the screensaver is visible but sleeps
        page.sleep = true;
        page.calls.length = 0;
        const panel = Object.create(Panel.prototype) as Panel;
        Object.assign(panel, { _activePage: page, log: { debug: noop } });
        await panel.setActivePage(true);
        expect(page.sleep).to.equal(false);
        expect(page.calls).to.deep.equal(['sendType:true', 'visible:true']);
    });
});
