import React from 'react';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { emptyEntity } from '../../protocol/split';
import type { Entity6 } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { isOn, popupForType } from '../cardEntities/shared/entityTypes';
import { tileTouch } from '../cardGrid/CardGrid';
import { isEmptySlot } from '../cardEntities/shared/menuParse';
import { Pressable } from '../cardEntities/shared/Pressable';
import { HmiTextBox, Toggle } from '../cardEntities/shared/widgets';
import {
    BOX_STYLES,
    DEVICE_GRID_ROWS,
    STATUS_FRAME_COLOR,
    deviceGeometry,
    progressPercent,
    type Box,
    type BoxStyle,
    type SlotGeometry,
} from './layout';
import type { CardDeviceModel } from './parse';

/** Hold time of the `tmLP` timer the device pages copied from cardGrid */
export const DEVICE_LONG_PRESS_MS = 500;

/** Width of the on/off switch of the HMI (picture in the 50 px box of `btOnOff`) */
const TOGGLE_WIDTH = 45;

/** Entity types whose popup opens as soon as the element is touched (cardGrid cell of the HMI) */
const POPUP_ON_TOUCH: ReadonlySet<string> = new Set(['shutter', 'shutter2', 'input_sel', 'timer']);

/** Entity types whose popup opens after holding {@link DEVICE_LONG_PRESS_MS} (`tmLP`) */
const POPUP_ON_HOLD: ReadonlySet<string> = new Set(['light', 'light2', 'fan', 'number']);

/**
 * The tapped elements of a device page: the device itself (main) and every kind of slot (of a switch slot its
 * icon and name - the switch itself sends `OnOff`)
 */
export type DeviceTapKind = 'main' | 'info' | 'value' | 'progress' | 'button' | 'switch' | 'status';

/**
 * The elements that show the press effect: the HMI draws them as buttons, or greys the cells of the status icon
 * grid while they are pressed (since device12). The other hotspots and texts show none.
 */
const PRESS_EFFECT: ReadonlySet<DeviceTapKind> = new Set<DeviceTapKind>(['main', 'info', 'button', 'status']);

/** What a touch of main or a slot does */
export type DeviceTouch =
    /** `event,buttonPress2,<id>,button` */
    | { kind: 'press' }
    /** open the popup of the entity type: `event,pageOpenDetail,<popup>,<id>` */
    | { kind: 'popup'; popup: string }
    /** `event,buttonPress3,<id>,button` */
    | { kind: 'longPress' }
    /** nothing (an empty element, type `text` without an id) */
    | { kind: 'none' };

/**
 * Touch of main or a slot. Every place of a device page runs the code of a cardGrid cell of the HMI
 * (`doc/ideas/device-details/device-page-hmi.md`, Ereignisse beim Antippen), so this is {@link tileTouch} of the
 * grid tile with what the device pages add: shutter, shutter2, input_sel and timer open their popup already on a
 * tap; an empty element and - except in a button slot - type `text` without an id send nothing.
 * Short tap: `buttonPress2,<id>,button`, also for type `text`. Held 500 ms: light, light2, fan and number open
 * their popup, every other type sends `buttonPress3,<id>,button`.
 *
 * @param element the kind of element that was touched
 * @param entity type and id of the element
 * @param entity.type the entity type
 * @param entity.id the internal name
 * @param held true when it was held longer than {@link DEVICE_LONG_PRESS_MS}
 */
export function deviceTouch(element: DeviceTapKind, entity: { type: string; id: string }, held: boolean): DeviceTouch {
    const { type, id } = entity;
    if (type === '' || type === 'delete') {
        return { kind: 'none' };
    }
    const popup = popupForType(type);
    if (popup !== undefined && POPUP_ON_TOUCH.has(type)) {
        return { kind: 'popup', popup };
    }
    if (element !== 'button' && type === 'text' && id === '') {
        return { kind: 'none' };
    }
    return tileTouch(type, held);
}

/**
 * A text as the HMI copies it into a component with a smaller buffer (`txt_maxl`): at most `maxBytes` bytes
 * (UTF-8), whole characters. No ellipsis - the text is only shorter.
 *
 * @param text the text
 * @param maxBytes the bytes of the buffer, unlimited when missing
 */
export function cutToBytes(text: string, maxBytes: number | undefined): string {
    if (maxBytes === undefined) {
        return text;
    }
    const encoder = new TextEncoder();
    let out = '';
    let bytes = 0;
    for (const char of text) {
        bytes += encoder.encode(char).length;
        if (bytes > maxBytes) {
            break;
        }
        out += char;
    }
    return out;
}

/**
 * The smallest box around the given boxes.
 *
 * @param boxes the boxes, at least one
 */
function unionBox(boxes: readonly Box[]): Box {
    const x = Math.min(...boxes.map(b => b.x));
    const y = Math.min(...boxes.map(b => b.y));
    const right = Math.max(...boxes.map(b => b.x + b.w));
    const bottom = Math.max(...boxes.map(b => b.y + b.h));
    return { x, y, w: right - x, h: bottom - y };
}

/**
 * cardDevice1 / cardDevice2 / cardDevice3: the page of one device - big icon (main), fixed slots
 * (info, value, progress, button, switch), on cardDevice1 / cardDevice3 the status icon grid of the stage (cells
 * from `devIcons`), the status line (field 6 of main, replaced by `devStatus`) and the info icon at the bottom
 * right. main, every slot and every filled cell are touched like a grid tile
 * ({@link deviceTouch}). The boxes come from the geometry of the model ({@link deviceGeometry}): eu, us-l and
 * us-p are rebuilt from the HMI pixel by pixel, web-l and web-p have layouts of their own on the full stage with
 * additional slots behind the standard ones (same kinds, same touch). Texts are cut at the border of their
 * field like on the panel.
 */
export class CardDevice extends React.Component<CardProps<CardDeviceModel>> {
    /**
     * A touch of main or a slot ({@link deviceTouch}). A popup gets what the HMI hands over: name, icon and icon
     * colour of the element - from a status cell no name (the page does not read it), from a progress slot no icon.
     *
     * @param element the kind of element
     * @param entity its entity
     * @param held true for a long press
     */
    onTap(element: DeviceTapKind, entity: Entity6, held: boolean): void {
        const touch = deviceTouch(element, entity, held);
        switch (touch.kind) {
            case 'popup':
                this.props.openPopup(
                    touch.popup,
                    entity.id,
                    element === 'status' ? '' : entity.displayName,
                    element === 'progress' ? '' : entity.icon,
                    element === 'progress' ? undefined : entity.iconColor,
                );
                break;
            case 'press':
                this.props.press(entity.id, 'button');
                break;
            case 'longPress':
                this.props.send(`event,buttonPress3,${entity.id},button`);
                break;
            default:
                break;
        }
    }

    /**
     * The switch of a switch slot: `buttonPress2,<id>,OnOff,<0|1>` like cardEntities.
     *
     * @param entity the slot
     * @param on the new state
     */
    onSwitch(entity: Entity6, on: boolean): void {
        this.props.press(entity.id, 'OnOff', on ? 1 : 0);
    }

    /** The info icon at the bottom right: `buttonPress2,<id>,button` */
    onInfo(): void {
        this.props.press(this.props.model.info.id, 'button');
    }

    private text(
        key: string,
        field: string,
        b: Box,
        style: BoxStyle,
        color: string,
        origin: Box = { x: 0, y: 0, w: 0, h: 0 },
    ): React.JSX.Element {
        return (
            <HmiTextBox
                key={key}
                field={cutToBytes(field, b.maxBytes)}
                color={color}
                x={b.x - origin.x}
                y={b.y - origin.y}
                w={b.w}
                h={b.h}
                // a box of the geometry may bring its own font and alignment, else those of the element kind
                font={b.font ?? style.font}
                xcen={b.align ?? style.align}
            />
        );
    }

    /**
     * A touch area around the boxes of an element (name and value forward their touch to the icon
     * on the HMI or lie under a hotspot, the whole element is tappable). It is the touch area of a grid tile
     * ({@link Pressable}) with the timer of the device pages: a tap on release, after {@link DEVICE_LONG_PRESS_MS}
     * the popup of light, light2, fan and number at once, the long press of every other type on release.
     *
     * With `hit` the element is touched only in these boxes (`data-role="<role>-hit"`), not in the whole area
     * around them: main, whose icon and name differ in width on the portrait pages - the HMI has only `bMain` and
     * `tMainName` as touch components, the room next to the icon belongs to nobody.
     *
     * @param role data-role of the area
     * @param element the kind of element
     * @param entity its entity
     * @param boxes the boxes of the element
     * @param render the content, positioned relative to the area
     * @param hit the boxes that take the touch, the whole area when missing
     */
    private tapArea(
        role: string,
        element: DeviceTapKind,
        entity: Entity6,
        boxes: readonly Box[],
        render: (origin: Box) => React.ReactNode,
        hit?: readonly Box[],
    ): React.JSX.Element {
        const area = unionBox(boxes);
        return (
            <Pressable
                key={role}
                data-role={role}
                data-id={entity.id}
                onPress={(): void => this.onTap(element, entity, false)}
                onLongPress={(): void => this.onTap(element, entity, true)}
                longPressMs={DEVICE_LONG_PRESS_MS}
                longPressOnRelease={!POPUP_ON_HOLD.has(entity.type)}
                pressEffect={PRESS_EFFECT.has(element)}
                style={{
                    position: 'absolute',
                    left: area.x,
                    top: area.y,
                    width: area.w,
                    height: area.h,
                    pointerEvents: hit ? 'none' : 'auto',
                }}
            >
                {hit?.map((b, i) => (
                    <div
                        key={`hit-${i}`}
                        data-role={`${role}-hit`}
                        style={{
                            position: 'absolute',
                            left: b.x - area.x,
                            top: b.y - area.y,
                            width: b.w,
                            height: b.h,
                            pointerEvents: 'auto',
                        }}
                    />
                ))}
                {render(area)}
            </Pressable>
        );
    }

    /**
     * A cell of the status icon grid: the icon only, centred in a 1 px grey frame that it shares with its
     * neighbours; an empty cell of a shown column keeps its frame and takes no touch. A filled cell is tappable like
     * every other place, it greys while pressed.
     *
     * @param entity the cell (type, id, icon, colour)
     * @param cell its box
     * @param role data-role of the cell
     */
    private renderCell(entity: Entity6, cell: Box, role: string): React.JSX.Element {
        return (
            <div
                key={role}
                data-role={role}
                data-kind="status"
                style={{
                    position: 'absolute',
                    left: cell.x,
                    top: cell.y,
                    width: cell.w,
                    height: cell.h,
                    border: `1px solid ${color565ToCss(STATUS_FRAME_COLOR)}`,
                    boxSizing: 'border-box',
                }}
            >
                {isEmptySlot(entity)
                    ? null
                    : // the touch area and the text box are the cell itself, the frame lies on top of their edge
                      this.tapArea(
                          'status-icon',
                          'status',
                          entity,
                          [{ x: -1, y: -1, w: cell.w, h: cell.h }],
                          (): React.ReactNode =>
                              this.text(
                                  'icon',
                                  entity.icon,
                                  cell,
                                  BOX_STYLES.cell,
                                  color565ToCss(entity.iconColor),
                                  cell,
                              ),
                      )}
            </div>
        );
    }

    /**
     * A standard or additional slot in its boxes; an empty one (or one the page has no place for) draws nothing.
     *
     * @param entity the slot
     * @param slot its boxes, `undefined`: no place on this page (in this stage)
     * @param role data-role of the slot (`slot-<k>`, `extra-<j>`)
     */
    private renderSlot(entity: Entity6, slot: SlotGeometry | undefined, role: string): React.JSX.Element | null {
        if (slot === undefined || isEmptySlot(entity)) {
            return null;
        }
        const fg = theme.foreground;
        const iconColor = color565ToCss(entity.iconColor);
        switch (slot.kind) {
            case 'info': {
                // set C of cardDevice1 has no name
                const { name } = slot;
                const boxes = name ? [slot.icon, name, slot.value] : [slot.icon, slot.value];
                return this.tapArea(role, 'info', entity, boxes, o => [
                    this.text('icon', entity.icon, slot.icon, BOX_STYLES.info.icon, iconColor, o),
                    name ? this.text('name', entity.displayName, name, BOX_STYLES.info.name, fg, o) : null,
                    this.text('value', entity.optionalValue, slot.value, BOX_STYLES.info.value, fg, o),
                ]);
            }
            case 'button':
                return this.tapArea(role, 'button', entity, [slot.icon, slot.name], o => [
                    this.text('icon', entity.icon, slot.icon, BOX_STYLES.button.icon, iconColor, o),
                    this.text('name', entity.displayName, slot.name, BOX_STYLES.button.name, fg, o),
                ]);
            case 'value':
                return this.tapArea(role, 'value', entity, [slot.icon, slot.value, slot.name], o => [
                    this.text('icon', entity.icon, slot.icon, BOX_STYLES.value.icon, iconColor, o),
                    this.text('value', entity.optionalValue, slot.value, BOX_STYLES.value.value, fg, o),
                    this.text('name', entity.displayName, slot.name, BOX_STYLES.value.name, fg, o),
                ]);
            case 'progress': {
                const inner = slot.bar.w - 2;
                const fill = Math.round((inner * progressPercent(entity.optionalValue)) / 100);
                return this.tapArea(role, 'progress', entity, [slot.name, slot.bar], o => [
                    this.text('name', entity.displayName, slot.name, BOX_STYLES.progress.name, fg, o),
                    <div
                        key="bar"
                        data-role="progress-bar"
                        style={{
                            position: 'absolute',
                            left: slot.bar.x - o.x,
                            top: slot.bar.y - o.y,
                            width: slot.bar.w,
                            height: slot.bar.h,
                            border: `1px solid ${fg}`,
                            boxSizing: 'border-box',
                        }}
                    >
                        <div
                            data-role="progress-fill"
                            style={{ width: fill, height: slot.bar.h - 2, background: iconColor }}
                        />
                    </div>,
                ]);
            }
            case 'switch':
                return (
                    <div
                        key={role}
                        data-role={role}
                    >
                        {this.tapArea(`${role}-label`, 'switch', entity, [slot.icon, slot.name], o => [
                            this.text('icon', entity.icon, slot.icon, BOX_STYLES.switch.icon, iconColor, o),
                            this.text('name', entity.displayName, slot.name, BOX_STYLES.switch.name, fg, o),
                        ])}
                        <div
                            style={{
                                position: 'absolute',
                                left: slot.toggle.x,
                                top: slot.toggle.y,
                                width: slot.toggle.w,
                                height: slot.toggle.h,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'auto',
                            }}
                        >
                            <Toggle
                                on={isOn(entity.optionalValue)}
                                onChange={(on): void => this.onSwitch(entity, on)}
                                width={Math.min(TOGGLE_WIDTH, slot.toggle.w)}
                            />
                        </div>
                    </div>
                );
        }
        return null;
    }

    render(): React.JSX.Element {
        const { model, ctx, global, press } = this.props;
        const geometry = deviceGeometry(model.layout, global.model, model.extras, model.stage);
        // the columns of the status icon grid that are shown, both cells of a column (also an empty one)
        const cells = geometry.grid.slice(0, model.columns * DEVICE_GRID_ROWS[model.layout]);
        const { main, info } = model;
        const mainBoxes = [geometry.main.icon, geometry.main.name];
        return (
            <div
                data-page={ctx.pageType}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: theme.background,
                    color: theme.foreground,
                    fontFamily: theme.fontFamily,
                    overflow: 'hidden',
                }}
            >
                <TitleBar
                    title={model.title}
                    navigation={model.navigation}
                    model={global.model}
                    press={press}
                    send={this.props.send}
                />
                <div
                    data-device=""
                    // spans the stage above the title bar: only the elements take the touches,
                    // the navigation arrows stay reachable
                    style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                >
                    {isEmptySlot(main)
                        ? null
                        : this.tapArea(
                              'main',
                              'main',
                              main,
                              mainBoxes,
                              o => [
                                  this.text(
                                      'icon',
                                      main.icon,
                                      geometry.main.icon,
                                      BOX_STYLES.main.icon,
                                      color565ToCss(main.iconColor),
                                      o,
                                  ),
                                  this.text(
                                      'name',
                                      main.displayName,
                                      geometry.main.name,
                                      BOX_STYLES.main.name,
                                      theme.foreground,
                                      o,
                                  ),
                              ],
                              // bMain and tMainName of the HMI: nothing between or next to them takes the touch
                              mainBoxes,
                          )}
                    {geometry.slots.map((slot, i) =>
                        this.renderSlot(model.slots[i] ?? emptyEntity(), slot, `slot-${i + 1}`),
                    )}
                    {geometry.extras.map((slot, j) =>
                        this.renderSlot(model.extras[j] ?? emptyEntity(), slot, `extra-${j + 1}`),
                    )}
                    {cells.map((cell, i) => this.renderCell(model.icons[i] ?? emptyEntity(), cell, `cell-${i + 1}`))}
                    <div data-role="status">
                        {this.text(
                            'status',
                            model.status,
                            geometry.status,
                            { font: BOX_STYLES.statusLine.font, align: geometry.statusAlign },
                            theme.foreground,
                        )}
                    </div>
                    {isEmptySlot(info) ? null : (
                        <Pressable
                            data-role="info"
                            data-id={info.id}
                            onPress={(): void => this.onInfo()}
                            style={{
                                position: 'absolute',
                                left: geometry.info.x,
                                top: geometry.info.y,
                                width: geometry.info.w,
                                height: geometry.info.h,
                                pointerEvents: 'auto',
                            }}
                        >
                            {this.text(
                                'icon',
                                info.icon,
                                geometry.info,
                                BOX_STYLES.infoIcon,
                                color565ToCss(info.iconColor),
                                geometry.info,
                            )}
                        </Pressable>
                    )}
                </div>
            </div>
        );
    }
}
