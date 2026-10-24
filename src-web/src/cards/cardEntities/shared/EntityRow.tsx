import React from 'react';
import { color565ToCss } from '../../../protocol/color';
import type { Entity6 } from '../../../protocol/types';
import { theme } from '../../../style/theme';
import { hasToggle, isOn, parseNumberOptions, parseShutterOptions, popupForType } from './entityTypes';
import { isEmptySlot } from './menuParse';
import { EntityIcon, NumberSlider, ShutterButtons, TextButton, Toggle } from './widgets';

export interface EntityRowProps {
    entity: Entity6;
    /** height of the row in stage pixels */
    height: number;
    /** smaller icons and fonts (cardSchedule with 6 rows) */
    compact?: boolean;
    send: (event: string) => void;
    press: (id: string, action: string, value?: string | number) => void;
    openPopup: (popup: string, id: string, title?: string, icon?: string) => void;
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
            openPopup(popup, entity.id, entity.displayName, entity.icon);
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

    private renderControl(): React.JSX.Element | null {
        const { entity, press, compact } = this.props;
        const fontSize = compact ? 18 : 20;
        if (hasToggle(entity.type)) {
            return (
                <Toggle
                    on={isOn(entity.optionalValue)}
                    width={compact ? 44 : 52}
                    onChange={(on): void => press(entity.id, 'OnOff', on ? 1 : 0)}
                />
            );
        }
        switch (entity.type) {
            case 'shutter':
            case 'shutter2':
                return (
                    <ShutterButtons
                        options={parseShutterOptions(entity.optionalValue)}
                        size={compact ? 24 : 30}
                        onAction={(action): void => press(entity.id, action)}
                    />
                );
            case 'number':
                return (
                    <NumberSlider
                        options={parseNumberOptions(entity.optionalValue)}
                        width={compact ? 150 : 190}
                        onChange={(value): void => press(entity.id, 'number-set', value)}
                    />
                );
            case 'button':
                return (
                    <TextButton
                        text={entity.optionalValue}
                        framed
                        fontSize={fontSize}
                        onPress={(): void => press(entity.id, 'button')}
                        onLongPress={this.onLongPress}
                    />
                );
            case 'input_sel':
            case 'timer':
                return (
                    <TextButton
                        text={entity.optionalValue}
                        fontSize={fontSize}
                        onPress={(): void => this.openPopup()}
                    />
                );
            case 'text':
                return (
                    <span
                        data-role="value"
                        style={{
                            fontSize,
                            maxWidth: 220,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: '0 0 auto',
                        }}
                    >
                        {entity.optionalValue}
                    </span>
                );
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
        const iconSize = compact ? 26 : 34;
        const color = color565ToCss(entity.iconColor);
        const pressableIcon = ['light', 'light2', 'fan', 'shutter', 'shutter2', 'number', 'button', 'switch'].includes(
            entity.type,
        );
        return (
            <div
                data-row=""
                data-type={entity.type}
                data-id={entity.id}
                style={{
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 24,
                    paddingRight: 26,
                    gap: 16,
                }}
            >
                <EntityIcon
                    icon={entity.icon}
                    color={color}
                    size={iconSize}
                    textSize={compact ? 18 : 22}
                    onPress={pressableIcon ? this.onIconPress : undefined}
                    style={{ minWidth: iconSize + 8, height: iconSize + 8, flex: '0 0 auto' }}
                />
                <div
                    data-role="name"
                    style={{
                        flex: '1 1 auto',
                        fontSize: compact ? 18 : 20,
                        color: theme.foreground,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {entity.displayName}
                </div>
                {this.renderControl()}
            </div>
        );
    }
}
