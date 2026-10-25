import React from 'react';
import type { CardProps } from '../CardContract';
import type { CardEntitiesModel } from './parse';
import { EntityList } from './shared/EntityList';

/** The rows start below the title bar; 4 rows of 57 px match the real display */
export const ENTITIES_TOP = 72;
export const ENTITIES_ROW_HEIGHT = 57;

/** cardEntities: a list of up to 4 (eu, us-l) or 5 (us-p) entity rows */
export class CardEntities extends React.Component<CardProps<CardEntitiesModel>> {
    render(): React.JSX.Element {
        const { model, ctx, global, send, press, openPopup } = this.props;
        return (
            <EntityList
                model={model}
                pageType={ctx.pageType}
                global={global}
                top={ENTITIES_TOP}
                rowHeight={ENTITIES_ROW_HEIGHT}
                send={send}
                press={press}
                openPopup={openPopup}
            />
        );
    }
}
