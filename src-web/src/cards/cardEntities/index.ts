import { defineCard } from '../CardContract';
import { CardEntities } from './CardEntities';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

/** cardEntities2: cardEntities with five rows (eu, web-l; same card, the adapter sends one row more) */
export const pageTypes = ['cardEntities', 'cardEntities2'] as const;

export const cardEntitiesModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardEntities,
});
