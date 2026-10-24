import { defineCard } from '../CardContract';
import { CardChart } from './CardChart';
import { initial, parseEntityUpd } from './parse';

export const pageTypes = ['cardChart', 'cardLChart'] as const;

export const cardChartModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    Component: CardChart,
});
