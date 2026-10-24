import React from 'react';
import type { CardProps } from '../CardContract';
import { EntityList } from '../cardEntities/shared/EntityList';
import type { CardScheduleModel } from './parse';

/** 6 rows of 37 px below the title bar (see the cardTrash pictures of the wiki) */
export const SCHEDULE_TOP = 76;
export const SCHEDULE_ROW_HEIGHT = 37;

/** cardSchedule: like cardEntities, but 6 tighter rows */
export class CardSchedule extends React.Component<CardProps<CardScheduleModel>> {
    render(): React.JSX.Element {
        const { model, ctx, global, send, press, openPopup } = this.props;
        return (
            <EntityList
                model={model}
                pageType={ctx.pageType}
                global={global}
                top={SCHEDULE_TOP}
                rowHeight={SCHEDULE_ROW_HEIGHT}
                compact
                send={send}
                press={press}
                openPopup={openPopup}
            />
        );
    }
}
