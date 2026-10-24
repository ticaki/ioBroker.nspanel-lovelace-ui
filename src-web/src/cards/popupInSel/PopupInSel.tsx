import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { pageCount, pageEntries, type PopupInSelModel } from './parse';

const HEAD_HEIGHT = 64;
const COLUMNS = 3;
const ROWS = 4;
/** RGB565 of the selected entry in the HMI (`bMode.pco=1374`) */
const SELECTED_COLOR = color565ToCss(1374);

/**
 * The selection popup (input_select, media lists, …): icon and headline at the top, the
 * X, and the entries in a 3 x 4 grid. More than 12 entries are paged with the arrow next
 * to the X (or the mouse wheel), like `bModeNext` of the HMI.
 *
 * Events: entry -> `event,buttonPress2,<id>,mode-<type>,<index>` (index in the whole list);
 * next page -> `event,pageOpenDetail,popupInSel,<id>,bModeNext,<page>`;
 * X -> `event,buttonPress2,popupInSel,bExit`.
 */
export class PopupInSel extends React.Component<CardProps<PopupInSelModel>, { page: number }> {
    constructor(props: CardProps<PopupInSelModel>) {
        super(props);
        this.state = { page: 0 };
    }

    /** a list of another length starts at page 0 again (the HMI keeps its buttons otherwise) */
    componentDidUpdate(prevProps: CardProps<PopupInSelModel>): void {
        const { model } = this.props;
        if (model !== prevProps.model) {
            const page = model.list.length === prevProps.model.list.length ? this.state.page : 0;
            const clamped = Math.min(page, pageCount(model) - 1);
            if (clamped !== this.state.page) {
                this.setState({ page: clamped });
            }
        }
    }

    private readonly nextPage = (): void => {
        const pages = pageCount(this.props.model);
        const page = (this.state.page + 1) % pages;
        this.setState({ page });
        this.props.send(`event,pageOpenDetail,popupInSel,${this.props.model.entityName},bModeNext,${page}`);
    };

    private readonly onWheel = (e: React.WheelEvent): void => {
        if (pageCount(this.props.model) > 1 && Math.abs(e.deltaY) > 0) {
            this.nextPage();
        }
    };

    private readonly close = (): void => {
        this.props.press('popupInSel', 'bExit');
    };

    private select(index: number): void {
        const { model } = this.props;
        this.props.press(model.entityName, `mode-${model.type}`, index);
    }

    private renderEntry(entry: { index: number; text: string }, slot: number): React.JSX.Element {
        const { model } = this.props;
        const selected = entry.text === model.current;
        return (
            <div
                key={entry.index}
                data-entry={entry.index}
                style={{
                    gridColumn: (slot % COLUMNS) + 1,
                    gridRow: Math.floor(slot / COLUMNS) + 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: selected ? SELECTED_COLOR : theme.foreground,
                    fontSize: 22,
                    lineHeight: '26px',
                    whiteSpace: 'pre-line',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: '0 4px',
                }}
                onClick={(): void => this.select(entry.index)}
            >
                {entry.text}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx } = this.props;
        const title = model.type || ctx.pageArgs[1] || '';
        const pages = pageCount(model);
        const entries = pageEntries(model, this.state.page);
        return (
            <div
                data-page={ctx.pageType}
                onWheel={this.onWheel}
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
                        {model.icon ? (
                            <Icon
                                glyph={model.icon}
                                size={36}
                                color={color565ToCss(model.iconColor)}
                            />
                        ) : (
                            <Icon
                                name="format-list-bulleted"
                                size={36}
                                color={color565ToCss(model.iconColor)}
                            />
                        )}
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
                    {pages > 1 ? (
                        <div
                            data-next=""
                            title={`${this.state.page + 1}/${pages}`}
                            style={{
                                width: 48,
                                height: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                            onClick={this.nextPage}
                        >
                            <Icon
                                name="chevron-right"
                                size={40}
                                color={theme.foreground}
                            />
                        </div>
                    ) : null}
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
                <div
                    data-list=""
                    style={{
                        position: 'absolute',
                        top: HEAD_HEIGHT,
                        left: 12,
                        right: 12,
                        bottom: 8,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
                        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                        columnGap: 4,
                    }}
                >
                    {entries.map((entry, slot) => this.renderEntry(entry, slot))}
                </div>
            </div>
        );
    }
}
