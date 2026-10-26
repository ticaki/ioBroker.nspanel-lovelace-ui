import { defineCard } from '../CardContract';
import { PopupLight } from './PopupLight';
import { initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['popupLight', 'popupLightNew'] as const;

export const popupLightModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    Component: PopupLight,
});
