import { describe, expect, it } from 'vitest';
import type { Entity6 } from '../../protocol/types';
import type { CardProps } from '../CardContract';
import { CardDevice, deviceTouch } from './CardDevice';
import { initial, type CardDeviceModel } from './parse';

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

describe('deviceTouch (cardGrid cell of the HMI, no long press event)', () => {
    it('opens shutter, shutter2, input_sel and timer on a tap', () => {
        for (const element of ['main', 'info', 'button'] as const) {
            expect(deviceTouch(element, 'shutter', false)).toEqual({ kind: 'popup', popup: 'popupShutter' });
            expect(deviceTouch(element, 'shutter2', false)).toEqual({ kind: 'popup', popup: 'popupShutter2' });
            expect(deviceTouch(element, 'input_sel', false)).toEqual({ kind: 'popup', popup: 'popupInSel' });
            expect(deviceTouch(element, 'timer', true)).toEqual({ kind: 'popup', popup: 'popupTimer' });
        }
    });

    it('presses light, light2, fan and number on a tap and opens their popup when held', () => {
        expect(deviceTouch('main', 'light', false)).toEqual({ kind: 'press' });
        expect(deviceTouch('main', 'light', true)).toEqual({ kind: 'popup', popup: 'popupLight' });
        expect(deviceTouch('info', 'light2', true)).toEqual({ kind: 'popup', popup: 'popupLightNew' });
        expect(deviceTouch('button', 'fan', true)).toEqual({ kind: 'popup', popup: 'popupFan' });
        expect(deviceTouch('button', 'number', false)).toEqual({ kind: 'press' });
        expect(deviceTouch('button', 'number', true)).toEqual({ kind: 'popup', popup: 'popupSlider' });
    });

    it('presses button and switch types, held or not (no buttonPress3)', () => {
        for (const type of ['button', 'switch']) {
            for (const held of [false, true]) {
                expect(deviceTouch('main', type, held)).toEqual({ kind: 'press' });
                expect(deviceTouch('info', type, held)).toEqual({ kind: 'press' });
                expect(deviceTouch('button', type, held)).toEqual({ kind: 'press' });
            }
        }
    });

    it('sends nothing for main and info of type text, a button of type text presses', () => {
        expect(deviceTouch('main', 'text', false)).toEqual({ kind: 'none' });
        expect(deviceTouch('info', 'text', true)).toEqual({ kind: 'none' });
        expect(deviceTouch('button', 'text', false)).toEqual({ kind: 'press' });
    });
});

describe('cardDevice events', () => {
    it('main: buttonPress2,<id>,button, popup on hold, nothing for text', () => {
        const { card: c, sent } = card();
        c.onTap('main', entity('button', 'dev'), false);
        c.onTap('main', entity('text', 'dev'), false);
        c.onTap('main', entity('light', 'lamp'), true);
        expect(sent.press).toEqual([['dev', 'button']]);
        expect(sent.popup).toEqual([['popupLight', 'lamp', 'Name', 'I', 1234]]);
        expect(sent.send).toEqual([]);
    });

    it('info: input_sel opens popupInSel, text sends nothing', () => {
        const { card: c, sent } = card();
        c.onTap('info', entity('input_sel', 'prog'), false);
        c.onTap('info', entity('text', 'akku'), false);
        expect(sent.popup).toEqual([['popupInSel', 'prog', 'Name', 'I', 1234]]);
        expect(sent.press).toEqual([]);
    });

    it('button: buttonPress2,<id>,button, also for type text', () => {
        const { card: c, sent } = card();
        c.onTap('button', entity('button', 'start'), false);
        c.onTap('button', entity('text', 'dock'), true);
        expect(sent.press).toEqual([
            ['start', 'button'],
            ['dock', 'button'],
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
