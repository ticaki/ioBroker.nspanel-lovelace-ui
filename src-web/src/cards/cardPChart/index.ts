import { defineCard } from '../CardContract';
import { CardPChart } from './CardPChart';
import { initial, parseEntityUpd } from './parse';

export const pageTypes = ['cardPChart'] as const;

export const cardPChartModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    Component: CardPChart,
});
