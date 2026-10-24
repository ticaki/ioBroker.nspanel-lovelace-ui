import { defineCard } from '../CardContract';
import { PageStartup } from './PageStartup';
import { handleCommand, initial, parseEntityUpd } from './parse';

export const pageTypes = ['pageStartup'] as const;

export const pageStartupModule = defineCard({
    pageTypes,
    initial,
    parseEntityUpd,
    handleCommand,
    Component: PageStartup,
});
