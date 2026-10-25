import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupHeaderIconColor } from '../popupSlider/fields';
import { CLOSE_CENTER, POPUP_FONT_SIZE, PopupHeader, TAP_SIZE } from '../popupSlider/PopupHeader';
import { pageCount, pageEntries, type PopupInSelModel } from './parse';

/** the 3 x 4 grid of the HMI: columns of 124 px from x 8, rows of 63 px centred at y 92 */
const COLUMNS = 3;
const COLUMN_LEFT = 8;
const COLUMN_WIDTH = 124;
const ROW_CENTER_Y = 92;
const ROW_PITCH = 63;
/** the page arrow sits between the title and the X */
const NEXT_CENTER = { x: CLOSE_CENTER.x - 50, y: CLOSE_CENTER.y };
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
        const col = slot % COLUMNS;
        const row = Math.floor(slot / COLUMNS);
        return (
            <div
                key={entry.index}
                data-entry={entry.index}
                style={{
                    position: 'absolute',
                    left: COLUMN_LEFT + col * COLUMN_WIDTH,
                    width: COLUMN_WIDTH,
                    top: ROW_CENTER_Y + row * ROW_PITCH - ROW_PITCH / 2,
                    height: ROW_PITCH,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: selected ? SELECTED_COLOR : theme.foreground,
                    fontSize: POPUP_FONT_SIZE,
                    lineHeight: '22px',
                    whiteSpace: 'pre-line',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: '0 4px',
                    boxSizing: 'border-box',
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
                <PopupHeader
                    title={title}
                    icon={model.icon || ctx.pageArgs[2] || ''}
                    // entityUpdateDetail2 carries the icon colour of the entity: it wins; until it
                    // arrives the colour of the tapped entity (pageArgs[3])
                    iconColor={popupHeaderIconColor(ctx, model.received ? model.iconColor : undefined)}
                    onClose={this.close}
                />
                {pages > 1 ? (
                    <div
                        data-next=""
                        title={`${this.state.page + 1}/${pages}`}
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
                            background: theme.background,
                        }}
                        onClick={this.nextPage}
                    >
                        <Icon
                            name="chevron-right"
                            size={36}
                            color={theme.foreground}
                        />
                    </div>
                ) : null}
                <div data-list="">{entries.map((entry, slot) => this.renderEntry(entry, slot))}</div>
            </div>
        );
    }
}
