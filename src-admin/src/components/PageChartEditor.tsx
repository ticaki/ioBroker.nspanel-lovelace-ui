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
} from '@mui/material';
import { EntitySelector } from './EntitySelector';
import type { ChartEntry } from '../../../src/lib/types/adminShareConfig';

export interface PageChartEditorProps {
    entry: ChartEntry;
    onEntryChange: (updated: ChartEntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
}

interface PageChartEditorState {
    dbInstances: Array<{ id: string; name: string }>;
}

export class PageChartEditor extends React.Component<PageChartEditorProps, PageChartEditorState> {
    constructor(props: PageChartEditorProps) {
        super(props);
        this.state = {
            dbInstances: [],
        };
    }

    async componentDidMount(): Promise<void> {
        await this.loadDbInstances();
    }

    private async loadDbInstances(): Promise<void> {
        try {
            const { socket } = this.props.oContext;

            // Lade alle Objekte vom Typ 'instance'
            const objects = await socket.getObjectViewSystem('instance', 'system.adapter.', 'system.adapter.\u9999');

            const dbInstances: Array<{ id: string; name: string }> = [];

            // Filtere nach Datenbank-Adaptern
            Object.keys(objects).forEach(id => {
                const obj = objects[id];
                if (
                    obj &&
                    obj.type === 'instance' &&
                    (id.startsWith('system.adapter.influxdb.') ||
                        id.startsWith('system.adapter.history.') ||
                        id.startsWith('system.adapter.sql.'))
                ) {
                    // Extrahiere den Instanznamen
                    const instanceName = id.replace('system.adapter.', '');
                    dbInstances.push({
                        id: id,
                        name: instanceName,
                    });
                }
            });

            this.setState({ dbInstances });
        } catch (error) {
            console.error('Error loading DB instances:', error);
        }
    }

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private handleFieldChange(field: string, value: any): void {
        const updated = { ...this.props.entry, [field]: value };
        this.props.onEntryChange(updated);
    }

    render(): React.JSX.Element {
        const { entry, oContext, theme } = this.props;
        const { dbInstances } = this.state;

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

                {/* Chart Type Selection */}
                <Box sx={{ mb: 2 }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">{this.getText('chart_Type')}</FormLabel>
                        <RadioGroup
                            row
                            value={entry.selChartType ?? 'cardChart'}
                            onChange={e => {
                                this.handleFieldChange('selChartType', e.target.value);
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
                    InputProps={{
                        sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
                    }}
                    sx={{ mb: 2 }}
                />

                {/* Chart Color */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        variant="standard"
                        type="color"
                        label={this.getText('chart_Color')}
                        value={entry.chart_color ?? '#FFFFFF'}
                        onChange={e => {
                            this.handleFieldChange('chart_color', e.target.value);
                        }}
                        InputProps={{
                            sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
                        }}
                    />
                </Box>

                {/* Data Source Selection */}
                <Box sx={{ mb: 2 }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">{this.getText('chart_DataSource')}</FormLabel>
                        <RadioGroup
                            row
                            value={entry.selInstanceDataSource ?? 0}
                            onChange={e => {
                                const value = parseInt(e.target.value, 10);
                                this.handleFieldChange('selInstanceDataSource', value);
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

                {/* Instance Selector (for DB adapter) - Dynamisches Select */}
                {entry.selInstanceDataSource === 1 && (
                    <Box sx={{ mb: 2 }}>
                        <FormControl
                            variant="standard"
                            fullWidth
                            sx={{ width: '50%' }}
                        >
                            <InputLabel>{this.getText('chart_Instance')}</InputLabel>
                            <Select
                                value={
                                    entry.selInstance && dbInstances.some(inst => inst.id === entry.selInstance)
                                        ? entry.selInstance
                                        : ''
                                }
                                onChange={e => {
                                    this.handleFieldChange('selInstance', e.target.value);
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
                                        value={instance.id}
                                    >
                                        {instance.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}

                {/* State for Ticks (only for oldScriptVersion) */}
                {entry.selInstanceDataSource === 0 && (
                    <Box sx={{ mb: 2 }}>
                        <EntitySelector
                            label={this.getText('chart_StateTicks')}
                            value={entry.setStateForTicks ?? undefined}
                            onChange={(v: string) => {
                                this.handleFieldChange('setStateForTicks', v);
                            }}
                            socket={oContext.socket}
                            theme={theme}
                            themeType={theme?.palette?.mode || 'light'}
                            dialogName="selectStateTicks"
                            filterFunc={(obj: ioBroker.Object) => {
                                return !!(obj && obj.type === 'state' && obj.common && obj.common.read);
                            }}
                        />
                    </Box>
                )}

                {/* State for Values (only for oldScriptVersion) */}
                {entry.selInstanceDataSource === 0 && (
                    <Box sx={{ mb: 2 }}>
                        <EntitySelector
                            label={this.getText('chart_StateValues')}
                            value={entry.setStateForValues ?? undefined}
                            onChange={(v: string) => {
                                this.handleFieldChange('setStateForValues', v);
                            }}
                            socket={oContext.socket}
                            theme={theme}
                            themeType={theme?.palette?.mode || 'light'}
                            dialogName="selectStateValues"
                            filterFunc={(obj: ioBroker.Object) => {
                                return !!(obj && obj.type === 'state' && obj.common && obj.common.read);
                            }}
                        />
                    </Box>
                )}

                {/* State for DB (only for DB adapter) */}
                {entry.selInstanceDataSource === 1 && (
                    <Box sx={{ mb: 2 }}>
                        <EntitySelector
                            label={this.getText('chart_StateDB')}
                            value={entry.setStateForDB ?? undefined}
                            onChange={(v: string) => {
                                this.handleFieldChange('setStateForDB', v);
                            }}
                            socket={oContext.socket}
                            theme={theme}
                            themeType={theme?.palette?.mode || 'light'}
                            dialogName="selectStateDB"
                            filterFunc={(obj: ioBroker.Object) => {
                                return !!(obj && obj.type === 'state' && obj.common && obj.common.read);
                            }}
                        />
                    </Box>
                )}

                {/* Y-Axis Label */}
                <TextField
                    fullWidth
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('chart_YAxis')}
                    value={entry.txtlabelYAchse ?? ''}
                    onChange={e => {
                        this.handleFieldChange('txtlabelYAchse', e.target.value);
                    }}
                    InputProps={{
                        sx: { backgroundColor: 'transparent', px: 1 },
                    }}
                    sx={{ mb: 2 }}
                />

                {/* Range Hours (only for DB adapter) */}
                {entry.selInstanceDataSource === 1 && (
                    <TextField
                        fullWidth
                        variant="standard"
                        type="number"
                        label={this.getText('chart_Hours')}
                        value={entry.rangeHours ?? 24}
                        onChange={e => {
                            this.handleFieldChange('rangeHours', parseInt(e.target.value, 10));
                        }}
                        InputProps={{
                            sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
                        }}
                        sx={{ mb: 2 }}
                    />
                )}

                {/* Factor Card Chart (only for cardChart) */}
                {entry.selInstanceDataSource === 1 && entry.selChartType === 'cardChart' && (
                    <FormControl
                        variant="standard"
                        sx={{ mb: 2, minWidth: 240 }}
                    >
                        <InputLabel>{this.getText('chart_Factor')}</InputLabel>
                        <Select
                            value={entry.factorCardChart ?? 1}
                            onChange={e => {
                                this.handleFieldChange('factorCardChart', e.target.value as number);
                            }}
                        >
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={10}>0,1</MenuItem>
                            <MenuItem value={100}>0,01</MenuItem>
                            <MenuItem value={1000}>0,001</MenuItem>
                        </Select>
                    </FormControl>
                )}

                {/* Max X-Axis Ticks (only for DB adapter and cardLChart) */}
                {entry.selInstanceDataSource === 1 && entry.selChartType === 'cardLChart' && (
                    <TextField
                        fullWidth
                        variant="standard"
                        type="number"
                        label={this.getText('chart_XTicks')}
                        value={entry.maxXAxisTicks ?? 10}
                        onChange={e => {
                            this.handleFieldChange('maxXAxisTicks', parseInt(e.target.value, 10));
                        }}
                        InputProps={{
                            sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
                        }}
                        sx={{ mb: 2 }}
                    />
                )}

                {/* Max X-Axis Labels */}
                {entry.selInstanceDataSource === 1 && (
                    <TextField
                        fullWidth
                        variant="standard"
                        type="number"
                        label={this.getText('chart_XLabels')}
                        value={entry.maxXAxisLabels ?? 6}
                        onChange={e => {
                            this.handleFieldChange('maxXAxisLabels', parseInt(e.target.value, 10));
                        }}
                        InputProps={{
                            sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
                        }}
                        sx={{ mb: 2 }}
                    />
                )}
            </Box>
        );
    }
}
