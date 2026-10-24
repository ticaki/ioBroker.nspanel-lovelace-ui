import { defineCard } from '../CardContract';
import { CardPower } from './CardPower';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['cardPower'] as const;

export const cardPowerModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardPower,
});
