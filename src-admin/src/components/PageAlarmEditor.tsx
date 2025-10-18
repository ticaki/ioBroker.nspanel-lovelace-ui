import React from 'react';
import {
    Box,
    TextField,
    FormControl,
    FormControlLabel,
    RadioGroup,
    Radio,
    Typography,
    Checkbox,
    Select,
    MenuItem,
    IconButton,
    InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import type { UnlockEntry } from '../../../src/lib/types/adminShareConfig';

export interface PageAlarmEditorProps {
    entry: UnlockEntry;
    pagesList: string[];
    onEntryChange: (updated: UnlockEntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
}

interface PageAlarmEditorState {
    showPin: boolean;
}

export class PageAlarmEditor extends React.Component<PageAlarmEditorProps, PageAlarmEditorState> {
    constructor(props: PageAlarmEditorProps) {
        super(props);
        this.state = {
            showPin: false,
        };
    }

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private handleFieldChange(field: string, value: any): void {
        const updated = { ...this.props.entry, [field]: value };
        this.props.onEntryChange(updated);
    }

    render(): React.JSX.Element {
        const { entry, pagesList } = this.props;

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

                {/* Radio for Alarm vs Unlock */}
                <Box sx={{ mb: 1 }}>
                    <FormControl component="fieldset">
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1 }}
                        >
                            {this.getText('unlock_type')}
                        </Typography>
                        <RadioGroup
                            row
                            value={entry.alarmType || ''}
                            onChange={(_e, val) => {
                                this.handleFieldChange('alarmType', val);
                            }}
                        >
                            <FormControlLabel
                                value="alarm"
                                control={<Radio />}
                                label={this.getText('unlock_alarm')}
                            />
                            <FormControlLabel
                                value="unlock"
                                control={<Radio />}
                                label={this.getText('unlock_unlock')}
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

                {/* PIN field */}
                <Box sx={{ mt: 2 }}>
                    <TextField
                        variant="standard"
                        label={this.getText('unlock_pin')}
                        type={this.state.showPin ? 'text' : 'password'}
                        value={entry.pin !== undefined && entry.pin !== null ? String(entry.pin) : ''}
                        onChange={e => {
                            const raw = e.target.value;
                            const digits = raw.replace(/[^0-9]/g, '');
                            const n = digits ? parseInt(digits, 10) : 0;
                            this.handleFieldChange('pin', n);
                        }}
                        InputProps={{
                            sx: { backgroundColor: 'transparent', px: 1 },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label={this.state.showPin ? 'hide-pin' : 'show-pin'}
                                        onClick={() => {
                                            this.setState({ showPin: !this.state.showPin });
                                        }}
                                        edge="end"
                                        size="small"
                                    >
                                        {this.state.showPin ? (
                                            <VisibilityOff fontSize="small" />
                                        ) : (
                                            <Visibility fontSize="small" />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Common fields */}
                <Box sx={{ mt: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!entry.hidden}
                                onChange={(_e, checked) => {
                                    this.handleFieldChange('hidden', checked);
                                }}
                            />
                        }
                        label={this.getText('hidden')}
                    />

                    {/* alwaysOn radio group */}
                    <Box sx={{ mt: 2 }}>
                        <FormControl component="fieldset">
                            <Typography
                                variant="subtitle2"
                                sx={{ mb: 1 }}
                            >
                                {this.getText('alwaysOn')}
                            </Typography>
                            <RadioGroup
                                row
                                value={entry.alwaysOn || 'none'}
                                onChange={(_e, val) => {
                                    this.handleFieldChange('alwaysOn', val as 'none' | 'always' | 'ignore');
                                }}
                            >
                                <FormControlLabel
                                    value="none"
                                    control={<Radio />}
                                    label={this.getText('alwaysOn_none')}
                                />
                                <FormControlLabel
                                    value="always"
                                    control={<Radio />}
                                    label={this.getText('alwaysOn_always')}
                                />
                                <FormControlLabel
                                    value="ignore"
                                    control={<Radio />}
                                    label={this.getText('alwaysOn_ignore')}
                                />
                            </RadioGroup>
                        </FormControl>
                    </Box>
                </Box>

                {/* Alarm-specific controls */}
                {entry.alarmType === 'alarm' && (
                    <Box sx={{ mt: 2 }}>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                gap: 2,
                            }}
                        >
                            {/* Armed buttons 1..4 */}
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    sx={{ mb: 1 }}
                                >
                                    {this.getText('unlock_armed_header')}
                                </Typography>
                                <Box sx={{ display: 'grid', gap: 2 }}>
                                    {[1, 2, 3, 4].map(i => {
                                        const key = `button${i}` as const;
                                        const labelIndex = ((i - 1) % 4) + 1;
                                        return (
                                            <Box key={i}>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ mb: 0.5 }}
                                                >
                                                    {this.getText(`unlock_button${labelIndex}_label`)}
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    variant="standard"
                                                    placeholder={this.getText(`unlock_button${labelIndex}_placeholder`)}
                                                    value={(entry as any)[key] ?? ''}
                                                    onChange={e => {
                                                        this.handleFieldChange(key, e.target.value);
                                                    }}
                                                    InputProps={{
                                                        disableUnderline: true,
                                                        sx: {
                                                            backgroundColor: 'transparent',
                                                            px: 1,
                                                            '& input::placeholder': {
                                                                color: 'text.disabled',
                                                            },
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>

                            {/* Disarmed buttons 5..8 */}
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    sx={{ mb: 1 }}
                                >
                                    {this.getText('unlock_disarmed_header')}
                                </Typography>
                                <Box sx={{ display: 'grid', gap: 2 }}>
                                    {[5, 6, 7, 8].map(i => {
                                        const key = `button${i}` as const;
                                        const labelIndex = ((i - 1) % 4) + 1;
                                        return (
                                            <Box key={i}>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ mb: 0.5 }}
                                                >
                                                    {this.getText(`unlock_button${labelIndex}_label`)}
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    variant="standard"
                                                    placeholder={this.getText(`unlock_button${labelIndex}_placeholder`)}
                                                    value={(entry as any)[key] ?? ''}
                                                    onChange={e => {
                                                        this.handleFieldChange(key, e.target.value);
                                                    }}
                                                    InputProps={{
                                                        disableUnderline: true,
                                                        sx: {
                                                            backgroundColor: 'transparent',
                                                            px: 1,
                                                            '& input::placeholder': {
                                                                color: 'text.disabled',
                                                            },
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Box>

                        {/* Approved checkbox */}
                        <Box sx={{ mt: 1 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!entry.approved}
                                        onChange={(_e, checked) => {
                                            this.handleFieldChange('approved', checked);
                                        }}
                                    />
                                }
                                label={this.getText('unlock_approved')}
                            />
                        </Box>
                        <Box sx={{ mt: 1 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!entry.global}
                                        onChange={(_e, checked) => {
                                            this.handleFieldChange('global', checked);
                                        }}
                                    />
                                }
                                label={this.getText('unlock_global')}
                            />
                        </Box>
                    </Box>
                )}

                {/* Unlock-specific: setNavi */}
                {entry.alarmType === 'unlock' && (
                    <Box sx={{ mt: 2 }}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                        >
                            {this.getText('unlock_setnavi_hint')}
                        </Typography>
                        <Select
                            variant="standard"
                            displayEmpty
                            value={entry.setNavi ?? ''}
                            onChange={e => {
                                this.handleFieldChange('setNavi', String((e.target as HTMLInputElement).value));
                            }}
                            sx={{ backgroundColor: 'transparent', px: 1, width: '60%' }}
                        >
                            <MenuItem value="">
                                <em>{this.getText('unlock_setnavi_placeholder')}</em>
                            </MenuItem>
                            {pagesList
                                .filter(
                                    (p: any) => typeof p === 'string' && !p.startsWith('///') && p !== entry.uniqueName,
                                )
                                .map(p => (
                                    <MenuItem
                                        key={p}
                                        value={p}
                                    >
                                        {p}
                                    </MenuItem>
                                ))}
                            {entry.setNavi &&
                                entry.setNavi !== entry.uniqueName &&
                                !pagesList.includes(entry.setNavi) && (
                                    <MenuItem
                                        key={`custom-${entry.setNavi}`}
                                        value={entry.setNavi}
                                    >
                                        {entry.setNavi}
                                    </MenuItem>
                                )}
                        </Select>
                    </Box>
                )}
            </Box>
        );
    }
}
