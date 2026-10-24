import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupTitle } from '../popupSlider/fields';
import { PopupHeader, POPUP_HEADER_HEIGHT } from '../popupSlider/PopupHeader';
import { Slider } from '../popupSlider/Slider';
import { Toggle } from '../popupSlider/Toggle';
import type { PopupFanModel } from './parse';

interface PopupFanState {
    /** the mode list is open */
    listOpen: boolean;
}

const LEFT = 20;
const SLIDER_LENGTH = 380;

/** The adapter formats list texts with `\r\n` as line break */
function modeText(text: string): string {
    return text.replace(/\r\n/g, '\n');
}

/**
 * `popupFan`: switch, speed slider (`number-set,<0..max>`) and the mode selection
 * (`mode-preset_modes,<index>`); the list of modes opens over the content like the
 * dropdown of the HMI.
 */
export class PopupFan extends React.Component<CardProps<PopupFanModel>, PopupFanState> {
    constructor(props: CardProps<PopupFanModel>) {
        super(props);
        this.state = { listOpen: false };
    }

    private get id(): string {
        return popupEntityId(this.props.ctx, this.props.model.entityName);
    }

    private selectMode(index: number): void {
        this.setState({ listOpen: false });
        this.props.press(this.id, 'mode-preset_modes', index);
    }

    private renderList(): React.JSX.Element {
        const { modes, mode } = this.props.model;
        const columns = modes.length > 6 ? 3 : 2;
        return (
            <div
                data-modelist=""
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: POPUP_HEADER_HEIGHT,
                    bottom: 0,
                    background: theme.background,
                    overflowY: 'auto',
                    padding: `4px ${LEFT}px`,
                    boxSizing: 'border-box',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: 8,
                    alignContent: 'start',
                }}
            >
                {modes.map((m, i) => {
                    const active = m === mode;
                    return (
                        <div
                            key={i}
                            data-mode={i}
                            data-active={active ? '1' : '0'}
                            onClick={(): void => this.selectMode(i)}
                            style={{
                                minHeight: 44,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                fontSize: 17,
                                lineHeight: '20px',
                                whiteSpace: 'pre-line',
                                color: active ? theme.accent : theme.foreground,
                                border: `1px solid ${active ? theme.accent : '#555'}`,
                                borderRadius: 6,
                                cursor: 'pointer',
                                padding: '2px 6px',
                                boxSizing: 'border-box',
                            }}
                        >
                            {modeText(m)}
                        </div>
                    );
                })}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, press } = this.props;
        const id = this.id;
        const iconColor = model.iconColor !== undefined ? color565ToCss(model.iconColor) : theme.foreground;
        const rowTop = POPUP_HEADER_HEIGHT + 10;
        const speedTop = rowTop + 44;
        const modeTop = model.speed !== undefined ? speedTop + 76 : speedTop;
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, color: theme.foreground }}
            >
                <PopupHeader
                    title={popupTitle(ctx, model.entityName)}
                    icon={model.icon}
                    iconColor={iconColor}
                    onClose={(): void => press(id, 'bExit')}
                />
                {model.power !== undefined ? (
                    <div style={{ position: 'absolute', right: LEFT, top: rowTop }}>
                        <Toggle
                            name="power"
                            on={model.power}
                            onToggle={(on): void => press(id, 'OnOff', on ? 1 : 0)}
                        />
                    </div>
                ) : null}
                {model.speed !== undefined ? (
                    <>
                        <div
                            style={{
                                position: 'absolute',
                                left: LEFT,
                                top: speedTop,
                                fontSize: 18,
                                lineHeight: '24px',
                                color: theme.foreground,
                            }}
                        >
                            {model.speedLabel}
                        </div>
                        <div
                            style={{
                                position: 'absolute',
                                left: LEFT,
                                top: speedTop + 28,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}
                        >
                            <Icon
                                name="fan"
                                size={28}
                                color={theme.foreground}
                            />
                            <Slider
                                name="speed"
                                value={model.speed}
                                min={0}
                                max={model.speedMax > 0 ? model.speedMax : 100}
                                length={SLIDER_LENGTH - 60}
                                onCommit={(v): void => press(id, 'number-set', v)}
                            />
                            <div
                                data-speed=""
                                style={{ width: 48, textAlign: 'right', fontSize: 20, color: theme.foreground }}
                            >
                                {model.speed}
                            </div>
                        </div>
                    </>
                ) : null}
                {model.modes.length > 0 ? (
                    <div
                        data-modebutton=""
                        onClick={(): void => this.setState({ listOpen: true })}
                        style={{
                            position: 'absolute',
                            left: LEFT,
                            right: LEFT,
                            top: modeTop,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxSizing: 'border-box',
                            padding: '0 12px 0 16px',
                            border: '1px solid #555',
                            borderRadius: 6,
                            cursor: 'pointer',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 18,
                                color: theme.foreground,
                                whiteSpace: 'pre-line',
                                lineHeight: '20px',
                            }}
                        >
                            {modeText(model.mode)}
                        </span>
                        <Icon
                            name="menu-down"
                            size={28}
                            color={theme.foreground}
                        />
                    </div>
                ) : null}
                {this.state.listOpen ? this.renderList() : null}
            </div>
        );
    }
}
