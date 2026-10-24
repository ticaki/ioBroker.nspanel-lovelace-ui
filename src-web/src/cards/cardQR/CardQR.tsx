import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import type { Entity6 } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { isQREntityVisible, type CardQRModel } from './parse';
import { qrModules, qrPath } from './qr';

/** side of the white QR box in stage pixels */
const QR_BOX = 200;
/** light modules around the code inside the white box */
const QUIET_ZONE = 2;

/** The QR card: the code on the left, up to two text rows (or a switch) on the right */
export class CardQR extends React.Component<CardProps<CardQRModel>> {
    private renderCode(): React.JSX.Element {
        const qr = qrModules(this.props.model.text);
        const box: React.CSSProperties = {
            position: 'absolute',
            left: 12,
            top: 88,
            width: QR_BOX,
            height: QR_BOX,
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
                width={QR_BOX}
                height={QR_BOX}
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

    private renderEntity(entity: Entity6, index: number): React.JSX.Element | null {
        if (!isQREntityVisible(entity)) {
            return null;
        }
        const top = 96 + index * 100;
        const color = color565ToCss(entity.iconColor);
        const isSwitch = entity.type === 'switch';
        const on = entity.optionalValue === '1';
        return (
            <div
                key={index}
                data-qr-entity={index}
                style={{ position: 'absolute', left: 230, right: 8, top, height: 96 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 40 }}>
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
                        style={{ position: 'absolute', right: 8, top: 44, width: 56, height: 48 }}
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
        const { model, ctx, press } = this.props;
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, color: theme.foreground }}
            >
                <TitleBar
                    title={model.title}
                    navigation={model.navigation}
                    press={press}
                />
                {this.renderCode()}
                {model.entities.map((entity, i) => this.renderEntity(entity, i))}
            </div>
        );
    }
}
