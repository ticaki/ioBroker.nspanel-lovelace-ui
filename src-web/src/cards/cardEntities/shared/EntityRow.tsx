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

interface EntityControl {
    node: React.JSX.Element;
    /** right edge relative to the text edge (`ROW_RIGHT`), positive = further right */
    offset: number;
    /** how far the centre of the control sits above the middle of the row */
    lift: number;
}

export interface EntityRowProps {
    entity: Entity6;
    /** height of the row in stage pixels */
    height: number;
    /** smaller icons and fonts (cardSchedule with 6 rows) */
    compact?: boolean;
    send: (event: string) => void;
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
 * - button: button -> `button`, long press -> `event,buttonPress3,<id>,button`
 * - input_sel: text -> `pageOpenDetail,popupInSel`; timer: text -> `pageOpenDetail,popupTimer`
 * - text: nothing
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

    private readonly onLongPress = (): void => {
        const { entity, send } = this.props;
        send(`event,buttonPress3,${entity.id},button`);
    };

    /**
     * The control at the right of the row. `offset` is how far its right edge sits right of the
     * text edge (x 424), `lift` how far its centre sits above the middle of the row - both
     * measured on the HMI.
     */
    private renderControl(fontSize: number, scale: number): EntityControl | null {
        const { entity, press, compact } = this.props;
        if (hasToggle(entity.type)) {
            return {
                offset: -6,
                lift: 0,
                node: (
                    <Toggle
                        on={isOn(entity.optionalValue)}
                        width={Math.round(45 * scale)}
                        onChange={(on): void => press(entity.id, 'OnOff', on ? 1 : 0)}
                    />
                ),
            };
        }
        switch (entity.type) {
            case 'shutter':
            case 'shutter2':
                return {
                    offset: 2,
                    lift: 3,
                    node: (
                        <ShutterButtons
                            options={parseShutterOptions(entity.optionalValue)}
                            size={Math.round(29 * scale)}
                            cell={51.5 * scale}
                            onAction={(action): void => press(entity.id, action)}
                        />
                    ),
                };
            case 'number':
                return {
                    offset: 0,
                    lift: 5,
                    node: (
                        <NumberSlider
                            options={parseNumberOptions(entity.optionalValue)}
                            width={Math.round(94 * scale)}
                            fontSize={fontSize}
                            onChange={(value): void => press(entity.id, 'number-set', value)}
                        />
                    ),
                };
            case 'button':
                return {
                    offset: 0,
                    lift: 2,
                    node: (
                        <TextButton
                            text={entity.optionalValue}
                            color={theme.accent}
                            fontSize={fontSize}
                            onPress={(): void => press(entity.id, 'button')}
                            onLongPress={this.onLongPress}
                        />
                    ),
                };
            case 'input_sel':
            case 'timer':
                return {
                    offset: 0,
                    lift: 3,
                    node: (
                        <TextButton
                            text={entity.optionalValue}
                            color={entity.type === 'input_sel' ? theme.accent : theme.foreground}
                            fontSize={fontSize}
                            onPress={(): void => this.openPopup()}
                        />
                    ),
                };
            case 'text':
                return {
                    offset: compact ? ROW_RIGHT - COMPACT_VALUE_RIGHT : 0,
                    lift: compact ? 2 : 3,
                    node: (
                        <div
                            data-role="value"
                            style={{
                                width: compact ? COMPACT_VALUE_WIDTH : undefined,
                                maxWidth: compact ? undefined : 240,
                                display: 'flex',
                                // a value wider than the box starts at its left edge and is cut at the right
                                justifyContent: 'safe flex-end',
                                fontSize: compact ? 17 : fontSize,
                                lineHeight: 1,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                flex: '0 0 auto',
                            }}
                        >
                            <span style={{ flex: '0 0 auto' }}>{entity.optionalValue}</span>
                        </div>
                    ),
                };
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
        const control = this.renderControl(fontSize, scale);
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
                        right: compact ? COMPACT_VALUE_RIGHT + COMPACT_VALUE_WIDTH + 8 : ROW_RIGHT + 150,
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
                    {entity.displayName}
                </div>
                {control ? (
                    <div
                        data-role="control"
                        style={{
                            position: 'absolute',
                            right: ROW_RIGHT - control.offset,
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
