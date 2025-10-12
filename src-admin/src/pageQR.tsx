import React from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Divider,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Checkbox,
    Select,
    MenuItem,
    InputLabel,
    IconButton,
    InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, InfoOutlined } from '@mui/icons-material';
import { withTheme } from '@mui/styles';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import {
    type QREntries,
    type QREntry,
    type NavigationAssignmentList,
    ADAPTER_NAME,
    SENDTO_GET_PAGES_All_COMMAND,
} from '../../src/lib/types/adminShareConfig';
import NavigationAssignmentPanel from './components/NavigationAssignmentPanel';
import ConfirmDialog from './components/ConfirmDialog';

interface QRPageState extends ConfigGenericState {
    entries: QREntries;
    confirmDeleteOpen?: boolean;
    confirmDeleteName?: string | null;
    pagesList?: string[];
    alive?: boolean;
    pagesRetryCount?: number;
}

interface LocalUIState {
    newName: string;
    selected: string;
    showPassword: boolean;
}

class QRPage extends ConfigGeneric<ConfigGenericProps & { theme?: any }, QRPageState> {
    private _local: LocalUIState | null = null;
    private pagesRetryTimeout?: NodeJS.Timeout;

    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
        const saved = ConfigGeneric.getValue(props.data, props.attr!);
        this.state = {
            ...(this.state as ConfigGenericState),
            entries: Array.isArray(saved) ? (saved as QREntries) : [],
            confirmDeleteOpen: false,
            confirmDeleteName: null,
            alive: false,
            pagesRetryCount: 0,
        } as QRPageState;
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
            this.setState({ alive: isAlive } as QRPageState);

            // Subscribe to alive state changes
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);

            // If adapter is alive, start loading pages
            if (isAlive) {
                await this.loadPagesList();
            }
        } catch (error) {
            console.error('[QRPage] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false } as QRPageState);
        }
    }

    // Callback for alive state changes
    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            this.setState({ alive: isAlive } as QRPageState);

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
            console.log('[QRPage] Adapter not alive, skipping pages load');
            return;
        }

        // preload pages list for setState select
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
                        `[QRPage] Got empty pages array, retrying in ${retryDelay}ms (attempt ${currentRetryCount + 1})`,
                    );

                    // Update retry count and schedule next retry
                    this.setState({ pagesRetryCount: currentRetryCount + 1 } as QRPageState);

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
                            console.log('[QRPage] Adapter went offline, cancelling pages retry');
                        }
                    }, retryDelay);

                    return; // Don't update pagesList yet, wait for retry
                } else if (list.length > 0) {
                    // Success! Reset retry count and clear any pending timeout
                    console.log(
                        `[QRPage] Successfully loaded ${list.length} pages after ${this.state.pagesRetryCount || 0} retries`,
                    );
                    this.setState({ pagesRetryCount: 0 } as QRPageState);
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
                    `[QRPage] Error loading pages, retrying in ${retryDelay}ms (attempt ${currentRetryCount + 1}): ${String(error)}`,
                );

                this.setState({ pagesRetryCount: currentRetryCount + 1 } as QRPageState);

                if (this.pagesRetryTimeout) {
                    clearTimeout(this.pagesRetryTimeout);
                }

                this.pagesRetryTimeout = setTimeout(() => {
                    // Double-check adapter is still alive before retrying
                    if (this.state.alive) {
                        void this.loadPagesList();
                    } else {
                        console.log('[QRPage] Adapter went offline, cancelling pages retry after error');
                    }
                }, retryDelay);

                return;
            }
        } else {
            console.log('[QRPage] No socket available for sendTo');
            return;
        }

        // remove duplicates and set state
        this.setState({ pagesList: Array.from(new Set(pages)) } as QRPageState);
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const entries = this.state.entries || [];
        const uniqueNames = Array.from(new Set(entries.map(e => e.uniqueName))).filter(Boolean);

        // local UI state for new name + selected
        // we keep them in component instance to avoid changing global state signature
        if (!this._local) {
            this._local = { newName: '', selected: uniqueNames[0] || '', showPassword: false };
        }
        const local = this._local;

        const doAdd = (): void => {
            const name = (local.newName || '').trim();
            if (!name) {
                return;
            }
            // create a default QREntry with provided uniqueName
            const newEntry: QREntry = {
                card: 'cardQR',
                uniqueName: name,
                headline: name,
                SSIDURLTEL: '',
                wlanhidden: false,
                pwdhidden: false,
                setState: '',
                selType: 0, // Default to FREE
            };
            const updated = [...entries, newEntry];
            this.setState({ entries: updated } as QRPageState);
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
            this.setState({ confirmDeleteOpen: true, confirmDeleteName: sel } as QRPageState);
        };

        const closeConfirm = (): void => {
            this.setState({ confirmDeleteOpen: false, confirmDeleteName: null } as QRPageState);
        };

        const confirmDelete = (): void => {
            const name = this.state.confirmDeleteName;
            if (!name) {
                closeConfirm();
                return;
            }
            const updated = entries.filter(e => e.uniqueName !== name);
            this.setState({ entries: updated, confirmDeleteOpen: false, confirmDeleteName: null } as QRPageState);
            void this.onChange(this.props.attr!, updated);
            // pick next
            const remaining = Array.from(new Set(updated.map(e => e.uniqueName))).filter(Boolean);
            local.selected = remaining[0] || '';
            this.setState({} as QRPageState);
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
                                    this.setState({} as QRPageState);
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
                                                this.setState({} as QRPageState);
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
                            href="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/PageQR"
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
                    title={this.getText('delete_confirm_title')}
                    description={
                        this.getText('delete_confirm_text') +
                        (this.state.confirmDeleteName ? `: ${this.state.confirmDeleteName}` : '')
                    }
                    cancelText={this.getText('Cancel')}
                    confirmText={this.getText('Delete')}
                    ariaTitleId="qr-delete-confirm-title"
                    ariaDescId="qr-delete-confirm-description"
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
                                    <Typography variant="h6">{this.getText('select_item')}</Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {this.getText('select_description')}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                // item selected: show config
                                <Box>
                                    {(() => {
                                        const sel = local.selected;
                                        const ent = entries.find(e => e.uniqueName === sel);
                                        if (!ent) {
                                            return null;
                                        }

                                        return (
                                            <>
                                                {/* UniqueName display */}
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
                                                        label={this.getText('unique_label')}
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
                                                            this.setState({ entries: updated } as QRPageState);
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

                                                {/* QR Type Selection */}
                                                <Box sx={{ mb: 2 }}>
                                                    <FormControl component="fieldset">
                                                        <FormLabel component="legend">
                                                            {this.getText('qr_type')}
                                                        </FormLabel>
                                                        <RadioGroup
                                                            row
                                                            value={ent.selType ?? 0}
                                                            onChange={e => {
                                                                const value = parseInt(e.target.value, 10);
                                                                const updated = entries.map(it =>
                                                                    it.uniqueName === sel
                                                                        ? { ...it, selType: value }
                                                                        : it,
                                                                );
                                                                this.setState({ entries: updated } as QRPageState);
                                                                void this.onChange(this.props.attr!, updated);
                                                            }}
                                                        >
                                                            <FormControlLabel
                                                                value={1}
                                                                control={<Radio />}
                                                                label={this.getText('qr_type_wifi')}
                                                            />
                                                            <FormControlLabel
                                                                value={2}
                                                                control={<Radio />}
                                                                label={this.getText('qr_type_url')}
                                                            />
                                                            <FormControlLabel
                                                                value={3}
                                                                control={<Radio />}
                                                                label={this.getText('qr_type_tel')}
                                                            />
                                                        </RadioGroup>
                                                    </FormControl>
                                                </Box>

                                                {/* Headline */}
                                                <TextField
                                                    fullWidth
                                                    variant="standard"
                                                    type="text"
                                                    autoComplete="off"
                                                    label={this.getText('headline')}
                                                    value={ent.headline ?? ''}
                                                    onChange={e => {
                                                        const v = e.target.value;
                                                        const updated = entries.map(it =>
                                                            it.uniqueName === sel ? { ...it, headline: v } : it,
                                                        );
                                                        this.setState({ entries: updated } as QRPageState);
                                                        void this.onChange(this.props.attr!, updated);
                                                    }}
                                                    InputProps={{
                                                        sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
                                                    }}
                                                    sx={{ mb: 2 }}
                                                />

                                                {/* SSID/URL/TEL field */}
                                                <TextField
                                                    fullWidth
                                                    variant="standard"
                                                    type="text"
                                                    autoComplete="off"
                                                    label={(() => {
                                                        switch (ent.selType) {
                                                            case 1:
                                                                return this.getText('qr_content_wifi');
                                                            case 2:
                                                                return this.getText('qr_content_url');
                                                            case 3:
                                                                return this.getText('qr_content_tel');
                                                            default:
                                                                return this.getText('qr_content');
                                                        }
                                                    })()}
                                                    value={ent.SSIDURLTEL ?? ''}
                                                    onChange={e => {
                                                        const v = e.target.value;
                                                        const updated = entries.map(it =>
                                                            it.uniqueName === sel ? { ...it, SSIDURLTEL: v } : it,
                                                        );
                                                        this.setState({ entries: updated } as QRPageState);
                                                        void this.onChange(this.props.attr!, updated);
                                                    }}
                                                    InputProps={{
                                                        sx: { backgroundColor: 'transparent', px: 1 },
                                                    }}
                                                    sx={{ mb: 2 }}
                                                />

                                                {/* WiFi-specific fields */}
                                                {ent.selType === 1 && (
                                                    <Box sx={{ mb: 2 }}>
                                                        {/* WLAN Type */}
                                                        <FormControl
                                                            variant="standard"
                                                            sx={{ mb: 2, minWidth: 120 }}
                                                        >
                                                            <InputLabel>{this.getText('qr_wlan_type')}</InputLabel>
                                                            <Select
                                                                value={ent.wlantype ?? 'WPA2'}
                                                                onChange={e => {
                                                                    const v = e.target.value as
                                                                        | 'nopass'
                                                                        | 'WPA'
                                                                        | 'WPA2'
                                                                        | 'WPA3'
                                                                        | 'WEP';
                                                                    const updated = entries.map(it =>
                                                                        it.uniqueName === sel
                                                                            ? { ...it, wlantype: v }
                                                                            : it,
                                                                    );
                                                                    this.setState({ entries: updated } as QRPageState);
                                                                    void this.onChange(this.props.attr!, updated);
                                                                }}
                                                            >
                                                                <MenuItem value="nopass">No Password</MenuItem>
                                                                <MenuItem value="WPA">WPA</MenuItem>
                                                                <MenuItem value="WPA2">WPA2</MenuItem>
                                                                <MenuItem value="WPA3">WPA3</MenuItem>
                                                                <MenuItem value="WEP">WEP</MenuItem>
                                                            </Select>
                                                        </FormControl>

                                                        {/* Password field */}
                                                        {ent.wlantype !== 'nopass' && (
                                                            <TextField
                                                                fullWidth
                                                                variant="standard"
                                                                type={local.showPassword ? 'text' : 'password'}
                                                                label={this.getText('qr_password')}
                                                                value={ent.qrPaas ?? ''}
                                                                onChange={e => {
                                                                    const v = e.target.value;
                                                                    const updated = entries.map(it =>
                                                                        it.uniqueName === sel
                                                                            ? { ...it, qrPaas: v }
                                                                            : it,
                                                                    );
                                                                    this.setState({ entries: updated } as QRPageState);
                                                                    void this.onChange(this.props.attr!, updated);
                                                                }}
                                                                InputProps={{
                                                                    sx: { backgroundColor: 'transparent', px: 1 },
                                                                    endAdornment: (
                                                                        <InputAdornment position="end">
                                                                            <IconButton
                                                                                aria-label="toggle password visibility"
                                                                                onClick={() => {
                                                                                    local.showPassword =
                                                                                        !local.showPassword;
                                                                                    this.setState({} as QRPageState);
                                                                                }}
                                                                                edge="end"
                                                                            >
                                                                                {local.showPassword ? (
                                                                                    <VisibilityOff />
                                                                                ) : (
                                                                                    <Visibility />
                                                                                )}
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                                sx={{ mb: 2 }}
                                                            />
                                                        )}

                                                        {/* Hidden checkboxes */}
                                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={!!ent.wlanhidden}
                                                                        onChange={(_e, checked) => {
                                                                            const updated = entries.map(it =>
                                                                                it.uniqueName === sel
                                                                                    ? { ...it, wlanhidden: checked }
                                                                                    : it,
                                                                            );
                                                                            this.setState({
                                                                                entries: updated,
                                                                            } as QRPageState);
                                                                            void this.onChange(
                                                                                this.props.attr!,
                                                                                updated,
                                                                            );
                                                                        }}
                                                                    />
                                                                }
                                                                label={this.getText('qr_wlan_hidden')}
                                                            />
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={!!ent.pwdhidden}
                                                                        onChange={(_e, checked) => {
                                                                            const updated = entries.map(it =>
                                                                                it.uniqueName === sel
                                                                                    ? { ...it, pwdhidden: checked }
                                                                                    : it,
                                                                            );
                                                                            this.setState({
                                                                                entries: updated,
                                                                            } as QRPageState);
                                                                            void this.onChange(
                                                                                this.props.attr!,
                                                                                updated,
                                                                            );
                                                                        }}
                                                                    />
                                                                }
                                                                label={this.getText('qr_pwd_hidden')}
                                                            />
                                                        </Box>

                                                        {/* Set State field */}
                                                        <TextField
                                                            fullWidth
                                                            variant="standard"
                                                            type="text"
                                                            autoComplete="off"
                                                            label={this.getText('qr_set_state')}
                                                            value={ent.setState ?? ''}
                                                            onChange={e => {
                                                                const v = e.target.value;
                                                                const updated = entries.map(it =>
                                                                    it.uniqueName === sel ? { ...it, setState: v } : it,
                                                                );
                                                                this.setState({ entries: updated } as QRPageState);
                                                                void this.onChange(this.props.attr!, updated);
                                                            }}
                                                            InputProps={{
                                                                sx: { backgroundColor: 'transparent', px: 1 },
                                                            }}
                                                            sx={{ mb: 2 }}
                                                        />
                                                    </Box>
                                                )}

                                                {/* Common fields */}
                                                <Box sx={{ mt: 2 }}>
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
                                                                    this.setState({ entries: updated } as QRPageState);
                                                                    void this.onChange(this.props.attr!, updated);
                                                                }}
                                                            />
                                                        }
                                                        label={this.getText('hidden')}
                                                    />

                                                    {/* alwaysOn radio group */}
                                                    <Box sx={{ mt: 2 }}>
                                                        <FormControl component="fieldset">
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{ mb: 1 }}
                                                            >
                                                                {this.getText('alwaysOn')}
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
                                                                    } as QRPageState);
                                                                    void this.onChange(this.props.attr!, updated);
                                                                }}
                                                            >
                                                                <FormControlLabel
                                                                    value="none"
                                                                    control={<Radio />}
                                                                    label={this.getText('alwaysOn_none')}
                                                                />
                                                                <FormControlLabel
                                                                    value="always"
                                                                    control={<Radio />}
                                                                    label={this.getText('alwaysOn_always')}
                                                                />
                                                                <FormControlLabel
                                                                    value="ignore"
                                                                    control={<Radio />}
                                                                    label={this.getText('alwaysOn_ignore')}
                                                                />
                                                            </RadioGroup>
                                                        </FormControl>
                                                    </Box>
                                                </Box>
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
                            this.setState({ entries: updated } as QRPageState);
                            void this.onChange(this.props.attr!, updated);
                        }}
                    />
                </Box>
            </Box>
        );
    }
}

export default withTheme(QRPage);
