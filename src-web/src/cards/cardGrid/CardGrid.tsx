import React from 'react';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import type { Entity6, PanelModel } from '../../protocol/types';
import { contentWidth, stageSize, theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { nextionFont, popupForType, splitIconField } from '../cardEntities/shared/entityTypes';
import { isEmptySlot, menuSlotCount, menuSlots } from '../cardEntities/shared/menuParse';
import { Pressable } from '../cardEntities/shared/Pressable';
import { EntityIcon } from '../cardEntities/shared/widgets';
import type { CardGridModel } from './parse';

/** Top of the tile area, below the title bar */
export const GRID_TOP = 62;

/** The Nextion font of a tile icon or value without `fontSize`: 80 px bold */
export const TILE_DEFAULT_FONT = 4;

/**
 * Vertical centre of the icon or value of a tile per Nextion font 0-5, relative to the top of
 * the row (measured on the emulator pictures): the small fonts are centred in the value box,
 * the big fonts 4 and 5 start at its top, font 5 is cut by the name box below.
 */
const TILE_CENTER: readonly number[] = [53, 52, 52, 52, 43, 67];

export interface GridLayout {
    columns: number;
    rows: number;
    /** left edge of the first column */
    left: number;
    columnWidth: number;
    rowHeight: number;
    /** width of the box of the icon / value, centred in the column */
    valueWidth: number;
    /** top of the name box within the row; the icon box ends there */
    nameTop: number;
    /** height of the name box (32 px Nextion font line) */
    nameHeight: number;
    nameFontSize: number;
}

/**
 * Tile arrangement per grid type as the HMI draws it (eu, measured on the emulator pictures):
 * cardGrid 3x2 columns of 147 px (centres 74, 221, 368), cardGrid2 4x2 of 112 px, cardGrid3
 * 2x2 of 223 px (centres 115, 338), rows of 119 px below the title bar. cardGrid/cardGrid2
 * write the name in the 24 px font, cardGrid3 in the 32 px font. On us-p cardGrid has
 * 2 columns and cardGrid2 3x3 (`PageMenu.maxItems`).
 *
 * @param pageType the grid type
 * @param model the panel model
 */
export function gridLayout(pageType: string, model: PanelModel): GridLayout {
    const count = menuSlotCount(pageType, model);
    const stage = stageSize(model);
    const content = contentWidth(model);
    const portrait = model === 'us-p';
    let columns: number;
    let columnWidth: number;
    let left = 0;
    switch (pageType) {
        case 'cardGrid2':
            columns = portrait ? 3 : 4;
            columnWidth = portrait ? Math.floor(content / columns) : 112;
            break;
        case 'cardGrid3':
            columns = 2;
            columnWidth = portrait ? Math.floor(content / columns) : 223;
            left = portrait ? 0 : 4;
            break;
        default:
            columns = portrait ? 2 : 3;
            columnWidth = portrait ? Math.floor(content / columns) : 147;
            left = portrait ? 0 : 1;
            break;
    }
    const rows = Math.max(1, Math.ceil(count / columns));
    const rowHeight = portrait ? Math.floor((stage.height - GRID_TOP - 18) / rows) : 119;
    const grid3 = pageType === 'cardGrid3';
    return {
        columns,
        rows,
        left,
        columnWidth,
        rowHeight,
        valueWidth: grid3 ? 140 : columnWidth,
        nameTop: grid3 ? 93 : 90,
        nameHeight: 32,
        nameFontSize: grid3 ? 24 : 18,
    };
}

/** What a grid tile does when it is tapped or held */
export type TileTouch =
    /** switch the entity: `event,buttonPress2,<id>,button` */
    | { kind: 'press' }
    /** open the detail popup of the tile: `event,pageOpenDetail,<popup>,<id>` */
    | { kind: 'popup'; popup: string }
    /** long press of a tile without a popup: `event,buttonPress3,<id>,button` */
    | { kind: 'longPress' };

/**
 * Touch of a grid tile, as the HMI does it (checked against a real panel on 2026-10-27):
 * a **short tap always switches** - the adapter flips a light, switch, number or fan tile in
 * `PageItem.onCommand`, `case 'button'`. **Holding** a tile opens the detail popup of its
 * type, so a tile with a popup (light, light2, fan, shutter, shutter2, number, input_sel,
 * timer) must never send the long press event: `PageItem.onCommandLongPress` only knows
 * `button` and `switch`, and `Panel.convertToEvent` fills the popup field of an event only
 * for `pageOpenDetail` - a `buttonPress3` of a light tile would fall through to
 * `onCommand('button')` and switch the light instead of opening the popup.
 *
 * Tiles without a popup (switch, button, text) keep the long press event; the adapter maps it
 * to `setNaviLongPress` or the `longPress` state.
 *
 * @param type entity type of the tile as it came in with `entityUpd`
 * @param held true when the tile was held longer than `LONG_PRESS_MS`
 * @returns what to do with the touch
 */
export function tileTouch(type: string, held: boolean): TileTouch {
    if (!held) {
        return { kind: 'press' };
    }
    const popup = popupForType(type);
    return popup ? { kind: 'popup', popup } : { kind: 'longPress' };
}

/**
 * cardGrid / cardGrid2 / cardGrid3: tiles with icon and name. With `useValue` the adapter
 * sends the value in the icon field (optionally `¬<font>`), it takes the place of the icon;
 * the HMI shows no further value line.
 *
 * Touch: see {@link tileTouch} - a short tap switches, holding opens the detail popup.
 */
export class CardGrid extends React.Component<CardProps<CardGridModel>> {
    private onTileTouch(entity: Entity6, held: boolean): void {
        const touch = tileTouch(entity.type, held);
        switch (touch.kind) {
            case 'popup':
                this.props.openPopup(touch.popup, entity.id, entity.displayName, entity.icon, entity.iconColor);
                break;
            case 'longPress':
                this.props.send(`event,buttonPress3,${entity.id},button`);
                break;
            default:
                this.props.press(entity.id, 'button');
                break;
        }
    }

    private renderTile(entity: Entity6, index: number, layout: GridLayout): React.JSX.Element {
        const column = index % layout.columns;
        const row = Math.floor(index / layout.columns);
        const left = layout.left + column * layout.columnWidth;
        const top = GRID_TOP + row * layout.rowHeight;
        if (isEmptySlot(entity)) {
            return (
                <div
                    key={index}
                    data-tile=""
                    style={{ position: 'absolute', left, top, width: layout.columnWidth, height: layout.rowHeight }}
                />
            );
        }
        const color = color565ToCss(entity.iconColor);
        const { font } = splitIconField(entity.icon);
        const nf = nextionFont(font, TILE_DEFAULT_FONT);
        const center = TILE_CENTER[font ?? TILE_DEFAULT_FONT] ?? TILE_CENTER[TILE_DEFAULT_FONT];
        return (
            <Pressable
                key={index}
                data-role="tile"
                data-id={entity.id}
                onPress={(): void => this.onTileTouch(entity, false)}
                onLongPress={(): void => this.onTileTouch(entity, true)}
                style={{
                    position: 'absolute',
                    left,
                    top,
                    width: layout.columnWidth,
                    height: layout.rowHeight,
                    pointerEvents: 'auto',
                }}
            >
                <div
                    data-role="icon-box"
                    style={{
                        position: 'absolute',
                        left: (layout.columnWidth - layout.valueWidth) / 2,
                        top: 0,
                        width: layout.valueWidth,
                        height: layout.nameTop,
                        overflow: 'hidden',
                    }}
                >
                    <EntityIcon
                        icon={entity.icon}
                        color={color}
                        font={TILE_DEFAULT_FONT}
                        style={{
                            position: 'absolute',
                            left: 0,
                            width: layout.valueWidth,
                            top: center - nf.fontSize / 2,
                            height: nf.fontSize,
                            overflow: 'visible',
                        }}
                    />
                </div>
                <div
                    data-role="name"
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: layout.nameTop,
                        width: layout.columnWidth,
                        height: layout.nameHeight,
                        lineHeight: `${layout.nameHeight}px`,
                        fontSize: layout.nameFontSize,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}
                >
                    {entity.displayName}
                </div>
            </Pressable>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, global, press } = this.props;
        const layout = gridLayout(ctx.pageType, global.model);
        const count = menuSlotCount(ctx.pageType, global.model);
        const slots = menuSlots(model.entities, count);
        return (
            <div
                data-page={ctx.pageType}
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
                    data-tiles=""
                    // spans the stage above the title bar: only the tiles take the touches,
                    // the navigation arrows stay reachable
                    style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                >
                    {slots.map((entity, i) => this.renderTile(entity, i, layout))}
                </div>
            </div>
        );
    }
}
