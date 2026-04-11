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
    Paper,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    type SelectChangeEvent,
} from '@mui/material';
import { I18n } from '@iobroker/adapter-react-v5';
import { EntitySelector } from './EntitySelector';
import type { ValueEntryConfig } from '../../../src/lib/types/adminShareConfig';

/** Feature flags passed by the parent to show/hide optional sections. */
type ValueEntryDialogFeatures = {
    /** Show the Unit field (only has effect when value state type is number, or when forceUnit is true). Default: true */
    showUnit?: boolean;
    /** Show the Text Size select. Default: true */
    showTextSize?: boolean;
    /** Show the Date Format section (only has effect when value state type is number/string, or when forceDateFormat is true). Default: true */
    showDateFormat?: boolean;
    /**
     * Controls the preview field:
     * - `undefined` / not set (default): show preview with real state value (socket call)
     * - `true`: show preview with a structural placeholder instead of loading the real value
     * - `false`: hide the preview field entirely
     */
    showPreview?: boolean;
    /**
     * Force the Unit field to be visible regardless of the detected value state type.
     * Use when the value source is a channel (no common.type) but units are still relevant.
     * Default: false
     */
    forceUnit?: boolean;
    /**
     * Force the Date Format section to be visible regardless of the detected value state type.
     * Use when the value source is a channel (no common.type) but date formatting is still relevant.
     * Default: false
     */
    forceDateFormat?: boolean;
    /**
     * Make the Value State ID field read-only (no typing or dialog picker).
     * Useful when the field is pre-filled from outside and must not be changed.
     * Default: false
     */
    readOnlyValueStateId?: boolean;
};

type ValueEntryDialogProps = {
    socket: any;
    theme: any;
    themeType?: string;
    onSave?: (config: ValueEntryConfig) => void;
    /** Called when the user clicks the delete button – parent should clear valueEntry */
    onDelete?: () => void;
    /** Called whenever the preview text is recomputed while the dialog is open */
    onPreviewUpdate?: (text: string) => void;
    /** Controls which optional fields are visible. Defaults to all enabled. */
    features?: ValueEntryDialogFeatures;
    /**
     * Allowed ioBroker state types for the main value selector.
     * Defaults to ['number', 'string'] when omitted.
     */
    valueStateTypes?: ('boolean' | 'number' | 'string')[];
    /**
     * Optional custom filter function for the main value EntitySelector.
     * When provided, overrides the default type-based filter derived from `valueStateTypes`.
     */
    mainValueFilterFunc?: (obj: ioBroker.Object) => boolean;
    /**
     * Optional transform applied to the ID selected via the main value dialog picker.
     * Useful for reducing sub-state IDs to their channel/device prefix.
     */
    mainValueTransformId?: (id: string) => string;
};

interface ValueEntryDialogState {
    open: boolean;
    valueStateId: string;
    /**
     * null = free text / not yet resolved;
     * 'string' | 'number' | 'boolean' = common.type of the resolved ioBroker state.
     */
    valueStateType: 'string' | 'number' | 'boolean' | null;
    unit: string;
    prefix: string;
    suffix: string;
    /** Locale used for date formatting – pre-filled from navigator.language */
    dateLocal: string;
    /** User input: JSON of Intl.DateTimeFormatOptions */
    dateFormatOptions: string;
    /** Whether dateFormatOptions can be parsed and applied via toLocaleString */
    dateFormatOptionsValid: boolean;
    /** Text size 0–5 (undefined = default/auto) */
    textSize: 0 | 1 | 2 | 3 | 4 | 5 | undefined;
    previewText: string;
    previewLoading: boolean;
}

/** Debounce delay in ms before the preview is recomputed */
const PREVIEW_DEBOUNCE_MS = 300;

/** Returns the browser locale string (e.g. 'de-DE'). */
function getBrowserLocale(): string {
    return typeof navigator !== 'undefined' ? navigator.language : 'en-US';
}

/**
 * Tries to parse `json` as Intl.DateTimeFormatOptions and probes it against a
 * sample date. Returns the parsed options when valid, otherwise null.
 *
 * @param json  Raw user input
 */
function tryParseDateFormatOptions(json: string): Intl.DateTimeFormatOptions | null {
    const trimmed = json.trim();
    if (!trimmed) {
        return null;
    }
    try {
        const opts: unknown = JSON.parse(trimmed);
        if (typeof opts !== 'object' || opts === null || Array.isArray(opts)) {
            return null;
        }
        // Probe: apply to a test date to validate option keys
        new Date(0).toLocaleString('en-US', opts as Intl.DateTimeFormatOptions);
        return opts as Intl.DateTimeFormatOptions;
    } catch {
        return null;
    }
}

/**
 * Dialog for configuring value display settings (prefix, unit, suffix, date format).
 * Models the inputs consumed by getValueEntryString() in tools.ts.
 */
class ValueEntryDialog extends React.Component<ValueEntryDialogProps, ValueEntryDialogState> {
    private previewTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(props: ValueEntryDialogProps) {
        super(props);
        this.state = {
            open: false,
            valueStateId: '',
            valueStateType: null,
            unit: '',
            prefix: '',
            suffix: '',
            dateLocal: getBrowserLocale(),
            dateFormatOptions: '',
            dateFormatOptionsValid: false,
            textSize: undefined,
            previewText: '',
            previewLoading: false,
        };
    }

    /**
     * Opens the dialog and pre-fills all fields from an existing config.
     * Resolves the value state type, then triggers a preview recompute.
     *
     * @param config  Optional existing configuration to restore
     */
    public openWith(config?: Partial<ValueEntryConfig>): void {
        if (this.previewTimer !== null) {
            clearTimeout(this.previewTimer);
        }
        const df = config?.dateFormat;
        const dateLocal = (df && typeof df === 'object' ? df.local : null) ?? getBrowserLocale();
        const rawFormat = df && typeof df === 'object' ? df.format : null;
        const dateFormatOptions = rawFormat != null ? JSON.stringify(rawFormat, null, 2) : '';

        this.setState(
            {
                open: true,
                valueStateId: config?.valueStateId ?? '',
                valueStateType: null,
                unit: config?.unit ?? '',
                prefix: config?.prefix ?? '',
                suffix: config?.suffix ?? '',
                dateLocal,
                dateFormatOptions,
                dateFormatOptionsValid: tryParseDateFormatOptions(dateFormatOptions) !== null,
                textSize: config?.textSize ?? undefined,
                previewText: '',
                previewLoading: true,
            },
            () => {
                const id = this.state.valueStateId;
                if (id) {
                    void this.resolveValueStateType(id);
                } else {
                    this.previewTimer = setTimeout(() => void this.computePreview(), PREVIEW_DEBOUNCE_MS);
                }
            },
        );
    }

    /**
     * Silently loads `config` into internal state and triggers a preview
     * computation without opening the dialog.
     * `onPreviewUpdate` is called once the preview is ready.
     *
     * @param config  Configuration to preview
     */
    public triggerPreviewFor(config: Partial<ValueEntryConfig>): void {
        if (this.previewTimer !== null) {
            clearTimeout(this.previewTimer);
        }
        const df = config?.dateFormat;
        const dateLocal = (df && typeof df === 'object' ? df.local : null) ?? getBrowserLocale();
        const rawFormat = df && typeof df === 'object' ? df.format : null;
        const dateFormatOptions = rawFormat != null ? JSON.stringify(rawFormat, null, 2) : '';

        this.setState(
            {
                valueStateId: config?.valueStateId ?? '',
                valueStateType: null,
                unit: config?.unit ?? '',
                prefix: config?.prefix ?? '',
                suffix: config?.suffix ?? '',
                dateLocal,
                dateFormatOptions,
                dateFormatOptionsValid: tryParseDateFormatOptions(dateFormatOptions) !== null,
                textSize: config?.textSize ?? undefined,
                previewText: '',
                previewLoading: true,
            },
            () => {
                const id = this.state.valueStateId;
                if (id) {
                    void this.resolveValueStateType(id);
                } else {
                    this.previewTimer = setTimeout(() => void this.computePreview(), PREVIEW_DEBOUNCE_MS);
                }
            },
        );
    }

    override componentWillUnmount(): void {
        if (this.previewTimer !== null) {
            clearTimeout(this.previewTimer);
        }
    }

    private handleClose = (): void => {
        this.setState({ open: false });
    };

    private handleSave = (): void => {
        const { valueStateId, unit, prefix, suffix, dateLocal, dateFormatOptions, textSize } = this.state;
        const parsedFormat = tryParseDateFormatOptions(dateFormatOptions);
        const dateFormat: ValueEntryConfig['dateFormat'] =
            parsedFormat !== null ? { local: dateLocal, format: parsedFormat } : '';
        this.props.onSave?.({ valueStateId, unit, prefix, suffix, dateFormat, textSize });
        this.setState({ open: false });
    };

    private schedulePreviewUpdate(): void {
        if (this.previewTimer !== null) {
            clearTimeout(this.previewTimer);
        }
        this.setState({ previewLoading: true });
        this.previewTimer = setTimeout(() => void this.computePreview(), PREVIEW_DEBOUNCE_MS);
    }

    /**
     * Heuristic: does the string look like an ioBroker state ID?
     * Used to decide whether to call socket.getObject.
     *
     * @param value  Candidate string
     */
    private looksLikeStateId(value: string): boolean {
        return value.length >= 5 && value.includes('.') && !value.includes(' ');
    }

    /**
     * Resolves `valueStateId` via socket.getObject and updates `valueStateType`.
     * Also auto-fills `unit` for number states. Schedules a preview refresh.
     *
     * @param id  Current value of `valueStateId`
     */
    private async resolveValueStateType(id: string): Promise<void> {
        const { socket } = this.props;
        if (!id || !socket || !this.looksLikeStateId(id)) {
            this.setState({ valueStateType: null }, () => this.schedulePreviewUpdate());
            return;
        }
        try {
            const obj: ioBroker.Object | null | undefined = await (socket.getObject(id) as Promise<
                ioBroker.Object | null | undefined
            >);
            if (obj?.type === 'state') {
                const stateObj = obj as ioBroker.StateObject;
                const t = stateObj.common.type;
                const vt: 'string' | 'number' | 'boolean' | null =
                    t === 'number' ? 'number' : t === 'string' ? 'string' : t === 'boolean' ? 'boolean' : null;
                const autoUnit = t === 'number' ? (stateObj.common.unit ?? this.state.unit) : this.state.unit;
                this.setState({ valueStateType: vt, unit: autoUnit }, () => this.schedulePreviewUpdate());
            } else {
                this.setState({ valueStateType: null }, () => this.schedulePreviewUpdate());
            }
        } catch {
            this.setState({ valueStateType: null }, () => this.schedulePreviewUpdate());
        }
    }

    /**
     * Tries to resolve `value` as an ioBroker state and return its current val.
     * Falls back to returning `value` unchanged if it is not a valid state ID.
     *
     * @param value  State ID or plain string
     */
    private async resolveIfState(value: string): Promise<string> {
        const { socket } = this.props;
        if (!value || !socket || !this.looksLikeStateId(value)) {
            return value;
        }
        try {
            const obj: ioBroker.Object | null | undefined = await (socket.getObject(value) as Promise<
                ioBroker.Object | null | undefined
            >);
            if (obj?.type !== 'state') {
                return value;
            }
            const st: ioBroker.State | null | undefined = await (socket.getState(value) as Promise<
                ioBroker.State | null | undefined
            >);
            return st?.val != null ? String(st.val) : value;
        } catch {
            return value;
        }
    }

    /** Builds the preview string from all current field values. */
    private async computePreview(): Promise<void> {
        const { socket } = this.props;
        const usePlaceholder = this.props.features?.showPreview === false;
        const { valueStateId, unit, prefix, suffix, dateLocal, dateFormatOptions, valueStateType } = this.state;

        const prefixResolved = await this.resolveIfState(prefix);
        const suffixResolved = await this.resolveIfState(suffix);

        // Main value: placeholder when showPreview===false, otherwise load from state
        let mainValue: string | number | null = null;
        if (valueStateId) {
            if (usePlaceholder) {
                // Structural preview: use a symbolic placeholder, no socket call
                mainValue = '<value>';
            } else if (valueStateType !== null && socket && this.looksLikeStateId(valueStateId)) {
                try {
                    const st: ioBroker.State | null | undefined = await (socket.getState(valueStateId) as Promise<
                        ioBroker.State | null | undefined
                    >);
                    mainValue = st?.val != null ? (st.val as string | number) : null;
                } catch {
                    // keep null
                }
            } else {
                // Free text – display as-is
                mainValue = valueStateId;
            }
        }

        let mainResolved: string;
        if (mainValue === null) {
            mainResolved = valueStateId ? `${valueStateId}` : '';
        } else {
            const parsedOpts = tryParseDateFormatOptions(dateFormatOptions);
            if (parsedOpts !== null) {
                // For numbers treat as Unix-ms timestamp; for strings try ISO date parsing (new Date)
                const isValidTimestamp = typeof mainValue === 'number' && mainValue >= 0;
                const d = isValidTimestamp ? new Date(mainValue as number) : new Date(String(mainValue));
                if (!isNaN(d.getTime())) {
                    try {
                        mainResolved = d.toLocaleString(dateLocal, parsedOpts);
                    } catch {
                        mainResolved = String(mainValue);
                    }
                } else {
                    mainResolved = String(mainValue);
                }
            } else {
                mainResolved = String(mainValue);
            }
        }

        const newPreviewText = `${prefixResolved}${mainResolved}${valueStateType === 'number' ? unit : ''}${suffixResolved}`;
        this.setState({ previewLoading: false, previewText: newPreviewText }, () => {
            this.props.onPreviewUpdate?.(newPreviewText);
        });
    }

    private handleValueStateIdChange = (id: string): void => {
        // Reset type on typed change; re-resolve on commit
        this.setState({ valueStateId: id, valueStateType: null }, () => this.schedulePreviewUpdate());
    };

    private handleValueStateIdCommit = (id: string): void => {
        void this.resolveValueStateType(id);
    };

    private handleDateFormatOptionsChange = (value: string): void => {
        const valid = tryParseDateFormatOptions(value) !== null;
        this.setState({ dateFormatOptions: value, dateFormatOptionsValid: valid }, () => this.schedulePreviewUpdate());
    };

    /**
     * Filter for prefix/suffix EntitySelectors: string or number states.
     *
     * @param obj
     */
    private readonly stringNumberStateFilterFunc = (obj: ioBroker.Object): boolean => {
        if (obj.type !== 'state') {
            return false;
        }
        const st = obj as ioBroker.StateObject;
        return st.common.type === 'string' || st.common.type === 'number';
    };

    /**
     * Filter for the main value EntitySelector.
     * Uses `valueStateTypes` prop when provided; defaults to string + number.
     *
     * @param obj
     */
    private readonly mainStateFilterFunc = (obj: ioBroker.Object): boolean => {
        if (obj.type !== 'state') {
            return false;
        }
        const st = obj as ioBroker.StateObject;
        const allowed = this.props.valueStateTypes ?? ['number', 'string'];
        return (allowed as string[]).includes(st.common.type);
    };

    render(): React.JSX.Element {
        const {
            open,
            valueStateId,
            valueStateType,
            unit,
            prefix,
            suffix,
            dateLocal,
            dateFormatOptions,
            dateFormatOptionsValid,
            textSize,
            previewText,
            previewLoading,
        } = this.state;
        const { socket, theme, themeType } = this.props;

        const features = this.props.features ?? {};
        const showUnit = features.showUnit !== false && (valueStateType === 'number' || features.forceUnit === true);
        const showTextSize = features.showTextSize !== false;
        // showDateFormat: controlled by features AND type check – bypassed by forceDateFormat
        const showDateFormat =
            features.showDateFormat !== false &&
            (features.forceDateFormat === true || valueStateType === 'number' || valueStateType === 'string');
        // showPreview: undefined/not-set = show with real value; true = show with placeholder; false = hide
        const readOnlyValueStateId = features.readOnlyValueStateId === true;

        return (
            <Dialog
                open={open}
                onClose={this.handleClose}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>{I18n.t('valueEntryDialog_title')}</DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            mt: 1,
                        }}
                    >
                        {/* Value State ID – highlighted box */}
                        <Paper
                            variant="outlined"
                            sx={{ p: 1.5, borderColor: 'primary.main', borderWidth: 2 }}
                        >
                            <Typography
                                variant="subtitle2"
                                color="primary"
                                sx={{ mb: 0.5 }}
                            >
                                {I18n.t('valueEntryDialog_valueStateLabel')}
                            </Typography>
                            <EntitySelector
                                label={I18n.t('valueEntryDialog_valueState')}
                                value={valueStateId}
                                onChange={this.handleValueStateIdChange}
                                onCommit={this.handleValueStateIdCommit}
                                socket={socket}
                                theme={theme}
                                themeType={themeType ?? 'light'}
                                dialogName="valueEntryDialogValue"
                                filterFunc={this.props.mainValueFilterFunc ?? this.mainStateFilterFunc}
                                onTransformSelectedId={this.props.mainValueTransformId}
                                disabled={readOnlyValueStateId}
                            />
                            {valueStateType !== null && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {`${I18n.t('valueEntryDialog_detectedType')}: ${valueStateType}`}
                                </Typography>
                            )}
                        </Paper>

                        {/* Unit – only visible for number states */}
                        {showUnit && (
                            <TextField
                                variant="standard"
                                fullWidth
                                label={I18n.t('valueEntryDialog_unit')}
                                value={unit}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    this.setState({ unit: e.target.value }, () => this.schedulePreviewUpdate())
                                }
                            />
                        )}

                        {/* Prefix – static string or state ID (string/number states) */}
                        <EntitySelector
                            label={I18n.t('valueEntryDialog_prefix')}
                            value={prefix}
                            onChange={(id: string) => this.setState({ prefix: id }, () => this.schedulePreviewUpdate())}
                            socket={socket}
                            theme={theme}
                            themeType={themeType ?? 'light'}
                            dialogName="valueEntryDialogPrefix"
                            filterFunc={this.stringNumberStateFilterFunc}
                        />

                        {/* Suffix – static string or state ID (string/number states) */}
                        <EntitySelector
                            label={I18n.t('valueEntryDialog_suffix')}
                            value={suffix}
                            onChange={(id: string) => this.setState({ suffix: id }, () => this.schedulePreviewUpdate())}
                            socket={socket}
                            theme={theme}
                            themeType={themeType ?? 'light'}
                            dialogName="valueEntryDialogSuffix"
                            filterFunc={this.stringNumberStateFilterFunc}
                        />

                        {/* Date format – only visible when showDateFormat feature is enabled AND state type is number or string */}
                        {showDateFormat && (
                            <Paper
                                variant="outlined"
                                sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}
                            >
                                <Typography variant="subtitle2">
                                    {I18n.t('valueEntryDialog_dateFormatSection')}
                                </Typography>
                                <TextField
                                    variant="standard"
                                    fullWidth
                                    label={I18n.t('valueEntryDialog_dateLocal')}
                                    value={dateLocal}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        this.setState({ dateLocal: e.target.value }, () => this.schedulePreviewUpdate())
                                    }
                                    helperText={I18n.t('valueEntryDialog_dateLocalHint')}
                                />
                                <TextField
                                    variant="standard"
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    label={I18n.t('valueEntryDialog_dateFormatOptions')}
                                    value={dateFormatOptions}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        this.handleDateFormatOptionsChange(e.target.value)
                                    }
                                    error={dateFormatOptions.trim() !== '' && !dateFormatOptionsValid}
                                    helperText={
                                        dateFormatOptions.trim() !== '' && !dateFormatOptionsValid
                                            ? I18n.t('valueEntryDialog_dateFormatInvalid')
                                            : I18n.t('valueEntryDialog_dateFormatOptionsHint')
                                    }
                                />
                            </Paper>
                        )}

                        {/* Text Size select 0–5 (controlled by features.showTextSize) */}
                        {showTextSize && (
                            <FormControl
                                variant="standard"
                                fullWidth
                            >
                                <InputLabel>{I18n.t('valueEntryDialog_textSize')}</InputLabel>
                                <Select
                                    value={textSize !== undefined ? String(textSize) : ''}
                                    onChange={(e: SelectChangeEvent<string>) => {
                                        const v = e.target.value;
                                        this.setState({
                                            textSize: v === '' ? undefined : (Number(v) as 0 | 1 | 2 | 3 | 4 | 5),
                                        });
                                    }}
                                    label={I18n.t('valueEntryDialog_textSize')}
                                >
                                    <MenuItem value="">{I18n.t('valueEntryDialog_textSizeDefault')}</MenuItem>
                                    {([1, 2, 3, 4, 5] as const).map(v => (
                                        <MenuItem
                                            key={v}
                                            value={String(v)}
                                        >
                                            {String(v)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {<Divider />}

                        {/* Preview (readonly) – controlled by features.showPreview */}
                        {
                            <TextField
                                variant="outlined"
                                fullWidth
                                label={I18n.t('valueEntryDialog_preview')}
                                value={previewLoading ? '\u2026' : previewText}
                                helperText={I18n.t('valueEntryDialog_previewHint')}
                                slotProps={{
                                    input: {
                                        readOnly: true,
                                        sx: { fontFamily: 'monospace' },
                                    },
                                }}
                            />
                        }
                    </Box>
                </DialogContent>
                <DialogActions>
                    {this.props.onDelete && (
                        <Button
                            color="error"
                            onClick={() => {
                                this.props.onDelete!();
                                this.setState({ open: false });
                            }}
                            sx={{ mr: 'auto' }}
                        >
                            {I18n.t('valueEntryDialog_delete')}
                        </Button>
                    )}
                    <Button onClick={this.handleClose}>{I18n.t('valueEntryDialog_cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={this.handleSave}
                    >
                        {I18n.t('valueEntryDialog_save')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default ValueEntryDialog;
