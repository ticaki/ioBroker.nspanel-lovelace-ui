import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Entity6, PanelModel } from '../../protocol/types';
import { initialGlobalState } from '../../store/PanelStore';
import { scheduleRowAction } from '../cardEntities/shared/entityTypes';
import { EntityList } from '../cardEntities/shared/EntityList';
import { EntityRow, rowGeometry, type EntityRowProps } from '../cardEntities/shared/EntityRow';
import { Pressable } from '../cardEntities/shared/Pressable';
import { NumberSlider, ShutterButtons, TextButton, Toggle } from '../cardEntities/shared/widgets';
import { CardSchedule } from './CardSchedule';
import { initial } from './parse';

/** all elements of a rendered tree (without rendering the child components) */
function elements(node: React.ReactNode): React.ReactElement<Record<string, unknown>>[] {
    if (Array.isArray(node)) {
        return node.flatMap(elements);
    }
    if (!React.isValidElement<Record<string, unknown>>(node)) {
        return [];
    }
    return [node, ...elements(node.props.children as React.ReactNode)];
}

function entity(type: string, optionalValue = ''): Entity6 {
    return { type, id: `${type}.id`, icon: 'A', iconColor: 2047, displayName: `${type} name`, optionalValue };
}

const OPTIONAL: Readonly<Record<string, string>> = {
    switch: '1',
    light: '1',
    light2: '0',
    fan: '1',
    shutter: 'A|B|C',
    shutter2: 'A|B|C',
    number: '5|0|10',
    button: 'PRESS',
    input_sel: 'PLA',
    timer: '00:10',
    text: '24.02.26',
};

function hmiRow(type: string, panelModel: PanelModel = 'eu'): EntityRowProps {
    return {
        entity: entity(type, OPTIONAL[type] ?? ''),
        height: 35,
        compact: true,
        hmiRow: true,
        panelModel,
        press: vi.fn<EntityRowProps['press']>(),
        openPopup: vi.fn<EntityRowProps['openPopup']>(),
    };
}

const CONTROLS: unknown[] = [Toggle, ShutterButtons, NumberSlider, TextButton];

describe('scheduleRowAction: the tap on a cardSchedule row of the HMI', () => {
    it('opens the popups, presses number and text, ignores the rest', () => {
        expect(scheduleRowAction('shutter', 'eu')).toEqual({ kind: 'popup', popup: 'popupShutter' });
        expect(scheduleRowAction('shutter2', 'eu')).toEqual({ kind: 'popup', popup: 'popupShutter2' });
        expect(scheduleRowAction('shutter2', 'us-l')).toEqual({ kind: 'popup', popup: 'popupShutter2' });
        expect(scheduleRowAction('light', 'eu')).toEqual({ kind: 'popup', popup: 'popupLight' });
        expect(scheduleRowAction('light2', 'eu')).toEqual({ kind: 'popup', popup: 'popupLightNew' });
        expect(scheduleRowAction('fan', 'eu')).toEqual({ kind: 'popup', popup: 'popupFan' });
        expect(scheduleRowAction('input_sel', 'eu')).toEqual({ kind: 'popup', popup: 'popupInSel' });
        expect(scheduleRowAction('timer', 'eu')).toEqual({ kind: 'popup', popup: 'popupTimer' });
        expect(scheduleRowAction('number', 'eu')).toEqual({ kind: 'press' });
        expect(scheduleRowAction('text', 'eu')).toEqual({ kind: 'press' });
        for (const type of ['switch', 'button', 'delete', '']) {
            expect(scheduleRowAction(type, 'eu')).toBeUndefined();
        }
    });

    it('us-p: shutter2 does nothing (no branch in its HMI)', () => {
        expect(scheduleRowAction('shutter2', 'us-p')).toBeUndefined();
        expect(scheduleRowAction('shutter', 'us-p')).toEqual({ kind: 'popup', popup: 'popupShutter' });
    });
});

describe('EntityRow hmiRow: cardSchedule like the HMI', () => {
    for (const type of Object.keys(OPTIONAL)) {
        it(`${type}: icon and name, ${type === 'text' ? 'the value' : 'no control and no value'}`, () => {
            const tree = elements(new EntityRow(hmiRow(type)).render());
            expect(tree.some(el => CONTROLS.includes(el.type))).toBe(false);
            const value = tree.find(el => el.props['data-role'] === 'value');
            expect(value !== undefined).toBe(type === 'text');
            const name = tree.find(el => el.props['data-role'] === 'name');
            expect(
                elements(name?.props.children as React.ReactNode).some(el => el.props.children === `${type} name`),
            ).toBe(true);
            // the whole row is the touch area, the icon has no own one
            const icon = tree.find(el => el.props.icon === 'A');
            expect(icon?.props.onPress).toBeUndefined();
        });
    }

    it('the name box is the same for every type (tEntity ends before bText)', () => {
        const options = { compact: true, fit: false, margin: 33 };
        const right = (type: string): unknown => {
            const tree = elements(new EntityRow(hmiRow(type)).render());
            const name = tree.find(el => el.props['data-role'] === 'name');
            return (name?.props.style as React.CSSProperties | undefined)?.right;
        };
        for (const type of Object.keys(OPTIONAL)) {
            expect(right(type)).toBe(rowGeometry('text', options).nameRight);
        }
    });

    it('a tap on the row does what the HMI does', () => {
        const tap = (type: string, model: PanelModel = 'eu'): EntityRowProps | undefined => {
            const props = hmiRow(type, model);
            const touch = elements(new EntityRow(props).render()).find(el => el.type === Pressable);
            if (!touch) {
                return undefined;
            }
            (touch.props.onPress as () => void)();
            return props;
        };
        const sel = tap('input_sel')!;
        expect(sel.openPopup).toHaveBeenCalledWith('popupInSel', 'input_sel.id', 'input_sel name', 'A', 2047);
        expect(sel.press).not.toHaveBeenCalled();
        expect(tap('shutter')!.openPopup).toHaveBeenCalledWith('popupShutter', 'shutter.id', 'shutter name', 'A', 2047);
        expect(tap('text')!.press).toHaveBeenCalledWith('text.id', 'button');
        expect(tap('number')!.press).toHaveBeenCalledWith('number.id', 'button');
        expect(tap('switch')).toBeUndefined();
        expect(tap('button')).toBeUndefined();
        expect(tap('shutter2', 'us-p')).toBeUndefined();
    });

    it('without hmiRow the controls stay (cardEntities, extensions allowed)', () => {
        const props = { ...hmiRow('switch'), hmiRow: false };
        expect(elements(new EntityRow(props).render()).some(el => el.type === Toggle)).toBe(true);
    });
});

describe('CardSchedule: HMI rows unless the web panel extensions are allowed', () => {
    function list(extensions: boolean): React.ReactElement<Record<string, unknown>> {
        const card = new CardSchedule({
            model: initial(),
            ctx: { pageType: 'cardSchedule', pageArgs: [] },
            global: initialGlobalState('eu', extensions),
            send: vi.fn(),
            press: vi.fn(),
            openPopup: vi.fn(),
        });
        const el = card.render() as React.ReactElement<Record<string, unknown>>;
        expect(el.type).toBe(EntityList);
        return el;
    }

    it('extensions off: hmiRows', () => {
        expect(list(false).props.hmiRows).toBe(true);
    });

    it('extensions on: the rows of cardEntities', () => {
        expect(list(true).props.hmiRows).toBe(false);
    });
});
