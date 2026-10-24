import { defineCard } from '../CardContract';
import { PopupInSel } from './PopupInSel';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['popupInSel'] as const;

export const popupInSelModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: PopupInSel,
});
