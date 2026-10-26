import { defineCard } from '../CardContract';
import { PopupThermo } from './PopupThermo';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['popupThermo'] as const;

export const popupThermoModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: PopupThermo,
});
