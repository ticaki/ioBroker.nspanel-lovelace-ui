import { defineCard } from '../CardContract';
import { PopupNotify3 } from './PopupNotify3';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['popupNotify3'] as const;

export const popupNotify3Module = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: PopupNotify3,
});
