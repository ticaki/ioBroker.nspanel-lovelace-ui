export type sendTemplates = {
    statusUpdate: Record<MessageStatusUpdate, string> & { eventType: 'statusUpdate' };
    weatherUpdate: {
        eventType: 'weatherUpdate';
        check?: {
            advanced: [
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName'>,
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName'>,
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName'>,
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName'>,
                Record<MessageWeatherUpdate, boolean>,
                Record<MessageWeatherUpdate, boolean>,
                Record<MessageWeatherUpdate, boolean>,
                Record<MessageWeatherUpdate, boolean>,
                Record<MessageWeatherUpdate, boolean>,
                Record<MessageWeatherUpdate, boolean>, // bottom
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName' | 'optionalValue'>,
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName' | 'optionalValue'>,
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName' | 'optionalValue'>,
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName' | 'optionalValue'>,
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName' | 'optionalValue'>,
            ];
            alternate: [
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName'>,
                Record<MessageWeatherUpdate, boolean>,
                Record<MessageWeatherUpdate, boolean>,
                Record<MessageWeatherUpdate, boolean>,
                Record<MessageWeatherUpdate, boolean>,
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName'>,
            ];
            standard: [
                Omit<Record<MessageWeatherUpdate, boolean>, 'displayName'>,
                Record<MessageWeatherUpdate, boolean>,
                Record<MessageWeatherUpdate, boolean>,
                Record<MessageWeatherUpdate, boolean>,
                Record<MessageWeatherUpdate, boolean>,
            ];
        };
        value: {
            advanced?: Record<MessageWeatherUpdate, string>[];
            alternate?: Record<MessageWeatherUpdate, string>[];
            standard?: Record<MessageWeatherUpdate, string>[];
        };
    };
};

export const weatherUpdateTestArray: Required<sendTemplates['weatherUpdate']['check']> = {
    advanced: [
        { icon: true, iconColor: true, optionalValue: true },
        { icon: true, iconColor: true, optionalValue: true },
        { icon: true, iconColor: true, optionalValue: true },
        { icon: true, iconColor: true, optionalValue: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: true, iconColor: true },
        { icon: true, iconColor: true },
        { icon: true, iconColor: true },
        { icon: true, iconColor: true },
        { icon: true, iconColor: true },
    ],
    standard: [
        { icon: true, iconColor: true, optionalValue: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
    ],
    alternate: [
        { icon: true, iconColor: true, optionalValue: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: true, iconColor: true, optionalValue: true, displayName: true },
        { icon: false, iconColor: false, optionalValue: false, displayName: false },
        { icon: true, iconColor: true, optionalValue: true },
    ],
};

export type MessageWeatherUpdate = 'icon' | 'iconColor' | 'displayName' | 'optionalValue'; // 'type' | 'intNameEntity' |  ignored
export type MessageStatusUpdate = 'icon1' | 'icon1Color' | 'icon2' | 'icon2Color' | 'icon1Font' | 'icon2Font';
