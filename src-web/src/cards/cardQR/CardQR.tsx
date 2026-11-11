import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import type { Entity6 } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { qrLayout, type QRLayout } from './layout';
import { isQREntityVisible, type CardQRModel } from './parse';
import { qrModules, qrPath } from './qr';

/** width of the switch icon (and its touch area) */
const SWITCH_WIDTH = 56;
/** light modules around the code inside the white box */
const QUIET_ZONE = 2;

/**
 * The QR card: the code on the left, up to two text rows (or a switch) on the right; on the
 * portrait models the code on top and the rows below it (see `layout.ts`)
 */
export class CardQR extends React.Component<CardProps<CardQRModel>> {
    private renderCode(layout: QRLayout): React.JSX.Element {
        const qr = qrModules(this.props.model.text);
        const size = layout.codeSize;
        const box: React.CSSProperties = {
            position: 'absolute',
            left: layout.code.left,
            top: layout.code.top,
            width: size,
            height: size,
            background: qr ? '#ffffff' : 'transparent',
        };
        if (!qr) {
            return (
                <div
                    data-qr-code=""
                    style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Icon
                        name="qrcode-scan"
                        size={96}
                        color={theme.muted}
                    />
                </div>
            );
        }
        const units = qr.size + 2 * QUIET_ZONE;
        return (
            <svg
                data-qr-code=""
                viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${units} ${units}`}
                width={size}
                height={size}
                shapeRendering="crispEdges"
                style={box}
            >
                <path
                    d={qrPath(qr)}
                    fill="#000000"
                />
            </svg>
        );
    }

    private renderEntity(entity: Entity6, index: number, layout: QRLayout): React.JSX.Element | null {
        const row = layout.entities[index];
        if (!isQREntityVisible(entity) || row === undefined) {
            return null;
        }
        const beside = layout.switchBesideName;
        const color = color565ToCss(entity.iconColor);
        const isSwitch = entity.type === 'switch';
        const on = entity.optionalValue === '1';
        return (
            <div
                key={index}
                data-qr-entity={index}
                style={{
                    position: 'absolute',
                    left: row.left,
                    right: row.right,
                    top: row.top,
                    height: layout.entityHeight,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        height: 40,
                        paddingRight: isSwitch && beside ? SWITCH_WIDTH + 8 : undefined,
                    }}
                >
                    <Icon
                        glyph={entity.icon}
                        size={36}
                        color={color}
                    />
                    <div
                        style={{
                            fontSize: 22,
                            color: theme.foreground,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {entity.displayName}
                    </div>
                </div>
                {isSwitch ? (
                    <div
                        data-pressable=""
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: beside ? -4 : 44,
                            width: SWITCH_WIDTH,
                            height: 48,
                        }}
                        onClick={(): void => this.props.press(entity.id, 'OnOff', on ? 0 : 1)}
                    >
                        <Icon
                            name={on ? 'toggle-switch' : 'toggle-switch-off-outline'}
                            size={56}
                            color={on ? theme.accent : theme.muted}
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            marginTop: 2,
                            paddingLeft: 56,
                            fontSize: 21,
                            lineHeight: '40px',
                            color: theme.foreground,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {entity.optionalValue}
                    </div>
                )}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, global, press } = this.props;
        const layout = qrLayout(global.model);
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, color: theme.foreground }}
            >
                <TitleBar
                    title={model.title}
                    navigation={model.navigation}
                    press={press}
                    model={global.model}
                />
                {this.renderCode(layout)}
                {model.entities.map((entity, i) => this.renderEntity(entity, i, layout))}
            </div>
        );
    }
}
