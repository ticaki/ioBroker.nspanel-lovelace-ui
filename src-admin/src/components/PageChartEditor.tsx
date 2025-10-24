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

export class PageChartEditor extends React.Component<PageChartEditorProps> {
    private getText(key: string): string {
        return this.props.getText(key);
    }

    private handleFieldChange(field: string, value: any): void {
        const updated = { ...this.props.entry, [field]: value };
        this.props.onEntryChange(updated);
    }

    render(): React.JSX.Element {
        const { entry, oContext, theme } = this.props;

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
                        <FormLabel component="legend">{this.getText('chart_type')}</FormLabel>
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
                                label={this.getText('chart_type_card')}
                            />
                            <FormControlLabel
                                value="cardLChart"
                                control={<Radio />}
                                label={this.getText('chart_type_card_l')}
                            />
                        </RadioGroup>
                    </FormControl>
                </Box>

                {/* Chart Color */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        variant="standard"
                        type="color"
                        label={this.getText('chart_color')}
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
                        <FormLabel component="legend">{this.getText('chart_data_source')}</FormLabel>
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
                                label={this.getText('chart_data_source_script')}
                            />
                            <FormControlLabel
                                value={1}
                                control={<Radio />}
                                label={this.getText('chart_data_source_db')}
                            />
                        </RadioGroup>
                    </FormControl>
                </Box>

                {/* Instance Selector (for DB adapter) */}
                {entry.selInstanceDataSource === 1 && (
                    <Box sx={{ mb: 2 }}>
                        <EntitySelector
                            label={this.getText('chart_instance')}
                            value={entry.selInstance ?? ''}
                            onChange={(v: string) => {
                                this.handleFieldChange('selInstance', v);
                            }}
                            socket={oContext.socket}
                            theme={theme}
                            themeType={theme?.palette?.mode || 'light'}
                            dialogName="selectInstance"
                            filterFunc={(obj: ioBroker.Object) => {
                                return !!(
                                    obj &&
                                    obj.type === 'instance' &&
                                    (obj._id.startsWith('system.adapter.influxdb.') ||
                                        obj._id.startsWith('system.adapter.history.') ||
                                        obj._id.startsWith('system.adapter.sql.'))
                                );
                            }}
                        />
                    </Box>
                )}

                {/* State for Ticks */}
                <Box sx={{ mb: 2 }}>
                    <EntitySelector
                        label={this.getText('chart_state_ticks')}
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

                {/* State for Values */}
                <Box sx={{ mb: 2 }}>
                    <EntitySelector
                        label={this.getText('chart_state_values')}
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

                {/* State for DB (only for DB adapter) */}
                {entry.selInstanceDataSource === 1 && (
                    <Box sx={{ mb: 2 }}>
                        <EntitySelector
                            label={this.getText('chart_state_db')}
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
                    label={this.getText('chart_y_axis_label')}
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
                        label={this.getText('chart_range_hours')}
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

                {/* Max X-Axis Ticks */}
                <TextField
                    fullWidth
                    variant="standard"
                    type="number"
                    label={this.getText('chart_max_x_ticks')}
                    value={entry.maxXAxisTicks ?? 10}
                    onChange={e => {
                        this.handleFieldChange('maxXAxisTicks', parseInt(e.target.value, 10));
                    }}
                    InputProps={{
                        sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
                    }}
                    sx={{ mb: 2 }}
                />

                {/* Factor Card Chart (only for cardChart) */}
                {entry.selChartType === 'cardChart' && (
                    <FormControl
                        variant="standard"
                        sx={{ mb: 2, minWidth: 240 }}
                    >
                        <InputLabel>{this.getText('chart_factor')}</InputLabel>
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

                {/* Max X-Axis Labels */}
                <TextField
                    fullWidth
                    variant="standard"
                    type="number"
                    label={this.getText('chart_max_x_labels')}
                    value={entry.maxXAxisLabels ?? 5}
                    onChange={e => {
                        this.handleFieldChange('maxXAxisLabels', parseInt(e.target.value, 10));
                    }}
                    InputProps={{
                        sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
                    }}
                    sx={{ mb: 2 }}
                />
            </Box>
        );
    }
}
