/**
 * Dialog for the raw input of an item (page item or screensaver item) as JSON, in one of two formats:
 * `native` - the runtime item the config manager produces, taken over unchanged; `script` - the item as it
 * would stand in the script, converted by the config manager like a script item (see RawItemFormat).
 *
 * Opened per ref with {@link RawItemConfigDialog.openWith}; the caller stores the result.
 */
import React from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Radio,
    RadioGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import { I18n, type ThemeType } from '@iobroker/gui-components';
import Editor from '@iobroker/json-config/build/JsonConfigComponent/wrapper/Components/Editor';
import {
    isRawItemObject,
    rawItemFormats,
    rawItemLabel,
    type RawItemFormat,
} from '../../../src/lib/types/adminShareConfig';

/** what the raw data stands for - decides the help texts */
export type RawItemKind = 'pageItem' | 'screensaverItem';

/** a raw configuration as the dialog hands it over */
export type RawItemValue = { format: RawItemFormat; config: Record<string, unknown> };

type RawItemConfigDialogProps = {
    kind: RawItemKind;
    themeType?: ThemeType;
    /** the raw data were applied */
    onApply: (value: RawItemValue) => void;
    /** the raw data were removed - the item goes back to the standard fields */
    onRemove: () => void;
};

type RawItemConfigDialogState = {
    open: boolean;
    format: RawItemFormat;
    json: string;
    /** the parsed object, null while the text is no JSON object */
    parsed: Record<string, unknown> | null;
    errorMessage: string;
    /** the item is in raw mode already - offers "remove raw data" */
    active: boolean;
};

/**
 * Text that names a raw item in the item lists of the editors: "Raw data" plus id / template / dpInit of the
 * configuration when it has one.
 *
 * @param config the raw configuration
 */
export function rawItemListLabel(config: unknown): string {
    const text = rawItemLabel(config);
    return text ? `${I18n.t('rawItemDialog_listLabel')}: ${text}` : I18n.t('rawItemDialog_listLabel');
}

/**
 * Parses the text of the editor.
 *
 * @param json text of the editor
 * @returns the object or the error text
 */
function parseRawJson(json: string): { parsed: Record<string, unknown> | null; errorMessage: string } {
    try {
        const value: unknown = JSON.parse(json);
        if (!isRawItemObject(value)) {
            return { parsed: null, errorMessage: I18n.t('rawItemDialog_notObject') };
        }
        return { parsed: value, errorMessage: '' };
    } catch (e) {
        return {
            parsed: null,
            errorMessage: I18n.t('rawItemDialog_invalidJson').replace('%s', e instanceof Error ? e.message : String(e)),
        };
    }
}

class RawItemConfigDialog extends React.Component<RawItemConfigDialogProps, RawItemConfigDialogState> {
    constructor(props: RawItemConfigDialogProps) {
        super(props);
        this.state = {
            open: false,
            format: 'native',
            json: '{}',
            parsed: {},
            errorMessage: '',
            active: false,
        };
    }

    /**
     * Opens the dialog, the stored content formatted.
     *
     * @param value the stored raw data, or a suggestion built from the standard fields (then `active` is false)
     * @param active the item is in raw mode already - default: a value was given
     */
    public openWith(value: RawItemValue | undefined, active: boolean = value !== undefined): void {
        const config = value?.config ?? {};
        this.setState({
            open: true,
            format: value?.format ?? 'native',
            json: JSON.stringify(config, null, 2),
            parsed: config,
            errorMessage: '',
            active,
        });
    }

    private handleClose = (): void => {
        this.setState({ open: false });
    };

    private handleJsonChange = (json: string): void => {
        this.setState({ json, ...parseRawJson(json) });
    };

    private handleFormatChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;
        if (value === 'native' || value === 'script') {
            this.setState({ format: value });
        }
    };

    /** indents valid JSON anew */
    private handleBeautify = (): void => {
        if (this.state.parsed) {
            this.setState({ json: JSON.stringify(this.state.parsed, null, 2) });
        }
    };

    private handleApply = (): void => {
        const { parsed, format } = this.state;
        if (!parsed) {
            return;
        }
        this.props.onApply({ format, config: parsed });
        this.setState({ open: false });
    };

    private handleRemove = (): void => {
        this.props.onRemove();
        this.setState({ open: false });
    };

    render(): React.JSX.Element {
        const { open, format, json, parsed, errorMessage, active } = this.state;
        const kindKey = this.props.kind === 'pageItem' ? 'page' : 'screensaver';
        return (
            <Dialog
                open={open}
                onClose={(_event, reason) => {
                    // the text could be lost by a click beside the dialog
                    if (reason !== 'backdropClick') {
                        this.handleClose();
                    }
                }}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>{I18n.t('rawItemDialog_title')}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="body2">{I18n.t('rawItemDialog_format')}</Typography>
                        <RadioGroup
                            row
                            value={format}
                            onChange={this.handleFormatChange}
                        >
                            {rawItemFormats.map(f => (
                                <FormControlLabel
                                    key={f}
                                    value={f}
                                    control={<Radio size="small" />}
                                    label={I18n.t(`rawItemDialog_format_${f}`)}
                                />
                            ))}
                        </RadioGroup>
                    </Box>
                    <Alert
                        severity="info"
                        sx={{ my: 1 }}
                    >
                        {I18n.t(`rawItemDialog_help_${kindKey}_${format}`)}
                    </Alert>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                        <Tooltip title={I18n.t('rawItemDialog_beautify')}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={this.handleBeautify}
                                    disabled={!parsed}
                                    aria-label={I18n.t('rawItemDialog_beautify')}
                                >
                                    <FormatAlignLeftIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                    <Box
                        sx={{
                            height: 380,
                            border: 1,
                            borderColor: parsed ? 'divider' : 'error.main',
                            borderRadius: 1,
                            overflow: 'hidden',
                        }}
                    >
                        <Editor
                            mode="json"
                            value={json}
                            onChange={this.handleJsonChange}
                            themeType={this.props.themeType ?? 'light'}
                            name="raw-item-config-editor"
                            editValueMode
                            error={!parsed}
                        />
                    </Box>
                    {!parsed && (
                        <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: 'block', mt: 0.5, px: 0.5 }}
                        >
                            {errorMessage || I18n.t('rawItemDialog_notObject')}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    {active && (
                        <Button
                            color="warning"
                            onClick={this.handleRemove}
                            sx={{ mr: 'auto' }}
                        >
                            {I18n.t('rawItemDialog_remove')}
                        </Button>
                    )}
                    <Button onClick={this.handleClose}>{I18n.t('rawItemDialog_cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={this.handleApply}
                        disabled={!parsed}
                    >
                        {I18n.t('rawItemDialog_apply')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default RawItemConfigDialog;

type RawItemButtonProps = {
    /** the item is in raw mode - the icon is colored */
    active: boolean;
    onClick: () => void;
};

/** the small, unobtrusive button that opens the raw dialog */
export class RawItemButton extends React.Component<RawItemButtonProps> {
    render(): React.JSX.Element {
        return (
            <Tooltip title={I18n.t('rawItemDialog_open')}>
                <IconButton
                    size="small"
                    onClick={this.props.onClick}
                    aria-label={I18n.t('rawItemDialog_open')}
                    sx={{ color: this.props.active ? 'warning.main' : 'text.disabled' }}
                >
                    <DataObjectIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        );
    }
}

type RawItemNoticeProps = {
    value: RawItemValue;
    onEdit: () => void;
};

/** shown instead of the standard fields while an item is in raw mode */
export class RawItemNotice extends React.Component<RawItemNoticeProps> {
    render(): React.JSX.Element {
        const { value } = this.props;
        const label = rawItemLabel(value.config);
        return (
            <Alert
                severity="warning"
                action={
                    <Button
                        color="inherit"
                        size="small"
                        onClick={this.props.onEdit}
                    >
                        {I18n.t('rawItemDialog_edit')}
                    </Button>
                }
            >
                <Typography variant="body2">
                    {I18n.t('rawItemDialog_active').replace('%s', I18n.t(`rawItemDialog_format_${value.format}`))}
                </Typography>
                {label && (
                    <Typography
                        variant="caption"
                        sx={{ display: 'block', fontFamily: 'monospace' }}
                    >
                        {label}
                    </Typography>
                )}
                <Typography
                    variant="caption"
                    sx={{ display: 'block' }}
                >
                    {I18n.t('rawItemDialog_activeHint')}
                </Typography>
            </Alert>
        );
    }
}
