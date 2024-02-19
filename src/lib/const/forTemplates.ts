import { ChangeTypeOfKeys } from '../types/pages';
import { IconEntryType } from '../types/type-pageItem';
import { DataItemsOptions } from '../types/types';
import * as Color from './Color';

export const lightIcon: ChangeTypeOfKeys<IconEntryType, DataItemsOptions> = {
    true: {
        value: { type: 'const', constVal: 'lightbulb' },
        color: { type: 'const', constVal: Color.Yellow },
    },
    false: {
        value: { type: 'const', constVal: 'lightbulb-outline' },
        color: { type: 'const', constVal: Color.HMIOff },
    },
    scale: undefined,
    maxBri: undefined,
    minBri: undefined,
};
