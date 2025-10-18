import React from 'react';
import {
    Box,
    TextField,
    FormControl,
    FormLabel,
    FormControlLabel,
    RadioGroup,
    Radio,
    Checkbox,
    Typography,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import ObjectIdSelector from './ObjectIdSelector';
import type { QREntry } from '../../../src/lib/types/adminShareConfig';

export interface PageQREditorProps {
    entry: QREntry;
    onEntryChange: (updated: QREntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
}

interface PageQREditorState {
    showPassword: boolean;
}

export class PageQREditor extends React.Component<PageQREditorProps, PageQREditorState> {
    constructor(props: PageQREditorProps) {
        super(props);
        this.state = {
            showPassword: false,
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

                {/* QR Type Selection */}
                <Box sx={{ mb: 2 }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">{this.getText('qr_type')}</FormLabel>
                        <RadioGroup
                            row
                            value={entry.selType ?? 0}
                            onChange={e => {
                                const value = parseInt(e.target.value, 10);
                                this.handleFieldChange('selType', value);
                            }}
                        >
                            <FormControlLabel
                                value={1}
                                control={<Radio />}
                                label={this.getText('qr_type_wifi')}
                            />
                            <FormControlLabel
                                value={2}
                                control={<Radio />}
                                label={this.getText('qr_type_url')}
                            />
                            <FormControlLabel
                                value={3}
                                control={<Radio />}
                                label={this.getText('qr_type_tel')}
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

                {/* SSID/URL/TEL field */}
                <TextField
                    fullWidth
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={(() => {
                        switch (entry.selType) {
                            case 1:
                                return this.getText('qr_content_wifi');
                            case 2:
                                return this.getText('qr_content_url');
                            case 3:
                                return this.getText('qr_content_tel');
                            default:
                                return this.getText('qr_content');
                        }
                    })()}
                    value={entry.ssidUrlTel ?? ''}
                    onChange={e => {
                        this.handleFieldChange('ssidUrlTel', e.target.value);
                    }}
                    InputProps={{
                        sx: { backgroundColor: 'transparent', px: 1 },
                    }}
                    sx={{ mb: 2 }}
                />

                {/* WiFi-specific fields */}
                {entry.selType === 1 && (
                    <Box sx={{ mb: 2 }}>
                        {/* WLAN Type */}
                        <FormControl
                            variant="standard"
                            sx={{ mb: 2, minWidth: 120 }}
                        >
                            <InputLabel>{this.getText('qr_wlan_type')}</InputLabel>
                            <Select
                                value={entry.wlantype ?? 'WPA2'}
                                onChange={e => {
                                    const v = e.target.value as 'nopass' | 'WPA' | 'WPA2' | 'WPA3' | 'WEP';
                                    this.handleFieldChange('wlantype', v);
                                }}
                            >
                                <MenuItem value="nopass">No Password</MenuItem>
                                <MenuItem value="WPA">WPA</MenuItem>
                                <MenuItem value="WPA2">WPA2</MenuItem>
                                <MenuItem value="WPA3">WPA3</MenuItem>
                                <MenuItem value="WEP">WEP</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Password field */}
                        {entry.wlantype !== 'nopass' && (
                            <TextField
                                fullWidth
                                variant="standard"
                                type={this.state.showPassword ? 'text' : 'password'}
                                label={this.getText('qr_password')}
                                value={entry.qrPass ?? ''}
                                onChange={e => {
                                    this.handleFieldChange('qrPass', e.target.value);
                                }}
                                InputProps={{
                                    sx: { backgroundColor: 'transparent', px: 1 },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => {
                                                    this.setState({ showPassword: !this.state.showPassword });
                                                }}
                                                edge="end"
                                            >
                                                {this.state.showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />
                        )}

                        {/* Hidden checkboxes */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!entry.wlanhidden}
                                        onChange={(_e, checked) => {
                                            this.handleFieldChange('wlanhidden', checked);
                                        }}
                                    />
                                }
                                label={this.getText('qr_wlan_hidden')}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!entry.pwdhidden}
                                        onChange={(_e, checked) => {
                                            this.handleFieldChange('pwdhidden', checked);
                                        }}
                                    />
                                }
                                label={this.getText('qr_pwd_hidden')}
                            />
                        </Box>

                        {/* Set State field */}
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                variant="body2"
                                sx={{ mb: 1, color: 'text.secondary' }}
                            >
                                {this.getText('qr_set_state')}
                            </Typography>
                            <ObjectIdSelector
                                value={entry.setState ?? ''}
                                onChange={(v: string) => {
                                    this.handleFieldChange('setState', v);
                                }}
                                socket={oContext.socket}
                                themeName={'blue' as any}
                                themeType={theme?.palette?.mode || 'light'}
                                theme={theme}
                                adapterName="nspanel-lovelace-ui"
                                instance={oContext?.instance || 0}
                                objectIdConfig={{
                                    types: 'state',
                                    filterFunc:
                                        "return !!(obj && obj.type === 'state' && obj.common && obj.common.type === 'boolean' && obj.common.write && obj.common.read);" as any,
                                }}
                            />
                        </Box>
                    </Box>
                )}

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
                                value={entry?.alwaysOn || 'none'}
                                onChange={(_e, val) => {
                                    this.handleFieldChange('alwaysOn', val as 'none' | 'always' | 'action' | 'ignore');
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
            </Box>
        );
    }
}
