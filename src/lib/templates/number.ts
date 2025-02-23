import { Color } from '../const/Color';
import type { TemplateItems } from '../types/types';

export const numberTemplates: TemplateItems = {
    'number.volume': {
        role: '',
        adapter: '',
        type: 'button',

        data: {
            icon: {
                true: {
                    value: {
                        type: 'triggered',
                        mode: 'auto',
                        role: 'value.volume',
                        dp: '',
                        read: `{
                            if (val > 66) {
                                return 'volume-high';
                            }
                            if (val > 33) {
                                return 'volume-medium';
                            }
                            if (val > 0) {
                                return 'volume-low';
                            }
                            return 'volume-mute';
                        }`,
                    },
                    text: {
                        value: {
                            type: 'triggered',
                            mode: 'auto',
                            role: 'value.volume',
                            dp: '',
                        },
                        unit: { type: 'const', constVal: '%' },
                    },
                    color: { type: 'const', constVal: Color.Red },
                },
                false: undefined,
                scale: { type: 'const', constVal: { min: 0, max: 100 } },
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'value.volume',
                    dp: '',
                },
                set: {
                    type: 'state',
                    mode: 'auto',
                    role: 'level.volume',
                    dp: '',
                },
            },
            text: {
                true: { type: 'const', constVal: 'volume' },
                false: undefined,
            },
        },
    },
};
