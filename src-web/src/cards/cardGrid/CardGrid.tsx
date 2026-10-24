import React from 'react';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import type { Entity6, PanelModel } from '../../protocol/types';
import { stageSize, theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { gridValueText, popupForType } from '../cardEntities/shared/entityTypes';
import { isEmptySlot, menuSlotCount, menuSlots } from '../cardEntities/shared/menuParse';
import { Pressable } from '../cardEntities/shared/Pressable';
import { EntityIcon } from '../cardEntities/shared/widgets';
import type { CardGridModel } from './parse';

/** Top of the tile area, below the title bar */
export const GRID_TOP = 66;

export interface GridLayout {
    columns: number;
    rows: number;
    iconSize: number;
    /** font size of a text icon (a value shown instead of an icon) */
    textIconSize: number;
    fontSize: number;
    /** cardGrid3 shows the optionalValue below the name */
    showValue: boolean;
}

/**
 * Tile arrangement per grid type (`PageMenu.maxItems` and the admin page editor):
 * cardGrid 3x2, cardGrid2 4x2 (us-p 3x3), cardGrid3 2x2 with a value line.
 *
 * @param pageType the grid type
 * @param model the panel model
 */
export function gridLayout(pageType: string, model: PanelModel): GridLayout {
    const count = menuSlotCount(pageType, model);
    switch (pageType) {
        case 'cardGrid2': {
            const columns = model === 'us-p' ? 3 : 4;
            return {
                columns,
                rows: Math.ceil(count / columns),
                iconSize: 46,
                textIconSize: 34,
                fontSize: 16,
                showValue: false,
            };
        }
        case 'cardGrid3':
            return { columns: 2, rows: 2, iconSize: 56, textIconSize: 40, fontSize: 19, showValue: true };
        default: {
            const columns = model === 'us-p' ? 2 : 3;
            return {
                columns,
                rows: Math.ceil(count / columns),
                iconSize: 56,
                textIconSize: 40,
                fontSize: 18,
                showValue: false,
            };
        }
    }
}

/**
 * cardGrid / cardGrid2 / cardGrid3: tiles with icon and name.
 *
 * Touch (see `PageItem.onCommand` and `GeneratePopup`): a tile with a popup type (light,
 * light2, fan, shutter, shutter2, number, input_sel, timer) sends `event,pageOpenDetail,<popup>,<id>`,
 * every other tile (switch, button, text) sends `event,buttonPress2,<id>,button`; holding a tile
 * sends `event,buttonPress3,<id>,button`.
 */
export class CardGrid extends React.Component<CardProps<CardGridModel>> {
    private onTilePress(entity: Entity6): void {
        const popup = popupForType(entity.type);
        if (popup) {
            this.props.openPopup(popup, entity.id, entity.displayName, entity.icon);
        } else {
            this.props.press(entity.id, 'button');
        }
    }

    private onTileLongPress(entity: Entity6): void {
        this.props.send(`event,buttonPress3,${entity.id},button`);
    }

    private renderTile(
        entity: Entity6,
        index: number,
        layout: GridLayout,
        width: number,
        height: number,
    ): React.JSX.Element {
        if (isEmptySlot(entity)) {
            return (
                <div
                    key={index}
                    data-tile=""
                    style={{ width, height }}
                />
            );
        }
        const color = color565ToCss(entity.iconColor);
        const value = layout.showValue ? gridValueText(entity) : '';
        return (
            <Pressable
                key={index}
                data-role="tile"
                data-id={entity.id}
                onPress={(): void => this.onTilePress(entity)}
                onLongPress={(): void => this.onTileLongPress(entity)}
                style={{
                    width,
                    height,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: value !== '' ? 2 : 8,
                    boxSizing: 'border-box',
                    padding: '0 4px',
                }}
            >
                <EntityIcon
                    icon={entity.icon}
                    color={color}
                    size={layout.iconSize}
                    textSize={layout.textIconSize}
                    style={{ height: layout.iconSize + 4 }}
                />
                <div
                    data-role="name"
                    style={{
                        fontSize: layout.fontSize,
                        lineHeight: 1.2,
                        maxWidth: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                    }}
                >
                    {entity.displayName}
                </div>
                {value !== '' ? (
                    <div
                        data-role="value"
                        style={{
                            fontSize: layout.fontSize,
                            lineHeight: 1.2,
                            color: theme.muted,
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textAlign: 'center',
                        }}
                    >
                        {value}
                    </div>
                ) : null}
            </Pressable>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, global, press } = this.props;
        const layout = gridLayout(ctx.pageType, global.model);
        const stage = stageSize(global.model);
        const count = menuSlotCount(ctx.pageType, global.model);
        const slots = menuSlots(model.entities, count);
        const tileWidth = Math.floor(stage.width / layout.columns);
        const tileHeight = Math.floor((stage.height - GRID_TOP) / layout.rows);
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
                    press={press}
                />
                <div
                    data-tiles=""
                    style={{
                        position: 'absolute',
                        top: GRID_TOP,
                        left: 0,
                        width: tileWidth * layout.columns,
                        display: 'flex',
                        flexWrap: 'wrap',
                    }}
                >
                    {slots.map((entity, i) => this.renderTile(entity, i, layout, tileWidth, tileHeight))}
                </div>
            </div>
        );
    }
}
