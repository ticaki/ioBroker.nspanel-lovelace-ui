import { defineCard } from '../CardContract';
import { PopupFan } from './PopupFan';
import { initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['popupFan'] as const;

export const popupFanModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    Component: PopupFan,
});
