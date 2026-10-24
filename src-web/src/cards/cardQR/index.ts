import { defineCard } from '../CardContract';
import { CardQR } from './CardQR';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['cardQR'] as const;

export const cardQRModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardQR,
});
