import { defineCard } from '../CardContract';
import { PopupShutter } from './PopupShutter';
import { initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['popupShutter', 'popupShutter2'] as const;

export const popupShutterModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    Component: PopupShutter,
});
