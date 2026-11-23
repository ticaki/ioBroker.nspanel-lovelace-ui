import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { initialGlobalState } from '../../store/PanelStore';
import type { Entity6 } from '../../protocol/types';
import type { CardProps } from '../CardContract';
import { Pressable, type PressableProps } from '../cardEntities/shared/Pressable';
import { CardDevice, DEVICE_LONG_PRESS_MS, deviceTouch } from './CardDevice';
import { handleCommand, initial, parseEntityUpd, type CardDeviceModel } from './parse';

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

describe('cardDevice1 status block rendering', () => {
    const NAV = ['button', 'p', '<', '65535', '', '', 'button', 'n', '>', '65535', '', ''];
    function html(statusIcons: number): string {
        const slots: string[] = [];
        for (let i = 1; i <= 10; i++) {
            const filled = i <= 6 || i - 6 <= statusIcons;
            slots.push(...(filled ? ['text', `s${i}`, 'X', '65535', `n${i}`, 'v'] : ['', '', '', '', '', '']));
        }
        const ctx = { pageType: 'cardDevice1', pageArgs: [] };
        const model = parseEntityUpd(
            ['T', ...NAV, 'text', 'm', 'M', '65535', 'Main', 'Status', ...slots],
            initial(),
            ctx,
        );
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

    it('shows no cells without status icons, all 4 framed cells with one, only the filled ones tappable', () => {
        expect(html(0).match(/data-kind="status"/g) ?? []).toHaveLength(0);
        for (const n of [1, 4]) {
            const out = html(n);
            expect(out.match(/data-kind="status"/g) ?? []).toHaveLength(4);
            const cells = out.split('data-kind="status"').slice(1);
            cells.forEach((cell, i) => {
                const own = cell.split('data-role="slot-')[0];
                expect(own.includes('data-pressable'), `cell ${i + 1} of ${n}`).toBe(i < n);
            });
        }
    });

    it('a filled status cell is a touch area over the whole cell, the icon stays in place', () => {
        const out = html(1);
        const cell = out.split('data-kind="status"')[1];
        expect(cell).toContain('data-role="status-icon"');
        expect(cell).toContain('data-id="s7"');
        expect(cell).toContain('left:-1px;top:-1px;width:38px;height:45px');
    });

    it('moves the info rows right while the block is shown', () => {
        expect(html(0)).toContain('left:126px;top:76px');
        expect(html(1)).toContain('left:204px;top:76px');
    });
});
