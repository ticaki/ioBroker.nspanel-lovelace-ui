import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Entity6 } from '../../protocol/types';
import { initialGlobalState } from '../../store/PanelStore';
import type { CardProps } from '../CardContract';
import { Pressable, type PressableProps } from '../cardEntities/shared/Pressable';
import { CardThermo2 } from '../cardThermo2/CardThermo2';
import { initial as initialThermo2, type CardThermo2Model } from '../cardThermo2/parse';
import { CardMedia } from './CardMedia';
import { ENTITY_LONG_PRESS_MS, entityPressProps, type EntityPage } from './entityPress';
import { initial as initialMedia, type CardMediaModel } from './parse';

function entity(type: string, id = `${type}.id`): Entity6 {
    return { type, id, icon: 'A', iconColor: 65535, displayName: type, optionalValue: '1' };
}

/** a Pressable whose setState applies at once (it is not mounted) */
function pressable(props: PressableProps): Pressable {
    const p = new Pressable(props);
    p.setState = ((state: Partial<Pressable['state']>): void => {
        p.state = { ...p.state, ...state };
    }) as Pressable['setState'];
    return p;
}

const pointer = { stopPropagation: (): void => undefined } as unknown as React.PointerEvent<HTMLDivElement>;

interface Touch {
    press: ReturnType<typeof vi.fn<CardProps<unknown>['press']>>;
    openPopup: ReturnType<typeof vi.fn<CardProps<unknown>['openPopup']>>;
}

/**
 * Touches an entity button of a page: finger down, wait `holdMs`, finger up.
 *
 * @param page the page
 * @param e the entity of the button
 * @param holdMs time between down and up
 * @returns the callbacks the button called
 */
function touch(page: EntityPage, e: Entity6, holdMs: number): Touch {
    const actions: Touch = { press: vi.fn(), openPopup: vi.fn() };
    const p = pressable({ ...entityPressProps(page, e, actions) });
    const div = (): React.ReactElement<{
        onPointerDown: (ev: typeof pointer) => void;
        onPointerUp: (ev: typeof pointer) => void;
    }> => p.render() as React.ReactElement<never>;
    div().props.onPointerDown(pointer);
    vi.advanceTimersByTime(holdMs);
    div().props.onPointerUp(pointer);
    return actions;
}

const PAGES: readonly EntityPage[] = ['cardMedia', 'cardThermo2'];

describe('entity buttons of cardMedia / cardThermo2: touch like the HMI', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('hold time is the tim of tmLP in the HMI', () => {
        expect(ENTITY_LONG_PRESS_MS).toEqual({ cardMedia: 500, cardThermo2: 300 });
    });

    for (const page of PAGES) {
        const hold = ENTITY_LONG_PRESS_MS[page];
        const holdTypes: [string, string][] = [
            ['light', 'popupLight'],
            ['light2', 'popupLight'],
            ['fan', 'popupFan'],
        ];
        if (page === 'cardThermo2') {
            holdTypes.push(['number', 'popupSlider']);
        }
        for (const [type, popup] of holdTypes) {
            it(`${page} ${type}: a tap sends the normal press`, () => {
                vi.useFakeTimers();
                const t = touch(page, entity(type), hold - 50);
                expect(t.press).toHaveBeenCalledWith(`${type}.id`, 'button');
                expect(t.openPopup).not.toHaveBeenCalled();
            });

            it(`${page} ${type}: holding opens ${popup} and sends no press`, () => {
                vi.useFakeTimers();
                const t = touch(page, entity(type), hold);
                expect(t.openPopup).toHaveBeenCalledWith(popup, `${type}.id`, type, 'A', 65535);
                expect(t.press).not.toHaveBeenCalled();
            });
        }

        for (const type of ['button', 'switch', 'text']) {
            it(`${page} ${type}: tap and hold both send the normal press`, () => {
                vi.useFakeTimers();
                for (const ms of [0, hold * 3]) {
                    const t = touch(page, entity(type), ms);
                    expect(t.press).toHaveBeenCalledTimes(1);
                    expect(t.press).toHaveBeenCalledWith(`${type}.id`, 'button');
                    expect(t.openPopup).not.toHaveBeenCalled();
                }
            });
        }
    }

    const touchTypes: Record<EntityPage, [string, string][]> = {
        cardMedia: [
            ['shutter', 'popupShutter'],
            ['shutter2', 'popupShutter2'],
            ['input_sel', 'popupInSel'],
            ['media_pl', 'popupInSel'],
            ['slider', 'popupSlider'],
            ['number', 'popupSlider'],
            ['timer', 'popupTimer'],
        ],
        cardThermo2: [
            ['shutter', 'popupShutter'],
            ['shutter2', 'popupShutter2'],
            ['input_sel', 'popupInSel'],
            ['timer', 'popupTimer'],
        ],
    };
    for (const page of PAGES) {
        for (const [type, popup] of touchTypes[page]) {
            it(`${page} ${type}: tap and hold open ${popup} (HMI: on touch-down), never a press`, () => {
                vi.useFakeTimers();
                for (const ms of [0, ENTITY_LONG_PRESS_MS[page] * 3]) {
                    const t = touch(page, entity(type), ms);
                    expect(t.openPopup).toHaveBeenCalledTimes(1);
                    expect(t.openPopup).toHaveBeenCalledWith(popup, `${type}.id`, type, 'A', 65535);
                    expect(t.press).not.toHaveBeenCalled();
                }
            });
        }
    }

    it('cardThermo2: media_pl and slider are no popup types there, they press', () => {
        vi.useFakeTimers();
        for (const type of ['media_pl', 'slider']) {
            const t = touch('cardThermo2', entity(type), 0);
            expect(t.press).toHaveBeenCalledWith(`${type}.id`, 'button');
            expect(t.openPopup).not.toHaveBeenCalled();
        }
    });

    it('empty and disabled slots have no handlers', () => {
        const actions = { press: vi.fn(), openPopup: vi.fn() };
        expect(entityPressProps('cardMedia', entity('disabled'), actions)).toBeUndefined();
        expect(entityPressProps('cardMedia', entity('light', ''), actions)).toBeUndefined();
        expect(
            entityPressProps(
                'cardThermo2',
                { type: '', id: '', icon: '', iconColor: 0, displayName: '', optionalValue: '' },
                actions,
            ),
        ).toBeUndefined();
    });
});

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

function cardProps<M>(model: M, pageType: string): CardProps<M> {
    return {
        model,
        ctx: { pageType, pageArgs: [] },
        global: initialGlobalState(),
        send: vi.fn(),
        press: vi.fn(),
        openPopup: vi.fn(),
    };
}

describe('the cards use the Pressable with the HMI hold time', () => {
    it('cardMedia: logo and bottom row', () => {
        const model: CardMediaModel = {
            ...initialMedia(),
            logo: entity('light', 'logo'),
            options: [entity('fan', '0'), entity('button', '1'), entity('shutter', '2')],
        };
        const tree = elements(new CardMedia(cardProps(model, 'cardMedia')).render());
        const buttons = tree.filter(el => el.type === Pressable);
        const logo = buttons.find(el => el.props['data-role'] === 'media-logo');
        expect(logo?.props.longPressMs).toBe(500);
        expect(logo?.props.onLongPress).toBeTypeOf('function');
        const options = buttons.filter(el => el.props['data-role'] === 'media-option');
        expect(options).toHaveLength(3);
        expect(options[0].props.onLongPress).toBeTypeOf('function');
        expect(options[1].props.onLongPress).toBeUndefined();
        expect(options[2].props.onLongPress).toBeUndefined();
    });

    it('cardThermo2: slots around the ring', () => {
        const model: CardThermo2Model = { ...initialThermo2() };
        model.slots = model.slots.map((s, i) => (i === 0 ? entity('light', 'p?0') : i === 1 ? entity('switch') : s));
        const tree = elements(new CardThermo2(cardProps(model, 'cardThermo2')).render());
        const slots = tree.filter(el => el.type === Pressable && el.props['data-role'] === 'thermo-slot');
        expect(slots).toHaveLength(9);
        expect(slots[0].props.longPressMs).toBe(300);
        expect(slots[0].props.onLongPress).toBeTypeOf('function');
        expect(slots[1].props.onLongPress).toBeUndefined();
        expect(slots[1].props.onPress).toBeTypeOf('function');
        expect(slots[2].props.onPress).toBeUndefined();
    });
});
