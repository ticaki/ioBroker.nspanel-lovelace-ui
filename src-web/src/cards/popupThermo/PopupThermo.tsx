import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { pageCount, pageModes, ROW_COUNT, type PopupThermoModel, type ThermoModeRow } from './parse';

const HEAD_HEIGHT = 60;
const ROW_HEIGHT = 80;
const HEADING_WIDTH = 120;
const NEXT_WIDTH = 44;
/** RGB565 of the selected mode in the HMI (`bMode.pco=1374`) */
const SELECTED_COLOR = color565ToCss(1374);

interface PopupThermoState {
    /** page of each row */
    pages: number[];
}

/**
 * The mode popup of cardThermo: icon and X at the top, up to three rows with a heading
 * and three mode buttons each, an arrow at the end pages through longer lists (local,
 * like `bModeNext` of the HMI). Rows without modes are hidden.
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
        return (
            <div
                key={rowIndex}
                data-row={rowIndex}
                style={{
                    position: 'absolute',
                    left: 12,
                    right: 12,
                    top: HEAD_HEIGHT + rowIndex * ROW_HEIGHT,
                    height: ROW_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        width: HEADING_WIDTH,
                        flex: '0 0 auto',
                        color: theme.foreground,
                        fontSize: 22,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        paddingLeft: 4,
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
                                flex: '1 1 0',
                                height: 56,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                color: selected ? SELECTED_COLOR : theme.foreground,
                                fontSize: 22,
                                lineHeight: '26px',
                                whiteSpace: 'pre-line',
                                overflow: 'hidden',
                                cursor: mode ? 'pointer' : 'default',
                                padding: '0 4px',
                            }}
                            onClick={mode ? (): void => this.select(row, mode.index) : undefined}
                        >
                            {mode?.text ?? ''}
                        </div>
                    );
                })}
                <div
                    data-next={pages > 1 ? rowIndex : undefined}
                    style={{
                        width: NEXT_WIDTH,
                        height: 56,
                        flex: '0 0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: pages > 1 ? 'pointer' : 'default',
                        visibility: pages > 1 ? 'visible' : 'hidden',
                    }}
                    onClick={pages > 1 ? (): void => this.nextPage(rowIndex) : undefined}
                >
                    <Icon
                        name="chevron-right"
                        size={40}
                        color={theme.foreground}
                    />
                </div>
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
                <div
                    data-head=""
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: HEAD_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 16,
                    }}
                >
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon
                            glyph={model.icon || undefined}
                            name={model.icon ? undefined : 'thermostat'}
                            size={36}
                            color={color565ToCss(model.iconColor)}
                        />
                    </div>
                    <div
                        style={{
                            flex: '1 1 auto',
                            marginLeft: 36,
                            color: theme.foreground,
                            fontSize: 26,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {title}
                    </div>
                    <div
                        data-close=""
                        style={{
                            width: 48,
                            height: 48,
                            marginRight: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={this.close}
                    >
                        <Icon
                            name="close"
                            size={32}
                            color={theme.foreground}
                        />
                    </div>
                </div>
                {model.rows.map((row, i) => this.renderRow(row, i))}
            </div>
        );
    }
}
