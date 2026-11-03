/**
 * Editor for pie chart pages (cardPChart) in the PageConfig tab.
 * Follows PageChartEditor: alive-gated fields, main-page lock, defaults from pchartDefaults so that
 * display and storage never diverge. The slots are the main view (up to six slices with time range and
 * DB instance), the script data point is the second option of the source select.
 */
import React from 'react';
import {
    Alert,
    Box,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { EntitySelector } from './EntitySelector';
import {
    ADAPTER_NAME,
    emptyPChartSlot,
    isMainPageEntry,
    PCHART_MAX_SLICES,
    PCHART_SOURCE_SCRIPT,
    PCHART_SOURCE_SLOTS,
    pchartDefaults,
    pchartRangeHoursOf,
    pchartRangeOptionOf,
    type PChartEntry,
    type PChartRangeOption,
    type PChartSlotConfig,
} from '../../../src/lib/types/adminShareConfig';

export interface PagePChartEditorProps {
    entry: PChartEntry;
    onEntryChange: (updated: PChartEntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
}

type DbInstance = { id: string; name: string };

interface PagePChartEditorState extends ConfigGenericState {
    alive: boolean;
    dbInstances: DbInstance[];
    /** the user chose "custom" in the range select - keeps the hours field visible even if the hours match a preset */
    customRange: boolean;
}

/** adapters that answer `getHistory` */
const DB_ADAPTERS = ['influxdb', 'history', 'sql'];

const RANGE_OPTIONS: readonly PChartRangeOption[] = ['current', 'hour', 'day', 'week', 'month', 'custom'];
const RANGE_LABEL_KEYS: Readonly<Record<PChartRangeOption, string>> = {
    current: 'pchart_RangeCurrent',
    hour: 'pchart_RangeHour',
    day: 'pchart_RangeDay',
    week: 'pchart_RangeWeek',
    month: 'pchart_RangeMonth',
    custom: 'pchart_RangeCustom',
};
const LEGEND_LABEL_KEYS: readonly string[] = ['pchart_Legend0', 'pchart_Legend1', 'pchart_Legend2', 'pchart_Legend3'];

/**
 * `system.adapter.influxdb.0` → `influxdb.0` (the stored form, same as the chart editor)
 *
 * @param id full or short instance id
 */
function shortInstanceId(id: string | undefined): string {
    return (id ?? '').replace(/^system\.adapter\./, '');
}

/**
 * slot source: numeric states only
 *
 * @param obj object from the browser
 */
function isNumberState(obj: ioBroker.Object): boolean {
    return !!(obj && obj.type === 'state' && obj.common && obj.common.type === 'number');
}

/**
 * script source: every state, like the chart editor (many script states lack `common.read`)
 *
 * @param obj object from the browser
 */
function isState(obj: ioBroker.Object): boolean {
    return !!(obj && obj.type === 'state');
}

/**
 * The six slots of the entry, filled up with empty slots so that the editor always shows all rows.
 *
 * @param entry pie chart entry
 */
function slotsOf(entry: PChartEntry): PChartSlotConfig[] {
    const slots = entry.slots ?? [];
    return Array.from({ length: PCHART_MAX_SLICES }, (_, i) => slots[i] ?? emptyPChartSlot(i));
}

export class PagePChartEditor extends ConfigGeneric<ConfigGenericProps & PagePChartEditorProps, PagePChartEditorState> {
    constructor(props: ConfigGenericProps & PagePChartEditorProps) {
        super(props);
        this.state = {
            ...this.state,
            alive: false,
            dbInstances: [],
            customRange: pchartRangeOptionOf(props.entry.rangeHours) === 'custom',
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
            console.error('[PagePChartEditor] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
        await this.loadDbInstances();
    }

    componentDidUpdate(prevProps: ConfigGenericProps & PagePChartEditorProps): void {
        if (prevProps.entry.uniqueName !== this.props.entry.uniqueName) {
            // another page was selected: derive the range selection from its hours again
            this.setState({ customRange: pchartRangeOptionOf(this.props.entry.rangeHours) === 'custom' });
        }
    }

    private onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const isAlive = state ? !!state.val : false;
        if (isAlive !== this.state.alive) {
            this.setState({ alive: isAlive });
        }
    };

    /** enabled history/sql/influxdb instances, stored and shown in the short form `influxdb.0` */
    private async loadDbInstances(): Promise<void> {
        try {
            const { socket } = this.props.oContext;
            const objects = await socket.getObjectViewSystem('instance', 'system.adapter.', 'system.adapter.香');
            const dbInstances: DbInstance[] = [];
            for (const id of Object.keys(objects)) {
                const obj = objects[id];
                if (!obj || obj.type !== 'instance' || !obj.common?.enabled) {
                    continue;
                }
                const name = shortInstanceId(id);
                if (DB_ADAPTERS.some(adapter => name.startsWith(`${adapter}.`))) {
                    dbInstances.push({ id, name });
                }
            }
            dbInstances.sort((a, b) => a.name.localeCompare(b.name));
            this.setState({ dbInstances });
        } catch (error) {
            console.error('[PagePChartEditor] Error loading DB instances:', error);
        }
    }

    getText(key: string): string {
        return this.props.getText(key);
    }

    private handleFieldChange<K extends keyof PChartEntry>(field: K, value: PChartEntry[K]): void {
        this.props.onEntryChange({ ...this.props.entry, [field]: value });
    }

    private updateSlot(index: number, patch: Partial<PChartSlotConfig>): void {
        const slots = slotsOf(this.props.entry);
        slots[index] = { ...slots[index], ...patch };
        this.handleFieldChange('slots', slots);
    }

    private handleRangeChange(option: PChartRangeOption): void {
        const { entry } = this.props;
        this.setState({ customRange: option === 'custom' });
        const hours = pchartRangeHoursOf(option, entry.rangeHours);
        if (hours !== (entry.rangeHours ?? 0)) {
            this.handleFieldChange('rangeHours', hours);
        }
    }

    /**
     * typed hours of the custom range; empty or invalid input keeps one hour (0 would switch to the current value)
     *
     * @param raw text of the input
     */
    private handleCustomHoursChange(raw: string): void {
        const n = parseInt(raw, 10);
        this.handleFieldChange('rangeHours', pchartRangeHoursOf('custom', Number.isFinite(n) ? n : undefined));
    }

    private renderUniqueName(): React.JSX.Element {
        const { entry } = this.props;
        return (
            <Box sx={{ mb: 1, p: 1, borderRadius: 1, backgroundColor: 'action.hover' }}>
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
                        input: { sx: { backgroundColor: 'transparent', px: 1, fontWeight: 600, width: '50%' } },
                    }}
                    disabled={!this.state.alive || isMainPageEntry(entry)}
                    helperText={isMainPageEntry(entry) ? this.getText('page_name_main_locked') : undefined}
                />
            </Box>
        );
    }

    private renderPageFields(): React.JSX.Element {
        const { entry } = this.props;
        const { alive } = this.state;
        const legendMode = entry.legendMode ?? pchartDefaults.legendMode;
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <TextField
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('headline')}
                    value={entry.headline ?? ''}
                    onChange={e => {
                        this.handleFieldChange('headline', e.target.value);
                    }}
                    slotProps={{ input: { sx: { backgroundColor: 'transparent', px: 1 } } }}
                    sx={{ flex: '1 1 240px' }}
                    disabled={!alive}
                />
                <FormControl
                    variant="standard"
                    sx={{ flex: '1 1 200px' }}
                    disabled={!alive}
                >
                    <InputLabel>{this.getText('pchart_LegendMode')}</InputLabel>
                    <Select
                        value={LEGEND_LABEL_KEYS[legendMode] ? legendMode : pchartDefaults.legendMode}
                        onChange={e => {
                            this.handleFieldChange('legendMode', Number(e.target.value));
                        }}
                    >
                        {LEGEND_LABEL_KEYS.map((key, mode) => (
                            <MenuItem
                                key={key}
                                value={mode}
                            >
                                {this.getText(key)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl
                    variant="standard"
                    sx={{ flex: '0 1 160px' }}
                    disabled={!alive}
                >
                    <InputLabel>{this.getText('pchart_Decimals')}</InputLabel>
                    <Select
                        value={entry.decimals ?? pchartDefaults.decimals}
                        onChange={e => {
                            this.handleFieldChange('decimals', Number(e.target.value));
                        }}
                    >
                        {[0, 1, 2, 3].map(d => (
                            <MenuItem
                                key={d}
                                value={d}
                            >
                                {d}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        );
    }

    private renderSourceSelect(source: number): React.JSX.Element {
        return (
            <FormControl
                variant="standard"
                sx={{ mb: 2, minWidth: 280 }}
                disabled={!this.state.alive}
            >
                <InputLabel>{this.getText('pchart_DataSource')}</InputLabel>
                <Select
                    value={source}
                    onChange={e => {
                        this.handleFieldChange(
                            'selInstanceDataSource',
                            Number(e.target.value) === PCHART_SOURCE_SCRIPT
                                ? PCHART_SOURCE_SCRIPT
                                : PCHART_SOURCE_SLOTS,
                        );
                    }}
                >
                    <MenuItem value={PCHART_SOURCE_SLOTS}>{this.getText('pchart_SourceSlots')}</MenuItem>
                    <MenuItem value={PCHART_SOURCE_SCRIPT}>{this.getText('pchart_SourceScript')}</MenuItem>
                </Select>
            </FormControl>
        );
    }

    private renderRange(): React.JSX.Element {
        const { entry } = this.props;
        const { alive, dbInstances, customRange } = this.state;
        const option: PChartRangeOption = customRange ? 'custom' : pchartRangeOptionOf(entry.rangeHours);
        const useDb = option !== 'current';
        const selectedInstance = shortInstanceId(entry.selInstance);
        const instanceKnown = dbInstances.some(inst => inst.name === selectedInstance);
        const instanceMissing = useDb && !selectedInstance;
        return (
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                    <FormControl
                        variant="standard"
                        sx={{ minWidth: 220 }}
                        disabled={!alive}
                    >
                        <InputLabel>{this.getText('pchart_Range')}</InputLabel>
                        <Select
                            value={option}
                            onChange={e => {
                                const value = String(e.target.value);
                                const chosen = RANGE_OPTIONS.find(o => o === value);
                                if (chosen) {
                                    this.handleRangeChange(chosen);
                                }
                            }}
                        >
                            {RANGE_OPTIONS.map(o => (
                                <MenuItem
                                    key={o}
                                    value={o}
                                >
                                    {this.getText(RANGE_LABEL_KEYS[o])}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {option === 'custom' && (
                        <TextField
                            variant="standard"
                            type="number"
                            label={this.getText('pchart_RangeHours')}
                            value={entry.rangeHours && entry.rangeHours > 0 ? entry.rangeHours : ''}
                            onChange={e => {
                                this.handleCustomHoursChange(e.target.value);
                            }}
                            slotProps={{
                                input: { sx: { backgroundColor: 'transparent', px: 1 } },
                                inputLabel: { shrink: true },
                                htmlInput: { min: 1 },
                            }}
                            sx={{ width: 140 }}
                            disabled={!alive}
                        />
                    )}
                    {useDb && (
                        <FormControl
                            variant="standard"
                            sx={{ minWidth: 220 }}
                            disabled={!alive}
                            error={instanceMissing}
                        >
                            <InputLabel>{this.getText('chart_Instance')}</InputLabel>
                            <Select
                                value={instanceKnown ? selectedInstance : ''}
                                onChange={e => {
                                    this.handleFieldChange('selInstance', shortInstanceId(String(e.target.value)));
                                }}
                            >
                                {dbInstances.length === 0 && (
                                    <MenuItem
                                        value=""
                                        disabled
                                    >
                                        {this.getText('chart_NoInstance')}
                                    </MenuItem>
                                )}
                                {dbInstances.map(instance => (
                                    <MenuItem
                                        key={instance.id}
                                        value={instance.name}
                                    >
                                        {instance.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {instanceMissing && (
                                <FormHelperText>{this.getText('pchart_InstanceMissing')}</FormHelperText>
                            )}
                        </FormControl>
                    )}
                </Box>
                {useDb && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1 }}
                    >
                        {this.getText('pchart_RangeHint')}
                    </Typography>
                )}
            </Box>
        );
    }

    private renderSlot(slot: PChartSlotConfig, index: number): React.JSX.Element {
        const { oContext, theme } = this.props;
        const { alive } = this.state;
        const themeType = oContext?.themeType ?? (theme?.palette?.mode || 'light');
        const defaultColor = emptyPChartSlot(index).color ?? '#ffffff';
        return (
            <Box
                key={index}
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '2fr 3fr 1fr 110px' },
                    gap: 2,
                    alignItems: 'end',
                    p: 1,
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: 'action.hover',
                }}
            >
                <TextField
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('pchart_Slice').replace('%s', String(index + 1))}
                    placeholder={this.getText('pchart_SliceNameHint')}
                    value={slot.name ?? ''}
                    onChange={e => this.updateSlot(index, { name: e.target.value })}
                    slotProps={{
                        input: { sx: { backgroundColor: 'transparent', px: 1 } },
                        inputLabel: { shrink: true },
                    }}
                    disabled={!alive}
                />
                <EntitySelector
                    label={this.getText('pchart_SliceState')}
                    value={slot.state ?? ''}
                    onChange={(v: string) => this.updateSlot(index, { state: v })}
                    socket={oContext.socket}
                    theme={theme}
                    themeType={themeType}
                    dialogName={`selectPChartSlot${index}`}
                    filterFunc={isNumberState}
                    disabled={!alive}
                />
                <TextField
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('pchart_SliceUnit')}
                    placeholder={this.getText('pchart_SliceUnitHint')}
                    value={slot.unit ?? ''}
                    onChange={e => this.updateSlot(index, { unit: e.target.value })}
                    slotProps={{
                        input: { sx: { backgroundColor: 'transparent', px: 1 } },
                        inputLabel: { shrink: true },
                    }}
                    disabled={!alive}
                />
                <TextField
                    variant="standard"
                    type="color"
                    label={this.getText('pchart_SliceColor')}
                    value={slot.color || defaultColor}
                    onChange={e => this.updateSlot(index, { color: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                    disabled={!alive}
                />
            </Box>
        );
    }

    private renderSlots(): React.JSX.Element {
        return (
            <Box sx={{ mb: 2 }}>
                {this.renderRange()}
                <Typography
                    variant="subtitle2"
                    sx={{ mb: 1 }}
                >
                    {this.getText('pchart_Slices')}
                </Typography>
                {slotsOf(this.props.entry).map((slot, index) => this.renderSlot(slot, index))}
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {this.getText('pchart_SlotsHint')}
                </Typography>
            </Box>
        );
    }

    private renderScriptSource(): React.JSX.Element {
        const { entry, oContext, theme } = this.props;
        const themeType = oContext?.themeType ?? (theme?.palette?.mode || 'light');
        return (
            <Box sx={{ mb: 2 }}>
                <EntitySelector
                    label={this.getText('pchart_ScriptState')}
                    value={entry.setStateForValues ?? ''}
                    onChange={(v: string) => {
                        this.handleFieldChange('setStateForValues', v);
                    }}
                    socket={oContext.socket}
                    theme={theme}
                    themeType={themeType}
                    dialogName="selectPChartScriptState"
                    filterFunc={isState}
                    disabled={!this.state.alive}
                />
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                >
                    {this.getText('pchart_ScriptHint')}
                </Typography>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { entry } = this.props;
        const source =
            entry.selInstanceDataSource === PCHART_SOURCE_SCRIPT ? PCHART_SOURCE_SCRIPT : PCHART_SOURCE_SLOTS;
        return (
            <Box>
                {this.renderUniqueName()}
                {!this.state.alive && (
                    <Alert
                        severity="info"
                        sx={{ mb: 2 }}
                    >
                        {this.getText('Adapter_offline')}
                    </Alert>
                )}
                {this.renderPageFields()}
                {this.renderSourceSelect(source)}
                {source === PCHART_SOURCE_SLOTS ? this.renderSlots() : this.renderScriptSource()}
            </Box>
        );
    }
}
