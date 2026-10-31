import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Entity6 } from '../../../protocol/types';
import { EntityRow, type EntityRowProps } from './EntityRow';
import { LONG_PRESS_MS, Pressable, type PressableProps } from './Pressable';
import { TextButton } from './widgets';

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
    return { type, id: `${type}.id`, icon: 'A', iconColor: 65535, displayName: type, optionalValue };
}

function rowProps(e: Entity6): EntityRowProps {
    return { entity: e, height: 57, press: vi.fn<EntityRowProps['press']>(), openPopup: vi.fn() };
}

/** the elements of a row and of its control (renders the row and the widget that carries the press handlers) */
function rowTree(props: EntityRowProps): React.ReactElement<Record<string, unknown>>[] {
    const own = elements(new EntityRow(props).render());
    const widgets = own.flatMap(el => {
        if (el.type === TextButton) {
            return elements(new TextButton(el.props as unknown as React.ComponentProps<typeof TextButton>).render());
        }
        return [];
    });
    return [...own, ...widgets];
}

describe('EntityRow: no long press (cardEntities / cardSchedule, like the HMI)', () => {
    for (const type of ['button', 'switch', 'light', 'number', 'shutter', 'input_sel', 'timer', 'text']) {
        it(`${type}: no element of the row takes a long press`, () => {
            const tree = rowTree(rowProps(entity(type, type === 'number' ? '0|0|100' : '1')));
            expect(tree.some(el => el.props.onLongPress !== undefined)).toBe(false);
        });
    }

    it('button: the text button sends the normal press (buttonPress2 ... button)', () => {
        const press = vi.fn<EntityRowProps['press']>();
        const props = { ...rowProps(entity('button', 'PRESS')), press };
        const button = elements(new EntityRow(props).render()).find(el => el.type === TextButton);
        expect(button).toBeDefined();
        (button!.props.onPress as () => void)();
        expect(press).toHaveBeenCalledWith('button.id', 'button');
    });
});

describe('Pressable: hold time', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    /** a Pressable whose setState applies at once (it is not mounted) */
    function pressable(props: PressableProps): Pressable {
        const p = new Pressable(props);
        p.setState = ((state: Partial<Pressable['state']>): void => {
            p.state = { ...p.state, ...state };
        }) as Pressable['setState'];
        return p;
    }

    const event = { stopPropagation: (): void => undefined } as unknown as React.PointerEvent<HTMLDivElement>;

    /** the handlers the Pressable puts on its div */
    function handlers(p: Pressable): { down: (e: typeof event) => void; up: (e: typeof event) => void } {
        const div = p.render() as React.ReactElement<{
            onPointerDown: (e: typeof event) => void;
            onPointerUp: (e: typeof event) => void;
        }>;
        return { down: div.props.onPointerDown, up: div.props.onPointerUp };
    }

    it('without onLongPress a held touch is a normal press on release', () => {
        vi.useFakeTimers();
        const onPress = vi.fn();
        const p = pressable({ onPress });
        handlers(p).down(event);
        vi.advanceTimersByTime(LONG_PRESS_MS * 3);
        expect(onPress).not.toHaveBeenCalled();
        handlers(p).up(event);
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('with onLongPress (grid tiles) a held touch calls only onLongPress', () => {
        vi.useFakeTimers();
        const onPress = vi.fn();
        const onLongPress = vi.fn();
        const p = pressable({ onPress, onLongPress });
        handlers(p).down(event);
        vi.advanceTimersByTime(LONG_PRESS_MS);
        expect(onLongPress).toHaveBeenCalledTimes(1);
        handlers(p).up(event);
        expect(onPress).not.toHaveBeenCalled();
    });
});
