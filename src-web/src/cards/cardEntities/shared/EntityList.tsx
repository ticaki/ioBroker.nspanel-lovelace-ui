import React from 'react';
import { TitleBar } from '../../../components/TitleBar';
import type { GlobalState, PanelModel } from '../../../protocol/types';
import { contentWidth, isPortrait, isWebModel, stageSize, theme } from '../../../style/theme';
import { EntityRow } from './EntityRow';
import { menuSlotCount, menuSlots, type MenuPageModel } from './menuParse';

export interface EntityListProps {
    model: MenuPageModel;
    pageType: string;
    global: GlobalState;
    /** height of a row on the landscape hardware (eu, us-l, web-l) */
    rowHeight: number;
    /** top of the first row */
    top: number;
    /** the card draws compact rows on the hardware models (cardSchedule) */
    compact?: boolean;
    press: (id: string, action: string, value?: string | number) => void;
    openPopup: (popup: string, id: string, title?: string, icon?: string, iconColor?: number) => void;
}

/** Arrangement of the rows of cardEntities / cardSchedule on a model */
export interface EntityListLayout {
    /** number of rows (`menuSlotCount`) */
    count: number;
    rowHeight: number;
    /** the narrow widgets (portrait models, cardSchedule on the hardware) */
    compact: boolean;
    /**
     * width of the value column at the right of a row (text values), right-aligned 47 px from
     * the right edge; `undefined` = the column of the HMI (66 px compact, up to 240 px otherwise)
     */
    valueWidth?: number;
    /** the name ends at the left edge of the control (all models but eu and us-l) */
    fit: boolean;
    /** empty strip at the right of the stage (stage width - `contentWidth`): 33 hardware, 0 web */
    margin: number;
}

/** Row height per portrait model and card, from `doc/web-panel/SMARTPHONE.md` and the us-p HMI */
const PORTRAIT_ROW_HEIGHT: Readonly<Record<string, Readonly<Partial<Record<PanelModel, number>>>>> = {
    // us-p: rows a little taller than eu (x 1.3); web-p: 8 rows of 71 px from y 72
    cardEntities: { 'us-p': 74, 'web-p': 71 },
    // us-p: 6 rows of 46 px; web-p: 11 rows of 49 px from y 79
    cardSchedule: { 'us-p': 46, 'web-p': 49 },
};

/** Row height of a landscape model that differs from the eu HMI */
const LANDSCAPE_ROW_HEIGHT: Readonly<Record<string, Readonly<Partial<Record<PanelModel, number>>>>> = {
    // web-l: the 6 rows use the height, floor((320 - 79 - 8) / 6), rows y 79 ... 307
    cardSchedule: { 'web-l': 38 },
};

/**
 * The wider value column of us-p (its HMI column `bText` is 145 px) and the web models (the column of 66 px
 * cuts "geschlossen")
 */
const VALUE_WIDTH: Readonly<Partial<Record<PanelModel, number>>> = { 'us-p': 110, 'web-l': 220, 'web-p': 110 };

/**
 * Rows of an entity list: the landscape models (eu, us-l, web-l) use the row height of the eu
 * HMI (web-l cardSchedule: taller rows), the portrait models the height of
 * {@link PORTRAIT_ROW_HEIGHT}; the rows never run below the stage. Portrait models draw the
 * compact rows, cardSchedule (`compactCard`) also on eu and us-l - web-l has the room for the
 * normal rows. The web models get a wider value column ({@link VALUE_WIDTH}).
 *
 * @param pageType the card (`cardEntities`, `cardSchedule`)
 * @param model the panel model
 * @param top top of the first row
 * @param rowHeight row height on the eu HMI
 * @param compactCard the card draws compact rows on the hardware (cardSchedule)
 */
export function entityListLayout(
    pageType: string,
    model: PanelModel,
    top: number,
    rowHeight: number,
    compactCard = false,
): EntityListLayout {
    const count = menuSlotCount(pageType, model);
    const { height } = stageSize(model);
    const portrait = isPortrait(model);
    const preferred = portrait
        ? (PORTRAIT_ROW_HEIGHT[pageType]?.[model] ?? Math.round(rowHeight * 1.3))
        : (LANDSCAPE_ROW_HEIGHT[pageType]?.[model] ?? rowHeight);
    return {
        count,
        rowHeight: Math.min(preferred, Math.floor((height - top) / count)),
        compact: portrait || (compactCard && !isWebModel(model)),
        valueWidth: VALUE_WIDTH[model],
        fit: portrait || isWebModel(model),
        margin: stageSize(model).width - contentWidth(model),
    };
}

/** Title bar plus the entity rows of cardEntities / cardSchedule */
export class EntityList extends React.Component<EntityListProps> {
    render(): React.JSX.Element {
        const { model, pageType, global, top, press } = this.props;
        const layout = entityListLayout(pageType, global.model, top, this.props.rowHeight, this.props.compact);
        const { count, rowHeight, compact, valueWidth, fit, margin } = layout;
        const slots = menuSlots(model.entities, count);
        return (
            <div
                data-page={pageType}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: theme.background,
                    color: theme.foreground,
                    fontFamily: theme.fontFamily,
                    overflow: 'hidden',
                }}
            >
                <TitleBar
                    title={model.title}
                    navigation={model.navigation}
                    model={global.model}
                    press={press}
                />
                <div
                    data-rows=""
                    style={{ position: 'absolute', top, left: 0, right: 0 }}
                >
                    {slots.map((entity, i) => (
                        <EntityRow
                            key={i}
                            entity={entity}
                            height={rowHeight}
                            compact={compact}
                            valueWidth={valueWidth}
                            fit={fit}
                            margin={margin}
                            press={press}
                            openPopup={this.props.openPopup}
                        />
                    ))}
                </div>
            </div>
        );
    }
}
