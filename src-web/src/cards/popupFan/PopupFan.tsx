import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupHeaderIconColor, popupTitle } from '../popupSlider/fields';
import { PopupHeader, POPUP_FONT_SIZE, TAP_SIZE } from '../popupSlider/PopupHeader';
import { Slider } from '../popupSlider/Slider';
import { Toggle } from '../popupSlider/Toggle';
import type { PopupFanModel } from './parse';

interface PopupFanState {
    /** page of the mode buttons (6 per page) */
    page: number;
}

/** geometry of the HMI (stage pixels) */
const TOGGLE_POS = { left: 373, top: 92 };
const SPEED_LABEL = { left: 43, centerY: 120 };
const SLIDER = { left: 50, length: 320, centerY: 160 };
/** the mode buttons use the 3 x n grid of the HMI (columns of 124 px from x 8, rows of 63 px) */
const MODE_COLUMNS = 3;
const MODE_COLUMN_LEFT = 8;
const MODE_COLUMN_WIDTH = 124;
const MODE_ROW_CENTER_Y = 238;
const MODE_ROW_PITCH = 63;
const MODE_ROWS = 2;
const MODES_PER_PAGE = MODE_COLUMNS * MODE_ROWS;
const NEXT_CENTER = { x: 440, y: MODE_ROW_CENTER_Y };
/** RGB565 of the selected mode on the HMI (`bMode.pco=1374`) */
const SELECTED_COLOR = color565ToCss(1374);

/** The adapter formats list texts with `\r\n` as line break (`formatInSelText` appends one) */
function modeText(text: string): string {
    return text
        .replace(/\\r\\n/g, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\n+$/, '');
}

/**
 * `popupFan`: switch at the right, speed slider (`number-set,<0..max>`) with its label
 * and the modes as text buttons in the 3 column grid of the HMI (`mode-preset_modes,<index>`);
 * more than six modes are paged with the arrow at the right.
 */
export class PopupFan extends React.Component<CardProps<PopupFanModel>, PopupFanState> {
    constructor(props: CardProps<PopupFanModel>) {
        super(props);
        this.state = { page: 0 };
    }

    componentDidUpdate(prevProps: CardProps<PopupFanModel>): void {
        const { modes } = this.props.model;
        if (modes.length !== prevProps.model.modes.length) {
            const pages = Math.max(1, Math.ceil(modes.length / MODES_PER_PAGE));
            if (this.state.page >= pages) {
                this.setState({ page: 0 });
            }
        }
    }

    private get id(): string {
        return popupEntityId(this.props.ctx, this.props.model.entityName);
    }

    private selectMode(index: number): void {
        this.props.press(this.id, 'mode-preset_modes', index);
    }

    private renderModes(): React.JSX.Element[] {
        const { modes, mode } = this.props.model;
        const pages = Math.max(1, Math.ceil(modes.length / MODES_PER_PAGE));
        const page = Math.min(this.state.page, pages - 1);
        const start = page * MODES_PER_PAGE;
        const elements = modes.slice(start, start + MODES_PER_PAGE).map((m, slot) => {
            const index = start + slot;
            const active = m === mode;
            const col = slot % MODE_COLUMNS;
            const row = Math.floor(slot / MODE_COLUMNS);
            return (
                <div
                    key={index}
                    data-mode={index}
                    data-active={active ? '1' : '0'}
                    onClick={(): void => this.selectMode(index)}
                    style={{
                        position: 'absolute',
                        left: MODE_COLUMN_LEFT + col * MODE_COLUMN_WIDTH,
                        width: MODE_COLUMN_WIDTH,
                        top: MODE_ROW_CENTER_Y + row * MODE_ROW_PITCH - MODE_ROW_PITCH / 2,
                        height: MODE_ROW_PITCH,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontSize: POPUP_FONT_SIZE,
                        lineHeight: '22px',
                        whiteSpace: 'pre-line',
                        overflow: 'hidden',
                        color: active ? SELECTED_COLOR : theme.foreground,
                        cursor: 'pointer',
                        padding: '0 4px',
                        boxSizing: 'border-box',
                    }}
                >
                    {modeText(m)}
                </div>
            );
        });
        if (pages > 1) {
            elements.push(
                <div
                    key="next"
                    data-next=""
                    title={`${page + 1}/${pages}`}
                    onClick={(): void => this.setState({ page: (page + 1) % pages })}
                    style={{
                        position: 'absolute',
                        left: NEXT_CENTER.x - TAP_SIZE / 2,
                        top: NEXT_CENTER.y - TAP_SIZE / 2,
                        width: TAP_SIZE,
                        height: TAP_SIZE,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <Icon
                        name="chevron-right"
                        size={36}
                        color={theme.foreground}
                    />
                </div>,
            );
        }
        return elements;
    }

    render(): React.JSX.Element {
        const { model, ctx, press } = this.props;
        const id = this.id;
        // the payload colour wins (the adapter sends the on/off colour of the entity); `disable`
        // or no payload yet: the colour of the tapped entity, then the foreground
        const iconColor = popupHeaderIconColor(ctx, model.iconColor);
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, color: theme.foreground }}
            >
                <PopupHeader
                    title={popupTitle(ctx, model.entityName)}
                    icon={model.icon || ctx.pageArgs[2] || ''}
                    iconColor={iconColor}
                    onClose={(): void => press(id, 'bExit')}
                />
                {model.power !== undefined ? (
                    <div style={{ position: 'absolute', left: TOGGLE_POS.left, top: TOGGLE_POS.top }}>
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
                                left: SPEED_LABEL.left,
                                top: SPEED_LABEL.centerY - 12,
                                width: TOGGLE_POS.left - SPEED_LABEL.left - 8,
                                height: 24,
                                lineHeight: '24px',
                                fontSize: POPUP_FONT_SIZE,
                                color: theme.foreground,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {model.speedLabel}
                        </div>
                        <div style={{ position: 'absolute', left: SLIDER.left, top: SLIDER.centerY - 11 }}>
                            <Slider
                                name="speed"
                                value={model.speed}
                                min={0}
                                max={model.speedMax > 0 ? model.speedMax : 100}
                                length={SLIDER.length}
                                onCommit={(v): void => press(id, 'number-set', v)}
                            />
                        </div>
                    </>
                ) : null}
                {this.renderModes()}
            </div>
        );
    }
}
