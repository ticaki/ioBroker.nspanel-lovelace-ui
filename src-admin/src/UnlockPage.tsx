import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Select,
    MenuItem,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormControl,
    Checkbox,
    IconButton,
    InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { withTheme } from '@mui/styles';
import ConfirmDialog from './components/ConfirmDialog';
import { ADAPTER_NAME } from '../../src/lib/types/adminShareConfig';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import type { UnlockEntry, UnlockEntries } from '../../src/lib/types/adminShareConfig';
import NavigationAssignmentPanel from './components/NavigationAssignmentPanel';

interface UnlockPageState extends ConfigGenericState {
    entries: UnlockEntries;
    confirmDeleteOpen?: boolean;
    confirmDeleteName?: string | null;
    pagesList?: string[];
}

interface LocalUIState {
    newName: string;
    selected: string;
    showPin: boolean;
}

class UnlockPage extends ConfigGeneric<ConfigGenericProps & { theme?: any }, UnlockPageState> {
    private _local: LocalUIState | null = null;
    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
        const saved = ConfigGeneric.getValue(props.data, props.attr!);
        this.state = {
            ...(this.state as ConfigGenericState),
            entries: Array.isArray(saved) ? (saved as UnlockEntries) : [],
            confirmDeleteOpen: false,
            confirmDeleteName: null,
        } as UnlockPageState;
    }

    async componentDidMount(): Promise<void> {
        // preload pages list for setNavi select
        const pages: string[] = [];
        if (this.props.oContext && this.props.oContext.socket) {
            const instance = this.props.oContext.instance ?? '0';
            const target = `${ADAPTER_NAME}.${instance}`;
            try {
                const rawPanels = await this.props.oContext.socket.sendTo(target, 'getPanels', null);
                let panels: { panelTopic: string }[] = [];
                if (Array.isArray(rawPanels)) {
                    panels = rawPanels;
                } else if (rawPanels && Array.isArray(rawPanels.result)) {
                    panels = rawPanels.result;
                }

                for (const p of panels) {
                    try {
                        const rawPages = await this.props.oContext.socket.sendTo(target, 'getPagesForPanel', {
                            panelTopic: p.panelTopic,
                        });
                        let list: string[] = [];
                        if (Array.isArray(rawPages)) {
                            list = rawPages;
                        } else if (rawPages && Array.isArray(rawPages.result)) {
                            list = rawPages.result;
                        }
                        for (const name of list) {
                            pages.push(name);
                        }
                    } catch {
                        // ignore per-panel errors
                    }
                }
            } catch {
                // ignore
            }
        }

        // remove duplicates and set state
        this.setState({ pagesList: Array.from(new Set(pages)) } as UnlockPageState);
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const entries = this.state.entries || [];
        const uniqueNames = Array.from(new Set(entries.map(e => e.uniqueName))).filter(Boolean);

        // local UI state for new name + selected
        // we keep them in component instance to avoid changing global state signature
        if (!this._local) {
            this._local = { newName: '', selected: uniqueNames[0] || '', showPin: false };
        }
        const local = this._local;

        const doAdd = (): void => {
            const name = (local.newName || '').trim();
            if (!name) {
                return;
            }
            // create a default UnlockEntry with provided uniqueName
            const newEntry: UnlockEntry = {
                uniqueName: name,
                headline: name,
                button1: '',
                button2: '',
                button3: '',
                button4: '',
                pin: 0,
            };
            const updated = [...entries, newEntry];
            this.setState({ entries: updated } as UnlockPageState);
            void this.onChange(this.props.attr!, updated);
            local.newName = '';
            local.selected = name;
        };

        const doRemove = (): void => {
            const sel = local.selected;
            if (!sel) {
                return;
            }
            // open confirmation dialog
            this.setState({ confirmDeleteOpen: true, confirmDeleteName: sel } as UnlockPageState);
        };

        const closeConfirm = (): void => {
            this.setState({ confirmDeleteOpen: false, confirmDeleteName: null } as UnlockPageState);
        };

        const confirmDelete = (): void => {
            const name = this.state.confirmDeleteName;
            if (!name) {
                closeConfirm();
                return;
            }
            const updated = entries.filter(e => e.uniqueName !== name);
            this.setState({ entries: updated, confirmDeleteOpen: false, confirmDeleteName: null } as UnlockPageState);
            void this.onChange(this.props.attr!, updated);
            // pick next
            const remaining = Array.from(new Set(updated.map(e => e.uniqueName))).filter(Boolean);
            local.selected = remaining[0] || '';
            this.setState({} as UnlockPageState);
        };

        return (
            <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', p: 1 }}>
                {/* left sidebar: 20% width */}
                <Box sx={{ width: '20%', pr: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Paper
                        sx={{ p: 1, backgroundColor: 'transparent' }}
                        elevation={0}
                    >
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                aria-label="new-name"
                                value={local.newName}
                                onChange={e => {
                                    local.newName = e.target.value;
                                    this.setState({} as UnlockPageState);
                                }}
                                variant="standard"
                                placeholder={this.getText('New item')}
                                InputProps={{
                                    disableUnderline: true,
                                    sx: { backgroundColor: 'transparent', px: 1 },
                                }}
                                sx={{ flex: 1 }}
                            />
                            {
                                // disable add when empty or name already exists
                            }
                            <Button
                                size="small"
                                variant="contained"
                                onClick={doAdd}
                                disabled={(() => {
                                    const nameTrim = (local.newName || '').trim();
                                    return !nameTrim || uniqueNames.includes(nameTrim);
                                })()}
                            >
                                +
                            </Button>
                        </Box>
                    </Paper>

                    {(() => {
                        // dynamic list height: min 3 rows, each ~40px, capped at 80% of viewport (minus header)
                        const rowHeight = 40;
                        const minRows = 3;
                        const rows = Math.max(minRows, uniqueNames.length || 0);
                        const available = (typeof window !== 'undefined' ? window.innerHeight : 800) - 64; // parent calc height
                        const maxListH = Math.floor(available * 0.8);
                        const desiredH = Math.min(rows * rowHeight, maxListH);

                        return (
                            <Paper
                                sx={{ height: desiredH, overflow: 'auto', p: 1, backgroundColor: 'transparent' }}
                                elevation={0}
                            >
                                {uniqueNames.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {this.getText('No items')}
                                    </Typography>
                                ) : (
                                    uniqueNames.map(name => (
                                        <Box
                                            key={name}
                                            onClick={() => {
                                                local.selected = name;
                                                this.setState({} as UnlockPageState);
                                            }}
                                            sx={{
                                                p: 1,
                                                borderRadius: 1,
                                                cursor: 'pointer',
                                                backgroundColor:
                                                    local.selected === name ? 'action.selected' : 'transparent',
                                                mb: 0.5,
                                            }}
                                        >
                                            <Typography variant="body2">{name}</Typography>
                                        </Box>
                                    ))
                                )}
                            </Paper>
                        );
                    })()}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={doRemove}
                            disabled={!local.selected}
                        >
                            -
                        </Button>
                    </Box>
                </Box>
                <ConfirmDialog
                    open={!!this.state.confirmDeleteOpen}
                    onClose={closeConfirm}
                    onConfirm={confirmDelete}
                    title={this.getText('unlock_delete_confirm_title')}
                    description={
                        this.getText('unlock_delete_confirm_text') +
                        (this.state.confirmDeleteName ? `: ${this.state.confirmDeleteName}` : '')
                    }
                    cancelText={this.getText('Cancel')}
                    confirmText={this.getText('Delete')}
                    ariaTitleId="unlock-delete-confirm-title"
                    ariaDescId="unlock-delete-confirm-description"
                />

                {/* right area: main content + optional collapsible side panel */}
                <Box
                    sx={{
                        width: '80%',
                        pl: 2,
                        display: 'flex',
                        gap: 1,
                        position: 'relative',
                    }}
                >
                    <Box sx={{ width: '70%', borderLeft: '1px solid', borderColor: 'divider' }}>
                        <Paper
                            sx={{ height: '100%', p: 2 }}
                            elevation={1}
                        >
                            {!local.selected ? (
                                // nothing selected: show only hint
                                <Box>
                                    <Typography variant="h6">{this.getText('unlock_select_item')}</Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {this.getText('unlock_select_description')}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                // item selected: show config (hide the helper description)
                                <Box>
                                    {/* editable headline */}
                                    {(() => {
                                        const sel = local.selected;
                                        const ent = entries.find(e => e.uniqueName === sel);
                                        if (!ent) {
                                            return null;
                                        }

                                        return (
                                            <>
                                                {/* UniqueName display (distinct from headline datapoint) */}
                                                <Box
                                                    sx={{
                                                        mb: 1,
                                                        p: 1,
                                                        borderRadius: 1,
                                                        backgroundColor: 'action.hover',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="subtitle2"
                                                        sx={{ mb: 0.5 }}
                                                    >
                                                        {this.getText('unlock_unique_label')}
                                                    </Typography>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{ fontWeight: 600 }}
                                                    >
                                                        {sel}
                                                    </Typography>
                                                </Box>

                                                {/* Radio for Alarm vs Unlock (placed above Headline) */}
                                                <Box sx={{ mb: 1 }}>
                                                    <FormControl component="fieldset">
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{ mb: 1 }}
                                                        >
                                                            {this.getText('unlock_type')}
                                                        </Typography>
                                                        <RadioGroup
                                                            row
                                                            value={ent?.alarmType || ''}
                                                            onChange={(_e, val) => {
                                                                const updated = entries.map(it =>
                                                                    it.uniqueName === sel
                                                                        ? { ...it, alarmType: val }
                                                                        : it,
                                                                );
                                                                this.setState({ entries: updated } as UnlockPageState);
                                                                void this.onChange(this.props.attr!, updated);
                                                            }}
                                                        >
                                                            <FormControlLabel
                                                                value="alarm"
                                                                control={<Radio />}
                                                                label={this.getText('unlock_alarm')}
                                                            />
                                                            <FormControlLabel
                                                                value="unlock"
                                                                control={<Radio />}
                                                                label={this.getText('unlock_unlock')}
                                                            />
                                                        </RadioGroup>
                                                    </FormControl>
                                                </Box>

                                                <TextField
                                                    fullWidth
                                                    variant="standard"
                                                    type="text"
                                                    autoComplete="off"
                                                    label={this.getText('unlock_headline')}
                                                    value={ent.headline ?? ''}
                                                    onChange={e => {
                                                        const v = e.target.value;
                                                        const updated = entries.map(it =>
                                                            it.uniqueName === sel ? { ...it, headline: v } : it,
                                                        );
                                                        this.setState({ entries: updated } as UnlockPageState);
                                                        void this.onChange(this.props.attr!, updated);
                                                    }}
                                                    InputProps={{
                                                        disableUnderline: true,
                                                        sx: { backgroundColor: 'transparent', px: 1 },
                                                    }}
                                                    sx={{ mb: 2 }}
                                                />

                                                {/* PIN field with show/hide */}
                                                <Box sx={{ mt: 2 }}>
                                                    <TextField
                                                        variant="standard"
                                                        label={this.getText('unlock_pin')}
                                                        type={local.showPin ? 'text' : 'password'}
                                                        value={
                                                            ent.pin !== undefined && ent.pin !== null
                                                                ? String(ent.pin)
                                                                : ''
                                                        }
                                                        onChange={e => {
                                                            const raw = e.target.value;
                                                            // keep only digits
                                                            const digits = raw.replace(/[^0-9]/g, '');
                                                            const n = digits ? parseInt(digits, 10) : 0;
                                                            const updated = entries.map(it =>
                                                                it.uniqueName === sel ? { ...it, pin: n } : it,
                                                            );
                                                            this.setState({ entries: updated } as UnlockPageState);
                                                            void this.onChange(this.props.attr!, updated);
                                                        }}
                                                        InputProps={{
                                                            disableUnderline: true,
                                                            sx: { backgroundColor: 'transparent', px: 1 },
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        aria-label={
                                                                            local.showPin ? 'hide-pin' : 'show-pin'
                                                                        }
                                                                        onClick={() => {
                                                                            local.showPin = !local.showPin;
                                                                            this.setState({} as UnlockPageState);
                                                                        }}
                                                                        edge="end"
                                                                        size="small"
                                                                    >
                                                                        {local.showPin ? (
                                                                            <VisibilityOff fontSize="small" />
                                                                        ) : (
                                                                            <Visibility fontSize="small" />
                                                                        )}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                </Box>

                                                {/* common fields for both alarm and unlock types */}
                                                <Box sx={{ mt: 2 }}>
                                                    {/* hidden checkbox */}
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={!!ent.hidden}
                                                                onChange={(_e, checked) => {
                                                                    const updated = entries.map(it =>
                                                                        it.uniqueName === sel
                                                                            ? { ...it, hidden: checked }
                                                                            : it,
                                                                    );
                                                                    this.setState({
                                                                        entries: updated,
                                                                    } as UnlockPageState);
                                                                    void this.onChange(this.props.attr!, updated);
                                                                }}
                                                            />
                                                        }
                                                        label={this.getText('unlock_hidden')}
                                                    />

                                                    {/* alwaysOn radio group */}
                                                    <Box sx={{ mt: 2 }}>
                                                        <FormControl component="fieldset">
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{ mb: 1 }}
                                                            >
                                                                {this.getText('unlock_alwaysOn')}
                                                            </Typography>
                                                            <RadioGroup
                                                                row
                                                                value={ent?.alwaysOn || 'none'}
                                                                onChange={(_e, val) => {
                                                                    const updated = entries.map(it =>
                                                                        it.uniqueName === sel
                                                                            ? {
                                                                                  ...it,
                                                                                  alwaysOn: val as
                                                                                      | 'none'
                                                                                      | 'always'
                                                                                      | 'ignore',
                                                                              }
                                                                            : it,
                                                                    );
                                                                    this.setState({
                                                                        entries: updated,
                                                                    } as UnlockPageState);
                                                                    void this.onChange(this.props.attr!, updated);
                                                                }}
                                                            >
                                                                <FormControlLabel
                                                                    value="none"
                                                                    control={<Radio />}
                                                                    label={this.getText('unlock_alwaysOn_none')}
                                                                />
                                                                <FormControlLabel
                                                                    value="always"
                                                                    control={<Radio />}
                                                                    label={this.getText('unlock_alwaysOn_always')}
                                                                />
                                                                <FormControlLabel
                                                                    value="ignore"
                                                                    control={<Radio />}
                                                                    label={this.getText('unlock_alwaysOn_ignore')}
                                                                />
                                                            </RadioGroup>
                                                        </FormControl>
                                                    </Box>
                                                </Box>

                                                {/* alarm-specific controls */}
                                                {ent.alarmType === 'alarm' && (
                                                    <Box sx={{ mt: 2 }}>
                                                        {/* Buttons 1..4 with small label above each */}
                                                        <Box
                                                            sx={{
                                                                display: 'grid',
                                                                gridTemplateColumns: '1fr',
                                                                gap: 2,
                                                            }}
                                                        >
                                                            {[1, 2, 3, 4].map(i => {
                                                                const key = `button${i}` as const;
                                                                return (
                                                                    <Box key={i}>
                                                                        <Typography
                                                                            variant="caption"
                                                                            color="text.secondary"
                                                                            sx={{ mb: 0.5 }}
                                                                        >
                                                                            {this.getText(`unlock_button${i}_label`)}
                                                                        </Typography>
                                                                        <TextField
                                                                            fullWidth
                                                                            variant="standard"
                                                                            placeholder={this.getText(
                                                                                `unlock_button${i}_placeholder`,
                                                                            )}
                                                                            value={(ent as any)[key] ?? ''}
                                                                            onChange={e => {
                                                                                const v = e.target.value;
                                                                                const updated = entries.map(it =>
                                                                                    it.uniqueName === sel
                                                                                        ? { ...it, [key]: v }
                                                                                        : it,
                                                                                );
                                                                                this.setState({
                                                                                    entries: updated,
                                                                                } as UnlockPageState);
                                                                                void this.onChange(
                                                                                    this.props.attr!,
                                                                                    updated,
                                                                                );
                                                                            }}
                                                                            InputProps={{
                                                                                disableUnderline: true,
                                                                                sx: {
                                                                                    backgroundColor: 'transparent',
                                                                                    px: 1,
                                                                                    '& input::placeholder': {
                                                                                        color: 'text.disabled',
                                                                                    },
                                                                                },
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>

                                                        {/* approved checkbox */}
                                                        <Box sx={{ mt: 1 }}>
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={!!ent.approved}
                                                                        onChange={(_e, checked) => {
                                                                            const updated = entries.map(it =>
                                                                                it.uniqueName === sel
                                                                                    ? { ...it, approved: checked }
                                                                                    : it,
                                                                            );
                                                                            this.setState({
                                                                                entries: updated,
                                                                            } as UnlockPageState);
                                                                            void this.onChange(
                                                                                this.props.attr!,
                                                                                updated,
                                                                            );
                                                                        }}
                                                                    />
                                                                }
                                                                label={this.getText('unlock_approved')}
                                                            />
                                                        </Box>
                                                    </Box>
                                                )}

                                                {/* unlock-specific: optional setNavi page name */}
                                                {ent.alarmType === 'unlock' && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ mb: 0.5 }}
                                                        >
                                                            {this.getText('unlock_setnavi_hint')}
                                                        </Typography>
                                                        <Select
                                                            fullWidth
                                                            variant="standard"
                                                            displayEmpty
                                                            value={ent.setNavi ?? ''}
                                                            onChange={e => {
                                                                const v = String((e.target as HTMLInputElement).value);
                                                                const updated = entries.map(it =>
                                                                    it.uniqueName === sel ? { ...it, setNavi: v } : it,
                                                                );
                                                                this.setState({ entries: updated } as UnlockPageState);
                                                                void this.onChange(this.props.attr!, updated);
                                                            }}
                                                            sx={{ backgroundColor: 'transparent', px: 1 }}
                                                        >
                                                            <MenuItem value="">
                                                                <em>{this.getText('unlock_setnavi_placeholder')}</em>
                                                            </MenuItem>
                                                            {(this.state.pagesList || [])
                                                                .filter(
                                                                    (p: any) =>
                                                                        typeof p === 'string' &&
                                                                        !p.startsWith('///') &&
                                                                        p !== sel,
                                                                )
                                                                .map(p => (
                                                                    <MenuItem
                                                                        key={p}
                                                                        value={p}
                                                                    >
                                                                        {p}
                                                                    </MenuItem>
                                                                ))}
                                                            {/* if current value is not in pagesList, keep it selectable */}
                                                            {ent.setNavi &&
                                                                ent.setNavi !== sel &&
                                                                !(this.state.pagesList || []).includes(ent.setNavi) && (
                                                                    <MenuItem
                                                                        key={`custom-${ent.setNavi}`}
                                                                        value={ent.setNavi}
                                                                    >
                                                                        {ent.setNavi}
                                                                    </MenuItem>
                                                                )}
                                                        </Select>
                                                    </Box>
                                                )}
                                            </>
                                        );
                                    })()}
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    {/* navigation assignment right panel (30%) */}
                    <NavigationAssignmentPanel
                        widthPercent={30}
                        uniqueName={local.selected}
                        currentAssignments={
                            entries.find(e => e.uniqueName === local.selected)?.navigationAssignment || []
                        }
                        // provide admin socket/context so the panel can call sendTo
                        oContext={this.props.oContext}
                        onAssign={(uniqueName, assignments) => {
                            const updated = entries.map(it =>
                                it.uniqueName === uniqueName ? { ...it, navigationAssignment: assignments } : it,
                            );
                            this.setState({ entries: updated } as UnlockPageState);
                            void this.onChange(this.props.attr!, updated);
                        }}
                    >
                        <Paper
                            sx={{ height: '100%', p: 2, backgroundColor: 'transparent' }}
                            elevation={0}
                        >
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    sx={{ mb: 1 }}
                                >
                                    {this.getText('unlock_unique_label')}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 600 }}
                                >
                                    {local.selected || this.getText('unlock_select_item')}
                                </Typography>
                                <InfoOutlined
                                    fontSize="small"
                                    color="action"
                                    sx={{ mt: 1 }}
                                />
                            </Box>
                        </Paper>
                    </NavigationAssignmentPanel>
                </Box>
            </Box>
        );
    }
}

export default withTheme(UnlockPage);
