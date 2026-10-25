import React from 'react';
import type { CardProps } from '../CardContract';
import { EntityList } from '../cardEntities/shared/EntityList';
import type { CardScheduleModel } from './parse';

/** 6 rows of 35 px, the first centred at y 96 (measured on the emulator picture `cardSchedule.png`) */
export const SCHEDULE_TOP = 79;
export const SCHEDULE_ROW_HEIGHT = 35;

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
