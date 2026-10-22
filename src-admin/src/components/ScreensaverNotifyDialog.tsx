/**
 * Dialog of one notification of the screensaver (notifyScreensaverEntity of the script): content (headline,
 * text and their parts - each a fixed text or a state), the states that show it, priority, dismissing and
 * buzzer. Opened from the notification list (ScreensaverNotifyListDialog) via {@link ScreensaverNotifyDialog.openWith}.
 */
import React from 'react';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { ThemeType } from '@iobroker/gui-components';
import { EntitySelector } from './EntitySelector';
import IconSelect from '../IconSelect';
import { type ScreensaverNotifyConfig, screensaverNotifyDefaultBuzzer } from '../../../src/lib/types/adminShareConfig';

export interface ScreensaverNotifyDialogProps {
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
    themeName?: any;
    /** group ids of the other notifications - offered in the dismiss group field */
    knownIds: string[];
    /** the edited notification */
    onSave: (notify: ScreensaverNotifyConfig) => void;
}

type BuzzerMode = 'off' | 'default' | 'custom';

/** text fields of a notification: fixed text or state id */
type NotifyTextField = 'headline' | 'headlinePrefix' | 'headlineUnit' | 'text' | 'textPrefix' | 'textSuffix';

interface ScreensaverNotifyDialogState {
    open: boolean;
    /** true while a new notification is edited (title) */
    isNew: boolean;
    draft: ScreensaverNotifyConfig;
    /** priority as typed, empty = default */
    priority: string;
    buzzerMode: BuzzerMode;
    /** own tone sequence, kept while switching the mode */
    buzzerSequence: string;
}

const EMPTY_COMMON: ioBroker.InstanceCommon = {} as ioBroker.InstanceCommon;

/**
 * any state
 *
 * @param obj object from the browser
 */
function isState(obj: ioBroker.Object): boolean {
    return !!obj && obj.type === 'state';
}

/**
 * mode of the buzzer select for a stored value
 *
 * @param buzzer stored buzzer
 */
function buzzerModeOf(buzzer: ScreensaverNotifyConfig['buzzer']): BuzzerMode {
    if (buzzer === true) {
        return 'default';
    }
    return typeof buzzer === 'string' && buzzer.trim() ? 'custom' : 'off';
}

export default class ScreensaverNotifyDialog extends React.Component<
    ScreensaverNotifyDialogProps,
    ScreensaverNotifyDialogState
> {
    constructor(props: ScreensaverNotifyDialogProps) {
        super(props);
        this.state = {
            open: false,
            isNew: true,
            draft: { enabled: [''] },
            priority: '',
            buzzerMode: 'off',
            buzzerSequence: '',
        };
    }

    /**
     * opens the dialog with a copy of the notification - a new one starts with one empty state row
     *
     * @param notify stored notification, undefined = new
     */
    public openWith(notify: ScreensaverNotifyConfig | undefined): void {
        const draft: ScreensaverNotifyConfig = notify
            ? { ...notify, enabled: notify.enabled.length ? [...notify.enabled] : [''] }
            : { enabled: [''] };
        this.setState({
            open: true,
            isNew: !notify,
            draft,
            priority: typeof draft.priority === 'number' ? String(draft.priority) : '',
            buzzerMode: buzzerModeOf(draft.buzzer),
            buzzerSequence: typeof draft.buzzer === 'string' ? draft.buzzer : '',
        });
    }

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private set<K extends keyof ScreensaverNotifyConfig>(field: K, value: ScreensaverNotifyConfig[K]): void {
        this.setState(prev => ({ draft: { ...prev.draft, [field]: value } }));
    }

    private setEnabled(index: number, value: string): void {
        this.setState(prev => ({
            draft: { ...prev.draft, enabled: prev.draft.enabled.map((e, i) => (i === index ? value : e)) },
        }));
    }

    private addEnabled = (): void => {
        this.setState(prev => ({ draft: { ...prev.draft, enabled: [...prev.draft.enabled, ''] } }));
    };

    private removeEnabled(index: number): void {
        this.setState(prev => ({
            draft: { ...prev.draft, enabled: prev.draft.enabled.filter((_e, i) => i !== index) },
        }));
    }

    private close = (): void => {
        this.setState({ open: false });
    };

    /** at least one state shows the notification */
    private hasEnabled(): boolean {
        return this.state.draft.enabled.some(e => e.trim() !== '');
    }

    private invalidPriority(): boolean {
        const raw = this.state.priority.trim();
        return raw !== '' && !Number.isFinite(Number(raw));
    }

    private invalidBuzzer(): boolean {
        return this.state.buzzerMode === 'custom' && !this.state.buzzerSequence.trim();
    }

    /** the draft as stored: empty fields dropped, priority and buzzer from their inputs */
    private apply = (): void => {
        const { draft, priority, buzzerMode, buzzerSequence } = this.state;
        const out: ScreensaverNotifyConfig = { enabled: draft.enabled.map(e => e.trim()).filter(e => !!e) };
        const texts: (NotifyTextField | 'headlineIcon' | 'visibleCondition')[] = [
            'headline',
            'headlinePrefix',
            'headlineUnit',
            'headlineIcon',
            'text',
            'textPrefix',
            'textSuffix',
            'visibleCondition',
        ];
        for (const field of texts) {
            const value = draft[field];
            if (value) {
                out[field] = field === 'visibleCondition' ? value.trim() : value;
            }
        }
        if (priority.trim() !== '') {
            out.priority = Number(priority);
        }
        if (draft.dismissible) {
            out.dismissible = true;
            if (draft.dismissibleId?.trim()) {
                out.dismissibleId = draft.dismissibleId.trim();
            }
        }
        if (buzzerMode === 'default') {
            out.buzzer = true;
        } else if (buzzerMode === 'custom') {
            out.buzzer = buzzerSequence.trim();
        }
        this.props.onSave(out);
        this.close();
    };

    // ---------- fields ----------

    private themeType(): ThemeType {
        const { oContext, theme } = this.props;
        return oContext?.themeType ?? (theme?.palette?.mode || 'light');
    }

    private renderTextField(field: NotifyTextField, labelKey: string): React.JSX.Element {
        const { oContext, theme } = this.props;
        return (
            <Box sx={{ flex: 1, minWidth: 220 }}>
                <EntitySelector
                    label={this.getText(labelKey)}
                    value={this.state.draft[field] ?? ''}
                    onChange={(v: string) => this.set(field, v)}
                    socket={oContext.socket}
                    theme={theme}
                    themeType={this.themeType()}
                    dialogName={`selectScreensaverNotify_${field}`}
                    filterFunc={isState}
                />
            </Box>
        );
    }

    private renderIconField(): React.JSX.Element {
        const { oContext, themeName } = this.props;
        const value = this.state.draft.headlineIcon ?? '';
        const label = this.getText('screensaver_notify_headlineIcon');
        return (
            <Box sx={{ flex: 1, minWidth: 220 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {label}
                </Typography>
                <IconSelect
                    oContext={oContext}
                    alive={true}
                    changed={false}
                    themeName={themeName}
                    common={EMPTY_COMMON}
                    attr="headlineIcon"
                    data={{ headlineIcon: value }}
                    originalData={{ headlineIcon: value }}
                    onError={() => {}}
                    schema={{ type: 'custom', name: 'IconSelect', url: '', label, i18n: false }}
                    custom
                    onChange={(attrOrData, val, cb): void => {
                        let icon = '';
                        if (typeof attrOrData === 'object') {
                            icon = (attrOrData as Record<string, string>).headlineIcon ?? '';
                        } else if (typeof val === 'string') {
                            icon = val;
                        }
                        this.set('headlineIcon', icon || undefined);
                        if (cb) {
                            cb();
                        }
                    }}
                />
            </Box>
        );
    }

    private renderSectionTitle(key: string): React.JSX.Element {
        return (
            <Typography
                variant="subtitle2"
                sx={{ mt: 2, mb: 1 }}
            >
                {this.getText(key)}
            </Typography>
        );
    }

    private renderContent(): React.JSX.Element {
        return (
            <Box>
                {this.renderSectionTitle('screensaver_notify_content')}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                >
                    {this.getText('screensaver_notify_contentHint')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {this.renderTextField('headlinePrefix', 'screensaver_notify_headlinePrefix')}
                    {this.renderTextField('headline', 'screensaver_notify_headline')}
                    {this.renderTextField('headlineUnit', 'screensaver_notify_headlineUnit')}
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {this.renderTextField('textPrefix', 'screensaver_notify_textPrefix')}
                    {this.renderTextField('text', 'screensaver_notify_text')}
                    {this.renderTextField('textSuffix', 'screensaver_notify_textSuffix')}
                </Box>
                <Box sx={{ maxWidth: 360, mt: 1 }}>{this.renderIconField()}</Box>
            </Box>
        );
    }

    private renderCondition(): React.JSX.Element {
        const { oContext, theme } = this.props;
        const { draft } = this.state;
        return (
            <Box>
                {this.renderSectionTitle('screensaver_notify_condition')}
                {draft.enabled.map((value, index) => (
                    <Box
                        key={index}
                        sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}
                    >
                        <Box sx={{ flex: 1 }}>
                            <EntitySelector
                                label={this.getText('screensaver_notify_enabled').replace('%s', String(index + 1))}
                                value={value}
                                onChange={(v: string) => this.setEnabled(index, v)}
                                socket={oContext.socket}
                                theme={theme}
                                themeType={this.themeType()}
                                dialogName="selectScreensaverNotify_enabled"
                                filterFunc={isState}
                            />
                        </Box>
                        <Tooltip title={this.getText('screensaver_notify_delete')}>
                            <span>
                                <IconButton
                                    size="small"
                                    disabled={draft.enabled.length <= 1}
                                    onClick={() => this.removeEnabled(index)}
                                    sx={{ mb: 1 }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                ))}
                <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={this.addEnabled}
                >
                    {this.getText('screensaver_notify_enabledAdd')}
                </Button>
                {draft.enabled.length > 1 && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                    >
                        {this.getText('screensaver_notify_enabledHint')}
                    </Typography>
                )}
                {!this.hasEnabled() && (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1 }}
                    >
                        {this.getText('screensaver_notify_needEnabled')}
                    </Alert>
                )}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                    <TextField
                        variant="standard"
                        autoComplete="off"
                        label={this.getText('screensaver_notify_visibleCondition')}
                        placeholder="val >= 3"
                        value={draft.visibleCondition ?? ''}
                        onChange={e => this.set('visibleCondition', e.target.value)}
                        helperText={this.getText('screensaver_notify_visibleConditionHint')}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ flex: 1, minWidth: 260 }}
                    />
                    <TextField
                        variant="standard"
                        type="number"
                        label={this.getText('screensaver_notify_priority')}
                        placeholder="99"
                        value={this.state.priority}
                        error={this.invalidPriority()}
                        onChange={e => this.setState({ priority: e.target.value })}
                        helperText={this.getText('screensaver_notify_priorityHint')}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ width: 220 }}
                    />
                </Box>
            </Box>
        );
    }

    private renderDismiss(): React.JSX.Element {
        const { draft } = this.state;
        const ids = this.props.knownIds.filter(id => id !== draft.dismissibleId);
        return (
            <Box>
                {this.renderSectionTitle('screensaver_notify_dismiss')}
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={!!draft.dismissible}
                            onChange={e => this.set('dismissible', e.target.checked)}
                        />
                    }
                    label={this.getText('screensaver_notify_dismissible')}
                    sx={{ display: 'flex' }}
                />
                <Autocomplete
                    freeSolo
                    disabled={!draft.dismissible}
                    options={ids}
                    value={draft.dismissibleId ?? ''}
                    inputValue={draft.dismissibleId ?? ''}
                    onInputChange={(_e, v) => this.set('dismissibleId', v)}
                    renderInput={params => (
                        <TextField
                            {...params}
                            variant="standard"
                            label={this.getText('screensaver_notify_dismissibleId')}
                            helperText={this.getText('screensaver_notify_dismissibleIdHint')}
                        />
                    )}
                    sx={{ maxWidth: 420 }}
                />
            </Box>
        );
    }

    private renderBuzzer(): React.JSX.Element {
        const { buzzerMode, buzzerSequence } = this.state;
        return (
            <Box>
                {this.renderSectionTitle('screensaver_notify_buzzer')}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <FormControl
                        variant="standard"
                        sx={{ minWidth: 220 }}
                    >
                        <InputLabel>{this.getText('screensaver_notify_buzzer')}</InputLabel>
                        <Select
                            value={buzzerMode}
                            onChange={e => {
                                const v = e.target.value;
                                this.setState({ buzzerMode: v === 'default' || v === 'custom' ? v : 'off' });
                            }}
                        >
                            <MenuItem value="off">{this.getText('screensaver_notify_buzzer_off')}</MenuItem>
                            <MenuItem value="default">
                                {this.getText('screensaver_notify_buzzer_default').replace(
                                    '%s',
                                    screensaverNotifyDefaultBuzzer,
                                )}
                            </MenuItem>
                            <MenuItem value="custom">{this.getText('screensaver_notify_buzzer_custom')}</MenuItem>
                        </Select>
                    </FormControl>
                    {buzzerMode === 'custom' && (
                        <TextField
                            variant="standard"
                            autoComplete="off"
                            label={this.getText('screensaver_notify_buzzerSequence')}
                            placeholder={screensaverNotifyDefaultBuzzer}
                            value={buzzerSequence}
                            error={this.invalidBuzzer()}
                            onChange={e => this.setState({ buzzerSequence: e.target.value })}
                            helperText={this.getText('screensaver_notify_buzzerHint')}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ width: 260 }}
                        />
                    )}
                </Box>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const blocked = !this.hasEnabled() || this.invalidPriority() || this.invalidBuzzer();
        return (
            <Dialog
                open={this.state.open}
                onClose={this.close}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {this.getText(this.state.isNew ? 'screensaver_notify_new' : 'screensaver_notify_editTitle')}
                </DialogTitle>
                <DialogContent dividers>
                    {this.renderContent()}
                    {this.renderCondition()}
                    {this.renderDismiss()}
                    {this.renderBuzzer()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.close}>{this.getText('Cancel1')}</Button>
                    <Button
                        variant="contained"
                        disabled={blocked}
                        onClick={this.apply}
                    >
                        {this.getText('screensaver_apply')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
