import { defineCard } from '../CardContract';
import { Screensaver } from './Screensaver';
import { handleCommand, initial, parseEntityUpd } from './parse';

export const pageTypes = ['screensaver', 'screensaver2', 'screensaver3'] as const;

export const screensaverModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    handleCommand,
    Component: Screensaver,
});
