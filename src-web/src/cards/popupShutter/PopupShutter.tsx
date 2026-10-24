import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupTitle } from '../popupSlider/fields';
import { PopupHeader, POPUP_HEADER_HEIGHT } from '../popupSlider/PopupHeader';
import { Slider } from '../popupSlider/Slider';
import type { ButtonTriple, PopupShutterModel } from './parse';

const LEFT = 20;
const STAGE_WIDTH = 480;

interface IconButtonProps {
    glyph: string;
    enabled: boolean;
    size: number;
    color?: string;
    action: string;
    onPress: (action: string) => void;
}

/** A square icon button; disabled buttons are grey and ignore taps */
class IconButton extends React.Component<IconButtonProps> {
    render(): React.JSX.Element {
        const { glyph, enabled, size, action, onPress } = this.props;
        const color = enabled ? (this.props.color ?? theme.foreground) : theme.muted;
        return (
            <div
                data-button={action}
                data-enabled={enabled ? '1' : '0'}
                onClick={enabled ? (): void => onPress(action) : undefined}
                style={{
                    width: size + 16,
                    height: size + 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: enabled ? 'pointer' : 'default',
                    flex: '0 0 auto',
                }}
            >
                {glyph ? (
                    <Icon
                        glyph={glyph}
                        size={size}
                        color={color}
                    />
                ) : null}
            </div>
        );
    }
}

/**
 * `popupShutter`: state text, up/stop/down buttons and the position slider, plus the same
 * row for the tilt (`tiltOpen`/`tiltStop`/`tiltClose`, `tiltSlider`) when the entity has one.
 * `popupShutter2`: window graphic with a vertical position slider (0 = open at the top,
 * 100 = closed), up/stop/down and up to three extra buttons (`button1Press`..`button3Press`).
 */
export class PopupShutter extends React.Component<CardProps<PopupShutterModel>> {
    private get id(): string {
        return popupEntityId(this.props.ctx, this.props.model.entityName);
    }

    private readonly onPress = (action: string): void => {
        this.props.press(this.id, action);
    };

    private renderTriple(
        triple: ButtonTriple,
        actions: [string, string, string],
        size: number,
        vertical = false,
    ): React.JSX.Element {
        return (
            <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center' }}>
                {triple.icons.map((glyph, i) => (
                    <IconButton
                        key={actions[i]}
                        glyph={glyph}
                        enabled={triple.enabled[i]}
                        size={size}
                        action={actions[i]}
                        onPress={this.onPress}
                    />
                ))}
            </div>
        );
    }

    /** one block of `popupShutter`: text + three buttons, label, slider */
    private renderBlock(
        top: number,
        text: string,
        triple: ButtonTriple,
        actions: [string, string, string],
        label: string,
        value: number | undefined,
        sliderAction: string,
    ): React.JSX.Element {
        const id = this.id;
        return (
            <div
                key={sliderAction}
                data-block={sliderAction}
                style={{ position: 'absolute', left: LEFT, right: LEFT, top }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
                    <div
                        style={{
                            fontSize: 18,
                            color: theme.foreground,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {text}
                    </div>
                    {this.renderTriple(triple, actions, 32)}
                </div>
                {value !== undefined ? (
                    <>
                        <div style={{ fontSize: 18, lineHeight: '24px', color: theme.foreground, marginTop: 2 }}>
                            {label}
                        </div>
                        <div style={{ marginTop: 2 }}>
                            <Slider
                                name={sliderAction}
                                value={value}
                                min={0}
                                max={100}
                                length={STAGE_WIDTH - 2 * LEFT}
                                onCommit={(v): void => this.props.press(id, sliderAction, v)}
                            />
                        </div>
                    </>
                ) : null}
            </div>
        );
    }

    private renderShutter(): React.JSX.Element[] {
        const { model } = this.props;
        const blocks: React.JSX.Element[] = [];
        const hasTilt = model.tilt !== undefined || model.tiltButtons.icons.some(i => i !== '');
        const top1 = POPUP_HEADER_HEIGHT + 4;
        blocks.push(
            this.renderBlock(
                top1,
                model.text,
                model.buttons,
                ['up', 'stop', 'down'],
                model.positionLabel,
                model.position,
                'positionSlider',
            ),
        );
        if (hasTilt) {
            blocks.push(
                this.renderBlock(
                    top1 + (model.position !== undefined ? 124 : 56),
                    model.tiltLabel,
                    model.tiltButtons,
                    ['tiltOpen', 'tiltStop', 'tiltClose'],
                    '',
                    model.tilt,
                    'tiltSlider',
                ),
            );
        }
        return blocks;
    }

    private renderShutter2(): React.JSX.Element {
        const { model } = this.props;
        const id = this.id;
        const closed = Math.max(0, Math.min(100, model.position ?? 0));
        const graphicTop = POPUP_HEADER_HEIGHT + 14;
        const graphicHeight = 190;
        const graphicWidth = 130;
        return (
            <>
                <div
                    data-window=""
                    style={{
                        position: 'absolute',
                        left: 40,
                        top: graphicTop,
                        width: graphicWidth,
                        height: graphicHeight,
                        boxSizing: 'border-box',
                        border: `3px solid ${theme.foreground}`,
                        borderRadius: 4,
                        background: 'linear-gradient(180deg, #2b4a6f 0%, #4b7fb8 100%)',
                        overflow: 'hidden',
                    }}
                >
                    {/* window cross */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: 0,
                            bottom: 0,
                            width: 3,
                            marginLeft: -1.5,
                            background: theme.foreground,
                            opacity: 0.7,
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            right: 0,
                            height: 3,
                            marginTop: -1.5,
                            background: theme.foreground,
                            opacity: 0.7,
                        }}
                    />
                    {/* the shutter covers the window from the top */}
                    <div
                        data-shutter={closed}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            height: `${closed}%`,
                            background:
                                'repeating-linear-gradient(180deg, #9a9a9a 0px, #9a9a9a 8px, #6a6a6a 8px, #6a6a6a 12px)',
                            borderBottom: closed > 0 ? '2px solid #3a3a3a' : undefined,
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
                <div
                    style={{
                        position: 'absolute',
                        left: 40,
                        width: graphicWidth,
                        top: graphicTop + graphicHeight + 6,
                        fontSize: 16,
                        color: theme.foreground,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {model.text}
                </div>
                {model.position !== undefined ? (
                    <div style={{ position: 'absolute', left: 190, top: graphicTop - 6 }}>
                        <Slider
                            name="positionSlider"
                            orientation="vertical"
                            reverse
                            value={model.position}
                            min={0}
                            max={100}
                            length={graphicHeight + 12}
                            onCommit={(v): void => this.props.press(id, 'positionSlider', v)}
                        />
                    </div>
                ) : null}
                <div
                    style={{
                        position: 'absolute',
                        left: 190,
                        width: 40,
                        top: graphicTop + graphicHeight + 6,
                        fontSize: 16,
                        color: theme.foreground,
                        textAlign: 'center',
                    }}
                >
                    {model.position !== undefined ? `${model.position}%` : ''}
                </div>
                <div style={{ position: 'absolute', left: 270, top: graphicTop - 4 }}>
                    {this.renderTriple(model.buttons, ['up', 'stop', 'down'], 44, true)}
                </div>
                <div
                    style={{
                        position: 'absolute',
                        left: 370,
                        top: graphicTop - 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    {model.extra.map((b, i) => (
                        <IconButton
                            key={i}
                            glyph={b.icon}
                            enabled={b.enabled}
                            size={44}
                            color={b.color !== undefined ? color565ToCss(b.color) : undefined}
                            action={`button${i + 1}Press`}
                            onPress={this.onPress}
                        />
                    ))}
                </div>
                <div
                    style={{
                        position: 'absolute',
                        left: 250,
                        right: LEFT,
                        top: graphicTop + graphicHeight + 6,
                        fontSize: 16,
                        color: theme.foreground,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {model.positionLabel}
                </div>
            </>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx } = this.props;
        const id = this.id;
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, color: theme.foreground }}
            >
                <PopupHeader
                    title={popupTitle(ctx, model.entityName)}
                    icon={model.icon}
                    onClose={(): void => this.props.press(id, 'bExit')}
                />
                {ctx.pageType === 'popupShutter2' ? this.renderShutter2() : this.renderShutter()}
            </div>
        );
    }
}
