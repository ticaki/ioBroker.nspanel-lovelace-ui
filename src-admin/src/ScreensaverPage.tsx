import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Divider,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Select,
    MenuItem,
    InputLabel,
} from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { withTheme } from '@mui/styles';
import ConfirmDialog from './components/ConfirmDialog';
import FileSelectorPopup from './components/FileSelectorPopup';
import { ADAPTER_NAME, SENDTO_GET_PAGES_All_COMMAND } from '../../src/lib/types/adminShareConfig';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import type { ScreensaverEntry, ScreensaverEntries } from '../../src/lib/types/adminShareConfig';
import NavigationAssignmentPanel from './components/NavigationAssignmentPanel';

interface ScreensaverPageState extends ConfigGenericState {
    entries: ScreensaverEntries;
    confirmDeleteOpen?: boolean;
    confirmDeleteName?: string | null;
    pagesList?: string[];
    alive?: boolean;
    pagesRetryCount?: number;
    fileSelectorOpen?: boolean;
}

interface LocalUIState {
    newName: string;
    selected: string;
}

class ScreensaverPage extends ConfigGeneric<ConfigGenericProps & { theme?: any }, ScreensaverPageState> {
    private _local: LocalUIState | null = null;
    private pagesRetryTimeout?: NodeJS.Timeout;

    // Common date and time format options
    private readonly dateFormats = [
        { value: { dateStyle: 'short' }, label: 'DD.MM.YY' },
        { value: { dateStyle: 'short', locale: 'en-US' }, label: 'MM/DD/YY' },
        { value: { year: 'numeric', month: '2-digit', day: '2-digit' }, label: 'YYYY-MM-DD' },
        { value: { day: '2-digit', month: 'short', year: 'numeric' }, label: 'DD MMM YYYY' },
        { value: { day: '2-digit', month: 'long', year: 'numeric' }, label: 'DD Month YYYY' },
        { value: { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }, label: 'EEE, DD.MM.YYYY' },
        { value: { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }, label: 'EEEE, DD.MM.YYYY' },
        { value: { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }, label: 'EEE, DD MMM YYYY' },
        { value: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }, label: 'EEEE, DD Month YYYY' },
        { value: 'custom', label: 'Custom' },
    ];

    private readonly timeFormats = [
        { value: 'HH:mm', label: 'timeFormat24' },
        { value: 'h:mm a', label: 'timeFormat12' },
        { value: 'HH:mm:ss', label: 'timeFormat24Seconds' },
        { value: 'h:mm:ss a', label: 'timeFormat12Seconds' },
        { value: 'custom', label: 'Custom' },
    ];

    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
        const saved = ConfigGeneric.getValue(props.data, props.attr!);
        this.state = {
            ...(this.state as ConfigGenericState),
            entries: Array.isArray(saved) ? (saved as ScreensaverEntries) : [],
            confirmDeleteOpen: false,
            confirmDeleteName: null,
            alive: false,
            pagesRetryCount: 0,
        } as ScreensaverPageState;
    }

    private formatDatePreview(date: Date, format: string): string {
        try {
            return date.toLocaleDateString(undefined, typeof format === 'string' ? JSON.parse(format) : format);
        } catch {
            return 'Invalid Format';
        }
    }

    private formatTimePreview(date: Date, format: string): string {
        return format
            .replace(/HH/g, String(date.getHours()).padStart(2, '0'))
            .replace(/mm/g, String(date.getMinutes()).padStart(2, '0'))
            .replace(/ss/g, String(date.getSeconds()).padStart(2, '0'))
            .replace(/h/g, String(date.getHours() % 12 || 12))
            .replace(/a/g, date.getHours() >= 12 ? 'PM' : 'AM');
    }

    private handleFileSelectorOpen = (): void => {
        this.setState({ fileSelectorOpen: true } as ScreensaverPageState);
    };

    private handleFileSelectorClose = (): void => {
        this.setState({ fileSelectorOpen: false } as ScreensaverPageState);
    };

    private handleFileSelect = (filePath: string): void => {
        console.log('[ScreensaverPage] Selected file:', filePath);
        // Handle file selection here (e.g., update state or show notification)
    };

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
            this.setState({ alive: isAlive } as ScreensaverPageState);

            // Subscribe to alive state changes
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);

            // If adapter is alive, start loading pages
            if (isAlive) {
                await this.loadPagesList();
            }
        } catch (error) {
            console.error('[ScreensaverPage] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false } as ScreensaverPageState);
        }
    }

    // Callback for alive state changes
    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            this.setState({ alive: isAlive } as ScreensaverPageState);

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
            console.log('[ScreensaverPage] Adapter not alive, skipping pages load');
            return;
        }

        // preload pages list for navigation selects
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
                        `[ScreensaverPage] Got empty pages array, retrying in ${retryDelay}ms (attempt ${currentRetryCount + 1})`,
                    );

                    // Update retry count and schedule next retry
                    this.setState({ pagesRetryCount: currentRetryCount + 1 } as ScreensaverPageState);

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
                            console.log('[ScreensaverPage] Adapter went offline, cancelling pages retry');
                        }
                    }, retryDelay);

                    return; // Don't update pagesList yet, wait for retry
                } else if (list.length > 0) {
                    // Success! Reset retry count and clear any pending timeout
                    console.log(
                        `[ScreensaverPage] Successfully loaded ${list.length} pages after ${this.state.pagesRetryCount || 0} retries`,
                    );
                    this.setState({ pagesRetryCount: 0 } as ScreensaverPageState);
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
                    `[ScreensaverPage] Error loading pages, retrying in ${retryDelay}ms (attempt ${currentRetryCount + 1}): ${String(error)}`,
                );

                this.setState({ pagesRetryCount: currentRetryCount + 1 } as ScreensaverPageState);

                if (this.pagesRetryTimeout) {
                    clearTimeout(this.pagesRetryTimeout);
                }

                this.pagesRetryTimeout = setTimeout(() => {
                    // Double-check adapter is still alive before retrying
                    if (this.state.alive) {
                        void this.loadPagesList();
                    } else {
                        console.log('[ScreensaverPage] Adapter went offline, cancelling pages retry after error');
                    }
                }, retryDelay);

                return;
            }
        } else {
            console.log('[ScreensaverPage] No socket available for sendTo');
            return;
        }

        // remove duplicates and set state
        this.setState({ pagesList: Array.from(new Set(pages)) } as ScreensaverPageState);
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const entries = this.state.entries || [];
        const uniqueNames = Array.from(new Set(entries.map(e => e.uniqueName))).filter(Boolean);

        // local UI state for new name + selected
        // we keep them in component instance to avoid changing global state signature
        if (!this._local) {
            this._local = { newName: '', selected: uniqueNames[0] || '' };
        }
        const local = this._local;

        const doAdd = (): void => {
            const name = (local.newName || '').trim();
            if (!name) {
                return;
            }
            // create a default ScreensaverEntry with provided uniqueName
            const newEntry: ScreensaverEntry = {
                card: 'screensaver',
                uniqueName: name,
                headline: name,
                type: 'clock',
                enabled: true,
                timeout: 60,
            };
            const updated = [...entries, newEntry];
            this.setState({ entries: updated } as ScreensaverPageState);
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
            this.setState({ confirmDeleteOpen: true, confirmDeleteName: sel } as ScreensaverPageState);
        };

        const closeConfirm = (): void => {
            this.setState({ confirmDeleteOpen: false, confirmDeleteName: null } as ScreensaverPageState);
        };

        const confirmDelete = (): void => {
            const name = this.state.confirmDeleteName;
            if (!name) {
                closeConfirm();
                return;
            }
            const updated = entries.filter((e: ScreensaverEntry) => e.uniqueName !== name);
            this.setState({
                entries: updated,
                confirmDeleteOpen: false,
                confirmDeleteName: null,
            } as ScreensaverPageState);
            void this.onChange(this.props.attr!, updated);
            // pick next
            const remaining = Array.from(new Set(updated.map((e: ScreensaverEntry) => e.uniqueName))).filter(Boolean);
            if (local) {
                local.selected = remaining[0] || '';
            }
            this.setState({} as ScreensaverPageState);
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
                    {/* Screensaver pages header */}
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 1,
                            fontWeight: 600,
                            color: 'primary.main',
                            fontSize: '1rem',
                        }}
                    >
                        {this.getText('screensaver_pages')}
                    </Typography>

                    <Paper
                        sx={{ p: 1, backgroundColor: 'transparent' }}
                        elevation={0}
                    >
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                aria-label="new-screensaver-name"
                                label={this.getText('new_screensaver')}
                                value={local?.newName || ''}
                                onChange={e => {
                                    if (local) {
                                        local.newName = e.target.value;
                                    }
                                    this.setState({} as ScreensaverPageState);
                                }}
                                variant="standard"
                                placeholder={this.getText('new_screensaver')}
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
                                    const nameTrim = (local?.newName || '').trim();
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
                                        {this.getText('no_screensavers')}
                                    </Typography>
                                ) : (
                                    uniqueNames.map((name: string) => (
                                        <Box
                                            key={name}
                                            onClick={() => {
                                                if (local) {
                                                    local.selected = name;
                                                }
                                                this.setState({} as ScreensaverPageState);
                                            }}
                                            sx={{
                                                p: 1,
                                                borderRadius: 1,
                                                cursor: 'pointer',
                                                backgroundColor:
                                                    local?.selected === name ? 'action.selected' : 'transparent',
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
                            disabled={!local?.selected}
                        >
                            -
                        </Button>
                    </Box>

                    {/* Card Type Selection */}
                    <Box sx={{ marginTop: 2, marginBottom: 2 }}>
                        <FormControl
                            component="fieldset"
                            disabled={local?.selected === null}
                        >
                            <FormLabel
                                component="legend"
                                sx={{
                                    color:
                                        local?.selected === null
                                            ? this.props.theme?.palette?.text?.disabled || '#999'
                                            : this.props.theme?.palette?.text?.primary,
                                }}
                            >
                                {this.getText('cardType')}
                            </FormLabel>
                            <RadioGroup
                                value={
                                    local?.selected
                                        ? this.state.entries.find(
                                              (entry: ScreensaverEntry) => entry.uniqueName === local.selected,
                                          )?.card || 'screensaver'
                                        : 'screensaver'
                                }
                                onChange={event => {
                                    if (local?.selected) {
                                        const newCard = event.target.value as
                                            | 'screensaver'
                                            | 'screensaver2'
                                            | 'screensaver3';
                                        const updatedEntries = [...this.state.entries];
                                        const index = updatedEntries.findIndex(
                                            (entry: ScreensaverEntry) => entry.uniqueName === local.selected,
                                        );
                                        if (index !== -1) {
                                            updatedEntries[index] = { ...updatedEntries[index], card: newCard };
                                            this.setState({ entries: updatedEntries });
                                            this.props.onChange(this.props.attr || '', updatedEntries);
                                        }
                                    }
                                }}
                                sx={{
                                    flexDirection: 'column',
                                    '& .MuiRadio-root.Mui-disabled': {
                                        color: '#999 !important',
                                    },
                                    '& .MuiFormControlLabel-label.Mui-disabled': {
                                        color: '#999 !important',
                                    },
                                }}
                            >
                                <FormControlLabel
                                    value="screensaver"
                                    control={<Radio />}
                                    label={this.getText('cardTypeStandard')}
                                />
                                <FormControlLabel
                                    value="screensaver2"
                                    control={<Radio />}
                                    label={this.getText('cardTypeAdvanced')}
                                />
                                <FormControlLabel
                                    value="screensaver3"
                                    control={<Radio />}
                                    label={this.getText('cardTypeEasyview')}
                                />
                            </RadioGroup>
                        </FormControl>
                    </Box>

                    <Divider sx={{ my: 1 }} />
                    {/* Documentation link */}
                    <Box sx={{ mb: 2 }}>
                        <a
                            href="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/screensaver"
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

                    {/* Test Button for FileSelectorPopup */}
                    <Box sx={{ mb: 2 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            fullWidth
                            onClick={this.handleFileSelectorOpen}
                        >
                            Test FileSelector
                        </Button>
                    </Box>
                </Box>
                <ConfirmDialog
                    open={!!this.state.confirmDeleteOpen}
                    onClose={closeConfirm}
                    onConfirm={confirmDelete}
                    title={this.getText('screensaver_delete_confirm_title')}
                    description={
                        this.getText('screensaver_delete_confirm_text') +
                        (this.state.confirmDeleteName ? `: ${this.state.confirmDeleteName}` : '')
                    }
                    cancelText={this.getText('Cancel')}
                    confirmText={this.getText('Delete')}
                    ariaTitleId="screensaver-delete-confirm-title"
                    ariaDescId="screensaver-delete-confirm-description"
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
                            {!local?.selected ? (
                                // nothing selected: show only hint
                                <Box>
                                    <Typography variant="h6">{this.getText('screensaver_select_item')}</Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {this.getText('screensaver_select_description')}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                // item selected: show screensaver config
                                <Box>
                                    {(() => {
                                        const sel = local?.selected;
                                        const ent = entries.find(e => e.uniqueName === sel);
                                        if (!ent) {
                                            return (
                                                <Typography
                                                    variant="body2"
                                                    color="error"
                                                >
                                                    {this.getText('screensaver_entry_not_found')}
                                                </Typography>
                                            );
                                        }

                                        return (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{ mb: 1 }}
                                                >
                                                    {this.getText('screensaver_config')}: {sel}
                                                </Typography>

                                                {/* Screensaver-specific configuration fields would go here */}
                                                <TextField
                                                    label={this.getText('screensaver_headline')}
                                                    value={ent.headline || ''}
                                                    onChange={e => {
                                                        const updated = entries.map((entry: ScreensaverEntry) =>
                                                            entry.uniqueName === sel
                                                                ? { ...entry, headline: e.target.value }
                                                                : entry,
                                                        );
                                                        this.setState({ entries: updated } as ScreensaverPageState);
                                                        void this.onChange(this.props.attr!, updated);
                                                    }}
                                                    variant="outlined"
                                                    fullWidth
                                                />

                                                <TextField
                                                    label={this.getText('screensaver_timeout')}
                                                    value={ent.timeout || 60}
                                                    onChange={e => {
                                                        const timeout = parseInt(e.target.value) || 60;
                                                        const updated = entries.map((entry: ScreensaverEntry) =>
                                                            entry.uniqueName === sel ? { ...entry, timeout } : entry,
                                                        );
                                                        this.setState({ entries: updated } as ScreensaverPageState);
                                                        void this.onChange(this.props.attr!, updated);
                                                    }}
                                                    variant="outlined"
                                                    type="number"
                                                    fullWidth
                                                />

                                                {/* Date Format Selection */}
                                                <FormControl
                                                    variant="outlined"
                                                    fullWidth
                                                    sx={{ mt: 2 }}
                                                >
                                                    <InputLabel>{this.getText('dateFormat')}</InputLabel>
                                                    <Select
                                                        value={ent.dateFormat || 'dd.MM.yyyy'}
                                                        onChange={e => {
                                                            const dateFormat = e.target.value;
                                                            const updated = entries.map((entry: ScreensaverEntry) =>
                                                                entry.uniqueName === sel
                                                                    ? { ...entry, dateFormat }
                                                                    : entry,
                                                            );
                                                            this.setState({ entries: updated } as ScreensaverPageState);
                                                            void this.onChange(this.props.attr!, updated);
                                                        }}
                                                        label={this.getText('dateFormat')}
                                                    >
                                                        {this.dateFormats.map(format => (
                                                            <MenuItem
                                                                key={format.label}
                                                                value={JSON.stringify(format.value)}
                                                            >
                                                                {format.value === 'custom'
                                                                    ? this.getText('dateFormatCustom')
                                                                    : format.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>

                                                {/* Custom Date Format Input */}
                                                {ent.dateFormat === 'custom' && (
                                                    <TextField
                                                        label={this.getText('dateFormatCustom')}
                                                        value={ent.customDateFormat || ''}
                                                        onChange={e => {
                                                            const customDateFormat = e.target.value;
                                                            const updated = entries.map((entry: ScreensaverEntry) =>
                                                                entry.uniqueName === sel
                                                                    ? { ...entry, customDateFormat }
                                                                    : entry,
                                                            );
                                                            this.setState({ entries: updated } as ScreensaverPageState);
                                                            void this.onChange(this.props.attr!, updated);
                                                        }}
                                                        variant="outlined"
                                                        fullWidth
                                                        placeholder="dd.MM.yyyy"
                                                        sx={{ mt: 1 }}
                                                    />
                                                )}

                                                {/* Date Format Example */}
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ mt: 0.5, display: 'block' }}
                                                >
                                                    {this.getText('dateFormatExample')}:{' '}
                                                    {(() => {
                                                        const currentDate = new Date();
                                                        const format = ent.dateFormat || 'dd.MM.yyyy';
                                                        console.log('Formatting date with format:', ent.dateFormat);
                                                        try {
                                                            if (format === 'custom') {
                                                                const customFormat = ent.customDateFormat || '';
                                                                if (!customFormat) {
                                                                    return 'Enter custom format above';
                                                                }
                                                                return this.formatDatePreview(
                                                                    currentDate,
                                                                    customFormat,
                                                                );
                                                            }
                                                            return this.formatDatePreview(currentDate, format);
                                                        } catch {
                                                            return 'Invalid format';
                                                        }
                                                    })()}
                                                </Typography>

                                                {/* Time Format Selection */}
                                                <FormControl
                                                    variant="outlined"
                                                    fullWidth
                                                    sx={{ mt: 2 }}
                                                >
                                                    <InputLabel>{this.getText('timeFormat')}</InputLabel>
                                                    <Select
                                                        value={ent.timeFormat || 'HH:mm'}
                                                        onChange={e => {
                                                            const timeFormat = e.target.value;
                                                            const updated = entries.map((entry: ScreensaverEntry) =>
                                                                entry.uniqueName === sel
                                                                    ? { ...entry, timeFormat }
                                                                    : entry,
                                                            );
                                                            this.setState({ entries: updated } as ScreensaverPageState);
                                                            void this.onChange(this.props.attr!, updated);
                                                        }}
                                                        label={this.getText('timeFormat')}
                                                    >
                                                        {this.timeFormats.map(format => (
                                                            <MenuItem
                                                                key={format.value}
                                                                value={format.value}
                                                            >
                                                                {format.value === 'custom'
                                                                    ? this.getText('timeFormatCustom')
                                                                    : this.getText(format.label)}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>

                                                {/* Custom Time Format Input */}
                                                {ent.timeFormat === 'custom' && (
                                                    <TextField
                                                        label={this.getText('timeFormatCustom')}
                                                        value={ent.customTimeFormat || ''}
                                                        onChange={e => {
                                                            const customTimeFormat = e.target.value;
                                                            const updated = entries.map((entry: ScreensaverEntry) =>
                                                                entry.uniqueName === sel
                                                                    ? { ...entry, customTimeFormat }
                                                                    : entry,
                                                            );
                                                            this.setState({ entries: updated } as ScreensaverPageState);
                                                            void this.onChange(this.props.attr!, updated);
                                                        }}
                                                        variant="outlined"
                                                        fullWidth
                                                        placeholder="HH:mm"
                                                        sx={{ mt: 1 }}
                                                    />
                                                )}

                                                {/* Time Format Example */}
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ mt: 0.5, display: 'block' }}
                                                >
                                                    {this.getText('timeFormatExample')}:{' '}
                                                    {(() => {
                                                        const currentTime = new Date();
                                                        const format = ent.timeFormat || 'HH:mm';
                                                        try {
                                                            if (format === 'custom') {
                                                                const customFormat = ent.customTimeFormat || '';
                                                                if (!customFormat) {
                                                                    return 'Enter custom format above';
                                                                }
                                                                return this.formatTimePreview(
                                                                    currentTime,
                                                                    customFormat,
                                                                );
                                                            }
                                                            return this.formatTimePreview(currentTime, format);
                                                        } catch {
                                                            return 'Invalid format';
                                                        }
                                                    })()}
                                                </Typography>

                                                {/* Add more screensaver-specific fields here as needed */}
                                            </Box>
                                        );
                                    })()}
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    {/* NavigationAssignmentPanel */}
                    <NavigationAssignmentPanel
                        {...this.props}
                        widthPercent={30}
                        oContext={this.props.oContext}
                        uniqueName={local?.selected || ''}
                        currentAssignments={(() => {
                            const sel = local?.selected;
                            if (!sel) {
                                return [];
                            }
                            const ent = entries.find((e: ScreensaverEntry) => e.uniqueName === sel);
                            return ent?.navigation || [];
                        })()}
                        onAssign={(uniqueName, assignments) => {
                            const updated = entries.map((entry: ScreensaverEntry) =>
                                entry.uniqueName === uniqueName ? { ...entry, navigation: assignments } : entry,
                            );
                            this.setState({ entries: updated } as ScreensaverPageState);
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
                                {this.getText('screensaver_unique_label')}
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 600 }}
                            >
                                {local.selected || this.getText('screensaver_select_item')}
                            </Typography>
                            <InfoOutlined
                                fontSize="small"
                                color="action"
                                sx={{ mt: 1 }}
                            />
                        </Box>
                    </Paper>
                </Box>

                {/* FileSelectorPopup component */}
                <FileSelectorPopup
                    open={!!this.state.fileSelectorOpen}
                    onClose={this.handleFileSelectorClose}
                    onSelect={this.handleFileSelect}
                    socket={this.props.oContext.socket}
                    themeName={this.props.themeName}
                    themeType={this.props.theme?.palette?.mode || 'light'}
                    theme={this.props.theme}
                    adapterName="nspanel-lovelace-ui"
                    instance={this.props.oContext?.instance || 0}
                    objectIdConfig={{
                        types: 'state',
                        filterFunc: (obj: ioBroker.Object) => {
                            return !!(obj?.type === 'state' && obj.common.role && obj.common.role.startsWith('switch'));
                        },
                    }}
                />
            </Box>
        );
    }
}

export default withTheme(ScreensaverPage);
