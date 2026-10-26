import { defineCard } from '../CardContract';
import { CardSchedule } from './CardSchedule';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['cardSchedule'] as const;

export const cardScheduleModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardSchedule,
});
