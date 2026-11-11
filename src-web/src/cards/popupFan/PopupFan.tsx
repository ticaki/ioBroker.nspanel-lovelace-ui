import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import type { PanelModel } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupHeaderIconColor, popupTitle } from '../popupSlider/fields';
import { closeCenter, popupFrame } from '../popupSlider/layout';
import { PopupHeader, POPUP_FONT_SIZE, TAP_SIZE } from '../popupSlider/PopupHeader';
import { Slider } from '../popupSlider/Slider';
import { Toggle } from '../popupSlider/Toggle';
import type { PopupFanModel } from './parse';

interface PopupFanState {
    /** page of the mode buttons (eu 6, other models 8 per page) */
    page: number;
}

/** geometry of popupFan in stage pixels */
export interface FanGeometry {
    toggle: { left: number; top: number };
    speedLabel: { left: number; centerY: number; right: number };
    slider: { left: number; length: number; centerY: number };
    modes: {
        columns: number;
        rows: number;
        columnLeft: number;
        columnWidth: number;
        rowCenterY: number;
        rowPitch: number;
    };
    /** centre of the page arrow */
    next: { x: number; y: number };
}

/**
 * The layout of popupFan per model. eu/us-l like the HMI: switch at 373/92, label at y 120,
 * slider from x 50 (320 px) at y 160, the modes in the 3 x 2 grid (columns of 124 px from x 8,
 * rows of 63 px centred at y 238), arrow at x 440. web-l: 4 x 2 modes, slider 480 px, arrow at
 * x 600. Portrait (us-p, web-p): switch and slider above, the modes in 2 x 4 (columns of 150 px),
 * the arrow in the header next to the X (the right edge is taken by the modes).
 *
 * @param model the panel model the popup sees
 */
export function fanGeometry(model: PanelModel): FanGeometry {
    const { width, portrait } = popupFrame(model);
    const close = closeCenter(model);
    const toggle = { left: width - 107, top: 92 };
    const speedLabel = { left: portrait ? 24 : 43, centerY: 120, right: width - toggle.left + 8 };
    const modeBase = { rowCenterY: 238, rowPitch: 63 };
    if (portrait) {
        return {
            toggle,
            speedLabel,
            slider: { left: 40, length: width - 80, centerY: 160 },
            modes: { ...modeBase, columns: 2, rows: 4, columnLeft: 10, columnWidth: 150 },
            next: { x: close.x - 50, y: close.y },
        };
    }
    return {
        toggle,
        speedLabel,
        slider: { left: 50, length: width - 160, centerY: 160 },
        // eu: 3 x 124 like the HMI; web-l: 4 x 140 up to the arrow at x 600
        modes: {
            ...modeBase,
            columns: width > 480 ? 4 : 3,
            rows: 2,
            columnLeft: 8,
            columnWidth: width > 480 ? 140 : 124,
        },
        next: { x: width - 40, y: modeBase.rowCenterY },
    };
}

/**
 * Modes per page on a model, see {@link fanGeometry}
 *
 * @param model the panel model
 */
export function fanModesPerPage(model: PanelModel): number {
    const { modes } = fanGeometry(model);
    return modes.columns * modes.rows;
}
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
 * and the modes as text buttons in the grid of the HMI (`mode-preset_modes,<index>`, eu 3 x 2,
 * web-l 4 x 2, portrait 2 x 4, see {@link fanGeometry}); more modes are paged with the arrow.
 */
export class PopupFan extends React.Component<CardProps<PopupFanModel>, PopupFanState> {
    constructor(props: CardProps<PopupFanModel>) {
        super(props);
        this.state = { page: 0 };
    }

    componentDidUpdate(prevProps: CardProps<PopupFanModel>): void {
        const { modes } = this.props.model;
        if (modes.length !== prevProps.model.modes.length) {
            const pages = Math.max(1, Math.ceil(modes.length / fanModesPerPage(this.props.global.model)));
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
        const g = fanGeometry(this.props.global.model);
        const grid = g.modes;
        const perPage = grid.columns * grid.rows;
        const pages = Math.max(1, Math.ceil(modes.length / perPage));
        const page = Math.min(this.state.page, pages - 1);
        const start = page * perPage;
        const elements = modes.slice(start, start + perPage).map((m, slot) => {
            const index = start + slot;
            const active = m === mode;
            const col = slot % grid.columns;
            const row = Math.floor(slot / grid.columns);
            return (
                <div
                    key={index}
                    data-mode={index}
                    data-active={active ? '1' : '0'}
                    onClick={(): void => this.selectMode(index)}
                    style={{
                        position: 'absolute',
                        left: grid.columnLeft + col * grid.columnWidth,
                        width: grid.columnWidth,
                        top: grid.rowCenterY + row * grid.rowPitch - grid.rowPitch / 2,
                        height: grid.rowPitch,
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
                        left: g.next.x - TAP_SIZE / 2,
                        top: g.next.y - TAP_SIZE / 2,
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
        const g = fanGeometry(this.props.global.model);
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
                    model={this.props.global.model}
                />
                {model.power !== undefined ? (
                    <div style={{ position: 'absolute', left: g.toggle.left, top: g.toggle.top }}>
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
                                left: g.speedLabel.left,
                                top: g.speedLabel.centerY - 12,
                                right: g.speedLabel.right,
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
                        <div style={{ position: 'absolute', left: g.slider.left, top: g.slider.centerY - 11 }}>
                            <Slider
                                name="speed"
                                value={model.speed}
                                min={0}
                                max={model.speedMax > 0 ? model.speedMax : 100}
                                length={g.slider.length}
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
