/**
 * Editor for thermostat pages (cardThermo2) in the PageConfig tab.
 * Follows the ConfigGeneric pattern of PageChartEditor: alive-gated fields, main-page lock.
 * Scope: alias channel, headline and temperature limits per heat circuit, page items with a
 * heat-circuit filter. The remaining script options of the page are not editable here yet.
 */
import React from 'react';
import { Alert, Box, Button, IconButton, Paper, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { I18n } from '@iobroker/gui-components';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { EntitySelector } from './EntitySelector';
import ChannelConfigDialog from './ChannelConfigDialog';
import {
    type Thermo2Entry,
    type Thermo2CircuitConfig,
    type AdminPageItemConfig,
    ADAPTER_NAME,
    thermo2MaxCircuits,
    thermo2Defaults,
    emptyThermo2Circuit,
    isMainPageEntry,
    normalizeChannelId,
} from '../../../src/lib/types/adminShareConfig';

export interface PageThermo2EditorProps {
    entry: Thermo2Entry;
    onEntryChange: (updated: Thermo2Entry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
    /** Expert-Mode aus dem json-config-System (Native-Toggle im Item-Dialog) */
    expertMode?: boolean;
    /** Alle verfügbaren Seiten (aus sendTo) – Navigationsziele im Item-Dialog */
    pagesList?: string[];
}

/** channel roles the adapter accepts for a heat circuit (pageThermo2.ts getPage) */
const CIRCUIT_ROLES: readonly string[] = ['thermostat', 'airCondition'];

type LimitField = 'minValue' | 'maxValue' | 'stepValue';

interface PageThermo2EditorState extends ConfigGenericState {
    alive: boolean;
    /** common.role per channel id; null = object not found */
    roles: Record<string, string | null>;
    /** common.name per object id, shown when a circuit or item has no own name */
    objectNames: Record<string, string>;
    /** index into pageItems while the dialog is open; equal to the length when adding */
    editingIndex: number | null;
}

/**
 * channel-like objects with a role the adapter accepts for a circuit
 *
 * @param obj object from the browser
 */
function isCircuitObject(obj: ioBroker.Object): boolean {
    return (
        !!obj &&
        (obj.type === 'channel' || obj.type === 'device' || obj.type === 'folder') &&
        CIRCUIT_ROLES.includes(String(obj.common?.role ?? ''))
    );
}

/**
 * common.name of an object as plain text
 *
 * @param obj object from the browser
 * @param lang admin language
 */
function objectName(obj: ioBroker.Object | null | undefined, lang: string): string {
    const raw: unknown = obj?.common?.name;
    if (typeof raw === 'string') {
        return raw;
    }
    if (raw && typeof raw === 'object') {
        const map = raw as Record<string, string>;
        return map[lang] || map.en || Object.values(map)[0] || '';
    }
    return '';
}

export class PageThermo2Editor extends ConfigGeneric<
    ConfigGenericProps & PageThermo2EditorProps,
    PageThermo2EditorState
> {
    private dialogRef = React.createRef<ChannelConfigDialog>();

    constructor(props: ConfigGenericProps & PageThermo2EditorProps) {
        super(props);
        this.state = {
            ...this.state,
            alive: false,
            roles: {},
            objectNames: {},
            editingIndex: null,
        };
    }

    componentWillUnmount(): void {
        const instance = this.props.oContext.instance ?? '0';
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
            this.onAliveChanged,
        );
    }

    async componentDidMount(): Promise<void> {
        const instance = this.props.oContext.instance ?? '0';
        const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;
        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            this.setState({ alive: !!state?.val });
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);
        } catch (error) {
            console.error('[PageThermo2Editor] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
        await this.loadObjects();
    }

    async componentDidUpdate(prevProps: Readonly<ConfigGenericProps & PageThermo2EditorProps>): Promise<void> {
        if (prevProps.entry !== this.props.entry) {
            await this.loadObjects();
        }
    }

    private onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const isAlive = state ? !!state.val : false;
        if (isAlive !== this.state.alive) {
            this.setState({ alive: isAlive });
        }
    };

    getText(key: string): string {
        return this.props.getText(key);
    }

    /** ids of the circuits (trimmed, non-empty) in display order */
    private circuitIds(): string[] {
        return (this.props.entry.thermoItems ?? []).map(c => (c?.channelId ?? '').trim()).filter(id => !!id);
    }

    /** roles of the circuit channels and names of circuits and items that are not loaded yet */
    private async loadObjects(): Promise<void> {
        const socket = this.props.oContext?.socket;
        if (!socket) {
            return;
        }
        const lang: string = (I18n as any).getLanguage?.() ?? 'en';
        const wanted = new Set<string>(this.circuitIds());
        for (const item of this.props.entry.pageItems ?? []) {
            const id = normalizeChannelId(item?.channelId).valueStateId;
            if (item && !item.name && id) {
                wanted.add(id);
            }
        }
        const roles: Record<string, string | null> = { ...this.state.roles };
        const objectNames: Record<string, string> = { ...this.state.objectNames };
        let changed = false;
        for (const id of wanted) {
            if (id in roles) {
                continue;
            }
            try {
                const obj: ioBroker.Object | null | undefined = await socket.getObject(id);
                roles[id] = obj ? String(obj.common?.role ?? '') : null;
                const name = objectName(obj, lang);
                if (name) {
                    objectNames[id] = name;
                }
            } catch {
                roles[id] = null;
            }
            changed = true;
        }
        if (changed) {
            this.setState({ roles, objectNames });
        }
    }

    /**
     * the role and name of a channel are read again after it was changed
     *
     * @param id channel id as typed or selected
     */
    private forgetObject(id: string): void {
        const trimmed = id.trim();
        if (!trimmed || !(trimmed in this.state.roles)) {
            return;
        }
        const roles = { ...this.state.roles };
        const objectNames = { ...this.state.objectNames };
        delete roles[trimmed];
        delete objectNames[trimmed];
        this.setState({ roles, objectNames }, () => void this.loadObjects());
    }

    /**
     * Labels of the circuits as the panel counts them: an airCondition channel takes two
     * (heating and cooling), circuits without channel are skipped by the adapter.
     */
    private circuitLabels(): string[] {
        const labels: string[] = [];
        for (const circuit of this.props.entry.thermoItems ?? []) {
            const id = (circuit?.channelId ?? '').trim();
            if (!id) {
                continue;
            }
            const base = (circuit.name ?? '').trim() || this.state.objectNames[id] || id;
            labels.push(base);
            if (this.state.roles[id] === 'airCondition') {
                labels.push(this.getText('thermo2_cooling').replace('%s', base));
            }
        }
        return labels;
    }

    private updateCircuits(thermoItems: Thermo2CircuitConfig[]): void {
        this.props.onEntryChange({ ...this.props.entry, thermoItems });
    }

    private handleCircuitChange<K extends keyof Thermo2CircuitConfig>(
        index: number,
        field: K,
        value: Thermo2CircuitConfig[K],
    ): void {
        const thermoItems = [...(this.props.entry.thermoItems ?? [])];
        thermoItems[index] = { ...thermoItems[index], [field]: value };
        this.updateCircuits(thermoItems);
    }

    /**
     * empty or invalid input clears the field; the adapter then uses its default
     *
     * @param index circuit index
     * @param field limit field
     * @param raw text of the input
     */
    private handleLimitChange(index: number, field: LimitField, raw: string): void {
        const n = parseFloat(raw);
        this.handleCircuitChange(index, field, Number.isFinite(n) ? n : undefined);
    }

    private handleCircuitAdd = (): void => {
        const thermoItems = [...(this.props.entry.thermoItems ?? [])];
        if (thermoItems.length >= thermo2MaxCircuits) {
            return;
        }
        thermoItems.push(emptyThermo2Circuit());
        this.updateCircuits(thermoItems);
    };

    private handleCircuitDelete(index: number): void {
        const thermoItems = [...(this.props.entry.thermoItems ?? [])];
        thermoItems.splice(index, 1);
        if (thermoItems.length === 0) {
            thermoItems.push(emptyThermo2Circuit());
        }
        this.updateCircuits(thermoItems);
    }

    private handleCircuitMove(index: number, delta: -1 | 1): void {
        const thermoItems = [...(this.props.entry.thermoItems ?? [])];
        const target = index + delta;
        if (target < 0 || target >= thermoItems.length) {
            return;
        }
        [thermoItems[index], thermoItems[target]] = [thermoItems[target], thermoItems[index]];
        this.updateCircuits(thermoItems);
    }

    private updateItems(pageItems: (AdminPageItemConfig | undefined)[]): void {
        this.props.onEntryChange({ ...this.props.entry, pageItems });
    }

    private handleItemOpen(index: number): void {
        const item = (this.props.entry.pageItems ?? [])[index];
        this.setState({ editingIndex: index });
        this.dialogRef.current?.openWith(item, true);
    }

    private handleItemAdd = (): void => {
        this.handleItemOpen((this.props.entry.pageItems ?? []).length);
    };

    private handleItemSave = (config: AdminPageItemConfig): void => {
        const { editingIndex } = this.state;
        if (editingIndex === null) {
            return;
        }
        const pageItems = [...(this.props.entry.pageItems ?? [])];
        while (pageItems.length <= editingIndex) {
            pageItems.push(undefined);
        }
        pageItems[editingIndex] = config;
        this.setState({ editingIndex: null });
        this.updateItems(pageItems);
    };

    private handleItemDelete(index: number): void {
        const pageItems = [...(this.props.entry.pageItems ?? [])];
        pageItems.splice(index, 1);
        this.updateItems(pageItems);
    }

    private handleItemMove(index: number, delta: -1 | 1): void {
        const pageItems = [...(this.props.entry.pageItems ?? [])];
        const target = index + delta;
        if (target < 0 || target >= pageItems.length) {
            return;
        }
        [pageItems[index], pageItems[target]] = [pageItems[target], pageItems[index]];
        this.updateItems(pageItems);
    }

    private renderLimitField(index: number, field: LimitField, labelKey: string): React.JSX.Element {
        const circuit = this.props.entry.thermoItems[index];
        return (
            <TextField
                variant="standard"
                type="number"
                label={this.getText(labelKey)}
                value={circuit[field] ?? ''}
                placeholder={String(thermo2Defaults[field])}
                onChange={e => {
                    this.handleLimitChange(index, field, e.target.value);
                }}
                slotProps={{
                    input: { sx: { backgroundColor: 'transparent', px: 1 } },
                    inputLabel: { shrink: true },
                    htmlInput: { step: 'any', min: 0 },
                }}
                sx={{ width: 140 }}
                disabled={!this.state.alive}
            />
        );
    }

    private renderCircuit(index: number, count: number): React.JSX.Element {
        const { entry, oContext, theme } = this.props;
        const { alive, roles } = this.state;
        const circuit = entry.thermoItems[index];
        const themeType = oContext?.themeType ?? (theme?.palette?.mode || 'light');
        const id = (circuit.channelId ?? '').trim();
        const role = id ? roles[id] : undefined;
        let problem: string | undefined;
        if (id && role === null) {
            problem = this.getText('thermo2_channelMissing').replace('%s', id);
        } else if (id && typeof role === 'string' && !CIRCUIT_ROLES.includes(role)) {
            problem = this.getText('thermo2_wrongRole')
                .replace('%s', id)
                .replace('%s', role || '-');
        }

        return (
            <Paper
                key={index}
                elevation={1}
                sx={{ p: 1.5, mb: 1.5 }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{ minWidth: 24 }}
                    >
                        {index + 1}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <EntitySelector
                            label={this.getText('thermo2_channel')}
                            value={circuit.channelId ?? ''}
                            onChange={(v: string) => {
                                this.handleCircuitChange(index, 'channelId', v);
                            }}
                            onCommit={(v: string) => {
                                this.forgetObject(v);
                            }}
                            socket={oContext.socket}
                            theme={theme}
                            themeType={themeType}
                            dialogName="selectThermo2Channel"
                            filterFunc={isCircuitObject}
                            disabled={!alive}
                        />
                    </Box>
                    <Tooltip title={this.getText('thermo2_moveUp')}>
                        <span>
                            <IconButton
                                size="small"
                                disabled={!alive || index === 0}
                                onClick={() => this.handleCircuitMove(index, -1)}
                            >
                                <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={this.getText('thermo2_moveDown')}>
                        <span>
                            <IconButton
                                size="small"
                                disabled={!alive || index === count - 1}
                                onClick={() => this.handleCircuitMove(index, 1)}
                            >
                                <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={this.getText('thermo2_removeCircuit')}>
                        <span>
                            <IconButton
                                size="small"
                                disabled={!alive}
                                onClick={() => this.handleCircuitDelete(index)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
                {problem && (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1 }}
                    >
                        {problem}
                    </Alert>
                )}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', mt: 1, pl: 4 }}>
                    <TextField
                        variant="standard"
                        type="text"
                        autoComplete="off"
                        label={this.getText('thermo2_name')}
                        value={circuit.name ?? ''}
                        placeholder={id ? this.state.objectNames[id] || '' : ''}
                        onChange={e => {
                            this.handleCircuitChange(index, 'name', e.target.value);
                        }}
                        slotProps={{
                            input: { sx: { backgroundColor: 'transparent', px: 1 } },
                            inputLabel: { shrink: true },
                        }}
                        sx={{ flex: 1, minWidth: 200 }}
                        disabled={!alive}
                    />
                    {this.renderLimitField(index, 'minValue', 'thermo2_minValue')}
                    {this.renderLimitField(index, 'maxValue', 'thermo2_maxValue')}
                    {this.renderLimitField(index, 'stepValue', 'thermo2_stepValue')}
                </Box>
            </Paper>
        );
    }

    private renderPageItem(index: number, count: number, labels: string[]): React.JSX.Element {
        const { alive } = this.state;
        const item = (this.props.entry.pageItems ?? [])[index];
        const channelId = item ? normalizeChannelId(item.channelId).valueStateId : '';
        const label = item
            ? item.useNative
                ? `${index + 1}: [native]`
                : item.name || this.state.objectNames[channelId] || channelId || String(index + 1)
            : `${index + 1}: ${this.getText('thermo2_emptySlot')}`;
        const filter = item?.filter;
        const circuitText =
            typeof filter === 'number' ? `${filter + 1}: ${labels[filter] ?? '?'}` : this.getText('thermo2_circuitAll');

        return (
            <Paper
                key={index}
                elevation={1}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    mb: 1,
                    cursor: alive && item ? 'pointer' : 'default',
                    opacity: item ? 1 : 0.6,
                }}
                onClick={alive && item ? () => this.handleItemOpen(index) : undefined}
            >
                <Typography
                    variant="subtitle2"
                    sx={{ minWidth: 24 }}
                >
                    {index + 1}
                </Typography>
                <Tooltip title={channelId || item?.targetPage || ''}>
                    <Typography
                        variant="body2"
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {label}
                        {item?.isNavigation && item.targetPage ? ` → ${item.targetPage}` : ''}
                    </Typography>
                </Tooltip>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap' }}
                >
                    {`${this.getText('thermo2_circuitLabel')}: ${circuitText}`}
                </Typography>
                <IconButton
                    size="small"
                    disabled={!alive || index === 0}
                    onClick={e => {
                        e.stopPropagation();
                        this.handleItemMove(index, -1);
                    }}
                >
                    <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    disabled={!alive || index === count - 1}
                    onClick={e => {
                        e.stopPropagation();
                        this.handleItemMove(index, 1);
                    }}
                >
                    <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    disabled={!alive}
                    onClick={e => {
                        e.stopPropagation();
                        this.handleItemDelete(index);
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Paper>
        );
    }

    render(): React.JSX.Element {
        const { entry, oContext, theme } = this.props;
        const { alive } = this.state;
        const thermoItems = entry.thermoItems ?? [];
        const pageItems = entry.pageItems ?? [];
        const labels = this.circuitLabels();

        return (
            <Box>
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
                        value={entry.uniqueName}
                        onChange={e => {
                            const newUniqueName = e.target.value;
                            if (newUniqueName.trim()) {
                                this.props.onUniqueNameChange(entry.uniqueName, newUniqueName);
                            }
                        }}
                        slotProps={{
                            input: {
                                sx: {
                                    backgroundColor: 'transparent',
                                    px: 1,
                                    fontWeight: 600,
                                    width: '50%',
                                },
                            },
                        }}
                        disabled={!alive || isMainPageEntry(entry)}
                        helperText={isMainPageEntry(entry) ? this.getText('page_name_main_locked') : undefined}
                    />
                </Box>

                {/* Heat circuits */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">{this.getText('thermo2_circuits')}</Typography>
                    <Tooltip
                        title={thermoItems.length >= thermo2MaxCircuits ? this.getText('thermo2_maxCircuits') : ''}
                    >
                        <span>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon />}
                                disabled={!alive || thermoItems.length >= thermo2MaxCircuits}
                                onClick={this.handleCircuitAdd}
                            >
                                {this.getText('thermo2_addCircuit')}
                            </Button>
                        </span>
                    </Tooltip>
                </Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                >
                    {this.getText('thermo2_valuesHint')}
                </Typography>
                {labels.length === 0 && (
                    <Alert
                        severity="info"
                        sx={{ mb: 1.5 }}
                    >
                        {this.getText('thermo2_noCircuit')}
                    </Alert>
                )}
                {thermoItems.map((_c, index) => this.renderCircuit(index, thermoItems.length))}

                {/* Page items */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 1 }}>
                    <Typography variant="h6">{this.getText('thermo2_items')}</Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        disabled={!alive}
                        onClick={this.handleItemAdd}
                    >
                        {this.getText('thermo2_addItem')}
                    </Button>
                </Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                >
                    {this.getText('thermo2_itemsHint')}
                </Typography>
                {pageItems.map((_item, index) => this.renderPageItem(index, pageItems.length, labels))}

                {/* ChannelConfigDialog – ohne Trigger-Button, per ref gesteuert */}
                <ChannelConfigDialog
                    ref={this.dialogRef}
                    socket={oContext?.socket}
                    theme={theme}
                    themeType={oContext?.themeType}
                    oContext={oContext}
                    expertMode={this.props.expertMode ?? false}
                    pagesList={this.props.pagesList ?? []}
                    currentPageName={entry.uniqueName}
                    currentPageCard="cardThermo2"
                    heatCircuits={labels}
                    hideTriggerButton
                    onSave={this.handleItemSave}
                />
            </Box>
        );
    }
}
