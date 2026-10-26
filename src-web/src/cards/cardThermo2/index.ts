import { defineCard } from '../CardContract';
import { CardThermo2 } from './CardThermo2';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['cardThermo2'] as const;

export const cardThermo2Module = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardThermo2,
});
