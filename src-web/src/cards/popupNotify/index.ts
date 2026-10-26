import { defineCard } from '../CardContract';
import { PopupNotify } from './PopupNotify';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['popupNotify', 'popupNotify2'] as const;

export const popupNotifyModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: PopupNotify,
});
