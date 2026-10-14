/**
 * Dialog of the icon list of a screensaver item (ScreensaverEntityIconSelect): one icon per value range of a
 * number state. The adapter sorts the list by value and takes the icon of the first entry whose value is not
 * below the state value, above the highest value the last icon.
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
import DeleteIcon from '@mui/icons-material/Delete';
import SortIcon from '@mui/icons-material/Sort';
import IconSelect from '../IconSelect';

export type ScreensaverIconSelectEntry = { value: number; icon: string };

export interface ScreensaverIconSelectDialogProps {
    getText: (key: string) => string;
    oContext: any;
    themeName?: any;
    /** the edited list, undefined = no list (all rows removed) */
    onSave: (list: ScreensaverIconSelectEntry[] | undefined) => void;
}

/** one row of the dialog - the value as text while typing, `key` keeps the icon picker of the row */
interface IconSelectRow {
    key: number;
    value: string;
    icon: string;
}

interface ScreensaverIconSelectDialogState {
    open: boolean;
    rows: IconSelectRow[];
}

const EMPTY_COMMON: ioBroker.InstanceCommon = {} as ioBroker.InstanceCommon;

/**
 * the value of a row as number, null = empty or no number
 *
 * @param raw text of the value field
 */
function rowValue(raw: string): number | null {
    if (raw.trim() === '') {
        return null;
    }
    const n = Number(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
}

export default class ScreensaverIconSelectDialog extends React.Component<
    ScreensaverIconSelectDialogProps,
    ScreensaverIconSelectDialogState
> {
    private nextKey = 0;

    constructor(props: ScreensaverIconSelectDialogProps) {
        super(props);
        this.state = { open: false, rows: [] };
    }

    /**
     * opens the dialog with the stored list - an empty list starts with two rows
     *
     * @param list stored list of the item
     */
    public openWith(list: ScreensaverIconSelectEntry[] | undefined): void {
        const rows = (list ?? []).map(e => this.row(String(e.value), e.icon));
        if (!rows.length) {
            rows.push(this.row('', ''), this.row('', ''));
        }
        this.setState({ open: true, rows });
    }

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private row(value: string, icon: string): IconSelectRow {
        return { key: this.nextKey++, value, icon };
    }

    private update(key: number, patch: Partial<Omit<IconSelectRow, 'key'>>): void {
        this.setState(prev => ({ rows: prev.rows.map(r => (r.key === key ? { ...r, ...patch } : r)) }));
    }

    private remove(key: number): void {
        this.setState(prev => ({ rows: prev.rows.filter(r => r.key !== key) }));
    }

    private add = (): void => {
        this.setState(prev => ({ rows: [...prev.rows, this.row('', '')] }));
    };

    /** rows by value, the highest first - like the adapter reads the list, rows without a value at the end */
    private sort = (): void => {
        this.setState(prev => ({
            rows: [...prev.rows].sort((a, b) => {
                const va = rowValue(a.value);
                const vb = rowValue(b.value);
                if (va === null || vb === null) {
                    return va === null ? (vb === null ? 0 : 1) : -1;
                }
                return vb - va;
            }),
        }));
    };

    /** rows with neither value nor icon are ignored, all others need both */
    private filledRows(): IconSelectRow[] {
        return this.state.rows.filter(r => r.value.trim() !== '' || r.icon !== '');
    }

    private invalid(): boolean {
        return this.filledRows().some(r => rowValue(r.value) === null || !r.icon);
    }

    /** values that occur more than once */
    private duplicates(): number[] {
        const seen = new Set<number>();
        const dup = new Set<number>();
        for (const r of this.filledRows()) {
            const v = rowValue(r.value);
            if (v !== null) {
                if (seen.has(v)) {
                    dup.add(v);
                }
                seen.add(v);
            }
        }
        return [...dup];
    }

    private save = (): void => {
        if (this.invalid()) {
            return;
        }
        const list: ScreensaverIconSelectEntry[] = [];
        for (const r of this.filledRows()) {
            const v = rowValue(r.value);
            if (v !== null && r.icon) {
                list.push({ value: v, icon: r.icon });
            }
        }
        list.sort((a, b) => b.value - a.value);
        this.props.onSave(list.length ? list : undefined);
        this.setState({ open: false });
    };

    private close = (): void => {
        this.setState({ open: false });
    };

    private renderRow(row: IconSelectRow): React.JSX.Element {
        const { oContext, themeName } = this.props;
        const filled = row.value.trim() !== '' || row.icon !== '';
        const badValue = filled && rowValue(row.value) === null;
        const attr = `icon_${row.key}`;
        return (
            <Box
                key={row.key}
                sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 1.5 }}
                data-ss="iconselect-row"
            >
                <TextField
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('screensaver_iconSelect_value')}
                    value={row.value}
                    error={badValue}
                    onChange={e => this.update(row.key, { value: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { inputMode: 'decimal' } }}
                    sx={{ width: 120, flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 220 }}>
                    <IconSelect
                        oContext={oContext}
                        alive={true}
                        changed={false}
                        themeName={themeName}
                        common={EMPTY_COMMON}
                        attr={attr}
                        data={{ [attr]: row.icon }}
                        originalData={{ [attr]: row.icon }}
                        onError={() => {}}
                        schema={{
                            type: 'custom',
                            name: 'IconSelect',
                            url: '',
                            label: this.getText('screensaver_iconSelect_icon'),
                            i18n: false,
                        }}
                        custom
                        onChange={(attrOrData, val, cb): void => {
                            let icon = '';
                            if (typeof attrOrData === 'object') {
                                icon = (attrOrData as Record<string, string>)[attr] ?? '';
                            } else if (typeof val === 'string') {
                                icon = val;
                            }
                            this.update(row.key, { icon });
                            if (cb) {
                                cb();
                            }
                        }}
                    />
                </Box>
                <Tooltip title={this.getText('screensaver_iconSelect_removeRow')}>
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
        const { open, rows } = this.state;
        const invalid = this.invalid();
        const duplicates = this.duplicates();
        return (
            <Dialog
                open={open}
                onClose={this.close}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{this.getText('screensaver_iconSelect_title')}</DialogTitle>
                <DialogContent dividers>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 2 }}
                    >
                        {this.getText('screensaver_iconSelect_hint')}
                    </Typography>
                    {rows.map(r => this.renderRow(r))}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={this.add}
                            data-ss="iconselect-add"
                        >
                            {this.getText('screensaver_iconSelect_addRow')}
                        </Button>
                        <Button
                            size="small"
                            startIcon={<SortIcon />}
                            onClick={this.sort}
                            disabled={rows.length < 2}
                        >
                            {this.getText('screensaver_iconSelect_sort')}
                        </Button>
                    </Box>
                    {invalid && (
                        <Alert
                            severity="warning"
                            sx={{ mt: 2 }}
                        >
                            {this.getText('screensaver_iconSelect_incomplete')}
                        </Alert>
                    )}
                    {duplicates.length > 0 && (
                        <Alert
                            severity="warning"
                            sx={{ mt: 2 }}
                        >
                            {this.getText('screensaver_iconSelect_duplicate').replace('%s', duplicates.join(', '))}
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
