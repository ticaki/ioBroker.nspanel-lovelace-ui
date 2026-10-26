import { defineCard } from '../CardContract';
import { CardGrid } from './CardGrid';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['cardGrid', 'cardGrid2', 'cardGrid3'] as const;

export const cardGridModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardGrid,
});
