import { createTheme, type Theme } from '@mui/material/styles';
import type { IobTheme, ThemeName, ThemeType } from '@iobroker/gui-components';

export interface ThemeAwareProps {
    themeType?: ThemeType;
    themeName?: ThemeName;
    theme?: IobTheme;
}

/** Alle Theme-Namen, die eine dunkle Oberfläche ergeben - `blue` gehört dazu, `colored` nicht. */
const darkThemeNames: ThemeName[] = ['dark', 'blue', 'modernDark', 'NW', 'HA'];

/**
 * `themeName` allein sagt nichts über die Helligkeit aus: `blue` ist dunkel, `colored` hell, und
 * die im Admin als Light/Dark angebotenen Themes heissen intern `modernLight`/`modernDark`.
 * Verlässlich ist nur `themeType` bzw. der Palette-Modus des Themes.
 *
 * @param props Komponenten-Props, die Theme-Informationen enthalten können
 * @returns true, wenn die Oberfläche gerade dunkel dargestellt wird
 */
export function isDarkTheme(props: ThemeAwareProps): boolean {
    if (props.themeType) {
        return props.themeType === 'dark';
    }
    if (props.theme?.palette?.mode) {
        return props.theme.palette.mode === 'dark';
    }
    return props.themeName !== undefined && darkThemeNames.includes(props.themeName);
}

let lightSurfaceTheme: { key: string; theme: Theme } | null = null;

/**
 * Theme für Flächen, die in jedem Theme eine helle Signalfarbe tragen (die eingefärbten
 * Panel-Karten). Es stellt Schrift, Rahmen und deaktivierte Elemente auf dunkel um - in einem
 * dunklen Theme wäre die Schrift sonst weiß auf hell, und die hellen Themes bringen teils
 * Rahmenfarben mit, die nur auf weißem Papier stehen (`modernLight` zeichnet Eingabefelder mit
 * `#E2E8F0`). Schriftart, Schriftgrößen und die Akzentfarben des Originals bleiben erhalten.
 *
 * @param theme Das aktuelle Theme der Oberfläche
 * @param background Die Hintergrundfarbe der Fläche
 * @returns Ein helles Theme für den Inhalt dieser Fläche
 */
export function getLightSurfaceTheme(theme: IobTheme, background: string): Theme {
    const key = `${theme.palette.primary.main}|${theme.palette.secondary.main}|${background}|${String(
        theme.typography.fontFamily,
    )}`;
    if (lightSurfaceTheme?.key === key) {
        return lightSurfaceTheme.theme;
    }
    const created = createTheme({
        palette: {
            mode: 'light',
            primary: { main: theme.palette.primary.main },
            secondary: { main: theme.palette.secondary.main },
            background: { paper: background, default: background },
        },
        typography: theme.typography,
        shape: theme.shape,
        components: {
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        // Auf der farbigen Fläche braucht der Rahmen mehr Kontrast als der
                        // MUI-Standard von rgba(0, 0, 0, 0.23) auf weißem Grund
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.42)' },
                    },
                },
            },
        },
    });
    lightSurfaceTheme = { key, theme: created };
    return created;
}
