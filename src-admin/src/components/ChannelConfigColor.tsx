import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    type SelectChangeEvent,
} from '@mui/material';
import { Color, type RGB, type ColorScaleInput } from '../../../src/lib/const/Color';
import { type PageItemRoleDefaults } from '../../../src/lib/const/page-item-defaults';
import { I18n } from '@iobroker/adapter-react-v5';

export interface ChannelConfigColorProps {
    socket: any;
    adapterName?: string;
    instance?: number;
    open: boolean;
    onClose: () => void;
    /** Aktuelle Channel-Rolle, bestimmt die Default-Farben */
    channelRole: string | null;
    /** Ist der Channel eine Navigation? */
    isNavigation: boolean;
    /** Default-Colors für die gewählte Rolle */
    roleDefaults: PageItemRoleDefaults | null;
    /** TrueColor (ColorMax) aus Hauptdialog */
    trueColor: string;
    /** FalseColor (ColorMin) aus Hauptdialog */
    falseColor: string;
    /** Callback wenn Farben geändert werden */
    onColorChange: (trueColor: string, falseColor: string) => void;
}

interface ChannelConfigColorState {
    /** ColorBest für IconScaleElement */
    colorBest: string;
    /** Farbmodus */
    colorMode: 'mixed' | 'hue' | 'cie' | 'triGrad' | 'triGradAnchor' | 'quadriGrad' | 'quadriGradAnchor';
    /** Logarithmische Skalierung */
    colorLog10: '' | 'max' | 'min';
    /** Minimaler Wert */
    valMin: number;
    /** Maximaler Wert */
    valMax: number;
    /** Optionaler Bestwert – undefined bedeutet kein Bestwert */
    valBest: number | undefined;
    /** Icon-Skala Minimum */
    valIconMin: number;
    /** Icon-Skala Maximum */
    valIconMax: number;
    /** Farbthema-ID aus der Adapter-Konfiguration (0=default,1=topical,2=technical,3=sunset,4=volcano,5=custom) */
    adapterColorTheme: number;
    /** Lokale Kopie von trueColor */
    localTrueColor: string;
    /** Lokale Kopie von falseColor */
    localFalseColor: string;
}

/**
 * Dialog zum Konfigurieren von Farbeinstellungen für PageItems
 * mit IconScaleElement-Unterstützung.
 */
class ChannelConfigColor extends React.Component<ChannelConfigColorProps, ChannelConfigColorState> {
    constructor(props: ChannelConfigColorProps) {
        super(props);
        this.state = {
            colorBest: '',
            colorMode: 'mixed',
            colorLog10: '',
            valMin: 0,
            valMax: 100,
            valBest: undefined,
            valIconMin: 0,
            valIconMax: 100,
            adapterColorTheme: 0,
            localTrueColor: props.trueColor,
            localFalseColor: props.falseColor,
        };
    }

    override componentDidMount(): void {
        void this.loadAdapterColorTheme();
    }

    override componentDidUpdate(prevProps: ChannelConfigColorProps): void {
        // Lokale Kopien aktualisieren wenn Props sich ändern
        if (prevProps.trueColor !== this.props.trueColor || prevProps.falseColor !== this.props.falseColor) {
            this.setState({
                localTrueColor: this.props.trueColor,
                localFalseColor: this.props.falseColor,
            });
        }
        // Theme neu laden wenn Dialog geöffnet wird
        if (!prevProps.open && this.props.open) {
            void this.loadAdapterColorTheme();
        }
    }

    private async loadAdapterColorTheme(): Promise<void> {
        const { socket, adapterName = 'nspanel-lovelace-ui', instance = 0 } = this.props;
        if (!socket) {
            return;
        }
        try {
            const obj: ioBroker.Object | null | undefined = await socket.getObject(
                `system.adapter.${adapterName}.${instance}`,
            );
            const t = (obj as any)?.native?.colorTheme;
            this.setState({ adapterColorTheme: typeof t === 'number' ? t : 0 });
        } catch {
            /* keep default 0 */
        }
    }

    private getThemeColors(): { on: RGB; off: RGB } {
        const theme = Color.getThemeByIndex(this.state.adapterColorTheme);
        return { on: theme.on, off: theme.off };
    }

    /**
     * Returns on/off colors for the currently selected role.
     * Falls back to the generic theme colors when no role-specific entry is found.
     */
    private getRoleDefaultColors(): { on: RGB; off: RGB } {
        const { roleDefaults } = this.props;
        const themeColors = this.getThemeColors();
        if (!roleDefaults) {
            return themeColors;
        }
        const on = this.getThemeColorForKey(roleDefaults.colorOn) ?? themeColors.on;
        const off = this.getThemeColorForKey(roleDefaults.colorOff) ?? themeColors.off;
        return { on, off };
    }

    /**
     * Resolves a color key (e.g. 'on', 'activated', 'Green') to an RGB value
     * using the currently selected color theme.
     *
     * @param colorKey The color key to resolve
     */
    private getThemeColorForKey(colorKey: string): RGB | null {
        const theme = Color.getThemeByIndex(this.state.adapterColorTheme);
        // Theme keys (lowercase, e.g. 'on', 'activated', 'open')
        if (colorKey in theme) {
            const val = (theme as unknown as Record<string, unknown>)[colorKey];
            if (typeof val === 'object' && val !== null && 'r' in val) {
                return val as RGB;
            }
        }
        // Named Color statics (PascalCase, e.g. 'Green', 'Red')
        if (colorKey in Color) {
            const val = (Color as unknown as Record<string, unknown>)[colorKey];
            if (typeof val === 'object' && val !== null && 'r' in val) {
                return val as RGB;
            }
        }
        return null;
    }

    /** Berechnet die Ganzzahl-Werte für die Farbvorschau-Tabelle. */
    private buildColorPreviewValues(): number[] {
        const { valMin, valMax, valBest } = this.state;
        const lo = Math.min(valMin, valMax);
        const hi = Math.max(valMin, valMax);
        const range = hi - lo;
        if (range <= 1) {
            return [];
        }
        const numCols = Math.min(30, range);
        const values: number[] = [];
        for (let i = 0; i < numCols; i++) {
            values.push(Math.round(lo + (i * range) / (numCols - 1)));
        }
        // Deduplizieren (Rundung kann Duplikate erzeugen)
        let unique = [...new Set(values)].sort((a, b) => a - b);
        // val_best sicherstellen (nur wenn gesetzt)
        if (valBest !== undefined) {
            const best = Math.min(hi, Math.max(lo, Math.round(valBest)));
            if (!unique.includes(best)) {
                let closestIdx = -1;
                let minDist = Infinity;
                for (let i = 1; i < unique.length - 1; i++) {
                    const d = Math.abs(unique[i] - best);
                    if (d < minDist) {
                        minDist = d;
                        closestIdx = i;
                    }
                }
                if (closestIdx >= 0) {
                    unique[closestIdx] = best;
                    unique = unique.sort((a, b) => a - b);
                }
            }
        }
        return unique;
    }

    /**
     * Renders a read-only color swatch with a label for the "default color" case.
     * Pass the resolved default RGB; when null, colour swatch is omitted.
     *
     * @param label Field label shown above the swatch
     * @param rgb Default RGB derived from the current theme (null = no swatch)
     */
    private renderColorDefault(label: string, rgb: RGB | null): React.JSX.Element {
        const hex = rgb ? Color.ConvertRGBtoHex(rgb.r, rgb.g, rgb.b) : '';
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                >
                    {label}
                </Typography>
                {rgb ? (
                    <Box
                        sx={{
                            width: '100%',
                            height: 40,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            backgroundColor: hex,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'white',
                                textShadow: '0 0 2px black',
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                            }}
                        >
                            {hex}
                        </Typography>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            width: '100%',
                            height: 40,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{ color: 'text.disabled' }}
                        >
                            {I18n.t('channelConfigColor_noColor')}
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }

    /** Rendert die kompakte Farbvorschau-Tabelle unterhalb der Skalen-Einstellungen. */
    private renderColorPreviewTable(): React.JSX.Element | null {
        const { valMin, valMax, valBest, colorBest, colorMode, colorLog10, localTrueColor, localFalseColor } =
            this.state;
        const range = Math.abs(valMax - valMin);
        if (range <= 1) {
            return null;
        }
        const values = this.buildColorPreviewValues();
        if (values.length === 0) {
            return null;
        }

        const roleColors = this.getRoleDefaultColors();
        const cto: RGB = localTrueColor !== '' ? Color.ConvertHexToRgb(localTrueColor) : roleColors.on;
        const cfrom: RGB = localFalseColor !== '' ? Color.ConvertHexToRgb(localFalseColor) : roleColors.off;
        const lo = Math.min(valMin, valMax);
        const hi = Math.max(valMin, valMax);
        const best = valBest !== undefined ? Math.min(hi, Math.max(lo, Math.round(valBest))) : undefined;
        const colorBestRgb: RGB | undefined = colorBest !== '' ? Color.ConvertHexToRgb(colorBest) : undefined;
        const def: RGB = { r: 128, g: 128, b: 128 };
        const scale: ColorScaleInput = {
            val_min: valMin,
            val_max: valMax,
            val_best: best,
            color_best: colorBestRgb,
            mode: colorMode,
            log10: colorLog10 !== '' ? colorLog10 : undefined,
        };

        return (
            <Box sx={{ mt: 1, width: '100%', overflowX: 'hidden' }}>
                <Box
                    sx={{
                        display: 'table',
                        width: '100%',
                        tableLayout: 'fixed',
                        borderCollapse: 'collapse',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 0.5,
                    }}
                >
                    {/* Zeile 1: Zahlenwerte */}
                    <Box sx={{ display: 'table-row' }}>
                        {values.map(v => (
                            <Box
                                key={`val-${v}`}
                                sx={{
                                    display: 'table-cell',
                                    textAlign: 'center',
                                    fontSize: '0.55rem',
                                    lineHeight: 1.3,
                                    py: 0.25,
                                    borderLeft: '1px solid',
                                    borderColor: 'divider',
                                    fontWeight: v === lo || v === hi || v === best ? 'bold' : 'normal',
                                    color: v === lo || v === hi || v === best ? 'text.primary' : 'text.secondary',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {v}
                            </Box>
                        ))}
                    </Box>
                    {/* Zeile 2: Farben */}
                    <Box sx={{ display: 'table-row' }}>
                        {values.map(v => {
                            const rgb = Color.computeNumberScaleColor(v, cto, cfrom, scale, def);
                            return (
                                <Box
                                    key={`col-${v}`}
                                    sx={{
                                        display: 'table-cell',
                                        height: 14,
                                        backgroundColor: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
                                        borderLeft: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                />
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        );
    }

    private handleClose = (): void => {
        // Änderungen an Parent durchreichen
        this.props.onColorChange(this.state.localTrueColor, this.state.localFalseColor);
        this.props.onClose();
    };

    render(): React.JSX.Element {
        const { open } = this.props;
        const { colorBest, colorMode, colorLog10, valMin, valMax, valBest, valIconMin, valIconMax } = this.state;

        return (
            <Dialog
                open={open}
                onClose={(event, reason) => {
                    // Dialog darf nur über Button geschlossen werden
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                        return;
                    }
                }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>{I18n.t('channelConfigColor_optionsTitle')}</DialogTitle>
                <DialogContent>
                    {/* Farbeinstellungen & IconScaleElement */}
                    {
                        <Box
                            sx={{
                                mb: 3,
                                p: 2,
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                            }}
                        >
                            {/* Farbfelder */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* Color Min (falseColor) */}
                                <Box sx={{ flex: 1 }}>
                                    {this.state.localFalseColor === '' ? (
                                        <>
                                            {this.renderColorDefault(
                                                I18n.t('channelConfigColor_colorMin'),
                                                this.getRoleDefaultColors().off,
                                            )}
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => {
                                                    const c = this.getRoleDefaultColors().off;
                                                    this.setState({
                                                        localFalseColor: Color.ConvertRGBtoHex(c.r, c.g, c.b),
                                                    });
                                                }}
                                                sx={{ mt: 1 }}
                                            >
                                                {I18n.t('channelConfigColor_setColor')}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <TextField
                                                variant="standard"
                                                type="color"
                                                label={I18n.t('channelConfigColor_colorMin')}
                                                value={this.state.localFalseColor}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    this.setState({ localFalseColor: e.target.value })
                                                }
                                                fullWidth
                                            />
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => this.setState({ localFalseColor: '' })}
                                                sx={{ mt: 1 }}
                                            >
                                                {I18n.t('channelConfigColor_resetColor')}
                                            </Button>
                                        </>
                                    )}
                                </Box>

                                {/* Color Max (trueColor) */}
                                <Box sx={{ flex: 1 }}>
                                    {this.state.localTrueColor === '' ? (
                                        <>
                                            {this.renderColorDefault(
                                                I18n.t('channelConfigColor_colorMax'),
                                                this.getRoleDefaultColors().on,
                                            )}
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => {
                                                    const c = this.getRoleDefaultColors().on;
                                                    this.setState({
                                                        localTrueColor: Color.ConvertRGBtoHex(c.r, c.g, c.b),
                                                    });
                                                }}
                                                sx={{ mt: 1 }}
                                            >
                                                {I18n.t('channelConfigColor_setColor')}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <TextField
                                                variant="standard"
                                                type="color"
                                                label={I18n.t('channelConfigColor_colorMax')}
                                                value={this.state.localTrueColor}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    this.setState({ localTrueColor: e.target.value })
                                                }
                                                fullWidth
                                            />
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => this.setState({ localTrueColor: '' })}
                                                sx={{ mt: 1 }}
                                            >
                                                {I18n.t('channelConfigColor_resetColor')}
                                            </Button>
                                        </>
                                    )}
                                </Box>

                                {/* Color Best */}
                                <Box sx={{ flex: 1 }}>
                                    {colorBest === '' ? (
                                        <>
                                            {this.renderColorDefault(I18n.t('channelConfigColor_colorBest'), null)}
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => this.setState({ colorBest: '#ffaa00' })}
                                                sx={{ mt: 1 }}
                                            >
                                                {I18n.t('channelConfigColor_setColor')}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <TextField
                                                variant="standard"
                                                type="color"
                                                label={I18n.t('channelConfigColor_colorBest')}
                                                value={colorBest}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    this.setState({ colorBest: e.target.value })
                                                }
                                                fullWidth
                                            />
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => this.setState({ colorBest: '' })}
                                                sx={{ mt: 1 }}
                                            >
                                                {I18n.t('channelConfigColor_resetColor')}
                                            </Button>
                                        </>
                                    )}
                                </Box>
                            </Box>

                            {/* val_min, val_max, val_best */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    variant="standard"
                                    type="number"
                                    label={I18n.t('channelConfigColor_valMin')}
                                    value={valMin}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        this.setState({ valMin: Number(e.target.value) })
                                    }
                                    fullWidth
                                />
                                <TextField
                                    variant="standard"
                                    type="number"
                                    label={I18n.t('channelConfigColor_valMax')}
                                    value={valMax}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        this.setState({ valMax: Number(e.target.value) })
                                    }
                                    fullWidth
                                />
                                <TextField
                                    variant="standard"
                                    type="number"
                                    label={I18n.t('channelConfigColor_valBest')}
                                    value={valBest ?? ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const v = e.target.value;
                                        this.setState({ valBest: v === '' ? undefined : Number(v) });
                                    }}
                                    placeholder={I18n.t('channelConfigColor_valBestPlaceholder')}
                                    fullWidth
                                />
                            </Box>

                            {/* Color Mode Select */}
                            <FormControl
                                variant="standard"
                                fullWidth
                            >
                                <InputLabel>{I18n.t('channelConfigColor_colorMode')}</InputLabel>
                                <Select
                                    value={colorMode}
                                    onChange={(e: SelectChangeEvent<string>) =>
                                        this.setState({
                                            colorMode: e.target.value as typeof this.state.colorMode,
                                        })
                                    }
                                    label={I18n.t('channelConfigColor_colorMode')}
                                >
                                    <MenuItem value="mixed">{I18n.t('channelConfigColor_colorMode_mixed')}</MenuItem>
                                    <MenuItem value="hue">{I18n.t('channelConfigColor_colorMode_hue')}</MenuItem>
                                    <MenuItem value="cie">{I18n.t('channelConfigColor_colorMode_cie')}</MenuItem>
                                    <MenuItem value="triGrad">
                                        {I18n.t('channelConfigColor_colorMode_triGrad')}
                                    </MenuItem>
                                    <MenuItem value="triGradAnchor">
                                        {I18n.t('channelConfigColor_colorMode_triGradAnchor')}
                                    </MenuItem>
                                    <MenuItem value="quadriGrad">
                                        {I18n.t('channelConfigColor_colorMode_quadriGrad')}
                                    </MenuItem>
                                    <MenuItem value="quadriGradAnchor">
                                        {I18n.t('channelConfigColor_colorMode_quadriGradAnchor')}
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            {/* Log10 Select */}
                            <FormControl
                                variant="standard"
                                fullWidth
                            >
                                <InputLabel>{I18n.t('channelConfigColor_log10')}</InputLabel>
                                <Select
                                    value={colorLog10}
                                    onChange={(e: SelectChangeEvent<string>) =>
                                        this.setState({
                                            colorLog10: e.target.value as typeof this.state.colorLog10,
                                        })
                                    }
                                    label={I18n.t('channelConfigColor_log10')}
                                >
                                    <MenuItem value="">{I18n.t('channelConfigColor_log10_linear')}</MenuItem>
                                    <MenuItem value="max">{I18n.t('channelConfigColor_log10_max')}</MenuItem>
                                    <MenuItem value="min">{I18n.t('channelConfigColor_log10_min')}</MenuItem>
                                </Select>
                            </FormControl>

                            {/* valIcon_min und valIcon_max */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    variant="standard"
                                    type="number"
                                    label={I18n.t('channelConfigColor_valIconMin')}
                                    value={valIconMin}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        this.setState({ valIconMin: Number(e.target.value) })
                                    }
                                    fullWidth
                                />
                                <TextField
                                    variant="standard"
                                    type="number"
                                    label={I18n.t('channelConfigColor_valIconMax')}
                                    value={valIconMax}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        this.setState({ valIconMax: Number(e.target.value) })
                                    }
                                    fullWidth
                                />
                            </Box>

                            {/* Farbvorschau-Tabelle */}
                            {this.renderColorPreviewTable()}
                        </Box>
                    }
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose}>{I18n.t('channelConfigColor_close')}</Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default ChannelConfigColor;
