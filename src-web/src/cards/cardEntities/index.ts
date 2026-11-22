import { defineCard } from '../CardContract';
import { CardEntities } from './CardEntities';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['cardEntities'] as const;

export const cardEntitiesModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardEntities,
});
