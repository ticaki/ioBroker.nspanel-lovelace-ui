import React from 'react';
import { color565ToCss } from '../../../protocol/color';
import type { Entity6 } from '../../../protocol/types';
import { theme } from '../../../style/theme';
import { hasToggle, isOn, parseNumberOptions, parseShutterOptions, popupForType } from './entityTypes';
import { isEmptySlot } from './menuParse';
import { EntityIcon, NumberSlider, ShutterButtons, TextButton, Toggle } from './widgets';

/**
 * Positions of a row as the HMI draws it (cardEntities, eu): icon centred at x 45.5, name
 * from x 77, the controls end at x 424 (text), 418 (toggle) resp. 426 (shutter buttons).
 * `ROW_RIGHT` is the distance of the text edge from the right edge of the stage.
 */
export const ROW_ICON_CENTER = 45.5;
export const ROW_NAME_LEFT = 77;
export const ROW_RIGHT = 56;

/**
 * The compact rows of cardSchedule (6 rows of 35 px): icon of 26 px centred at x 37, name from
 * x 67 (18 px), the value (17 px) in a 66 px wide box that ends at x 433 - a long value is cut
 * hard at the right ("geschlossen" -> "geschlo"), a short one is right-aligned.
 */
export const COMPACT_ICON_CENTER = 37;
export const COMPACT_NAME_LEFT = 67;
export const COMPACT_VALUE_WIDTH = 66;
export const COMPACT_VALUE_RIGHT = 47;

/**
 * Line height of the value box in px: room for ascenders and descenders of the font
 * (about 1.25 x the font size). The extra height is even, so the centred box grows by whole
 * pixels above and below and the text does not move by a sub-pixel.
 *
 * @param fontSize font size of the value
 */
export function valueLineHeight(fontSize: number): number {
    return fontSize + 2 * Math.ceil(fontSize / 8);
}

/** Empty strip at the right of the hardware displays (stage width - `contentWidth`) */
export const HMI_RIGHT_MARGIN = 33;

/** How a row is laid out horizontally - see {@link rowGeometry} */
export interface RowOptions {
    /** compact row (cardSchedule, portrait models) */
    compact: boolean;
    /**
     * the name ends at the actual left edge of the control (us-p and the web models); `false`
     * keeps the fixed columns of the eu HMI (eu, us-l), where the name may run under a control
     */
    fit: boolean;
    /** width of the value column of the web models, `undefined` = the column of the HMI */
    valueWidth?: number;
    /** empty strip at the right of the stage: 33 on the hardware, 0 on the web models */
    margin: number;
}

/** Horizontal geometry of a row, distances from the right edge of the row (= stage) */
export interface RowGeometry {
    /** right edge of the name box */
    nameRight: number;
    /** right edge of the control */
    controlRight: number;
    /** width of a toggle */
    toggleWidth: number;
    /** width of one of the three shutter buttons (the tap area) */
    shutterCell: number;
    /** width of the track of a number slider */
    sliderWidth: number;
    /** width of the value box of a text entity, `undefined` = as wide as the value (max 240) */
    valueWidth: number | undefined;
    /** maximum width of the text of button / input_sel / timer */
    textButtonWidth: number;
}

/** gap between the end of the name and the control */
const NAME_GAP = 8;
/** the value text of a number slider has at least this width (`NumberSlider`) */
const SLIDER_VALUE_WIDTH = 44;
/** tap area of a shutter button on the narrow portrait rows */
const NARROW_SHUTTER_CELL = 44;
/** track of a number slider on the narrow portrait rows */
const NARROW_SLIDER_WIDTH = 60;

/**
 * Where name and control of a row go.
 *
 * eu / us-l (`fit` false): the columns of the HMI - text up to 240 px at x 424 (compact: value
 * box of 66 px at x 433), toggle ends at x 418, shutter buttons at x 426, the name ends 150 px
 * left of the text edge (compact: 8 px left of the value box), whatever the control is.
 *
 * us-p and the web models (`fit` true): the name ends `NAME_GAP` left of the actual left edge
 * of the control of the entity type, so it never runs under a wide control. The compact
 * (portrait) rows set the shutter buttons closer (44 px tap areas, ending at the content edge)
 * and shorten the slider. The web models have no empty strip at the right (`margin` 0), all
 * controls move 33 px to the right.
 *
 * @param type entity type of the row
 * @param options compact / fit / value column / right margin
 */
export function rowGeometry(type: string, options: RowOptions): RowGeometry {
    const { compact, fit } = options;
    const scale = compact ? 26 / 29 : 1;
    const shift = options.margin - HMI_RIGHT_MARGIN;
    const toggleWidth = Math.round(45 * scale);
    if (!fit) {
        const valueWidth = compact ? COMPACT_VALUE_WIDTH : undefined;
        const nameRight = compact ? COMPACT_VALUE_RIGHT + COMPACT_VALUE_WIDTH + 8 : ROW_RIGHT + 150;
        let controlRight = ROW_RIGHT;
        if (hasToggle(type)) {
            controlRight = ROW_RIGHT + 6;
        } else if (type === 'shutter' || type === 'shutter2') {
            controlRight = ROW_RIGHT - 2;
        } else if (type === 'text' && compact) {
            controlRight = COMPACT_VALUE_RIGHT;
        }
        return {
            nameRight: nameRight + shift,
            controlRight: controlRight + shift,
            toggleWidth,
            shutterCell: 51.5 * scale,
            sliderWidth: Math.round(94 * scale),
            valueWidth,
            textButtonWidth: 240,
        };
    }
    const narrow = compact;
    // the value column: compact rows and the web models right-align it 47 px from the edge
    const valueRight = (compact || options.valueWidth !== undefined ? COMPACT_VALUE_RIGHT : ROW_RIGHT) + shift;
    const valueWidth = options.valueWidth ?? (compact ? COMPACT_VALUE_WIDTH : undefined);
    const textButtonWidth = options.valueWidth ?? (compact ? 110 : 240);
    const shutterCell = narrow ? NARROW_SHUTTER_CELL : 51.5 * scale;
    const sliderWidth = narrow ? NARROW_SLIDER_WIDTH : Math.round(94 * scale);
    let controlRight: number;
    let width: number;
    let gap = NAME_GAP;
    if (hasToggle(type)) {
        controlRight = ROW_RIGHT + 6 + shift;
        width = toggleWidth;
    } else {
        switch (type) {
            case 'shutter':
            case 'shutter2':
                controlRight = (narrow ? HMI_RIGHT_MARGIN : ROW_RIGHT - 2) + shift;
                width = 3 * shutterCell;
                // the icons sit in the middle of their tap areas, that is gap enough
                gap = 0;
                break;
            case 'number':
                controlRight = valueRight;
                width = sliderWidth + 8 + SLIDER_VALUE_WIDTH;
                break;
            case 'button':
            case 'input_sel':
            case 'timer':
                controlRight = valueRight;
                width = textButtonWidth;
                break;
            case 'text':
                controlRight = valueRight;
                width = valueWidth ?? 240;
                break;
            default:
                controlRight = valueRight;
                width = 0;
                gap = 0;
                break;
        }
    }
    return {
        nameRight: controlRight + width + gap,
        controlRight,
        toggleWidth,
        shutterCell,
        sliderWidth,
        valueWidth,
        textButtonWidth,
    };
}

interface EntityControl {
    node: React.JSX.Element;
    /** how far the centre of the control sits above the middle of the row */
    lift: number;
}

export interface EntityRowProps {
    entity: Entity6;
    /** height of the row in stage pixels */
    height: number;
    /** smaller icons and fonts (cardSchedule with 6 rows) */
    compact?: boolean;
    /**
     * width of the value column of a text entity, right-aligned `COMPACT_VALUE_RIGHT` from the
     * right edge, the name gets the rest (web models); `undefined` = the column of the HMI
     */
    valueWidth?: number;
    /** the name ends at the left edge of the control (us-p, web models), see `rowGeometry` */
    fit?: boolean;
    /** empty strip at the right of the stage, 33 px on the hardware (default), 0 on the web models */
    margin?: number;
    press: (id: string, action: string, value?: string | number) => void;
    openPopup: (popup: string, id: string, title?: string, icon?: string, iconColor?: number) => void;
}

/**
 * One row of cardEntities / cardSchedule: icon, name and the control of the entity type.
 *
 * Touch events (see HMI/Readme.md "cardEntities Page" and `PageItem.onCommand`):
 * - light, light2, switch, fan: toggle -> `OnOff,1|0`; icon of light/light2/fan -> `pageOpenDetail`
 * - shutter, shutter2: buttons -> `up` / `stop` / `down`; icon -> `pageOpenDetail,popupShutter[2]`
 * - number: slider -> `number-set,<value>`; icon -> `button` (flips `switch1` in the adapter)
 * - button: button -> `button`
 * - input_sel: text -> `pageOpenDetail,popupInSel`; timer: text -> `pageOpenDetail,popupTimer`
 * - text: nothing
 *
 * No long press: on the HMI (v5.1.1 / v6.0.2) only the items of cardGrid / cardGrid2 / cardGrid3 send
 * `event,buttonPress3,<id>,button`. The rows of cardEntities / cardSchedule have no long press timer, they send
 * `buttonPress2` already on touch-down (`codesdown`, `codesup-0`), so holding a row is the same as tapping it.
 */
export class EntityRow extends React.Component<EntityRowProps> {
    private openPopup(): void {
        const { entity, openPopup } = this.props;
        const popup = popupForType(entity.type);
        if (popup) {
            openPopup(popup, entity.id, entity.displayName, entity.icon, entity.iconColor);
        }
    }

    private readonly onIconPress = (): void => {
        const { entity, press } = this.props;
        switch (entity.type) {
            case 'light':
            case 'light2':
            case 'fan':
            case 'shutter':
            case 'shutter2':
                this.openPopup();
                break;
            case 'number':
            case 'button':
            case 'switch':
                press(entity.id, 'button');
                break;
            default:
                break;
        }
    };

    /**
     * The control at the right of the row; `lift` is how far its centre sits above the middle
     * of the row (measured on the HMI), the sizes come from {@link rowGeometry}.
     */
    private renderControl(fontSize: number, geometry: RowGeometry): EntityControl | null {
        const { entity, press, compact } = this.props;
        if (hasToggle(entity.type)) {
            return {
                lift: 0,
                node: (
                    <Toggle
                        on={isOn(entity.optionalValue)}
                        width={geometry.toggleWidth}
                        onChange={(on): void => press(entity.id, 'OnOff', on ? 1 : 0)}
                    />
                ),
            };
        }
        switch (entity.type) {
            case 'shutter':
            case 'shutter2':
                return {
                    lift: 3,
                    node: (
                        <ShutterButtons
                            options={parseShutterOptions(entity.optionalValue)}
                            size={Math.round(29 * (compact ? 26 / 29 : 1))}
                            cell={geometry.shutterCell}
                            onAction={(action): void => press(entity.id, action)}
                        />
                    ),
                };
            case 'number':
                return {
                    lift: 5,
                    node: (
                        <NumberSlider
                            options={parseNumberOptions(entity.optionalValue)}
                            width={geometry.sliderWidth}
                            fontSize={fontSize}
                            onChange={(value): void => press(entity.id, 'number-set', value)}
                        />
                    ),
                };
            case 'button':
                return {
                    lift: 2,
                    node: (
                        <TextButton
                            text={entity.optionalValue}
                            color={theme.accent}
                            fontSize={fontSize}
                            maxWidth={geometry.textButtonWidth}
                            onPress={(): void => press(entity.id, 'button')}
                        />
                    ),
                };
            case 'input_sel':
            case 'timer':
                return {
                    lift: 3,
                    node: (
                        <TextButton
                            text={entity.optionalValue}
                            color={entity.type === 'input_sel' ? theme.accent : theme.foreground}
                            fontSize={fontSize}
                            maxWidth={geometry.textButtonWidth}
                            onPress={(): void => this.openPopup()}
                        />
                    ),
                };
            case 'text': {
                return {
                    lift: compact ? 2 : 3,
                    node: (
                        <div
                            data-role="value"
                            style={{
                                width: geometry.valueWidth,
                                maxWidth: geometry.valueWidth === undefined ? 240 : undefined,
                                display: 'flex',
                                // a value wider than the box starts at its left edge and is cut at the right
                                justifyContent: 'safe flex-end',
                                fontSize: compact ? 17 : fontSize,
                                // tall enough for the descenders (only the width cuts); the box is centred
                                // in the row, the extra height is split above and below the line, so the
                                // baseline stays where it was with `lineHeight: 1`
                                lineHeight: `${valueLineHeight(compact ? 17 : fontSize)}px`,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                flex: '0 0 auto',
                            }}
                        >
                            {/* a value wider than the column ends with an ellipsis instead of a cut letter */}
                            <span
                                style={{ flex: '0 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                                {entity.optionalValue}
                            </span>
                        </div>
                    ),
                };
            }
            default:
                return null;
        }
    }

    render(): React.JSX.Element {
        const { entity, height, compact } = this.props;
        if (isEmptySlot(entity)) {
            return (
                <div
                    data-row=""
                    style={{ height }}
                />
            );
        }
        const scale = compact ? 26 / 29 : 1;
        const fontSize = 18;
        const iconCenter = compact ? COMPACT_ICON_CENTER : ROW_ICON_CENTER;
        const nameLeft = compact ? COMPACT_NAME_LEFT : ROW_NAME_LEFT;
        const color = color565ToCss(entity.iconColor);
        const pressableIcon = ['light', 'light2', 'fan', 'shutter', 'shutter2', 'number', 'button', 'switch'].includes(
            entity.type,
        );
        const geometry = rowGeometry(entity.type, {
            compact: compact === true,
            fit: this.props.fit === true,
            valueWidth: this.props.valueWidth,
            margin: this.props.margin ?? HMI_RIGHT_MARGIN,
        });
        const control = this.renderControl(fontSize, geometry);
        const iconBox = Math.round(44 * scale);
        return (
            <div
                data-row=""
                data-type={entity.type}
                data-id={entity.id}
                style={{ height, position: 'relative' }}
            >
                <EntityIcon
                    icon={entity.icon}
                    color={color}
                    font={1}
                    scale={scale}
                    onPress={pressableIcon ? this.onIconPress : undefined}
                    style={{
                        position: 'absolute',
                        left: iconCenter - iconBox / 2,
                        top: 0,
                        width: iconBox,
                        height,
                    }}
                />
                <div
                    data-role="name"
                    style={{
                        position: 'absolute',
                        left: nameLeft,
                        right: geometry.nameRight,
                        top: 0,
                        height,
                        // the cap centre of the name sits 2 px above the middle of the row
                        paddingBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize,
                        lineHeight: 1,
                        color: theme.foreground,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}
                >
                    {/* the line box of the value: descenders (g, p, y) are not cut by `overflow` */}
                    <span
                        style={{
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: `${valueLineHeight(fontSize)}px`,
                        }}
                    >
                        {entity.displayName}
                    </span>
                </div>
                {control ? (
                    <div
                        data-role="control"
                        style={{
                            position: 'absolute',
                            right: geometry.controlRight,
                            top: 0,
                            height,
                            paddingBottom: 2 * control.lift,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                        }}
                    >
                        {control.node}
                    </div>
                ) : null}
            </div>
        );
    }
}
