import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App, type MockPanel } from '../../App';
import type { PanelModel } from '../../protocol/types';
import { Pressable } from '../cardEntities/shared/Pressable';
import { DEVICE_LONG_PRESS_MS } from './CardDevice';
import { DEVICE_EXTRA_KINDS, DEVICE_SLOT_KINDS, type DeviceLayout } from './layout';

/*
 * The device pages over the whole chain of the web panel, as the browser runs it: the app takes the model of
 * the `hello` frame into its store, the store hands it to the parser (`ParseContext.model` - only a web model
 * reads the additional slots), the app draws the component of the page with the model of the stage, and a touch
 * of an element sends an event through the store to the transport.
 *
 * The tests have no DOM. They take the element tree the app renders, build every component of it and call the
 * pointer handlers of the touch areas ({@link Pressable}) like the browser does. Where an element is on the
 * stage follows from the absolutely positioned boxes of the tree: a point belongs to the last box that takes
 * pointer events (css `pointer-events`), like the hit test of the browser.
 */

const LAYOUTS: readonly DeviceLayout[] = [1, 2, 3];
const WEB_MODELS = ['web-l', 'web-p'] as const;
const HARDWARE_MODELS = ['eu', 'us-l', 'us-p'] as const;

type Props = Record<string, unknown> & { children?: React.ReactNode; style?: React.CSSProperties };

/** a touch area of the page: a {@link Pressable} with its pointer handlers */
interface Touch {
    /** data-role of the area */
    role: string;
    /** data-id of the area */
    id: string;
    /** the data-roles of the elements around it, outermost first */
    path: readonly string[];
    down: () => void;
    up: () => void;
}

/** a box of the stage that takes pointer events, with the touch area it belongs to (none: nothing happens) */
interface Area {
    x: number;
    y: number;
    w: number;
    h: number;
    touch: Touch | undefined;
}

interface Tree {
    touches: Touch[];
    /** in document order: a later box lies above an earlier one */
    areas: Area[];
    /** every data-role of the page */
    roles: string[];
    /** every data-id of the page */
    ids: string[];
}

interface Position {
    /** origin of the absolutely positioned children */
    x: number;
    y: number;
    /** css `pointer-events` as inherited: false = none */
    events: boolean;
    touch: Touch | undefined;
    path: readonly string[];
}

function touchOf(props: Props, at: Position): { touch: Touch; rendered: React.ReactNode } {
    const area = new Pressable(props);
    // not mounted: keep the state by hand
    area.setState = (state): void => {
        Object.assign(area.state, state);
    };
    const event = { stopPropagation: (): void => undefined };
    const role = props['data-role'];
    const id = props['data-id'];
    const handlers = (): Record<string, ((e: unknown) => void) | undefined> =>
        (area.render() as React.ReactElement<Record<string, ((e: unknown) => void) | undefined>>).props;
    const touch: Touch = {
        role: typeof role === 'string' ? role : '',
        id: typeof id === 'string' ? id : '',
        path: at.path,
        down: () => handlers().onPointerDown?.(event),
        up: () => handlers().onPointerUp?.(event),
    };
    return { touch, rendered: area.render() };
}

/**
 * Builds the components of an element tree and collects its touch areas and boxes.
 *
 * @param node the element tree
 * @param at where its children are placed
 * @param out the result
 */
function collect(node: React.ReactNode, at: Position, out: Tree): void {
    if (Array.isArray(node)) {
        node.forEach(child => collect(child, at, out));
        return;
    }
    if (!React.isValidElement<Props>(node)) {
        return;
    }
    const { type, props } = node;
    if (type === React.Fragment) {
        collect(props.children, at, out);
        return;
    }
    if (typeof type === 'string') {
        const style = props.style ?? {};
        const events = style.pointerEvents === undefined ? at.events : style.pointerEvents !== 'none';
        const role = props['data-role'];
        const id = props['data-id'];
        if (typeof role === 'string') {
            out.roles.push(role);
        }
        if (typeof id === 'string') {
            out.ids.push(id);
        }
        let { x, y } = at;
        if (style.position === 'absolute' && typeof style.left === 'number' && typeof style.top === 'number') {
            x += style.left;
            y += style.top;
            if (events && typeof style.width === 'number' && typeof style.height === 'number') {
                out.areas.push({ x, y, w: style.width, h: style.height, touch: at.touch });
            }
            // the children are placed inside the border
            const border = /^(\d+)px/.exec(typeof style.border === 'string' ? style.border : '');
            if (border) {
                x += Number(border[1]);
                y += Number(border[1]);
            }
        }
        const path = typeof role === 'string' ? [...at.path, role] : at.path;
        collect(props.children, { x, y, events, touch: at.touch, path }, out);
        return;
    }
    if (typeof type !== 'function') {
        throw new Error('element type the test cannot build');
    }
    if (type === Pressable) {
        const { touch, rendered } = touchOf(props, at);
        out.touches.push(touch);
        collect(rendered, { ...at, touch }, out);
        return;
    }
    const isClass = (type.prototype as { isReactComponent?: unknown } | undefined)?.isReactComponent !== undefined;
    if (isClass) {
        const component = new (type as new (p: Props) => React.Component)(props);
        collect(component.render(), at, out);
        return;
    }
    collect((type as (p: Props) => React.ReactNode)(props), at, out);
}

/** the web panel in mock mode: the app with its store and the transport that records what is sent */
interface Panel {
    /** a message of the adapter */
    dispatch: (raw: string) => void;
    /** everything the panel sent */
    sent: string[];
    /** the page as the app draws it now */
    page: () => Tree;
}

/**
 * Starts the app like `/demo?mock=1&model=<model>`: its mock `hello` carries the model.
 *
 * @param model the model of the hello frame
 */
function startPanel(model: PanelModel): Panel {
    const win: { __panel?: MockPanel } = {};
    vi.stubGlobal('window', win);
    const app = new App({ topic: 'test', mock: true, mockModel: model, mockButtons: false });
    const panel = win.__panel;
    if (!panel) {
        throw new Error('the app did not start in mock mode');
    }
    return {
        dispatch: raw => panel.dispatch(raw),
        sent: panel.sent,
        page: (): Tree => {
            // not mounted: what componentDidMount subscribes to and what the icon loader sets
            app.state = { ...app.state, snapshot: app['store'].getSnapshot(), iconsLoaded: true };
            const out: Tree = { touches: [], areas: [], roles: [], ids: [] };
            collect(app['renderPage'](), { x: 0, y: 0, events: true, touch: undefined, path: [] }, out);
            return out;
        },
    };
}

const NAV = 'button~p~<~65535~~~button~n~>~65535~~';
const EMPTY = '~~~~~';

function element(kind: string, id: string): string {
    const type = kind === 'switch' ? 'switch' : kind === 'button' ? 'button' : 'text';
    // a switch that is on, a bar at 50 %
    return `${type}~${id}~X~65535~name ${id}~${kind === 'switch' ? '1' : '50'}`;
}

/**
 * The `entityUpd` of a device page as the adapter sends it to a web model: main `m`, the slots `s1`…, the info
 * icon `info`, behind it the additional slots `x1`… (bit j of `mask` fills additional slot j + 1).
 *
 * @param layout the page
 * @param mask the filled additional slots
 * @param stage the stage of the status icon grid (field 6 of info)
 */
function entityUpd(layout: DeviceLayout, mask: number, stage = 0): string {
    const slots = DEVICE_SLOT_KINDS[layout].map((kind, i) => element(kind, `s${i + 1}`));
    const extras = DEVICE_EXTRA_KINDS[layout].map((kind, j) => ((mask >> j) & 1 ? element(kind, `x${j + 1}`) : EMPTY));
    return [
        'entityUpd',
        'Title',
        NAV,
        'text~m~M~65535~Main~Status',
        ...slots,
        `button~info~i~65535~~${stage > 0 ? stage : ''}`,
        ...extras,
    ].join('~');
}

/**
 * Shows a device page on a panel of this model.
 *
 * @param model the model of the hello frame
 * @param layout the page
 * @param mask the filled additional slots of the message
 * @param stage the stage of the status icon grid; above 0 a `devIcons` with four cells `c1`…`c4` follows
 */
function show(model: PanelModel, layout: DeviceLayout, mask: number, stage = 0): { panel: Panel; tree: Tree } {
    const panel = startPanel(model);
    panel.dispatch(`pageType~cardDevice${layout}`);
    panel.dispatch(entityUpd(layout, mask, stage));
    if (stage > 0) {
        panel.dispatch(['devIcons', ...[1, 2, 3, 4].map(i => `1~c${i}~X~2047`), '~~~'].join('~'));
    }
    return { panel, tree: panel.page() };
}

/** the id the element of a touch area carries in the message: its own slot, whatever place it stands on */
function ownId(touch: Touch): string | undefined {
    for (const role of [touch.role, ...[...touch.path].reverse()]) {
        if (role === 'main') {
            return 'm';
        }
        if (role === 'info') {
            return 'info';
        }
        const slot = /^(slot|extra)-(\d+)(-label)?$/.exec(role);
        if (slot) {
            return `${slot[1] === 'slot' ? 's' : 'x'}${slot[2]}`;
        }
    }
    return undefined;
}

/** what the panel sends while `action` runs */
function sentBy(panel: Panel, action: () => void): string[] {
    const before = panel.sent.length;
    action();
    return panel.sent.slice(before);
}

function tap(touch: Touch): void {
    touch.down();
    touch.up();
}

function hold(touch: Touch): void {
    touch.down();
    vi.advanceTimersByTime(DEVICE_LONG_PRESS_MS);
    touch.up();
}

/** the touch area a point of the stage belongs to: that of the topmost box that takes pointer events */
function touchAt(tree: Tree, x: number, y: number): Touch | undefined {
    const hit = tree.areas.filter(a => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h);
    return hit[hit.length - 1]?.touch;
}

/** a tap or a long press at a point of the stage */
function touchPoint(panel: Panel, tree: Tree, x: number, y: number): { tap: string[]; hold: string[] } {
    const touch = touchAt(tree, x, y);
    return {
        tap: sentBy(panel, () => touch && tap(touch)),
        hold: sentBy(panel, () => touch && hold(touch)),
    };
}

/** the boxes of the stage in which a touch area takes the touch */
function boxesOf(tree: Tree, touch: Touch | undefined): Omit<Area, 'touch'>[] {
    return tree.areas.filter(a => a.touch === touch).map(a => ({ x: a.x, y: a.y, w: a.w, h: a.h }));
}

/**
 * Touches every element of the page and compares what is sent with the id of the element itself.
 *
 * @param panel the panel
 * @param tree its page
 * @param at the case, for the messages
 */
function expectOwnIds(panel: Panel, tree: Tree, at: string): { elements: string[]; switches: string[] } {
    const elements: string[] = [];
    const switches: string[] = [];
    for (const touch of tree.touches) {
        const id = ownId(touch);
        if (id === undefined) {
            // the arrows of the title bar are no Pressable; nothing else is on the page
            throw new Error(`${at}: touch area ${touch.role} belongs to no element`);
        }
        const name = `${at} ${[...touch.path, touch.role].join('/')}`;
        if (touch.role === 'toggle') {
            // the switch is on: it sends off, with the id of its own slot
            expect(
                sentBy(panel, () => tap(touch)),
                name,
            ).toEqual([`event,buttonPress2,${id},OnOff,0`]);
            switches.push(id);
            continue;
        }
        expect(touch.id, name).toBe(id);
        expect(
            sentBy(panel, () => tap(touch)),
            name,
        ).toEqual([`event,buttonPress2,${id},button`]);
        // the info icon has no long press: holding it is a tap
        const held = touch.role === 'info' ? 'buttonPress2' : 'buttonPress3';
        expect(
            sentBy(panel, () => hold(touch)),
            `${name} held`,
        ).toEqual([`event,${held},${id},button`]);
        elements.push(id);
    }
    return { elements: elements.sort(), switches: switches.sort() };
}

/** the ids `<prefix>1` … `<prefix><count>` */
function ids(prefix: string, count: number): string[] {
    return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}

describe('device pages through the app: hello model -> store -> parser -> component -> event', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // the app is not mounted: React reports the setState of its constructor, everything else stays an error
        const error = console.error;
        vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
            if (!String(args[0]).includes("Can't call %s on a component that is not yet mounted")) {
                error(...args);
                throw new Error(`console.error: ${String(args[0])}`);
            }
        });
    });
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    for (const model of WEB_MODELS) {
        for (const layout of LAYOUTS) {
            it(`${model} cardDevice${layout}: the additional elements are shown, every element sends its own id`, () => {
                const kinds = DEVICE_SLOT_KINDS[layout];
                const extraKinds = DEVICE_EXTRA_KINDS[layout];
                const { panel, tree } = show(model, layout, (1 << extraKinds.length) - 1);
                const at = `${model} cardDevice${layout}`;
                expect(
                    tree.roles.filter(r => /^extra-\d+$/.test(r)),
                    at,
                ).toEqual(extraKinds.map((_, j) => `extra-${j + 1}`));
                const sent = expectOwnIds(panel, tree, at);
                // nothing is missing: main, every slot, every additional slot and the info icon were touched
                expect(sent.elements, at).toEqual(
                    ['info', 'm', ...ids('s', kinds.length), ...ids('x', extraKinds.length)].sort(),
                );
                const switchIds = [
                    ...kinds.flatMap((kind, i) => (kind === 'switch' ? [`s${i + 1}`] : [])),
                    ...extraKinds.flatMap((kind, j) => (kind === 'switch' ? [`x${j + 1}`] : [])),
                ];
                expect(sent.switches, at).toEqual(switchIds.sort());
            });
        }
    }

    it('web-l / web-p: a standard and an additional element by name - tap, long press, switch', () => {
        for (const model of WEB_MODELS) {
            // cardDevice1: standard button slot 3 and additional button 2
            const one = show(model, 1, 0b11);
            const find = (tree: Tree, role: string, within?: string): Touch => {
                const touch = tree.touches.find(
                    t => t.role === role && (within === undefined || t.path.includes(within)),
                );
                if (!touch) {
                    throw new Error(`${model}: no touch area ${within ?? ''} ${role}`);
                }
                return touch;
            };
            expect(sentBy(one.panel, () => tap(find(one.tree, 'slot-3')))).toEqual(['event,buttonPress2,s3,button']);
            expect(sentBy(one.panel, () => hold(find(one.tree, 'slot-3')))).toEqual(['event,buttonPress3,s3,button']);
            expect(sentBy(one.panel, () => tap(find(one.tree, 'extra-2')))).toEqual(['event,buttonPress2,x2,button']);
            expect(sentBy(one.panel, () => hold(find(one.tree, 'extra-2')))).toEqual(['event,buttonPress3,x2,button']);
            expect(sentBy(one.panel, () => tap(find(one.tree, 'main')))).toEqual(['event,buttonPress2,m,button']);
            // cardDevice3: standard switch slot 8, additional switch 3, additional info 1
            const three = show(model, 3, 0b111);
            expect(sentBy(three.panel, () => tap(find(three.tree, 'toggle', 'slot-8')))).toEqual([
                'event,buttonPress2,s8,OnOff,0',
            ]);
            expect(sentBy(three.panel, () => tap(find(three.tree, 'toggle', 'extra-3')))).toEqual([
                'event,buttonPress2,x3,OnOff,0',
            ]);
            expect(sentBy(three.panel, () => tap(find(three.tree, 'extra-3-label')))).toEqual([
                'event,buttonPress2,x3,button',
            ]);
            expect(sentBy(three.panel, () => hold(find(three.tree, 'extra-1')))).toEqual([
                'event,buttonPress3,x1,button',
            ]);
        }
    });

    it('eu, us-l, us-p: the same message shows no additional element', () => {
        for (const model of HARDWARE_MODELS) {
            for (const layout of LAYOUTS) {
                const kinds = DEVICE_SLOT_KINDS[layout];
                const { panel, tree } = show(model, layout, (1 << DEVICE_EXTRA_KINDS[layout].length) - 1);
                const at = `${model} cardDevice${layout}`;
                expect(
                    tree.roles.filter(r => r.startsWith('extra-')),
                    at,
                ).toEqual([]);
                expect(
                    tree.ids.filter(id => id.startsWith('x')),
                    at,
                ).toEqual([]);
                const sent = expectOwnIds(panel, tree, at);
                expect(sent.elements, at).toEqual(['info', 'm', ...ids('s', kinds.length)].sort());
                expect(sent.switches, at).toEqual(kinds.flatMap((kind, i) => (kind === 'switch' ? [`s${i + 1}`] : [])));
            }
        }
    });

    it('an additional element on the place of an empty one in front of it still sends its own id', () => {
        // the second of two additional slots of a kind alone: [page, mask with the first, mask with the second]
        const cases: [DeviceLayout, number, number][] = [
            [1, 0b01, 0b10],
            [2, 0b010, 0b100],
            [3, 0b001, 0b010],
        ];
        for (const model of WEB_MODELS) {
            for (const [layout, firstMask, secondMask] of cases) {
                const at = `${model} cardDevice${layout}`;
                const first = show(model, layout, firstMask);
                const second = show(model, layout, secondMask);
                const firstIndex = Math.log2(firstMask) + 1;
                const secondIndex = Math.log2(secondMask) + 1;
                const place = boxesOf(
                    first.tree,
                    first.tree.touches.find(t => t.role === `extra-${firstIndex}`),
                );
                expect(place, at).toHaveLength(1);
                // no hole: the second one stands where the first one would, nothing else of the page moves
                const own = second.tree.touches.find(t => t.role === `extra-${secondIndex}`);
                expect(boxesOf(second.tree, own), at).toEqual(place);
                expect(
                    second.tree.roles.filter(r => /^extra-\d+$/.test(r)),
                    at,
                ).toEqual([`extra-${secondIndex}`]);
                expect(
                    second.tree.areas.map(a => [a.x, a.y, a.w, a.h]),
                    at,
                ).toEqual(first.tree.areas.map(a => [a.x, a.y, a.w, a.h]));
                const { x, y, w, h } = place[0];
                const sent = touchPoint(second.panel, second.tree, x + w / 2, y + h / 2);
                expect(sent.tap, at).toEqual([`event,buttonPress2,x${secondIndex},button`]);
                expect(sent.hold, at).toEqual([`event,buttonPress3,x${secondIndex},button`]);
                expectOwnIds(second.panel, second.tree, at);
            }
        }
    });
});

describe('device pages: main is touched in its icon and its name only (bMain, tMainName of the HMI)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        const error = console.error;
        vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
            if (!String(args[0]).includes("Can't call %s on a component that is not yet mounted")) {
                error(...args);
                throw new Error(`console.error: ${String(args[0])}`);
            }
        });
    });
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    const MAIN = { tap: ['event,buttonPress2,m,button'], hold: ['event,buttonPress3,m,button'] };
    const NOTHING = { tap: [], hold: [] };

    /** the two boxes of main and what a touch at the given points sends */
    function main(
        model: PanelModel,
        layout: DeviceLayout,
        stage: number,
    ): { panel: Panel; tree: Tree; boxes: Omit<Area, 'touch'>[] } {
        const { panel, tree } = show(model, layout, 0, stage);
        const boxes = boxesOf(
            tree,
            tree.touches.find(t => t.role === 'main'),
        );
        return { panel, tree, boxes };
    }

    it('us-p / web-p cardDevice3: the icon stands in the middle above the wide name - beside it nothing is sent', () => {
        for (const [model, y] of [
            ['us-p', 68],
            ['web-p', 67],
        ] as const) {
            const { panel, tree, boxes } = main(model, 3, 1);
            expect(boxes, model).toEqual([
                { x: 85, y, w: 150, h: 82 },
                { x: 10, y: y + 84, w: 300, h: 26 },
            ]);
            // left and right of the icon, at its height
            expect(touchPoint(panel, tree, 40, y + 40), `${model} left of the icon`).toEqual(NOTHING);
            expect(touchPoint(panel, tree, 84, y + 81), `${model} left of the icon`).toEqual(NOTHING);
            expect(touchPoint(panel, tree, 235, y), `${model} right of the icon`).toEqual(NOTHING);
            expect(touchPoint(panel, tree, 280, y + 40), `${model} right of the icon`).toEqual(NOTHING);
            // the 2 px between icon and name
            expect(touchPoint(panel, tree, 160, y + 83), `${model} between icon and name`).toEqual(NOTHING);
            // the icon and the name over its whole width
            expect(touchPoint(panel, tree, 160, y + 40), `${model} icon`).toEqual(MAIN);
            expect(touchPoint(panel, tree, 85, y), `${model} icon`).toEqual(MAIN);
            expect(touchPoint(panel, tree, 234, y + 81), `${model} icon`).toEqual(MAIN);
            expect(touchPoint(panel, tree, 20, y + 95), `${model} name`).toEqual(MAIN);
            expect(touchPoint(panel, tree, 300, y + 95), `${model} name`).toEqual(MAIN);
        }
    });

    it('web-p cardDevice1 in stage 0: main in the middle, the room beside the icon sends nothing', () => {
        const { panel, tree, boxes } = main('web-p', 1, 0);
        expect(boxes).toEqual([
            { x: 85, y: 70, w: 150, h: 86 },
            { x: 10, y: 158, w: 300, h: 26 },
        ]);
        expect(touchPoint(panel, tree, 40, 110)).toEqual(NOTHING);
        expect(touchPoint(panel, tree, 280, 110)).toEqual(NOTHING);
        expect(touchPoint(panel, tree, 160, 110)).toEqual(MAIN);
        expect(touchPoint(panel, tree, 20, 170)).toEqual(MAIN);
        // in stage 1 the icon stands at the left, its name below it: set C beside it and the cells of the grid
        // below it are their own
        const withIcons = main('web-p', 1, 1);
        expect(withIcons.boxes).toEqual([
            { x: 10, y: 70, w: 150, h: 86 },
            { x: 10, y: 158, w: 150, h: 26 },
        ]);
        expect(touchPoint(withIcons.panel, withIcons.tree, 200, 90).tap).toEqual(['event,buttonPress2,s1,button']);
        expect(touchPoint(withIcons.panel, withIcons.tree, 20, 245).tap).toEqual(['event,buttonPress2,c1,button']);
        expect(touchPoint(withIcons.panel, withIcons.tree, 60, 285).hold).toEqual(['event,buttonPress3,c4,button']);
        // beyond the filled columns there is no cell
        expect(touchPoint(withIcons.panel, withIcons.tree, 100, 245)).toEqual(NOTHING);
    });

    it('eu, us-l, web-l: icon and name have the same width - only the 2 px between them send nothing', () => {
        const pages: [PanelModel, DeviceLayout, Omit<Area, 'touch'>][] = [
            ['eu', 1, { x: 10, y: 68, w: 110, h: 86 }],
            ['eu', 2, { x: 10, y: 67, w: 96, h: 82 }],
            ['eu', 3, { x: 10, y: 67, w: 100, h: 82 }],
            ['us-l', 1, { x: 25, y: 68, w: 110, h: 86 }],
            ['web-l', 1, { x: 10, y: 68, w: 110, h: 86 }],
            ['us-p', 1, { x: 10, y: 70, w: 150, h: 86 }],
            ['us-p', 2, { x: 10, y: 68, w: 90, h: 82 }],
        ];
        for (const [model, layout, icon] of pages) {
            const at = `${model} cardDevice${layout}`;
            const { panel, tree, boxes } = main(model, layout, 0);
            const name = { x: icon.x, y: icon.y + icon.h + 2, w: icon.w, h: 26 };
            expect(boxes, at).toEqual([icon, name]);
            const x = icon.x + icon.w / 2;
            expect(touchPoint(panel, tree, x, icon.y + icon.h - 1), `${at} icon`).toEqual(MAIN);
            expect(touchPoint(panel, tree, x, icon.y + icon.h), `${at} gap`).toEqual(NOTHING);
            expect(touchPoint(panel, tree, x, icon.y + icon.h + 1), `${at} gap`).toEqual(NOTHING);
            expect(touchPoint(panel, tree, x, name.y), `${at} name`).toEqual(MAIN);
            expect(touchPoint(panel, tree, x, name.y + name.h - 1), `${at} name`).toEqual(MAIN);
            expect(touchPoint(panel, tree, x, name.y + name.h), `${at} below the name`).toEqual(NOTHING);
            expect(touchPoint(panel, tree, icon.x - 1, icon.y + 10), `${at} left of the icon`).toEqual(NOTHING);
        }
    });
});
