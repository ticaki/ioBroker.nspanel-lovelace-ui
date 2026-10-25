import { defineCard } from '../CardContract';
import { CardMedia } from './CardMedia';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['cardMedia'] as const;

export const cardMediaModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardMedia,
});
