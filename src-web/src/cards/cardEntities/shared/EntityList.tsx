import React from 'react';
import { TitleBar } from '../../../components/TitleBar';
import type { GlobalState } from '../../../protocol/types';
import { stageSize, theme } from '../../../style/theme';
import { EntityRow } from './EntityRow';
import { menuSlotCount, menuSlots, type MenuPageModel } from './menuParse';

export interface EntityListProps {
    model: MenuPageModel;
    pageType: string;
    global: GlobalState;
    /** preferred height of a row, reduced when the rows do not fit */
    rowHeight: number;
    /** top of the first row */
    top: number;
    compact?: boolean;
    press: (id: string, action: string, value?: string | number) => void;
    openPopup: (popup: string, id: string, title?: string, icon?: string, iconColor?: number) => void;
}

/** Title bar plus the entity rows of cardEntities / cardSchedule */
export class EntityList extends React.Component<EntityListProps> {
    render(): React.JSX.Element {
        const { model, pageType, global, top, press } = this.props;
        const count = menuSlotCount(pageType, global.model);
        const { width, height } = stageSize(global.model);
        // portrait: rows may grow a little to fill the taller stage, the narrow width uses the compact widgets
        const maxRowHeight = Math.round(this.props.rowHeight * (height > width ? 1.3 : 1));
        const rowHeight = Math.min(maxRowHeight, Math.floor((height - top) / count));
        const compact = this.props.compact || width < 400;
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
                            press={press}
                            openPopup={this.props.openPopup}
                        />
                    ))}
                </div>
            </div>
        );
    }
}
