import type { PanelModel } from '../protocol/types';

export interface StageSize {
    width: number;
    height: number;
}

/** Native resolution of the display per model */
export function stageSize(model: PanelModel): StageSize {
    return model === 'us-p' ? { width: 320, height: 480 } : { width: 480, height: 320 };
}

export const theme = {
    /** display background */
    background: '#000000',
    /** default text colour (65535) */
    foreground: '#ffffff',
    /** inactive / disabled elements */
    muted: '#8a8a8a',
    /** the blue of the HMI (sliders, highlights) */
    accent: '#1a8fe3',
    fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    /** height of the title bar with the navigation icons */
    titleBarHeight: 60,
    /** default icon size of the navigation icons */
    navIconSize: 40,
    /** area below the display with the two hardware buttons */
    hardwareButtonsHeight: 48,
} as const;
