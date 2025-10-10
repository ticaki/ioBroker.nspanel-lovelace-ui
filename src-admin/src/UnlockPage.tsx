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
    Divider,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { withTheme } from '@mui/styles';
import ConfirmDialog from './components/ConfirmDialog';
import { ADAPTER_NAME, SENDTO_GET_PAGES_All_COMMAND } from '../../src/lib/types/adminShareConfig';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import type { UnlockEntry, UnlockEntries } from '../../src/lib/types/adminShareConfig';
import NavigationAssignmentPanel from './components/NavigationAssignmentPanel';

interface UnlockPageState extends ConfigGenericState {
    entries: UnlockEntries;
    confirmDeleteOpen?: boolean;
    confirmDeleteName?: string | null;
    pagesList?: string[];
    alive?: boolean;
    pagesRetryCount?: number;
}

interface LocalUIState {
    newName: string;
    selected: string;
    showPin: boolean;
}

class UnlockPage extends ConfigGeneric<ConfigGenericProps & { theme?: any }, UnlockPageState> {
    private _local: LocalUIState | null = null;
    private pagesRetryTimeout?: NodeJS.Timeout;

    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
        const saved = ConfigGeneric.getValue(props.data, props.attr!);
        this.state = {
            ...(this.state as ConfigGenericState),
            entries: Array.isArray(saved) ? (saved as UnlockEntries) : [],
            confirmDeleteOpen: false,
            confirmDeleteName: null,
            alive: false,
            pagesRetryCount: 0,
        } as UnlockPageState;
    }

    componentWillUnmount(): void {
        if (this.pagesRetryTimeout) {
            clearTimeout(this.pagesRetryTimeout);
        }
        // Unsubscribe from alive state changes
        const instance = this.props.oContext.instance ?? '0';
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
            this.onAliveChanged,
        );
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount();

        // Get initial alive state and subscribe to changes
        const instance = this.props.oContext.instance ?? '0';
        const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;

        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            const isAlive = !!state?.val;
            this.setState({ alive: isAlive } as UnlockPageState);

            // Subscribe to alive state changes
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);

            // If adapter is alive, start loading pages
            if (isAlive) {
                await this.loadPagesList();
            }
        } catch (error) {
            console.error('[UnlockPage] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false } as UnlockPageState);
        }
    }

    // Callback for alive state changes
    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            this.setState({ alive: isAlive } as UnlockPageState);

            // If adapter just became alive and we don't have pages loaded, start loading
            if (!wasAlive && isAlive && (!this.state.pagesList || this.state.pagesList.length === 0)) {
                void this.loadPagesList();
            }

            // If adapter went offline, clear any pending retry timeout
            if (wasAlive && !isAlive && this.pagesRetryTimeout) {
                clearTimeout(this.pagesRetryTimeout);
                this.pagesRetryTimeout = undefined;
            }
        }
    };

    private async loadPagesList(): Promise<void> {
        // Don't try to load if adapter is not alive
        if (!this.state.alive) {
            console.log('[UnlockPage] Adapter not alive, skipping pages load');
            return;
        }

        // preload pages list for setNavi select
        const pages: string[] = [];
        if (this.props.oContext && this.props.oContext.socket) {
            const instance = this.props.oContext.instance ?? '0';
            const target = `${ADAPTER_NAME}.${instance}`;
            try {
                const rawPages = await this.props.oContext.socket.sendTo(target, SENDTO_GET_PAGES_All_COMMAND, null);
                let list: string[] = [];
                if (Array.isArray(rawPages)) {
                    list = rawPages;
                } else if (rawPages && Array.isArray(rawPages.result)) {
                    list = rawPages.result;
                }
                for (const name of list) {
                    pages.push(name);
                }

                // Check if we got an empty array - keep retrying every 3 seconds until success
                if (list.length === 0) {
                    const currentRetryCount = this.state.pagesRetryCount || 0;
                    const retryDelay = 3000; // 3 seconds

                    console.log(
                        `[UnlockPage] Got empty pages array, retrying in ${retryDelay}ms (attempt ${currentRetryCount + 1})`,
                    );

                    // Update retry count and schedule next retry
                    this.setState({ pagesRetryCount: currentRetryCount + 1 } as UnlockPageState);

                    // Clear any existing retry timeout
                    if (this.pagesRetryTimeout) {
                        clearTimeout(this.pagesRetryTimeout);
                    }

                    // Schedule retry in 3 seconds, but only if adapter is still alive
                    this.pagesRetryTimeout = setTimeout(() => {
                        // Double-check adapter is still alive before retrying
                        if (this.state.alive) {
                            void this.loadPagesList();
                        } else {
                            console.log('[UnlockPage] Adapter went offline, cancelling pages retry');
                        }
                    }, retryDelay);

                    return; // Don't update pagesList yet, wait for retry
                } else if (list.length > 0) {
                    // Success! Reset retry count and clear any pending timeout
                    console.log(
                        `[UnlockPage] Successfully loaded ${list.length} pages after ${this.state.pagesRetryCount || 0} retries`,
                    );
                    this.setState({ pagesRetryCount: 0 } as UnlockPageState);
                    if (this.pagesRetryTimeout) {
                        clearTimeout(this.pagesRetryTimeout);
                        this.pagesRetryTimeout = undefined;
                    }
                }
            } catch (error) {
                // On error, also retry in 3 seconds, but only if adapter is still alive
                const currentRetryCount = this.state.pagesRetryCount || 0;
                const retryDelay = 3000;

                console.log(
                    `[UnlockPage] Error loading pages, retrying in ${retryDelay}ms (attempt ${currentRetryCount + 1}): ${String(error)}`,
                );

                this.setState({ pagesRetryCount: currentRetryCount + 1 } as UnlockPageState);

                if (this.pagesRetryTimeout) {
                    clearTimeout(this.pagesRetryTimeout);
                }

                this.pagesRetryTimeout = setTimeout(() => {
                    // Double-check adapter is still alive before retrying
                    if (this.state.alive) {
                        void this.loadPagesList();
                    } else {
                        console.log('[UnlockPage] Adapter went offline, cancelling pages retry after error');
                    }
                }, retryDelay);

                return;
            }
        } else {
            console.log('[UnlockPage] No socket available for sendTo');
            return;
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
                card: 'cardAlarm',
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
            <Box
                sx={{
                    height: 'calc(100vh - 64px)',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    p: 1,
                }}
            >
                {/* left sidebar: 20% width on desktop, full width on mobile */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '20%' },
                        pr: { xs: 0, md: 1 },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {/* Pages header */}
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 1,
                            fontWeight: 600,
                            color: 'primary.main',
                            fontSize: '1rem',
                        }}
                    >
                        {this.getText('pages')}
                    </Typography>

                    <Paper
                        sx={{ p: 1, backgroundColor: 'transparent' }}
                        elevation={0}
                    >
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                aria-label="new-name"
                                label={this.getText('new_page')}
                                value={local.newName}
                                onChange={e => {
                                    local.newName = e.target.value;
                                    this.setState({} as UnlockPageState);
                                }}
                                variant="standard"
                                placeholder={this.getText('New item')}
                                InputProps={{
                                    sx: { backgroundColor: 'transparent', px: 1 },
                                }}
                                sx={{
                                    flex: 1,
                                    '& .MuiInput-underline:before': {
                                        borderBottomColor: 'primary.main',
                                    },
                                    '& .MuiInput-underline:hover:before': {
                                        borderBottomColor: 'primary.main',
                                    },
                                    '& .MuiInput-underline:after': {
                                        borderBottomColor: 'primary.main',
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'primary.main',
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: 'primary.main',
                                    },
                                }}
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
                        return (
                            <Paper
                                sx={{ overflow: 'auto', p: 1, backgroundColor: 'transparent' }}
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
                    <Divider sx={{ my: 1 }} />
                    {/* Documentation link */}
                    <Box sx={{ mb: 2 }}>
                        <a
                            href="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/pageUnlock"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                fontSize: '0.875rem',
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'primary.main',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        opacity: 0.8,
                                    },
                                }}
                            >
                                {this.getText('documentation')}
                            </Typography>
                        </a>
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
                        width: { xs: '100%', md: '90%' },
                        pl: { xs: 0, md: 2 },
                        mt: { xs: 2, md: 0 },
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 1,
                        position: 'relative',
                    }}
                >
                    <Box
                        sx={{
                            width: { xs: '100%', md: '95%' },
                            borderLeft: { xs: 'none', md: '1px solid' },
                            borderColor: 'divider',
                        }}
                    >
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
                                                    <TextField
                                                        fullWidth
                                                        variant="standard"
                                                        type="text"
                                                        label={this.getText('unlock_unique_label')}
                                                        value={sel}
                                                        onChange={e => {
                                                            const newUniqueName = e.target.value;
                                                            if (!newUniqueName.trim()) {
                                                                return;
                                                            }

                                                            // Update the entry with new uniqueName
                                                            const updated = entries.map(it =>
                                                                it.uniqueName === sel
                                                                    ? { ...it, uniqueName: newUniqueName }
                                                                    : it,
                                                            );
                                                            this.setState({ entries: updated } as UnlockPageState);
                                                            void this.onChange(this.props.attr!, updated);

                                                            // Update local selected to the new name
                                                            local.selected = newUniqueName;
                                                        }}
                                                        InputProps={{
                                                            sx: {
                                                                backgroundColor: 'transparent',
                                                                px: 1,
                                                                fontWeight: 600,
                                                                width: '50%',
                                                            },
                                                        }}
                                                    />
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
                                                        sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
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
                                                            sx={{ backgroundColor: 'transparent', px: 1, width: '60%' }}
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
                        {...this.props}
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
                    />

                    {/* Info box moved outside NavigationAssignmentPanel */}
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
                </Box>
            </Box>
        );
    }
}

export default withTheme(UnlockPage);
