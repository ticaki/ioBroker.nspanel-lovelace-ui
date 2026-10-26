import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupHeaderIconColor } from '../popupSlider/fields';
import { POPUP_FONT_SIZE, PopupHeader, TAP_SIZE } from '../popupSlider/PopupHeader';
import { pageCount, pageModes, ROW_COUNT, type PopupThermoModel, type ThermoModeRow } from './parse';

/**
 * geometry of the HMI (stage pixels): per row the heading at the left (y 84) and the
 * three mode buttons in the 3 column grid below it (y 118); rows of 80 px
 */
const ROW_PITCH = 80;
const HEADING = { left: 11, centerY: 84 };
const MODES_CENTER_Y = 118;
const COLUMN_LEFT = 8;
const COLUMN_WIDTH = 124;
const MODE_HEIGHT = 44;
const NEXT_CENTER_X = 440;
/** RGB565 of the selected mode in the HMI (`bMode.pco=1374`) */
const SELECTED_COLOR = color565ToCss(1374);

interface PopupThermoState {
    /** page of each row */
    pages: number[];
}

/**
 * The mode popup of cardThermo: icon, title and X at the top, up to three rows with a
 * heading and three mode buttons each, an arrow at the end pages through longer lists
 * (local, like `bModeNext` of the HMI). Rows without modes are hidden.
 *
 * Events: mode -> `event,buttonPress2,<pageId>,mode-<type>,<index>`;
 * X -> `event,buttonPress2,popupThermo,bExit`.
 */
export class PopupThermo extends React.Component<CardProps<PopupThermoModel>, PopupThermoState> {
    constructor(props: CardProps<PopupThermoModel>) {
        super(props);
        this.state = { pages: new Array<number>(ROW_COUNT).fill(0) };
    }

    componentDidUpdate(prevProps: CardProps<PopupThermoModel>): void {
        const { model } = this.props;
        if (model !== prevProps.model) {
            const pages = this.state.pages.map((page, i) => {
                const row = model.rows[i];
                const prevRow = prevProps.model.rows[i];
                if (!row || !prevRow || row.list.length !== prevRow.list.length) {
                    return 0;
                }
                return Math.min(page, pageCount(row) - 1);
            });
            if (pages.some((p, i) => p !== this.state.pages[i])) {
                this.setState({ pages });
            }
        }
    }

    private readonly close = (): void => {
        this.props.press('popupThermo', 'bExit');
    };

    private nextPage(rowIndex: number): void {
        const row = this.props.model.rows[rowIndex];
        if (!row) {
            return;
        }
        const pages = [...this.state.pages];
        pages[rowIndex] = ((pages[rowIndex] ?? 0) + 1) % pageCount(row);
        this.setState({ pages });
    }

    private select(row: ThermoModeRow, index: number): void {
        this.props.press(this.props.model.entityName, `mode-${row.type}`, index);
    }

    private renderRow(row: ThermoModeRow, rowIndex: number): React.JSX.Element | null {
        if (row.list.length === 0) {
            return null;
        }
        const page = this.state.pages[rowIndex] ?? 0;
        const modes = pageModes(row, page);
        const pages = pageCount(row);
        const top = rowIndex * ROW_PITCH;
        return (
            <div
                key={rowIndex}
                data-row={rowIndex}
                // the first row spans the header: only the modes and the page button take the
                // touches, the X stays reachable
                style={{ position: 'absolute', left: 0, right: 0, top, height: ROW_PITCH, pointerEvents: 'none' }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: HEADING.left,
                        right: 20,
                        top: HEADING.centerY - 12,
                        height: 24,
                        lineHeight: '24px',
                        color: theme.foreground,
                        fontSize: POPUP_FONT_SIZE,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {row.heading}
                </div>
                {[0, 1, 2].map(slot => {
                    const mode = modes[slot];
                    const selected = mode !== undefined && mode.text === row.current;
                    return (
                        <div
                            key={slot}
                            data-mode={mode?.index}
                            style={{
                                position: 'absolute',
                                left: COLUMN_LEFT + slot * COLUMN_WIDTH,
                                width: COLUMN_WIDTH,
                                top: MODES_CENTER_Y - MODE_HEIGHT / 2,
                                height: MODE_HEIGHT,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                color: selected ? SELECTED_COLOR : theme.foreground,
                                fontSize: POPUP_FONT_SIZE,
                                lineHeight: '22px',
                                whiteSpace: 'pre-line',
                                overflow: 'hidden',
                                cursor: mode ? 'pointer' : 'default',
                                padding: '0 4px',
                                boxSizing: 'border-box',
                                pointerEvents: 'auto',
                            }}
                            onClick={mode ? (): void => this.select(row, mode.index) : undefined}
                        >
                            {mode?.text ?? ''}
                        </div>
                    );
                })}
                {pages > 1 ? (
                    <div
                        data-next={rowIndex}
                        style={{
                            position: 'absolute',
                            left: NEXT_CENTER_X - TAP_SIZE / 2,
                            top: MODES_CENTER_Y - TAP_SIZE / 2,
                            width: TAP_SIZE,
                            height: TAP_SIZE,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                        }}
                        onClick={(): void => this.nextPage(rowIndex)}
                    >
                        <Icon
                            name="chevron-right"
                            size={36}
                            color={theme.foreground}
                        />
                    </div>
                ) : null}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx } = this.props;
        const title = ctx.pageArgs[1] ?? '';
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, overflow: 'hidden' }}
            >
                <PopupHeader
                    title={title}
                    icon={model.icon || ''}
                    // the payload carries the icon colour: it wins; until it arrives the colour of the
                    // tapped entity (pageArgs[3])
                    iconColor={popupHeaderIconColor(ctx, model.received ? model.iconColor : undefined)}
                    onClose={this.close}
                />
                {model.rows.map((row, i) => this.renderRow(row, i))}
            </div>
        );
    }
}
