/**
 * Editor for chart pages (cardChart / cardLChart) in the PageConfig tab.
 * Follows the ConfigGeneric pattern of PageQREditor: alive-gated fields, main-page lock,
 * defaults from chartDefaults so that display and storage never diverge.
 */
import React from 'react';
import {
    Box,
    TextField,
    FormControl,
    FormLabel,
    FormControlLabel,
    RadioGroup,
    Radio,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
} from '@mui/material';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { EntitySelector } from './EntitySelector';
import { type ChartEntry, ADAPTER_NAME, chartDefaults, isMainPageEntry } from '../../../src/lib/types/adminShareConfig';

export interface PageChartEditorProps {
    entry: ChartEntry;
    onEntryChange: (updated: ChartEntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
}

type DbInstance = { id: string; name: string };

interface PageChartEditorState extends ConfigGenericState {
    alive: boolean;
    dbInstances: DbInstance[];
}

type NumberField = 'rangeHours' | 'maxXAxisTicks' | 'maxXAxisLabels';

/** adapters that answer `getHistory` */
const DB_ADAPTERS = ['influxdb', 'history', 'sql'];

/**
 * `system.adapter.influxdb.0` → `influxdb.0` (the stored form, same as the classic table)
 *
 * @param id full or short instance id
 */
function shortInstanceId(id: string | undefined): string {
    return (id ?? '').replace(/^system\.adapter\./, '');
}

/**
 * script source: every state, like the classic table (no `common.read` check, many script states lack it)
 *
 * @param obj object from the browser
 */
function isState(obj: ioBroker.Object): boolean {
    return !!(obj && obj.type === 'state');
}

/**
 * DB source: only states with logging enabled for the chosen instance,
 * e.g. `influxdb.0` → `common.custom['influxdb.0'].enabled`.
 * Without a chosen instance: any enabled logging of a DB adapter.
 *
 * @param instance short instance id (`influxdb.0`) or ''
 */
function loggedByInstance(instance: string): (obj: ioBroker.Object) => boolean {
    return (obj: ioBroker.Object): boolean => {
        if (!obj || obj.type !== 'state') {
            return false;
        }
        const custom = obj.common?.custom as Record<string, { enabled?: boolean } | undefined> | undefined;
        if (!custom) {
            return false;
        }
        if (instance) {
            return !!custom[instance]?.enabled;
        }
        return Object.keys(custom).some(key => DB_ADAPTERS.includes(key.split('.')[0]) && !!custom[key]?.enabled);
    };
}

export class PageChartEditor extends ConfigGeneric<ConfigGenericProps & PageChartEditorProps, PageChartEditorState> {
    constructor(props: ConfigGenericProps & PageChartEditorProps) {
        super(props);
        this.state = {
            ...this.state,
            alive: false,
            dbInstances: [],
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
            console.error('[PageChartEditor] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
        await this.loadDbInstances();
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
            console.error('[PageChartEditor] Error loading DB instances:', error);
        }
    }

    getText(key: string): string {
        return this.props.getText(key);
    }

    private handleFieldChange<K extends keyof ChartEntry>(field: K, value: ChartEntry[K]): void {
        this.props.onEntryChange({ ...this.props.entry, [field]: value });
    }

    /**
     * empty or invalid input clears the field; the adapter then falls back to chartDefaults
     *
     * @param field numeric entry field
     * @param raw text of the input
     */
    private handleNumberChange(field: NumberField, raw: string): void {
        const n = parseInt(raw, 10);
        this.handleFieldChange(field, Number.isFinite(n) && n > 0 ? n : undefined);
    }

    private renderNumberField(field: NumberField, labelKey: string, tooltipKey?: string): React.JSX.Element {
        const { entry } = this.props;
        const textField = (
            <TextField
                fullWidth
                variant="standard"
                type="number"
                label={this.getText(labelKey)}
                value={entry[field] ?? ''}
                placeholder={String(chartDefaults[field])}
                onChange={e => {
                    this.handleNumberChange(field, e.target.value);
                }}
                slotProps={{
                    input: { sx: { backgroundColor: 'transparent', px: 1, width: '50%' } },
                    inputLabel: { shrink: true },
                }}
                sx={{ mb: 2 }}
                disabled={!this.state.alive}
            />
        );
        if (!tooltipKey) {
            return textField;
        }
        return (
            <Tooltip
                title={this.getText(tooltipKey)}
                placement="top"
                arrow
            >
                {textField}
            </Tooltip>
        );
    }

    private renderStateSelector(
        field: 'setStateForTicks' | 'setStateForValues' | 'setStateForDB',
        labelKey: string,
        dialogName: string,
        filterFunc: (obj: ioBroker.Object) => boolean,
    ): React.JSX.Element {
        const { entry, oContext, theme } = this.props;
        const themeType = oContext?.themeType ?? (theme?.palette?.mode || 'light');
        return (
            <Box sx={{ mb: 2 }}>
                <EntitySelector
                    label={this.getText(labelKey)}
                    value={entry[field] ?? undefined}
                    onChange={(v: string) => {
                        this.handleFieldChange(field, v);
                    }}
                    socket={oContext.socket}
                    theme={theme}
                    themeType={themeType}
                    dialogName={dialogName}
                    filterFunc={filterFunc}
                    disabled={!this.state.alive}
                />
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { entry } = this.props;
        const { dbInstances, alive } = this.state;
        const dataSource = entry.selInstanceDataSource ?? chartDefaults.selInstanceDataSource;
        const chartType = entry.selChartType ?? chartDefaults.selChartType;
        const useDb = dataSource === 1;
        const selectedInstance = shortInstanceId(entry.selInstance);
        const instanceKnown = dbInstances.some(inst => inst.name === selectedInstance);

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

                {/* Chart type */}
                <Box sx={{ mb: 2 }}>
                    <FormControl
                        component="fieldset"
                        disabled={!alive}
                    >
                        <FormLabel component="legend">{this.getText('chart_Type')}</FormLabel>
                        <RadioGroup
                            row
                            value={chartType}
                            onChange={e => {
                                this.handleFieldChange(
                                    'selChartType',
                                    e.target.value === 'cardLChart' ? 'cardLChart' : 'cardChart',
                                );
                            }}
                        >
                            <FormControlLabel
                                value="cardChart"
                                control={<Radio />}
                                label={this.getText('chart_ColumnType')}
                            />
                            <FormControlLabel
                                value="cardLChart"
                                control={<Radio />}
                                label={this.getText('chart_LineType')}
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
                    value={entry.headline ?? ''}
                    onChange={e => {
                        this.handleFieldChange('headline', e.target.value);
                    }}
                    slotProps={{
                        input: { sx: { backgroundColor: 'transparent', px: 1, width: '50%' } },
                    }}
                    sx={{ mb: 2 }}
                    disabled={!alive}
                />

                {/* Chart color */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        variant="standard"
                        type="color"
                        label={this.getText('chart_Color')}
                        value={entry.chartColor ?? chartDefaults.chartColor}
                        onChange={e => {
                            this.handleFieldChange('chartColor', e.target.value);
                        }}
                        slotProps={{
                            input: { sx: { backgroundColor: 'transparent', px: 1, width: '50%' } },
                        }}
                        disabled={!alive}
                    />
                </Box>

                {/* Data source: script states or DB adapter */}
                <Box sx={{ mb: 2 }}>
                    <FormControl
                        component="fieldset"
                        disabled={!alive}
                    >
                        <FormLabel component="legend">{this.getText('chart_DataSource')}</FormLabel>
                        <RadioGroup
                            row
                            value={dataSource}
                            onChange={e => {
                                this.handleFieldChange('selInstanceDataSource', e.target.value === '1' ? 1 : 0);
                            }}
                        >
                            <FormControlLabel
                                value={0}
                                control={<Radio />}
                                label={this.getText('chart_ScriptVersion')}
                            />
                            <FormControlLabel
                                value={1}
                                control={<Radio />}
                                label={this.getText('chart_DB_Adapter')}
                            />
                        </RadioGroup>
                    </FormControl>
                </Box>

                {/* DB instance (short form, e.g. influxdb.0) */}
                {useDb && (
                    <Box sx={{ mb: 2 }}>
                        <FormControl
                            variant="standard"
                            fullWidth
                            sx={{ width: '50%' }}
                            disabled={!alive}
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
                        </FormControl>
                    </Box>
                )}

                {/* Script source: states for ticks and values */}
                {!useDb &&
                    this.renderStateSelector('setStateForTicks', 'chart_StateTicks', 'selectStateTicks', isState)}
                {!useDb &&
                    this.renderStateSelector('setStateForValues', 'chart_StateValues', 'selectStateValues', isState)}

                {/* DB source: only states logged by the selected instance (any DB instance if none is chosen) */}
                {useDb &&
                    this.renderStateSelector(
                        'setStateForDB',
                        'chart_StateDB',
                        'selectStateDB',
                        loggedByInstance(selectedInstance),
                    )}

                {/* Y-axis label */}
                <TextField
                    fullWidth
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('chart_YAxis')}
                    value={entry.txtLabelYAchse ?? ''}
                    onChange={e => {
                        this.handleFieldChange('txtLabelYAchse', e.target.value);
                    }}
                    slotProps={{
                        input: { sx: { backgroundColor: 'transparent', px: 1 } },
                    }}
                    sx={{ mb: 2 }}
                    disabled={!alive}
                />

                {/* DB source only: range, factor (bar), x ticks (line), x labels */}
                {useDb && this.renderNumberField('rangeHours', 'chart_Hours')}

                {useDb && chartType === 'cardChart' && (
                    <FormControl
                        variant="standard"
                        sx={{ mb: 2, minWidth: 240 }}
                        disabled={!alive}
                    >
                        <InputLabel>{this.getText('chart_Factor')}</InputLabel>
                        <Select
                            value={entry.factorCardChart ?? chartDefaults.factorCardChart}
                            onChange={e => {
                                this.handleFieldChange('factorCardChart', Number(e.target.value));
                            }}
                        >
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={10}>0,1</MenuItem>
                            <MenuItem value={100}>0,01</MenuItem>
                            <MenuItem value={1000}>0,001</MenuItem>
                        </Select>
                    </FormControl>
                )}

                {useDb &&
                    chartType === 'cardLChart' &&
                    this.renderNumberField('maxXAxisTicks', 'chart_XTicks', 'chart_XTicksTooltip')}

                {useDb && this.renderNumberField('maxXAxisLabels', 'chart_XLabels', 'chart_XLabelsTooltip')}
            </Box>
        );
    }
}
