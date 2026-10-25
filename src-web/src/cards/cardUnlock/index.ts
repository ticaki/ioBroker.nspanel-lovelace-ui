import { defineCard } from '../CardContract';
import { CardUnlock } from './CardUnlock';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['cardUnlock'] as const;

export const cardUnlockModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardUnlock,
});
