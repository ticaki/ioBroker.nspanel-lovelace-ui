import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import type { PanelModel } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupHeaderIconColor } from '../popupSlider/fields';
import { popupFrame } from '../popupSlider/layout';
import { POPUP_FONT_SIZE, PopupHeader, TAP_SIZE } from '../popupSlider/PopupHeader';
import { modesPerPage, pageCount, pageModes, ROW_COUNT, type PopupThermoModel, type ThermoModeRow } from './parse';

/** geometry of the rows in stage pixels; the y values are relative to `rowIndex * rowPitch` */
export interface ThermoRowGeometry {
    rowPitch: number;
    headingLeft: number;
    headingCenterY: number;
    /** vertical centres of the lines of mode buttons (one line landscape, two portrait) */
    modeLineCenters: number[];
    columns: number;
    columnLeft: number;
    columnWidth: number;
    modeHeight: number;
    nextCenterX: number;
}

/**
 * The rows of popupThermo per model. eu/us-l like the HMI: per row the heading at the left
 * (y 84) and three mode buttons in the 3 column grid below it (y 118, columns of 124 px from
 * x 8), rows of 80 px, arrow at x 440. web-l: four modes of 140 px per line, arrow at x 600. Portrait:
 * four modes per row in two lines of two (columns of 125 px), rows of 160 px (web-p) or
 * 130 px (us-p), the arrow at the right between both lines.
 *
 * @param model the panel model the popup sees
 */
export function thermoRowGeometry(model: PanelModel): ThermoRowGeometry {
    const { width, height, portrait } = popupFrame(model);
    const perPage = modesPerPage(model);
    if (portrait) {
        const tall = height >= 640;
        const headingCenterY = tall ? 90 : 84;
        const first = headingCenterY + (tall ? 40 : 36);
        const linePitch = tall ? 50 : 46;
        return {
            rowPitch: tall ? 160 : 130,
            headingLeft: 11,
            headingCenterY,
            modeLineCenters: [first, first + linePitch],
            columns: perPage / 2,
            columnLeft: 10,
            columnWidth: 125,
            modeHeight: 44,
            nextCenterX: width - 30,
        };
    }
    return {
        rowPitch: 80,
        headingLeft: 11,
        headingCenterY: 84,
        modeLineCenters: [118],
        columns: perPage,
        columnLeft: 8,
        // eu: 3 x 124 like the HMI; web-l: 4 x 140 up to the arrow at x 600
        columnWidth: perPage > 3 ? 140 : 124,
        modeHeight: 44,
        nextCenterX: width - 40,
    };
}
/** RGB565 of the selected mode in the HMI (`bMode.pco=1374`) */
const SELECTED_COLOR = color565ToCss(1374);

interface PopupThermoState {
    /** page of each row */
    pages: number[];
}

/**
 * The mode popup of cardThermo: icon, title and X at the top, up to three rows with a
 * heading and three (eu) or four (other models) mode buttons each ({@link thermoRowGeometry}), an arrow at the end pages through longer lists
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

    /** modes per page on the model of the panel */
    private get perPage(): number {
        return modesPerPage(this.props.global.model);
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
                return Math.min(page, pageCount(row, this.perPage) - 1);
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
        pages[rowIndex] = ((pages[rowIndex] ?? 0) + 1) % pageCount(row, this.perPage);
        this.setState({ pages });
    }

    private select(row: ThermoModeRow, index: number): void {
        this.props.press(this.props.model.entityName, `mode-${row.type}`, index);
    }

    private renderRow(row: ThermoModeRow, rowIndex: number): React.JSX.Element | null {
        if (row.list.length === 0) {
            return null;
        }
        const g = thermoRowGeometry(this.props.global.model);
        const perPage = this.perPage;
        const page = this.state.pages[rowIndex] ?? 0;
        const modes = pageModes(row, page, perPage);
        const pages = pageCount(row, perPage);
        const top = rowIndex * g.rowPitch;
        const lines = g.modeLineCenters;
        const nextCenterY = (lines[0] + lines[lines.length - 1]) / 2;
        return (
            <div
                key={rowIndex}
                data-row={rowIndex}
                // the first row spans the header: only the modes and the page button take the
                // touches, the X stays reachable
                style={{ position: 'absolute', left: 0, right: 0, top, height: g.rowPitch, pointerEvents: 'none' }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: g.headingLeft,
                        right: 20,
                        top: g.headingCenterY - 12,
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
                {Array.from({ length: perPage }, (_, slot) => {
                    const mode = modes[slot];
                    const col = slot % g.columns;
                    const lineCenter = lines[Math.floor(slot / g.columns)] ?? lines[0];
                    const selected = mode !== undefined && mode.text === row.current;
                    return (
                        <div
                            key={slot}
                            data-mode={mode?.index}
                            style={{
                                position: 'absolute',
                                left: g.columnLeft + col * g.columnWidth,
                                width: g.columnWidth,
                                top: lineCenter - g.modeHeight / 2,
                                height: g.modeHeight,
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
                            left: g.nextCenterX - TAP_SIZE / 2,
                            top: nextCenterY - TAP_SIZE / 2,
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
                    model={this.props.global.model}
                />
                {model.rows.map((row, i) => this.renderRow(row, i))}
            </div>
        );
    }
}
