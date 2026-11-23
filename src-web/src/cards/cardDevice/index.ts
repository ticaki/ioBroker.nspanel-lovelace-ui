import { defineCard } from '../CardContract';
import { CardDevice } from './CardDevice';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

export const pageTypes = ['cardDevice1', 'cardDevice2', 'cardDevice3'] as const;

export const cardDeviceModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    handleCommand,
    Component: CardDevice,
});
