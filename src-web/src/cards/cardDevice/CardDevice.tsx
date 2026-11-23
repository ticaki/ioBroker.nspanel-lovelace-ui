import React from 'react';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { emptyEntity } from '../../protocol/split';
import type { Entity6 } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { isOn, popupForType } from '../cardEntities/shared/entityTypes';
import { isEmptySlot } from '../cardEntities/shared/menuParse';
import { Pressable } from '../cardEntities/shared/Pressable';
import { HmiTextBox, Toggle, type NextionAlign } from '../cardEntities/shared/widgets';
import {
    DEVICE_GEOMETRY,
    STATUS_GRID_COLOR,
    progressPercent,
    showsStatusIcons,
    type Box,
    type SlotGeometry,
} from './layout';
import type { CardDeviceModel } from './parse';

/** Hold time of the `tmLP` timer the device pages copied from cardGrid */
export const DEVICE_LONG_PRESS_MS = 500;

/** Entity types whose popup opens as soon as the element is touched (cardGrid cell of the HMI) */
const POPUP_ON_TOUCH: ReadonlySet<string> = new Set(['shutter', 'shutter2', 'input_sel', 'timer']);

/** Entity types whose popup opens after holding {@link DEVICE_LONG_PRESS_MS} (`tmLP`) */
const POPUP_ON_HOLD: ReadonlySet<string> = new Set(['light', 'light2', 'fan', 'number']);

/** The tapped elements of a device page: the device itself (main), an info slot, a button slot */
export type DeviceTapKind = 'main' | 'info' | 'button';

/** What a touch of main, an info slot or a button slot does */
export type DeviceTouch =
    /** `event,buttonPress2,<id>,button` */
    | { kind: 'press' }
    /** open the popup of the entity type: `event,pageOpenDetail,<popup>,<id>` */
    | { kind: 'popup'; popup: string }
    /** nothing (main and info of type `text`) */
    | { kind: 'none' };

/**
 * Touch of main, an info or a button slot - the code of a cardGrid cell of the HMI
 * (`doc/ideas/device-details/device-page-hmi.md`, Elementarten): shutter, shutter2, input_sel and
 * timer open their popup on touch, light, light2, fan and number after holding 500 ms, the release
 * sends `buttonPress2,<id>,button`. main and info of type `text` send nothing, a button always
 * sends. There is no long press event (`buttonPress3`) on these pages.
 *
 * @param element the kind of element that was touched
 * @param type the entity type of the element
 * @param held true when it was held longer than {@link DEVICE_LONG_PRESS_MS}
 */
export function deviceTouch(element: DeviceTapKind, type: string, held: boolean): DeviceTouch {
    const popup = popupForType(type);
    if (popup !== undefined && (POPUP_ON_TOUCH.has(type) || (held && POPUP_ON_HOLD.has(type)))) {
        return { kind: 'popup', popup };
    }
    if (element !== 'button' && type === 'text') {
        return { kind: 'none' };
    }
    return { kind: 'press' };
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
 * (info, value, progress, button, switch; cardDevice1 also a 2x2 grid of status icons that, once one
 * of them is filled, narrows the info rows), the status line (field 6 of main) and the info icon
 * at the bottom right. Rebuilt from the eu HMI pixel by pixel; on web-l the page is drawn in the
 * eu geometry (`CENTERED_ON_WEB`). Texts are cut at the border of their field like on the panel.
 */
export class CardDevice extends React.Component<CardProps<CardDeviceModel>> {
    /**
     * A tap on main, an info or a button slot.
     *
     * @param element the kind of element
     * @param entity its entity
     * @param held true for a long press
     */
    onTap(element: DeviceTapKind, entity: Entity6, held: boolean): void {
        const touch = deviceTouch(element, entity.type, held);
        switch (touch.kind) {
            case 'popup':
                this.props.openPopup(touch.popup, entity.id, entity.displayName, entity.icon, entity.iconColor);
                break;
            case 'press':
                this.props.press(entity.id, 'button');
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
        font: number,
        xcen: NextionAlign,
        color: string,
        origin: Box = { x: 0, y: 0, w: 0, h: 0 },
    ): React.JSX.Element {
        return (
            <HmiTextBox
                key={key}
                field={field}
                color={color}
                x={b.x - origin.x}
                y={b.y - origin.y}
                w={b.w}
                h={b.h}
                font={font}
                xcen={xcen}
            />
        );
    }

    /**
     * A touch area around the boxes of an element (name and value forward their touch to the icon
     * on the HMI, the whole element is tappable).
     *
     * @param role data-role of the area
     * @param element the kind of element
     * @param entity its entity
     * @param boxes the boxes of the element
     * @param render the content, positioned relative to the area
     */
    private tapArea(
        role: string,
        element: DeviceTapKind,
        entity: Entity6,
        boxes: readonly Box[],
        render: (origin: Box) => React.ReactNode,
    ): React.JSX.Element {
        const area = unionBox(boxes);
        const hold = POPUP_ON_HOLD.has(entity.type);
        return (
            <Pressable
                key={role}
                data-role={role}
                data-id={entity.id}
                onPress={(): void => this.onTap(element, entity, false)}
                onLongPress={hold ? (): void => this.onTap(element, entity, true) : undefined}
                longPressMs={DEVICE_LONG_PRESS_MS}
                style={{
                    position: 'absolute',
                    left: area.x,
                    top: area.y,
                    width: area.w,
                    height: area.h,
                    pointerEvents: 'auto',
                }}
            >
                {render(area)}
            </Pressable>
        );
    }

    /**
     * A cell of the status grid (cardDevice1): framed, icon only, no touch; an empty slot stays an empty cell.
     *
     * @param entity the slot
     * @param slot its cell
     * @param role data-role of the cell
     */
    private renderStatusCell(entity: Entity6, slot: Box, role: string): React.JSX.Element {
        const empty = isEmptySlot(entity);
        return (
            <div
                key={role}
                data-role={role}
                data-empty={empty ? '' : undefined}
                style={{
                    position: 'absolute',
                    left: slot.x,
                    top: slot.y,
                    width: slot.w,
                    height: slot.h,
                    border: `1px solid ${color565ToCss(STATUS_GRID_COLOR)}`,
                    boxSizing: 'border-box',
                }}
            >
                {empty ? null : this.text('icon', entity.icon, slot, 1, 1, color565ToCss(entity.iconColor), slot)}
            </div>
        );
    }

    private renderSlot(
        entity: Entity6,
        slot: SlotGeometry,
        index: number,
        statusShown: boolean,
    ): React.JSX.Element | null {
        const role = `slot-${index + 1}`;
        if (slot.kind === 'status') {
            return statusShown ? this.renderStatusCell(entity, slot.icon, role) : null;
        }
        if (isEmptySlot(entity)) {
            return null;
        }
        const fg = theme.foreground;
        const iconColor = color565ToCss(entity.iconColor);
        switch (slot.kind) {
            case 'info': {
                const row = statusShown && slot.narrow ? slot.narrow : slot;
                return this.tapArea(role, 'info', entity, [row.icon, row.name, row.value], o => [
                    this.text('icon', entity.icon, row.icon, 1, 1, iconColor, o),
                    this.text('name', entity.displayName, row.name, 0, 0, fg, o),
                    this.text('value', entity.optionalValue, row.value, 0, 2, fg, o),
                ]);
            }
            case 'button':
                return this.tapArea(role, 'button', entity, [slot.icon, slot.name], o => [
                    this.text('icon', entity.icon, slot.icon, 3, 1, iconColor, o),
                    this.text('name', entity.displayName, slot.name, 0, 1, fg, o),
                ]);
            case 'value':
                return (
                    <div
                        key={role}
                        data-role={role}
                    >
                        {this.text('icon', entity.icon, slot.icon, 1, 1, iconColor)}
                        {this.text('value', entity.optionalValue, slot.value, 4, 0, fg)}
                        {this.text('name', entity.displayName, slot.name, 0, 0, fg)}
                    </div>
                );
            case 'progress': {
                const inner = slot.bar.w - 2;
                const fill = Math.round((inner * progressPercent(entity.optionalValue)) / 100);
                return (
                    <div
                        key={role}
                        data-role={role}
                    >
                        {this.text('name', entity.displayName, slot.name, 0, 0, fg)}
                        <div
                            data-role="progress-bar"
                            style={{
                                position: 'absolute',
                                left: slot.bar.x,
                                top: slot.bar.y,
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
                        </div>
                    </div>
                );
            }
            case 'switch':
                return (
                    <div
                        key={role}
                        data-role={role}
                    >
                        {this.text('icon', entity.icon, slot.icon, 1, 1, iconColor)}
                        {this.text('name', entity.displayName, slot.name, 0, 0, fg)}
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
                            />
                        </div>
                    </div>
                );
        }
        return null;
    }

    render(): React.JSX.Element {
        const { model, ctx, global, press } = this.props;
        const geometry = DEVICE_GEOMETRY[model.layout];
        const { main, info } = model;
        const statusShown = showsStatusIcons(geometry.slots, i => isEmptySlot(model.slots[i] ?? emptyEntity()));
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
                        : this.tapArea('main', 'main', main, [geometry.main.icon, geometry.main.name], o => [
                              this.text('icon', main.icon, geometry.main.icon, 4, 1, color565ToCss(main.iconColor), o),
                              this.text('name', main.displayName, geometry.main.name, 0, 1, theme.foreground, o),
                          ])}
                    {geometry.slots.map((slot, i) =>
                        this.renderSlot(model.slots[i] ?? emptyEntity(), slot, i, statusShown),
                    )}
                    <div data-role="status">
                        {this.text('status', model.status, geometry.status, 0, geometry.statusAlign, theme.foreground)}
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
                                1,
                                1,
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
