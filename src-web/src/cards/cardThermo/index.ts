import { defineCard } from '../CardContract';
import { CardThermo } from './CardThermo';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['cardThermo'] as const;

export const cardThermoModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardThermo,
});
