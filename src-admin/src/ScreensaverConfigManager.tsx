/**
 * Admin tab "Screensaver": the table native.screensaverConfig - a list of screensavers on the left,
 * the editor of the selected one on the right (same pattern as PageConfigManager, but the
 * screensaver is no page: no navigation, no start page, exactly one per panel).
 */
import React from 'react';
import { Box, Button, Divider, IconButton, Paper, TextField, Tooltip, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import ConfirmDialog from './components/ConfirmDialog';
import { ScreensaverEditor } from './components/ScreensaverEditor';
import type { AdminPanelConfig, ScreensaverEntry, ScreensaverTemplateInfo } from '../../src/lib/types/adminShareConfig';
import {
    ADAPTER_NAME,
    SENDTO_GET_PAGES_All_COMMAND,
    SENDTO_GET_WEATHER_ENTITY_COMMAND,
    SENDTO_GET_SCREENSAVER_TEMPLATES_COMMAND,
    emptyScreensaverEntry,
} from '../../src/lib/types/adminShareConfig';

interface ScreensaverConfigManagerState extends ConfigGenericState {
    entries: ScreensaverEntry[];
    selected: string;
    newName: string;
    confirmDeleteName: string | null;
    alive: boolean;
    pagesList: string[];
    /** installed instances of the supported weather adapters, undefined until the adapter answered */
    weatherEntities?: { value: string; label: string }[];
    /** page item templates of the adapter (item dialog, source "template"), undefined until the adapter answered */
    templates?: ScreensaverTemplateInfo[];
}

const PAGES_RETRY_MS = 3000;

class ScreensaverConfigManager extends ConfigGeneric<
    ConfigGenericProps & { theme?: any },
    ScreensaverConfigManagerState
> {
    private pagesRetryTimeout?: NodeJS.Timeout;

    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
        const saved = ConfigGeneric.getValue(props.data, props.attr);
        const entries: ScreensaverEntry[] = Array.isArray(saved) ? (saved as ScreensaverEntry[]) : [];
        this.state = {
            ...(this.state as ConfigGenericState),
            entries,
            selected: entries[0]?.name ?? '',
            newName: '',
            confirmDeleteName: null,
            alive: false,
            pagesList: [],
        };
    }

    private aliveStateId(): string {
        const instance = this.props.oContext.instance ?? '0';
        return `system.adapter.${ADAPTER_NAME}.${instance}.alive`;
    }

    async componentDidMount(): Promise<void> {
        void super.componentDidMount();
        try {
            const state = await this.props.oContext.socket.getState(this.aliveStateId());
            const alive = !!state?.val;
            this.setState({ alive } as ScreensaverConfigManagerState);
            await this.props.oContext.socket.subscribeState(this.aliveStateId(), this.onAliveChanged);
            if (alive) {
                void this.loadPagesList();
                void this.loadWeatherEntities();
                void this.loadTemplates();
            }
        } catch (error) {
            console.error('[ScreensaverConfig] alive state failed:', error);
            this.setState({ alive: false } as ScreensaverConfigManagerState);
        }
    }

    componentWillUnmount(): void {
        if (this.pagesRetryTimeout) {
            clearTimeout(this.pagesRetryTimeout);
        }
        this.props.oContext.socket.unsubscribeState(this.aliveStateId(), this.onAliveChanged);
    }

    private onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const alive = state ? !!state.val : false;
        if (alive !== this.state.alive) {
            this.setState({ alive } as ScreensaverConfigManagerState);
            if (alive && !this.state.weatherEntities) {
                void this.loadWeatherEntities();
                void this.loadTemplates();
            }
            if (alive && this.state.pagesList.length === 0) {
                void this.loadPagesList();
            }
            if (!alive && this.pagesRetryTimeout) {
                clearTimeout(this.pagesRetryTimeout);
                this.pagesRetryTimeout = undefined;
            }
        }
    };

    /** pages the adapter knows - navigation targets of the item dialog; retried while the adapter starts */
    private async loadPagesList(): Promise<void> {
        if (!this.state.alive) {
            return;
        }
        const instance = this.props.oContext.instance ?? '0';
        let list: string[] = [];
        try {
            const raw = await this.props.oContext.socket.sendTo(
                `${ADAPTER_NAME}.${instance}`,
                SENDTO_GET_PAGES_All_COMMAND,
                null,
            );
            list = Array.isArray(raw) ? raw : Array.isArray(raw?.result) ? raw.result : [];
        } catch (e) {
            console.warn('[ScreensaverConfig] getAllPages failed', e);
        }
        if (list.length === 0) {
            if (this.pagesRetryTimeout) {
                clearTimeout(this.pagesRetryTimeout);
            }
            this.pagesRetryTimeout = setTimeout(() => void this.loadPagesList(), PAGES_RETRY_MS);
            return;
        }
        this.setState({ pagesList: Array.from(new Set(list)) } as ScreensaverConfigManagerState);
    }

    /** page item templates the adapter knows (main.ts getScreensaverTemplates) - the admin must not import them */
    private async loadTemplates(): Promise<void> {
        if (!this.state.alive) {
            return;
        }
        const instance = this.props.oContext.instance ?? '0';
        try {
            const raw = await this.props.oContext.socket.sendTo(
                `${ADAPTER_NAME}.${instance}`,
                SENDTO_GET_SCREENSAVER_TEMPLATES_COMMAND,
                {},
            );
            const list: ScreensaverTemplateInfo[] = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.result)
                  ? raw.result
                  : [];
            this.setState({
                templates: list.filter(t => t && typeof t.name === 'string' && t.name !== ''),
            } as ScreensaverConfigManagerState);
        } catch (e) {
            console.warn('[ScreensaverConfig] getScreensaverTemplates failed', e);
        }
    }

    /** installed instances of the supported weather adapters (main.ts getWeatherEntity, like the global settings page) */
    private async loadWeatherEntities(): Promise<void> {
        if (!this.state.alive) {
            return;
        }
        const instance = this.props.oContext.instance ?? '0';
        try {
            const raw = await this.props.oContext.socket.sendTo(
                `${ADAPTER_NAME}.${instance}`,
                SENDTO_GET_WEATHER_ENTITY_COMMAND,
                {},
            );
            const list: { value: string; label: string }[] = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.result)
                  ? raw.result
                  : [];
            // the first entry of the adapter is "custom" (no instance) - the editor has its own choices for that
            this.setState({
                weatherEntities: list.filter(e => e && typeof e.value === 'string' && e.value !== ''),
            } as ScreensaverConfigManagerState);
        } catch (e) {
            console.warn('[ScreensaverConfig] getWeatherEntity failed', e);
        }
    }

    private save(entries: ScreensaverEntry[]): void {
        this.setState({ entries } as ScreensaverConfigManagerState);
        void this.onChange(this.props.attr, entries);
    }

    private handleAdd = (): void => {
        const name = this.state.newName.trim();
        if (!name || this.state.entries.some(e => e.name === name)) {
            return;
        }
        const entries = [...this.state.entries, emptyScreensaverEntry(name, 'standard')];
        this.save(entries);
        this.setState({ selected: name, newName: '' } as ScreensaverConfigManagerState);
    };

    private handleDeleteConfirm = (): void => {
        const name = this.state.confirmDeleteName;
        if (name === null) {
            return;
        }
        const entries = this.state.entries.filter(e => e.name !== name);
        this.save(entries);
        this.setState({
            confirmDeleteName: null,
            selected: this.state.selected === name ? (entries[0]?.name ?? '') : this.state.selected,
        } as ScreensaverConfigManagerState);
    };

    private handleEntryChange = (updated: ScreensaverEntry): void => {
        this.save(this.state.entries.map(e => (e.name === updated.name ? updated : e)));
    };

    private handleNameChange = (oldName: string, newName: string): void => {
        if (!newName.trim()) {
            return;
        }
        this.save(this.state.entries.map(e => (e.name === oldName ? { ...e, name: newName } : e)));
        this.setState({ selected: newName } as ScreensaverConfigManagerState);
    };

    private panels(): AdminPanelConfig[] {
        return Array.isArray(this.props.data?.panels) ? this.props.data.panels : [];
    }

    /** configured panels no entry is assigned to - they keep the screensaver of the script */
    private unassignedPanels(): string[] {
        const used = new Set(this.state.entries.flatMap(e => e.panels ?? []));
        return this.panels()
            .filter(p => p.topic && !used.has(p.topic))
            .map(p => p.name || p.topic!);
    }

    private renderList(): React.JSX.Element {
        const { entries, selected, newName, alive } = this.state;
        const nameTaken = entries.some(e => e.name === newName.trim());
        return (
            <Box
                sx={{
                    width: { xs: '100%', md: '22%' },
                    pr: { xs: 0, md: 1 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: 'primary.main', fontSize: '1rem' }}
                >
                    {this.getText('screensaver_tab_title')}
                </Typography>
                <Paper
                    sx={{ p: 0, backgroundColor: 'transparent' }}
                    elevation={0}
                >
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                        <TextField
                            fullWidth
                            disabled={!alive}
                            variant="standard"
                            label={this.getText('screensaver_new')}
                            value={newName}
                            onChange={e => this.setState({ newName: e.target.value } as ScreensaverConfigManagerState)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    this.handleAdd();
                                }
                            }}
                            error={nameTaken}
                            helperText={nameTaken ? this.getText('screensaver_name_exists') : undefined}
                            slotProps={{ input: { sx: { px: 1 } } }}
                        />
                        <Button
                            size="small"
                            variant="contained"
                            onClick={this.handleAdd}
                            disabled={!alive || !newName.trim() || nameTaken}
                        >
                            +
                        </Button>
                    </Box>
                </Paper>
                <Paper
                    sx={{ overflow: 'auto', p: 0, backgroundColor: 'transparent', mt: 1 }}
                    elevation={0}
                >
                    {entries.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {this.getText('no_screensavers')}
                        </Typography>
                    ) : (
                        entries.map(e => (
                            <Box
                                key={e.name}
                                onClick={() => this.setState({ selected: e.name } as ScreensaverConfigManagerState)}
                                sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    backgroundColor: selected === e.name ? 'action.selected' : 'transparent',
                                    mb: 0.5,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    '&:hover .delete-icon': { opacity: 1 },
                                }}
                            >
                                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {e.name}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            display: 'block',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {this.getText(`screensaver_mode_${e.mode}`)}
                                        {' · '}
                                        {(e.panels ?? []).length
                                            ? (e.panels ?? [])
                                                  .map(t => this.panels().find(p => p.topic === t)?.name || t)
                                                  .join(', ')
                                            : this.getText('screensaver_panels_none_short')}
                                    </Typography>
                                </Box>
                                <Tooltip title={this.getText('Delete')}>
                                    <span>
                                        <IconButton
                                            disabled={!alive}
                                            className="delete-icon"
                                            edge="end"
                                            size="small"
                                            onClick={ev => {
                                                ev.stopPropagation();
                                                this.setState({
                                                    confirmDeleteName: e.name,
                                                } as ScreensaverConfigManagerState);
                                            }}
                                            sx={{
                                                color: 'error.main',
                                                opacity: { xs: 1, md: 0 },
                                                transition: 'opacity 0.2s',
                                            }}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>
                        ))
                    )}
                </Paper>
                {this.unassignedPanels().length > 0 && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        {this.getText('screensaver_unassigned_panels').replace(
                            '%s',
                            this.unassignedPanels().join(', '),
                        )}
                    </Typography>
                )}
                <Divider sx={{ my: 1 }} />
                <a
                    href="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/screensaver"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.875rem' }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'primary.main',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 },
                        }}
                    >
                        {this.getText('documentation')}
                    </Typography>
                </a>
            </Box>
        );
    }

    private renderEditor(): React.JSX.Element {
        const { entries, selected, alive, pagesList } = this.state;
        const entry = entries.find(e => e.name === selected);
        if (!entry) {
            return (
                <Box>
                    <Typography variant="h6">{this.getText('screensaver_select_item')}</Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 2 }}
                    >
                        {this.getText('screensaver_select_description')}
                    </Typography>
                </Box>
            );
        }
        const data = this.props.data ?? {};
        return (
            <ScreensaverEditor
                entry={entry}
                entries={entries}
                panels={this.panels()}
                globalFormats={{
                    weekdayFormat: data.weekdayFormat,
                    monthFormat: data.monthFormat,
                    yearFormat: data.yearFormat,
                }}
                onEntryChange={this.handleEntryChange}
                onNameChange={this.handleNameChange}
                getText={key => this.getText(key)}
                oContext={this.props.oContext}
                theme={this.props.theme}
                themeName={this.props.themeName}
                alive={alive}
                expertMode={this.props.expertMode ?? false}
                pagesList={pagesList}
                weatherEntities={this.state.weatherEntities}
                templates={this.state.templates}
                globalWeatherEntity={typeof data.weatherEntity === 'string' ? data.weatherEntity : ''}
            />
        );
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        return (
            <Box
                sx={{
                    height: 'calc(100vh - 64px)',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    p: 1,
                }}
            >
                {this.renderList()}
                <ConfirmDialog
                    open={this.state.confirmDeleteName !== null}
                    onClose={() => this.setState({ confirmDeleteName: null } as ScreensaverConfigManagerState)}
                    onConfirm={this.handleDeleteConfirm}
                    title={this.getText('screensaver_delete_confirm_title')}
                    description={`${this.getText('screensaver_delete_confirm_text')}: ${this.state.confirmDeleteName ?? ''}`}
                    cancelText={this.getText('Cancel1')}
                    confirmText={this.getText('Delete')}
                    ariaTitleId="screensaver-delete-confirm-title"
                    ariaDescId="screensaver-delete-confirm-description"
                />
                <Box
                    sx={{
                        width: { xs: '100%', md: '78%' },
                        pl: { xs: 0, md: 2 },
                        mt: { xs: 2, md: 0 },
                        borderLeft: { xs: 'none', md: '1px solid' },
                        borderColor: 'divider',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Paper
                        sx={{ height: '100%', p: 2, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
                        elevation={1}
                    >
                        {this.renderEditor()}
                    </Paper>
                </Box>
            </Box>
        );
    }
}

export default ScreensaverConfigManager;
