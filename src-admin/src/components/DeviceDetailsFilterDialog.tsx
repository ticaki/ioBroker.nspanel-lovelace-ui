/**
 * Filter list of a device with details (doc/ideas/device-details/README.md): the entries of the mask of the adapter
 * (or of the general mask) with the states they found, plus every other state of the device. One tick per row; the
 * user sees the found state, not the rule behind it, and can exchange it. With an adapter without mask of its own every
 * row can be assigned to an entry of the general mask (the role suggests it). The order (drag & drop) is the order of
 * the detail page; the ticked rows stand on top, ticking or unticking moves a row to the border of both blocks.
 * Ticked rows with the same name get a second name line (automatic, can be overwritten).
 */
import React from 'react';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { I18n } from '@iobroker/gui-components';
import {
    deviceDetailEntriesOfRows,
    deviceDetailEntryOfState,
    deviceDetailNameKey,
    deviceDetailSubNames,
    exchangeDeviceDetailRowState,
    generalDeviceDetailMask,
    hasOwnDeviceDetailMask,
    tickDeviceDetailRow,
    tickedDeviceDetailRowsFirst,
    type DeviceDetailEntryConfig,
    type DeviceDetailRow,
    type DeviceDetailSubName,
    type DeviceStateInfo,
} from '../../../src/lib/types/deviceDetails';

export interface DeviceDetailsFilterDialogProps {
    /** the ticked rows in their order */
    onSave: (entries: DeviceDetailEntryConfig[]) => void;
}

/** a row of the dialog - `key` keeps the row while the rows move */
interface FilterRow extends DeviceDetailRow {
    rowKey: number;
}

interface DeviceDetailsFilterDialogState {
    open: boolean;
    deviceId: string;
    deviceName: string;
    states: DeviceStateInfo[];
    rows: FilterRow[];
    dragKey: number | null;
    overKey: number | null;
}

export default class DeviceDetailsFilterDialog extends React.Component<
    DeviceDetailsFilterDialogProps,
    DeviceDetailsFilterDialogState
> {
    private nextKey = 0;

    constructor(props: DeviceDetailsFilterDialogProps) {
        super(props);
        this.state = {
            open: false,
            deviceId: '',
            deviceName: '',
            states: [],
            rows: [],
            dragKey: null,
            overKey: null,
        };
    }

    /**
     * Opens the dialog.
     *
     * @param deviceId id of the device
     * @param deviceName name of the device
     * @param states the states of the device
     * @param rows the rows of the filter list (buildDeviceDetailRows)
     */
    public openWith(
        deviceId: string,
        deviceName: string,
        states: DeviceStateInfo[],
        rows: readonly DeviceDetailRow[],
    ): void {
        this.setState({
            open: true,
            deviceId,
            deviceName,
            states,
            rows: tickedDeviceDetailRowsFirst(rows.map(r => ({ ...r, rowKey: this.nextKey++ }))),
            dragKey: null,
            overKey: null,
        });
    }

    private stateOf(id: string): DeviceStateInfo | undefined {
        return this.state.states.find(s => s.id === id);
    }

    /**
     * @param row a row
     * @returns the name of the row: the name of its entry, without entry the name of its state
     */
    private rowName(row: DeviceDetailRow): string {
        if (row.key) {
            return I18n.t(deviceDetailNameKey(row.key));
        }
        return this.stateOf(row.id)?.name || row.id.split('.').pop() || '';
    }

    /**
     * Ticks or unticks a row: it becomes the last ticked row or the first unticked one.
     *
     * @param rowKey key of the row
     * @param enabled ticked or not
     */
    private tick(rowKey: number, enabled: boolean): void {
        this.setState(prev => ({
            rows: tickDeviceDetailRow(
                prev.rows,
                prev.rows.findIndex(r => r.rowKey === rowKey),
                enabled,
            ),
        }));
    }

    private update(rowKey: number, change: Partial<DeviceDetailRow>): void {
        this.setState(prev => ({ rows: prev.rows.map(r => (r.rowKey === rowKey ? { ...r, ...change } : r)) }));
    }

    /**
     * Another state for a row. Without a mask of its own the role of the new state suggests the entry.
     *
     * @param row the row
     * @param id id of the new state
     */
    private exchangeState(row: FilterRow, id: string): void {
        const change: Partial<DeviceDetailRow> = {};
        const state = this.stateOf(id);
        if (state && !hasOwnDeviceDetailMask(this.state.deviceId)) {
            change.key = deviceDetailEntryOfState(generalDeviceDetailMask, state)?.key ?? '';
        }
        // a state is shown in one row only: the row that had it takes the old state of this row
        // a row that becomes empty is unticked and moves below the ticked ones
        this.setState(prev => ({
            rows: tickedDeviceDetailRowsFirst(
                exchangeDeviceDetailRowState(
                    prev.rows,
                    prev.rows.findIndex(r => r.rowKey === row.rowKey),
                    id,
                    change,
                ),
            ),
        }));
    }

    /**
     * moves a row to a position - within its block: the ticked rows stay on top
     *
     * @param rowKey key of the row
     * @param target index the row has afterwards
     */
    private move(rowKey: number, target: number): void {
        this.setState(prev => {
            const from = prev.rows.findIndex(r => r.rowKey === rowKey);
            if (from < 0 || target < 0 || target >= prev.rows.length || from === target) {
                return null;
            }
            const rows = [...prev.rows];
            const [row] = rows.splice(from, 1);
            rows.splice(target, 0, row);
            return { rows: tickedDeviceDetailRowsFirst(rows) };
        });
    }

    private onDragStart(rowKey: number, e: React.DragEvent<HTMLElement>): void {
        e.dataTransfer.effectAllowed = 'move';
        // Firefox starts a drag only with data
        e.dataTransfer.setData('text/plain', String(rowKey));
        // the handle is grabbed, the whole row moves
        const row = e.currentTarget.parentElement;
        if (row) {
            e.dataTransfer.setDragImage(row, 0, 0);
        }
        this.setState({ dragKey: rowKey });
    }

    private onDragOver(rowKey: number, e: React.DragEvent<HTMLElement>): void {
        if (this.state.dragKey === null) {
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (this.state.overKey !== rowKey) {
            this.setState({ overKey: rowKey });
        }
    }

    private onDrop(rowKey: number, e: React.DragEvent<HTMLElement>): void {
        const { dragKey, rows } = this.state;
        if (dragKey === null) {
            return;
        }
        e.preventDefault();
        this.move(
            dragKey,
            rows.findIndex(r => r.rowKey === rowKey),
        );
        this.onDragEnd();
    }

    private onDragEnd = (): void => {
        this.setState({ dragKey: null, overKey: null });
    };

    private save = (): void => {
        this.props.onSave(deviceDetailEntriesOfRows(this.state.rows));
        this.setState({ open: false });
    };

    private close = (): void => {
        this.setState({ open: false });
    };

    /**
     * @param state a state of the device
     * @returns its label in the state list: id below the device, role and unit
     */
    private stateLabel(state: DeviceStateInfo): string {
        const rest = state.id.startsWith(`${this.state.deviceId}.`)
            ? state.id.slice(this.state.deviceId.length + 1)
            : state.id;
        const extra = [state.role, state.unit].filter(Boolean).join(', ');
        return extra ? `${rest} (${extra})` : rest;
    }

    /**
     * The second name lines of the ticked rows (deviceDetailSubNames).
     *
     * @param rows the rows of the dialog
     * @returns rowKey -> second line, only for ticked rows with a state
     */
    private subNamesOf(rows: readonly FilterRow[]): Map<number, DeviceDetailSubName> {
        const ticked = rows.filter(r => r.enabled && r.id !== '');
        const subs = deviceDetailSubNames(
            this.state.deviceId,
            ticked.map(r => ({ id: r.id, name: this.rowName(r), subName: r.subName })),
        );
        const out = new Map<number, DeviceDetailSubName>();
        ticked.forEach((r, i) => out.set(r.rowKey, subs[i]));
        return out;
    }

    /**
     * The field of the second name line: shown for a ticked row that shares its name with another ticked row, or that
     * has an own text (it applies without duplicate as well and must stay removable).
     *
     * @param row the row
     * @param sub its second line, undefined for an unticked row
     * @returns the field or null
     */
    private renderSubName(row: FilterRow, sub: DeviceDetailSubName | undefined): React.JSX.Element | null {
        if (!sub || (!sub.duplicate && row.subName === undefined)) {
            return null;
        }
        return (
            <Tooltip title={I18n.t('deviceDetailsDialog_subNameHint')}>
                <TextField
                    variant="standard"
                    size="small"
                    label={I18n.t('deviceDetailsDialog_subName')}
                    value={row.subName ?? ''}
                    placeholder={sub.auto}
                    sx={{ width: 130, flexShrink: 0 }}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { 'data-dd': 'sub-name' } }}
                    onChange={e => this.update(row.rowKey, { subName: e.target.value })}
                />
            </Tooltip>
        );
    }

    private renderRow(
        row: FilterRow,
        index: number,
        ownMask: boolean,
        sub: DeviceDetailSubName | undefined,
    ): React.JSX.Element {
        const { rows, dragKey, overKey, states } = this.state;
        return (
            <Box
                key={row.rowKey}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'nowrap',
                    minWidth: 0,
                    gap: 0.5,
                    py: 0.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                    opacity: dragKey === row.rowKey ? 0.4 : 1,
                    outline: overKey === row.rowKey && dragKey !== row.rowKey ? '2px solid #4da3ff' : 'none',
                }}
                data-dd="filter-row"
                onDragOver={e => this.onDragOver(row.rowKey, e)}
                onDrop={e => this.onDrop(row.rowKey, e)}
            >
                <Tooltip title={I18n.t('deviceDetailsDialog_drag')}>
                    <Box
                        sx={{ display: 'flex', cursor: 'grab', color: 'text.secondary' }}
                        draggable
                        onDragStart={e => this.onDragStart(row.rowKey, e)}
                        onDragEnd={this.onDragEnd}
                    >
                        <DragIndicatorIcon fontSize="small" />
                    </Box>
                </Tooltip>
                <Tooltip title={I18n.t('deviceDetailsDialog_up')}>
                    <span>
                        <IconButton
                            size="small"
                            disabled={index === 0 || (!row.enabled && !!rows[index - 1]?.enabled)}
                            onClick={() => this.move(row.rowKey, index - 1)}
                        >
                            <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={I18n.t('deviceDetailsDialog_down')}>
                    <span>
                        <IconButton
                            size="small"
                            disabled={index === rows.length - 1 || (row.enabled && rows[index + 1]?.enabled === false)}
                            onClick={() => this.move(row.rowKey, index + 1)}
                        >
                            <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Checkbox
                    size="small"
                    checked={row.enabled}
                    disabled={row.id === ''}
                    onChange={e => this.tick(row.rowKey, e.target.checked)}
                />
                <Tooltip title={this.rowName(row)}>
                    <Typography
                        variant="body2"
                        noWrap
                        sx={{ width: 160, flexShrink: 0, fontWeight: row.key ? 500 : 400 }}
                    >
                        {this.rowName(row)}
                    </Typography>
                </Tooltip>
                {this.renderSubName(row, sub)}
                {!ownMask && (
                    <FormControl
                        variant="standard"
                        size="small"
                        sx={{ width: 150, flexShrink: 0 }}
                    >
                        <InputLabel>{I18n.t('deviceDetailsDialog_entry')}</InputLabel>
                        <Select
                            value={row.key}
                            onChange={e => this.update(row.rowKey, { key: String(e.target.value) })}
                        >
                            <MenuItem value="">{I18n.t('deviceDetailsDialog_entryNone')}</MenuItem>
                            {generalDeviceDetailMask.entries.map(entry => (
                                <MenuItem
                                    key={entry.key}
                                    value={entry.key}
                                >
                                    {I18n.t(deviceDetailNameKey(entry.key))}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                <FormControl
                    variant="standard"
                    size="small"
                    sx={{ flex: 1, minWidth: 0 }}
                >
                    <InputLabel>{I18n.t('deviceDetailsDialog_state')}</InputLabel>
                    <Select
                        value={row.id}
                        sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                        onChange={e => this.exchangeState(row, String(e.target.value))}
                    >
                        <MenuItem value="">
                            <em>{I18n.t('deviceDetailsDialog_noState')}</em>
                        </MenuItem>
                        {states.map(state => (
                            <MenuItem
                                key={state.id}
                                value={state.id}
                            >
                                {this.stateLabel(state)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { open, rows, deviceId, deviceName } = this.state;
        const ownMask = hasOwnDeviceDetailMask(deviceId);
        const ticked = rows.filter(r => r.enabled && r.id !== '').length;
        const subNames = this.subNamesOf(rows);
        return (
            <Dialog
                open={open}
                onClose={this.close}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {I18n.t('deviceDetailsDialog_title')}
                    <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                    >
                        {deviceName || deviceId}
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1, whiteSpace: 'pre-line' }}
                    >
                        {I18n.t(ownMask ? 'deviceDetailsDialog_hint' : 'deviceDetailsDialog_hintGeneral')}
                    </Typography>
                    {rows.map((row, index) => this.renderRow(row, index, ownMask, subNames.get(row.rowKey)))}
                </DialogContent>
                <DialogActions>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mr: 'auto', pl: 1 }}
                    >
                        {I18n.t(ticked === 1 ? 'deviceDetailsDialog_tickedOne' : 'deviceDetailsDialog_ticked').replace(
                            '%s',
                            String(ticked),
                        )}
                    </Typography>
                    <Button onClick={this.close}>{I18n.t('channelConfigDialog_cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={this.save}
                    >
                        {I18n.t('deviceDetailsDialog_apply')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
