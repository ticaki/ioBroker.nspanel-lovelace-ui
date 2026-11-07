/**
 * Dialog of the values of a screensaver indicator that cycles through a list (ScreensaverEntityCycleValues): each
 * press writes the next value, after the last one it starts again with the first. The order of the rows is the
 * order of the list - it is never sorted by value, the same value may appear several times.
 */
import React from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { cycleValueToState } from '../../../src/lib/const/screensaver-cycle';

export interface ScreensaverCycleValuesDialogProps {
    getText: (key: string) => string;
    /** the edited values in their order, empty rows left out */
    onSave: (values: string[]) => void;
}

/** one row of the dialog - `key` keeps the text field of the row while the rows move */
interface CycleValueRow {
    key: number;
    value: string;
}

interface ScreensaverCycleValuesDialogState {
    open: boolean;
    rows: CycleValueRow[];
    /** common.type of the state the values are written to, undefined = no state yet */
    stateType: string | undefined;
    /** the row that is dragged and the row it is over */
    dragKey: number | null;
    overKey: number | null;
}

export default class ScreensaverCycleValuesDialog extends React.Component<
    ScreensaverCycleValuesDialogProps,
    ScreensaverCycleValuesDialogState
> {
    private nextKey = 0;

    constructor(props: ScreensaverCycleValuesDialogProps) {
        super(props);
        this.state = { open: false, rows: [], stateType: undefined, dragKey: null, overKey: null };
    }

    /**
     * opens the dialog with the stored values - an empty list starts with one empty row
     *
     * @param values stored values of the action
     * @param stateType common.type of the state, undefined = no state yet
     */
    public openWith(values: readonly string[], stateType: string | undefined): void {
        const rows = values.map(value => this.row(value));
        if (!rows.length) {
            rows.push(this.row(''));
        }
        this.setState({ open: true, rows, stateType, dragKey: null, overKey: null });
    }

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private row(value: string): CycleValueRow {
        return { key: this.nextKey++, value };
    }

    private update(key: number, value: string): void {
        this.setState(prev => ({ rows: prev.rows.map(r => (r.key === key ? { ...r, value } : r)) }));
    }

    private remove(key: number): void {
        this.setState(prev => ({ rows: prev.rows.filter(r => r.key !== key) }));
    }

    private add = (): void => {
        this.setState(prev => ({ rows: [...prev.rows, this.row('')] }));
    };

    /**
     * moves a row to a position
     *
     * @param key key of the row
     * @param target index the row has afterwards
     */
    private move(key: number, target: number): void {
        this.setState(prev => {
            const from = prev.rows.findIndex(r => r.key === key);
            if (from < 0 || target < 0 || target >= prev.rows.length || from === target) {
                return null;
            }
            const rows = [...prev.rows];
            const [row] = rows.splice(from, 1);
            rows.splice(target, 0, row);
            return { rows };
        });
    }

    private onDragStart(key: number, e: React.DragEvent<HTMLElement>): void {
        e.dataTransfer.effectAllowed = 'move';
        // Firefox starts a drag only with data
        e.dataTransfer.setData('text/plain', String(key));
        // the handle is grabbed, the whole row moves
        const row = e.currentTarget.parentElement;
        if (row) {
            e.dataTransfer.setDragImage(row, 0, 0);
        }
        this.setState({ dragKey: key });
    }

    private onDragOver(key: number, e: React.DragEvent<HTMLElement>): void {
        if (this.state.dragKey === null) {
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (this.state.overKey !== key) {
            this.setState({ overKey: key });
        }
    }

    private onDrop(key: number, e: React.DragEvent<HTMLElement>): void {
        const { dragKey, rows } = this.state;
        if (dragKey === null) {
            return;
        }
        e.preventDefault();
        this.move(
            dragKey,
            rows.findIndex(r => r.key === key),
        );
        this.onDragEnd();
    }

    private onDragEnd = (): void => {
        this.setState({ dragKey: null, overKey: null });
    };

    /**
     * the text of a row does not fit the type of the state; an empty row is ignored
     *
     * @param value text of the row
     */
    private invalidValue(value: string): boolean {
        return value.trim() !== '' && cycleValueToState(value, this.state.stateType) === null;
    }

    private invalid(): boolean {
        return this.state.rows.some(r => this.invalidValue(r.value));
    }

    private save = (): void => {
        if (this.invalid()) {
            return;
        }
        this.props.onSave(this.state.rows.map(r => r.value.trim()).filter(value => value !== ''));
        this.setState({ open: false });
    };

    private close = (): void => {
        this.setState({ open: false });
    };

    private renderRow(row: CycleValueRow, index: number): React.JSX.Element {
        const { rows, dragKey, overKey } = this.state;
        return (
            <Box
                key={row.key}
                sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 0.5,
                    mb: 1,
                    opacity: dragKey === row.key ? 0.4 : 1,
                    outline: overKey === row.key && dragKey !== row.key ? '2px solid #4da3ff' : 'none',
                }}
                data-ss="cycle-row"
                onDragOver={e => this.onDragOver(row.key, e)}
                onDrop={e => this.onDrop(row.key, e)}
            >
                <Tooltip title={this.getText('screensaver_cycle_drag')}>
                    <Box
                        sx={{ display: 'flex', alignSelf: 'center', cursor: 'grab', color: 'text.secondary' }}
                        draggable
                        onDragStart={e => this.onDragStart(row.key, e)}
                        onDragEnd={this.onDragEnd}
                        data-ss="cycle-handle"
                    >
                        <DragIndicatorIcon fontSize="small" />
                    </Box>
                </Tooltip>
                <Tooltip title={this.getText('screensaver_cycle_up')}>
                    <span>
                        <IconButton
                            size="small"
                            disabled={index === 0}
                            onClick={() => this.move(row.key, index - 1)}
                        >
                            <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={this.getText('screensaver_cycle_down')}>
                    <span>
                        <IconButton
                            size="small"
                            disabled={index === rows.length - 1}
                            onClick={() => this.move(row.key, index + 1)}
                        >
                            <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <TextField
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('screensaver_cycle_value')}
                    value={row.value}
                    error={this.invalidValue(row.value)}
                    onChange={e => this.update(row.key, e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1, mx: 1 }}
                />
                <Tooltip title={this.getText('screensaver_cycle_remove')}>
                    <IconButton
                        size="small"
                        onClick={() => this.remove(row.key)}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { open, rows, stateType } = this.state;
        const invalid = this.invalid();
        return (
            <Dialog
                open={open}
                onClose={this.close}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{this.getText('screensaver_cycle_title')}</DialogTitle>
                <DialogContent dividers>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 2 }}
                    >
                        {this.getText('screensaver_cycle_hint')}
                    </Typography>
                    {rows.map((row, index) => this.renderRow(row, index))}
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={this.add}
                        sx={{ mt: 1 }}
                        data-ss="cycle-add"
                    >
                        {this.getText('screensaver_cycle_add')}
                    </Button>
                    {invalid && (
                        <Alert
                            severity="warning"
                            sx={{ mt: 2 }}
                        >
                            {this.getText('screensaver_cycle_invalid').replace('%s', stateType || '-')}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.close}>{this.getText('Cancel1')}</Button>
                    <Button
                        variant="contained"
                        disabled={invalid}
                        onClick={this.save}
                    >
                        {this.getText('screensaver_apply')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
