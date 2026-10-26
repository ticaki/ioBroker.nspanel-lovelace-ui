import { defineCard } from '../CardContract';
import { CardAlarm } from './CardAlarm';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['cardAlarm'] as const;

export const cardAlarmModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardAlarm,
});
