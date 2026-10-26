import { defineCard } from '../CardContract';
import { PopupTimer } from './PopupTimer';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['popupTimer'] as const;

export const popupTimerModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: PopupTimer,
});
