import { defineCard } from '../CardContract';
import { PopupSlider } from './PopupSlider';
import { initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['popupSlider'] as const;

export const popupSliderModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    Component: PopupSlider,
});
