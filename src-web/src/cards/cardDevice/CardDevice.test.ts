import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { initialGlobalState } from '../../store/PanelStore';
import type { Entity6, PanelModel } from '../../protocol/types';
import type { CardProps } from '../CardContract';
import { Pressable, type PressableProps } from '../cardEntities/shared/Pressable';
import { CardDevice, DEVICE_LONG_PRESS_MS, cutToBytes, deviceTouch } from './CardDevice';
import { handleCommand, initial, parseEntityUpd, type CardDeviceModel } from './parse';
import device1 from '../../../scripts/examples/cardDevice1.txt?raw';
import webL1 from '../../../scripts/examples/web-l-cardDevice1.txt?raw';
import webL1Plain from '../../../scripts/examples/web-l-cardDevice1-plain.txt?raw';
import webL2 from '../../../scripts/examples/web-l-cardDevice2.txt?raw';
import webL3 from '../../../scripts/examples/web-l-cardDevice3.txt?raw';
import webL3Plain from '../../../scripts/examples/web-l-cardDevice3-plain.txt?raw';
import webP1 from '../../../scripts/examples/web-p-cardDevice1.txt?raw';
import webP1Plain from '../../../scripts/examples/web-p-cardDevice1-plain.txt?raw';
import webP2 from '../../../scripts/examples/web-p-cardDevice2.txt?raw';
import webP2Plain from '../../../scripts/examples/web-p-cardDevice2-plain.txt?raw';
import webP3 from '../../../scripts/examples/web-p-cardDevice3.txt?raw';
import webP3Plain from '../../../scripts/examples/web-p-cardDevice3-plain.txt?raw';
import usP1 from '../../../scripts/examples/us-p-cardDevice1.txt?raw';
import usP1Plain from '../../../scripts/examples/us-p-cardDevice1-plain.txt?raw';
import usP2 from '../../../scripts/examples/us-p-cardDevice2.txt?raw';
import usP3 from '../../../scripts/examples/us-p-cardDevice3.txt?raw';

interface Sent {
    press: unknown[][];
    popup: unknown[][];
    send: string[];
}

function card(model: CardDeviceModel = initial()): { card: CardDevice; sent: Sent } {
    const sent: Sent = { press: [], popup: [], send: [] };
    const props: CardProps<CardDeviceModel> = {
        model,
        ctx: { pageType: 'cardDevice1', pageArgs: [] },
        global: {} as CardProps<CardDeviceModel>['global'],
        send: (e: string): void => {
            sent.send.push(e);
        },
        press: (id, action, value): void => {
            sent.press.push(value === undefined ? [id, action] : [id, action, value]);
        },
        openPopup: (popup, id, title, icon, iconColor): void => {
            sent.popup.push([popup, id, title, icon, iconColor]);
        },
    };
    return { card: new CardDevice(props), sent };
}

function entity(type: string, id = 'x'): Entity6 {
    return { type, id, icon: 'I', iconColor: 1234, displayName: 'Name', optionalValue: '' };
}

const NONE = [{ kind: 'none' }, { kind: 'none' }];

const ELEMENTS = ['main', 'info', 'value', 'progress', 'button', 'switch', 'status'] as const;

describe('deviceTouch (every place is a cardGrid cell of the HMI)', () => {
    it('opens shutter, shutter2, input_sel and timer on a tap, in every place', () => {
        for (const element of ELEMENTS) {
            expect(deviceTouch(element, entity('shutter'), false)).toEqual({ kind: 'popup', popup: 'popupShutter' });
            expect(deviceTouch(element, entity('shutter2'), false)).toEqual({ kind: 'popup', popup: 'popupShutter2' });
            expect(deviceTouch(element, entity('input_sel'), false)).toEqual({ kind: 'popup', popup: 'popupInSel' });
            expect(deviceTouch(element, entity('timer'), true)).toEqual({ kind: 'popup', popup: 'popupTimer' });
        }
    });

    it('presses light, light2, fan and number on a tap and opens their popup when held', () => {
        for (const element of ELEMENTS) {
            expect(deviceTouch(element, entity('light'), false)).toEqual({ kind: 'press' });
            expect(deviceTouch(element, entity('light'), true)).toEqual({ kind: 'popup', popup: 'popupLight' });
            expect(deviceTouch(element, entity('light2'), true)).toEqual({ kind: 'popup', popup: 'popupLightNew' });
            expect(deviceTouch(element, entity('fan'), true)).toEqual({ kind: 'popup', popup: 'popupFan' });
            expect(deviceTouch(element, entity('number'), false)).toEqual({ kind: 'press' });
            expect(deviceTouch(element, entity('number'), true)).toEqual({ kind: 'popup', popup: 'popupSlider' });
        }
    });

    it('button, switch and text: buttonPress2 on a tap, buttonPress3 when held, in every place', () => {
        for (const element of ELEMENTS) {
            for (const type of ['button', 'switch', 'text']) {
                expect(deviceTouch(element, entity(type), false)).toEqual({ kind: 'press' });
                expect(deviceTouch(element, entity(type), true)).toEqual({ kind: 'longPress' });
            }
        }
    });

    it('type text without an id sends nothing, only a button slot always sends', () => {
        for (const element of ELEMENTS) {
            const expected = element === 'button' ? [{ kind: 'press' }, { kind: 'longPress' }] : NONE;
            expect([
                deviceTouch(element, entity('text', ''), false),
                deviceTouch(element, entity('text', ''), true),
            ]).toEqual(expected);
        }
    });

    it('an empty element sends nothing', () => {
        for (const element of ELEMENTS) {
            expect(deviceTouch(element, entity('', 'x'), false)).toEqual({ kind: 'none' });
            expect(deviceTouch(element, entity('delete', 'x'), true)).toEqual({ kind: 'none' });
        }
    });
});

describe('cardDevice events', () => {
    it('main: buttonPress2 on a tap (also type text), buttonPress3 when held, popup of a light when held', () => {
        const { card: c, sent } = card();
        c.onTap('main', entity('button', 'dev'), false);
        c.onTap('main', entity('text', 'dev'), false);
        c.onTap('main', entity('text', ''), false);
        c.onTap('main', entity('button', 'dev'), true);
        c.onTap('main', entity('light', 'lamp'), true);
        expect(sent.press).toEqual([
            ['dev', 'button'],
            ['dev', 'button'],
        ]);
        expect(sent.popup).toEqual([['popupLight', 'lamp', 'Name', 'I', 1234]]);
        expect(sent.send).toEqual(['event,buttonPress3,dev,button']);
    });

    it('info: input_sel opens popupInSel, a text with an id sends buttonPress2 / buttonPress3', () => {
        const { card: c, sent } = card();
        c.onTap('info', entity('input_sel', 'prog'), false);
        c.onTap('info', entity('text', 'akku'), false);
        c.onTap('info', entity('text', 'akku'), true);
        expect(sent.popup).toEqual([['popupInSel', 'prog', 'Name', 'I', 1234]]);
        expect(sent.press).toEqual([['akku', 'button']]);
        expect(sent.send).toEqual(['event,buttonPress3,akku,button']);
    });

    it('button: buttonPress2,<id>,button, also for type text; held buttonPress3', () => {
        const { card: c, sent } = card();
        c.onTap('button', entity('button', 'start'), false);
        c.onTap('button', entity('text', 'dock'), true);
        expect(sent.press).toEqual([['start', 'button']]);
        expect(sent.send).toEqual(['event,buttonPress3,dock,button']);
    });

    it('value, progress, status and icon/name of a switch slot: tap and long press like a cell', () => {
        for (const element of ['value', 'progress', 'status', 'switch'] as const) {
            const { card: c, sent } = card();
            c.onTap(element, entity('text', 'rest'), false);
            c.onTap(element, entity('text', 'rest'), true);
            c.onTap(element, entity('switch', 'klima'), true);
            c.onTap(element, entity('text', ''), false);
            expect(sent.press, element).toEqual([['rest', 'button']]);
            expect(sent.send, element).toEqual(['event,buttonPress3,rest,button', 'event,buttonPress3,klima,button']);
            expect(sent.popup, element).toEqual([]);
        }
    });

    it('popups: a status cell hands over no name, a progress slot no icon', () => {
        const { card: c, sent } = card();
        c.onTap('status', entity('input_sel', 'mode'), false);
        c.onTap('progress', entity('number', 'level'), true);
        c.onTap('value', entity('timer', 'rest'), false);
        expect(sent.popup).toEqual([
            ['popupInSel', 'mode', '', 'I', 1234],
            ['popupSlider', 'level', 'Name', '', undefined],
            ['popupTimer', 'rest', 'Name', 'I', 1234],
        ]);
    });

    it('switch: buttonPress2,<id>,OnOff,<0|1> like cardEntities', () => {
        const { card: c, sent } = card();
        c.onSwitch(entity('switch', 'klima'), true);
        c.onSwitch(entity('switch', 'klima'), false);
        expect(sent.press).toEqual([
            ['klima', 'OnOff', 1],
            ['klima', 'OnOff', 0],
        ]);
    });

    it('info icon: buttonPress2,<id>,button', () => {
        const model = { ...initial(), info: entity('button', '9?0?info') };
        const { card: c, sent } = card(model);
        c.onInfo();
        expect(sent.press).toEqual([['9?0?info', 'button']]);
    });
});

/** the handlers of a touch area, called like the browser does */
function touchArea(props: PressableProps): { down: () => void; up: () => void; leave: () => void } {
    const area = new Pressable(props);
    // not mounted: keep the state by hand
    area.setState = (state): void => {
        Object.assign(area.state, state);
    };
    const event = { stopPropagation: (): void => undefined };
    const handlers = (): Record<string, ((e: unknown) => void) | undefined> =>
        (area.render() as React.ReactElement<Record<string, ((e: unknown) => void) | undefined>>).props;
    return {
        down: () => handlers().onPointerDown?.(event),
        up: () => handlers().onPointerUp?.(event),
        leave: () => handlers().onPointerLeave?.(event),
    };
}

describe('touch area of the device pages (Pressable of the grid tile, long press on release)', () => {
    function area(onRelease: boolean): { calls: string[]; touch: ReturnType<typeof touchArea> } {
        const calls: string[] = [];
        const touch = touchArea({
            onPress: () => calls.push('press'),
            onLongPress: () => calls.push('long'),
            longPressMs: DEVICE_LONG_PRESS_MS,
            longPressOnRelease: onRelease,
        });
        return { calls, touch };
    }

    it('a short tap presses on release', () => {
        vi.useFakeTimers();
        const { calls, touch } = area(true);
        touch.down();
        vi.advanceTimersByTime(DEVICE_LONG_PRESS_MS - 1);
        expect(calls).toEqual([]);
        touch.up();
        expect(calls).toEqual(['press']);
        vi.useRealTimers();
    });

    it('held 500 ms: the long press is sent on release, exactly once and without a press', () => {
        vi.useFakeTimers();
        const { calls, touch } = area(true);
        touch.down();
        vi.advanceTimersByTime(DEVICE_LONG_PRESS_MS + 2000);
        expect(calls).toEqual([]);
        touch.up();
        expect(calls).toEqual(['long']);
        vi.useRealTimers();
    });

    it('leaving the area while holding sends nothing', () => {
        vi.useFakeTimers();
        const { calls, touch } = area(true);
        touch.down();
        vi.advanceTimersByTime(DEVICE_LONG_PRESS_MS);
        touch.leave();
        touch.up();
        expect(calls).toEqual([]);
        vi.useRealTimers();
    });

    it('light, light2, fan, number (not on release): the popup opens when the hold time is reached', () => {
        vi.useFakeTimers();
        const { calls, touch } = area(false);
        touch.down();
        vi.advanceTimersByTime(DEVICE_LONG_PRESS_MS);
        expect(calls).toEqual(['long']);
        touch.up();
        expect(calls).toEqual(['long']);
        vi.useRealTimers();
    });
});

const NAV12 = ['button', 'p', '<', '65535', '', '', 'button', 'n', '>', '65535', '', ''];

function page(pageType: string, main: string[], slots: string[][]): string {
    const ctx = { pageType, pageArgs: [] };
    const model = parseEntityUpd(['T', ...NAV12, ...main, ...slots.flat()], initial(), ctx);
    return renderToStaticMarkup(
        React.createElement(CardDevice, {
            model,
            ctx,
            global: initialGlobalState('eu'),
            send: () => undefined,
            press: () => undefined,
            openPopup: () => undefined,
        }),
    );
}

/** the opening tag of the element with this data-role */
function tag(html: string, role: string): string {
    const at = html.indexOf(`data-role="${role}"`);
    return at < 0 ? '' : html.slice(html.lastIndexOf('<', at), html.indexOf('>', at) + 1);
}

describe('cardDevice touch areas', () => {
    const t = (id: string): string[] => ['text', id, 'X', '65535', `n${id}`, '50'];
    const EMPTY = ['', '', '', '', '', ''];

    it('cardDevice2: value and progress are touch areas the size of the HMI hotspots', () => {
        const out = page('cardDevice2', t('m'), [t('1'), t('2'), t('3'), t('4'), t('5'), t('6')]);
        expect(tag(out, 'slot-1')).toContain('data-pressable');
        expect(tag(out, 'slot-1')).toContain('left:110px;top:67px;width:226px;height:110px');
        expect(tag(out, 'slot-2')).toContain('data-pressable');
        expect(tag(out, 'slot-2')).toContain('left:10px;top:179px;width:429px;height:42px');
        // the bar stays where it was: 10 / 207 on the stage
        expect(tag(out, 'progress-bar')).toContain('left:0;top:28px;width:429px;height:14px');
    });

    it('cardDevice3: icon and name of a switch slot are a touch area, the switch stays its own', () => {
        const slots = [
            t('1'),
            t('2'),
            t('3'),
            t('4'),
            t('5'),
            t('6'),
            ['switch', '7', 'X', '65535', 'Klima', '1'],
            EMPTY,
        ];
        const out = page('cardDevice3', t('m'), slots);
        expect(tag(out, 'slot-7-label')).toContain('data-pressable');
        expect(tag(out, 'slot-7-label')).toContain('data-id="7"');
        expect(tag(out, 'slot-7-label')).toContain('left:10px;top:236px;width:161px;height:34px');
        expect(tag(out, 'toggle')).toContain('data-pressable');
        expect(out).not.toContain('data-role="slot-8-label"');
    });

    it('empty value, progress and switch slots take no touch', () => {
        const out = page('cardDevice2', t('m'), [EMPTY, EMPTY, t('3'), t('4'), t('5'), t('6')]);
        expect(out).not.toContain('data-role="slot-1"');
        expect(out).not.toContain('data-role="slot-2"');
    });
});

describe('cardDevice status line', () => {
    const main = (status: string): string[] => ['text', 'm', 'M', '65535', 'Main', status];

    it('the text stands in its field, cut at its border, aligned like on the panel', () => {
        const out = page('cardDevice2', main('Schleudern'), []);
        expect(out).toContain('left:10px;top:289px;width:390px;height:30px');
        expect(out).toContain('Schleudern');
        // no ellipsis of its own, no animation
        const long = 'Fehler: Wassertank leer, bitte nachfüllen und die Tür der Maschine schließen';
        for (const pageType of ['cardDevice1', 'cardDevice2', 'cardDevice3']) {
            const cut = page(pageType, main(long), []);
            expect(cut).toContain(`${long}<`);
            expect(cut).not.toContain('…');
            expect(cut).not.toContain('animation');
            expect(cut).not.toContain('@keyframes');
        }
    });

    it('devStatus replaces only the text of the status line', () => {
        const ctx = { pageType: 'cardDevice2', pageArgs: [] };
        const NAV = ['button', 'p', '<', '65535', '', '', 'button', 'n', '>', '65535', '', ''];
        const before = parseEntityUpd(['T', ...NAV, ...main('Reinigung läuft,')], initial(), ctx);
        const after = handleCommand('devStatus', ['noch 23 min'], before, ctx);
        expect(after).toBeDefined();
        if (!after) {
            return;
        }
        const render = (model: CardDeviceModel): string =>
            renderToStaticMarkup(
                React.createElement(CardDevice, {
                    model,
                    ctx,
                    global: initialGlobalState('eu'),
                    send: (): void => undefined,
                    press: (): void => undefined,
                    openPopup: (): void => undefined,
                }),
            );
        expect(render(before)).toContain('Reinigung läuft,');
        expect(render(after)).toContain('noch 23 min');
        expect(render(after)).toBe(render(before).replace('Reinigung läuft,', 'noch 23 min'));
    });
});

describe('cardDevice status icon grid rendering', () => {
    const NAV = ['button', 'p', '<', '65535', '', '', 'button', 'n', '>', '65535', '', ''];
    const row = (i: number): string[] => ['1', `s${i}`, 'X', '65535', `Name ${i}`, `Wert ${i}`];

    /**
     * a page in a stage with `icons` filled cells
     *
     * @param pageType cardDevice1 / cardDevice3
     * @param stage the stage (field 6 of info)
     * @param icons filled cells
     * @param model the panel model
     */
    function html(pageType: string, stage: number, icons: number, model: PanelModel = 'eu'): string {
        const count = pageType === 'cardDevice3' ? 8 : 6;
        const cells = pageType === 'cardDevice3' ? 8 : 16;
        const slots = Array.from({ length: count }, (_, i) => row(i + 1)).flat();
        const ctx = { pageType, pageArgs: [], model };
        const parsed = parseEntityUpd(
            [
                'T',
                ...NAV,
                '1',
                'm',
                'M',
                '65535',
                'Main',
                'Status',
                ...slots,
                '1',
                'info',
                'i',
                '65535',
                '',
                `${stage}`,
            ],
            initial(),
            ctx,
        );
        const args = Array.from({ length: cells }, (_, i) =>
            i < icons ? ['1', `c${i + 1}`, 'X', '2047'] : ['', '', '', ''],
        ).flat();
        return renderToStaticMarkup(
            React.createElement(CardDevice, {
                model: handleCommand('devIcons', args, parsed, ctx) ?? parsed,
                ctx,
                global: initialGlobalState(model),
                send: () => undefined,
                press: () => undefined,
                openPopup: () => undefined,
            }),
        );
    }
    const cells = (out: string): string[] => out.split('data-kind="status"').slice(1);

    it('shows the columns of the filled cells (a half filled one with its empty cell), only filled ones tappable', () => {
        expect(cells(html('cardDevice1', 0, 16))).toHaveLength(0);
        expect(cells(html('cardDevice1', 1, 0))).toHaveLength(0);
        for (const [stage, n, shown] of [
            [1, 1, 2],
            [1, 5, 6],
            [1, 9, 6],
            [2, 9, 10],
            [3, 16, 16],
        ]) {
            const out = cells(html('cardDevice1', stage, n));
            expect(out, `stage ${stage} ${n} icons`).toHaveLength(shown);
            out.forEach((cell, i) => {
                const own = cell.split('data-role="cell-')[0].split('data-role="status"')[0];
                expect(own.includes('data-pressable'), `stage ${stage} cell ${i + 1} of ${n}`).toBe(i < n);
            });
        }
        // cardDevice3: one row
        expect(cells(html('cardDevice3', 1, 7))).toHaveLength(4);
        expect(cells(html('cardDevice3', 2, 7))).toHaveLength(7);
    });

    it('a cell: 1 px grey frame shared with its neighbour, the touch area over the whole cell, press effect', () => {
        const out = html('cardDevice1', 1, 3);
        expect(tag(out, 'cell-1')).toContain('left:124px;top:71px;width:38px;height:45px');
        expect(tag(out, 'cell-3')).toContain('left:161px;top:71px;width:38px;height:45px');
        expect(tag(out, 'cell-4')).toContain('left:161px;top:115px;width:38px;height:45px');
        expect(tag(out, 'cell-1')).toContain('border:1px solid');
        const cell = cells(out)[0];
        expect(cell).toContain('data-role="status-icon"');
        expect(cell).toContain('data-id="c1"');
        expect(cell).toContain('left:-1px;top:-1px;width:38px;height:45px');
        expect(cell).not.toContain('opacity:0.6');
    });

    it('the info rows in the set of the stage: A, B (name cut to 15 bytes), C (no name), none', () => {
        const a = html('cardDevice1', 0, 0);
        expect(tag(a, 'slot-1')).toContain('left:126px;top:76px');
        expect(a).toContain('Name 1<');
        const b = html('cardDevice1', 1, 3);
        expect(tag(b, 'slot-1')).toContain('left:247px;top:76px');
        expect(b).toContain('Name 1<');
        expect(b).toContain('Wert 1<');
        const c = html('cardDevice1', 2, 9);
        expect(tag(c, 'slot-1')).toContain('left:321px;top:76px');
        expect(c).not.toContain('Name 1<');
        expect(c).toContain('Wert 1<');
        const none = html('cardDevice1', 3, 16);
        expect(none).not.toContain('data-role="slot-1"');
        expect(none).not.toContain('data-role="slot-2"');
        expect(none).toContain('data-role="slot-3"');
    });

    it('cardDevice3: tile 1 (stage 1) or tiles 1 and 2 (stage 2) give way to the grid', () => {
        expect(html('cardDevice3', 0, 0)).toContain('data-role="slot-1"');
        const one = html('cardDevice3', 1, 4);
        expect(one).not.toContain('data-role="slot-1"');
        expect(one).toContain('data-role="slot-2"');
        const two = html('cardDevice3', 2, 8);
        expect(two).not.toContain('data-role="slot-1"');
        expect(two).not.toContain('data-role="slot-2"');
        expect(tag(two, 'cell-8')).toContain('left:373px;top:67px;width:38px;height:52px');
    });

    it('cuts a copied text to the bytes of the set, whole characters, never an ellipsis', () => {
        expect(cutToBytes('Batteriezustand', 15)).toBe('Batteriezustand');
        expect(cutToBytes('Batteriezustand!', 15)).toBe('Batteriezustand');
        expect(cutToBytes('Türschloss hinten', 15)).toBe('Türschloss hin');
        expect(cutToBytes('21,5°C', 19)).toBe('21,5°C');
        expect(cutToBytes('anything', undefined)).toBe('anything');
    });
});

describe('cardDevice on the models', () => {
    /** renders the `entityUpd` (and `devIcons`) of an example of scripts/examples as the store does on this model */
    function render(example: string, pageType: string, model: PanelModel): string {
        const lines = example.split('\n');
        const line = lines.find(l => l.startsWith('entityUpd~')) ?? '';
        const icons = lines.find(l => l.startsWith('devIcons~'));
        const ctx = { pageType, pageArgs: [], model };
        const entityUpd = parseEntityUpd(line.split('~').slice(1), initial(), ctx);
        const parsed = icons
            ? (handleCommand('devIcons', icons.split('~').slice(1), entityUpd, ctx) ?? entityUpd)
            : entityUpd;
        return renderToStaticMarkup(
            React.createElement(CardDevice, {
                model: parsed,
                ctx,
                global: initialGlobalState(model),
                send: () => undefined,
                press: () => undefined,
                openPopup: () => undefined,
            }),
        );
    }

    it('web-l cardDevice1: the two additional buttons are touch areas like the standard ones', () => {
        const out = render(webL1, 'cardDevice1', 'web-l');
        expect(tag(out, 'slot-3')).toContain('left:8px;top:190px;width:104px;height:80px');
        expect(tag(out, 'slot-6')).toContain('left:320px;top:190px;width:104px;height:80px');
        expect(tag(out, 'extra-1')).toContain('data-pressable');
        expect(tag(out, 'extra-1')).toContain('data-id="9?0?13"');
        expect(tag(out, 'extra-1')).toContain('left:424px;top:190px;width:104px;height:80px');
        expect(tag(out, 'extra-2')).toContain('data-id="9?0?14"');
        expect(tag(out, 'extra-2')).toContain('left:528px;top:190px;width:104px;height:80px');
        expect(out).toContain('Zone<');
        expect(out).toContain('Leeren<');
        // status line over the width, info icon at the right edge
        expect(out).toContain('left:10px;top:289px;width:580px;height:30px');
        expect(tag(out, 'info')).toContain('left:594px;top:288px;width:36px;height:32px');
    });

    it('web-l without additional slots: nothing is drawn for them, the row is spread', () => {
        const out = render(webL1Plain, 'cardDevice1', 'web-l');
        expect(out).not.toContain('data-role="extra-');
        expect(tag(out, 'slot-3')).toContain('left:10px;top:190px');
        expect(tag(out, 'slot-6')).toContain('left:526px;top:190px');
        const car = render(webL3Plain, 'cardDevice3', 'web-l');
        expect(car).not.toContain('data-role="extra-');
        expect(tag(car, 'slot-8-label')).toContain('left:320px;top:236px');
    });

    it('web-l cardDevice2 and cardDevice3: additional info tiles, buttons and the switch', () => {
        const washer = render(webL2, 'cardDevice2', 'web-l');
        expect(tag(washer, 'extra-1')).toContain('left:490px;top:226px;width:140px;height:51px');
        expect(washer).toContain('48 l<');
        expect(tag(washer, 'slot-6')).toContain('left:330px;top:67px;width:100px;height:78px');
        expect(tag(washer, 'extra-2')).toContain('left:430px;top:67px');
        expect(tag(washer, 'extra-3')).toContain('left:530px;top:67px');
        expect(tag(washer, 'slot-2')).toContain('left:10px;top:179px;width:620px;height:42px');
        const car = render(webL3, 'cardDevice3', 'web-l');
        expect(tag(car, 'extra-1')).toContain('left:469px;top:67px;width:161px;height:51px');
        expect(tag(car, 'extra-2')).toContain('left:469px;top:119px');
        expect(tag(car, 'extra-3-label')).toContain('data-id="9?0?13"');
        expect(tag(car, 'extra-3-label')).toContain('left:424px;top:236px;width:159px;height:34px');
        expect(car.match(/data-role="toggle"/g) ?? []).toHaveLength(3);
        expect(car).not.toContain('…');
    });

    it('eu and us-l show only the standard part, also of a payload with additional slots', () => {
        for (const model of ['eu', 'us-l'] as const) {
            const out = render(webL1, 'cardDevice1', model);
            expect(out, model).not.toContain('data-role="extra-');
            expect(out, model).not.toContain('Zone<');
            expect(out, model).not.toContain('transform');
        }
        // eu draws a payload with additional slots exactly like the one without
        expect(render(webL1, 'cardDevice1', 'eu')).toBe(render(device1, 'cardDevice1', 'eu'));
    });

    it('us-l: the eu page 15 px to the right', () => {
        const eu = render(device1, 'cardDevice1', 'eu');
        const usl = render(device1, 'cardDevice1', 'us-l');
        expect(tag(eu, 'main')).toContain('left:10px;top:68px;width:110px;height:114px');
        expect(tag(usl, 'main')).toContain('left:25px;top:68px;width:110px;height:114px');
        expect(tag(eu, 'slot-6')).toContain('left:334px;top:190px');
        expect(tag(usl, 'slot-6')).toContain('left:349px;top:190px');
        expect(eu).toContain('left:10px;top:289px;width:390px;height:30px');
        expect(usl).toContain('left:25px;top:289px;width:390px;height:30px');
        expect(tag(usl, 'info')).toContain('left:419px;top:288px');
    });

    it('us-p: the page of the us-p HMI (P2) - grid where the rows are, set C right of main, status line 262 px', () => {
        const out = render(usP1, 'cardDevice1', 'us-p');
        expect(out).not.toContain('transform');
        expect(out).not.toContain('data-role="extra-');
        expect(tag(out, 'main')).toContain('left:10px;top:70px;width:150px;height:114px');
        // stage 1 with four icons: two columns of the 8 x 2 grid
        expect(out.match(/data-kind="status"/g) ?? []).toHaveLength(4);
        expect(tag(out, 'cell-1')).toContain('left:10px;top:188px;width:38px;height:41px');
        expect(tag(out, 'cell-4')).toContain('left:47px;top:228px;width:38px;height:41px');
        // the info rows as set C right of main (icon and value)
        expect(tag(out, 'slot-1')).toContain('left:166px;top:76px;width:144px;height:34px');
        expect(tag(out, 'slot-2')).toContain('left:166px;top:120px;width:144px;height:34px');
        // without status icons (stage 0): the rows below main
        expect(tag(render(usP1Plain, 'cardDevice1', 'us-p'), 'slot-1')).toContain(
            'left:10px;top:190px;width:300px;height:34px',
        );
        expect(tag(out, 'slot-6')).toContain('left:162px;top:358px;width:148px;height:80px');
        expect(out).toContain('left:10px;top:447px;width:262px;height:30px');
        expect(tag(out, 'info')).toContain('left:274px;top:446px;width:36px;height:32px');
        // a payload with additional slots shows only the standard part
        expect(render(webP1, 'cardDevice1', 'us-p')).toBe(out);
    });

    it('us-p cardDevice2 and cardDevice3: hotspots of the HMI, switch rows over the width', () => {
        const washer = render(usP2, 'cardDevice2', 'us-p');
        expect(tag(washer, 'slot-1')).toContain('left:102px;top:68px;width:208px;height:110px');
        expect(tag(washer, 'slot-2')).toContain('left:10px;top:184px;width:300px;height:42px');
        expect(tag(washer, 'slot-6')).toContain('left:10px;top:356px;width:300px;height:80px');
        const car = render(usP3, 'cardDevice3', 'us-p');
        expect(tag(car, 'main')).toContain('left:10px;top:68px;width:300px;height:110px');
        expect(tag(car, 'slot-2')).toContain('left:162px;top:182px;width:148px;height:51px');
        expect(tag(car, 'slot-7-label')).toContain('left:10px;top:350px;width:248px;height:34px');
        expect(car.match(/data-role="toggle"/g) ?? []).toHaveLength(2);
    });

    it('web-p: the additional slots as a third row of buttons, a fourth info row / row of tiles, a third switch', () => {
        const robot = render(webP1, 'cardDevice1', 'web-p');
        expect(robot).not.toContain('transform');
        expect(tag(robot, 'extra-1')).toContain('data-id="9?0?13"');
        // stage 1: set C right of main, the grid below it, three rows of buttons
        expect(tag(robot, 'slot-1')).toContain('left:166px;top:76px;width:144px;height:34px');
        expect(tag(robot, 'cell-1')).toContain('left:10px;top:210px;width:38px;height:41px');
        expect(tag(robot, 'extra-1')).toContain('left:10px;top:502px;width:148px;height:80px');
        expect(tag(robot, 'extra-2')).toContain('left:162px;top:502px;width:148px;height:80px');
        expect(robot).toContain('left:10px;top:607px;width:262px;height:30px');
        expect(tag(robot, 'info')).toContain('left:274px;top:606px;width:36px;height:32px');
        const washer = render(webP2, 'cardDevice2', 'web-p');
        expect(tag(washer, 'extra-1')).toContain('left:10px;top:431px;width:300px;height:34px');
        expect(tag(washer, 'slot-6')).toContain('left:10px;top:496px;width:100px;height:80px');
        expect(tag(washer, 'extra-2')).toContain('left:110px;top:496px;width:100px;height:80px');
        expect(tag(washer, 'extra-3')).toContain('left:210px;top:496px;width:100px;height:80px');
        const car = render(webP3, 'cardDevice3', 'web-p');
        expect(tag(car, 'extra-1')).toContain('left:10px;top:365px;width:148px;height:51px');
        expect(tag(car, 'extra-2')).toContain('left:162px;top:365px;width:148px;height:51px');
        expect(tag(car, 'extra-3-label')).toContain('left:10px;top:551px;width:248px;height:34px');
        expect(car.match(/data-role="toggle"/g) ?? []).toHaveLength(3);
        expect(car).not.toContain('…');
    });

    it('web-p without additional slots: nothing is drawn for them, the rows share the height', () => {
        const robot = render(webP1Plain, 'cardDevice1', 'web-p');
        expect(robot).not.toContain('data-role="extra-');
        // stage 1: the grid below main, two rows of buttons
        expect(tag(robot, 'slot-5')).toContain('left:10px;top:475px;width:148px;height:80px');
        const washer = render(webP2Plain, 'cardDevice2', 'web-p');
        expect(washer).not.toContain('data-role="extra-');
        expect(tag(washer, 'slot-6')).toContain('left:10px;top:486px;width:300px;height:80px');
        const car = render(webP3Plain, 'cardDevice3', 'web-p');
        expect(car).not.toContain('data-role="extra-');
        expect(tag(car, 'slot-8-label')).toContain('left:10px;top:526px;width:248px;height:34px');
    });
});
