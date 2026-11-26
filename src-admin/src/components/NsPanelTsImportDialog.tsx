import React from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List,
    ListItemButton,
    ListItemText,
    TextField,
    Typography,
} from '@mui/material';
import { I18n } from '@iobroker/gui-components';
import type {
    NsPanelTsConvertAnswer,
    NsPanelTsScriptInfo,
} from '../../../src/lib/configuration/nspanelts-import-types';

export interface NsPanelTsImportDialogProps {
    socket: any;
    adapterName: string;
    instance: string | number;
}

type Step = 'closed' | 'warning' | 'select' | 'running' | 'result';

type ConvertSuccess = Exclude<NsPanelTsConvertAnswer, { error: string }>;

interface NsPanelTsImportDialogState {
    step: Step;
    panelName: string;
    panelTopic: string;
    scripts: NsPanelTsScriptInfo[] | null;
    selected: string;
    topic: string;
    error: string | null;
    result: ConvertSuccess | null;
}

const closedState: NsPanelTsImportDialogState = {
    step: 'closed',
    panelName: '',
    panelTopic: '',
    scripts: null,
    selected: '',
    topic: '',
    error: null,
    result: null,
};

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isScriptInfo(v: unknown): v is NsPanelTsScriptInfo {
    return isRecord(v) && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.supported === 'boolean';
}

function isConvertSuccess(v: unknown): v is ConvertSuccess {
    return (
        isRecord(v) &&
        typeof v.scriptId === 'string' &&
        Array.isArray(v.pages) &&
        Array.isArray(v.todoPages) &&
        typeof v.todos === 'number' &&
        Array.isArray(v.discarded)
    );
}

/**
 * Converts the old standalone script NSPanelTs.ts of the javascript adapter into a new, disabled
 * configuration script of this instance (sendTo `nspanelTsList` / `nspanelTsConvert`). Opened from the tile
 * of a panel: the panel of the tile is the target. A warning comes first, so nobody mixes it up with the
 * configuration script of the adapter.
 */
class NsPanelTsImportDialog extends React.Component<NsPanelTsImportDialogProps, NsPanelTsImportDialogState> {
    constructor(props: NsPanelTsImportDialogProps) {
        super(props);
        this.state = { ...closedState };
    }

    /**
     * Opens the dialog (warning step) for a panel.
     *
     * @param panel the panel of the tile
     * @param panel.name name of the panel
     * @param panel.topic topic of the panel
     */
    public openFor(panel: { name?: string; topic?: string }): void {
        this.setState({ ...closedState, step: 'warning', panelName: panel.name ?? '', panelTopic: panel.topic ?? '' });
    }

    private close = (): void => {
        this.setState({ ...closedState });
    };

    private target(): string {
        return `${this.props.adapterName}.${this.props.instance}`;
    }

    private errorText(answer: unknown): string {
        if (answer === 'timeout' || answer == null) {
            return I18n.t('nspanelTsImport_errorTimeout');
        }
        if (isRecord(answer) && typeof answer.errorKey === 'string') {
            return I18n.t(answer.errorKey);
        }
        if (isRecord(answer) && typeof answer.error === 'string') {
            return answer.error;
        }
        return I18n.t('nspanelTsImport_errorTimeout');
    }

    private continueToSelect = async (): Promise<void> => {
        this.setState({ step: 'select', scripts: null, error: null });
        const answer: unknown = await this.props.socket.sendTo(this.target(), 'nspanelTsList', {});
        if (isRecord(answer) && Array.isArray(answer.scripts)) {
            const scripts = answer.scripts.filter(isScriptInfo);
            const first = scripts.find(s => s.supported);
            this.setState({ scripts }, () => {
                if (first) {
                    this.select(first);
                }
            });
        } else {
            this.setState({ scripts: [], error: this.errorText(answer) });
        }
    };

    private select(script: NsPanelTsScriptInfo): void {
        if (!script.supported) {
            return;
        }
        this.setState({ selected: script.id, topic: script.topic ?? '', error: null });
    }

    private convert = async (): Promise<void> => {
        const { selected, panelName, topic } = this.state;
        this.setState({ step: 'running', error: null });
        const answer: unknown = await this.props.socket.sendTo(this.target(), 'nspanelTsConvert', {
            scriptId: selected,
            panelName,
            topic: topic.trim(),
        });
        if (isConvertSuccess(answer)) {
            this.setState({ step: 'result', result: answer });
        } else {
            this.setState({ step: 'select', error: this.errorText(answer) });
        }
    };

    private reasonText(script: NsPanelTsScriptInfo): string {
        if (script.supported) {
            return I18n.t('nspanelTsImport_supported');
        }
        return I18n.t(`nspanelTsImport_reason_${script.reason ?? 'noVersion'}`).replace('%s', script.version ?? '');
    }

    private renderWarning(): React.JSX.Element {
        return (
            <>
                <DialogContent>
                    <Alert
                        severity="warning"
                        sx={{ mb: 2 }}
                    >
                        {I18n.t('nspanelTsImport_warnOld')}
                    </Alert>
                    <DialogContentText sx={{ mb: 1 }}>{I18n.t('nspanelTsImport_warnNotAdapter')}</DialogContentText>
                    <DialogContentText sx={{ mb: 1 }}>{I18n.t('nspanelTsImport_warnResult')}</DialogContentText>
                    <DialogContentText>
                        {I18n.t('nspanelTsImport_warnTarget').replace('%s', this.state.panelName)}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.close}>{I18n.t('nspanelTsImport_cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={(): void => void this.continueToSelect()}
                    >
                        {I18n.t('nspanelTsImport_continue')}
                    </Button>
                </DialogActions>
            </>
        );
    }

    private renderTopic(): React.JSX.Element | null {
        const { scripts, selected, topic, panelTopic } = this.state;
        const script = scripts?.find(s => s.id === selected);
        if (!script) {
            return null;
        }
        const value = topic.trim();
        const mismatch = value !== '' && panelTopic !== '' && value !== panelTopic;
        return (
            <Box sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    required
                    size="small"
                    label={I18n.t('nspanelTsImport_topicLabel')}
                    value={topic}
                    error={value === ''}
                    helperText={
                        value === ''
                            ? I18n.t(script.topic ? 'nspanelTsImport_topicRequired' : 'nspanelTsImport_topicNone')
                            : I18n.t('nspanelTsImport_topicHelp')
                    }
                    onChange={(e): void => this.setState({ topic: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                />
                <Typography
                    variant="body2"
                    sx={{ mt: 1 }}
                >
                    {I18n.t('nspanelTsImport_topicPanel').replace('%s', panelTopic || '-')}
                </Typography>
                {mismatch ? (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1 }}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={(): void => this.setState({ topic: panelTopic })}
                            >
                                {I18n.t('nspanelTsImport_topicTakePanel')}
                            </Button>
                        }
                    >
                        {I18n.t('nspanelTsImport_topicMismatch')}
                    </Alert>
                ) : null}
            </Box>
        );
    }

    private renderSelect(): React.JSX.Element {
        const { scripts, selected, error, step } = this.state;
        const running = step === 'running';
        const canConvert = !!selected && this.state.topic.trim() !== '' && !running;
        return (
            <>
                <DialogContent>
                    <DialogContentText sx={{ mb: 1 }}>{I18n.t('nspanelTsImport_selectText')}</DialogContentText>
                    {scripts === null ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} />
                            <Typography>{I18n.t('nspanelTsImport_loading')}</Typography>
                        </Box>
                    ) : scripts.length === 0 ? (
                        <Alert severity="info">{I18n.t('nspanelTsImport_none')}</Alert>
                    ) : (
                        <List
                            dense
                            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                        >
                            {scripts.map(s => (
                                <ListItemButton
                                    key={s.id}
                                    selected={s.id === selected}
                                    sx={{
                                        // light selection with a marker instead of a solid color: both lines stay readable
                                        '&.Mui-selected, &.Mui-selected:hover': {
                                            // the admin theme paints the selection as gradient (background-image)
                                            background: (theme): string => theme.palette.action.selected,
                                            color: 'text.primary',
                                            boxShadow: (theme): string => `inset 4px 0 0 ${theme.palette.primary.main}`,
                                        },
                                        '&.Mui-selected .MuiListItemText-secondary': { color: 'text.secondary' },
                                    }}
                                    disabled={!s.supported || running}
                                    onClick={(): void => this.select(s)}
                                >
                                    <ListItemText
                                        primary={`${s.name} (${s.version ?? '?'})`}
                                        secondary={`${s.id} · ${I18n.t(s.enabled ? 'nspanelTsImport_running' : 'nspanelTsImport_stopped')} · ${I18n.t('nspanelTsImport_topicLabel')}: ${s.topic ?? '-'} · ${this.reasonText(s)}`}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                    {this.renderTopic()}
                    {error ? (
                        <Alert
                            severity="error"
                            sx={{ mt: 2 }}
                        >
                            {error}
                        </Alert>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={this.close}
                        disabled={running}
                    >
                        {I18n.t('nspanelTsImport_cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!canConvert}
                        onClick={(): void => void this.convert()}
                        startIcon={running ? <CircularProgress size={16} /> : undefined}
                    >
                        {I18n.t('nspanelTsImport_convert')}
                    </Button>
                </DialogActions>
            </>
        );
    }

    private renderResult(): React.JSX.Element | null {
        const r = this.state.result;
        if (!r) {
            return null;
        }
        const line = (key: string, value: string): React.JSX.Element => (
            <Typography sx={{ mb: 0.5 }}>{I18n.t(key).replace('%s', value)}</Typography>
        );
        return (
            <>
                <DialogContent>
                    <Alert
                        severity="success"
                        sx={{ mb: 2 }}
                    >
                        {I18n.t('nspanelTsImport_resultCreated').replace('%s', r.scriptId)}
                    </Alert>
                    {line('nspanelTsImport_resultPages', String(r.pages.length))}
                    {line('nspanelTsImport_resultTodos', String(r.todos))}
                    {r.todoPages.length > 0 ? line('nspanelTsImport_resultTodoPages', r.todoPages.join(', ')) : null}
                    {line(
                        'nspanelTsImport_resultDiscarded',
                        r.discarded.length > 0 ? `${r.discarded.length} (${r.discarded.join(', ')})` : '0',
                    )}
                    {r.warnings.length > 0 ? (
                        <Alert
                            severity="warning"
                            sx={{ mt: 1 }}
                        >
                            {r.warnings.join('; ')}
                        </Alert>
                    ) : null}
                    <Alert
                        severity="info"
                        sx={{ mt: 2 }}
                    >
                        {I18n.t('nspanelTsImport_resultHint')}
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={this.close}
                    >
                        {I18n.t('nspanelTsImport_close')}
                    </Button>
                </DialogActions>
            </>
        );
    }

    render(): React.JSX.Element {
        const { step } = this.state;
        return (
            <Dialog
                open={step !== 'closed'}
                onClose={step === 'running' ? undefined : this.close}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>{I18n.t('nspanelTsImport_title').replace('%s', this.state.panelName)}</DialogTitle>
                {step === 'warning'
                    ? this.renderWarning()
                    : step === 'result'
                      ? this.renderResult()
                      : step === 'closed'
                        ? null
                        : this.renderSelect()}
            </Dialog>
        );
    }
}

export default NsPanelTsImportDialog;
