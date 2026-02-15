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
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { EntitySelector } from './EntitySelector';
import { type QREntry, ADAPTER_NAME } from '../../../src/lib/types/adminShareConfig';

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
    alive: boolean;
}

export class PageQREditor extends React.Component<PageQREditorProps, PageQREditorState> {
    constructor(props: PageQREditorProps) {
        super(props);
        this.state = {
            showPassword: false,
            alive: false,
        };
    }

    componentWillUnmount(): void {
        // Unsubscribe from alive state changes
        const instance = this.props.oContext.instance ?? '0';
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
            this.onAliveChanged,
        );
    }

    async componentDidMount(): Promise<void> {
        // Get initial alive state and subscribe to changes
        const instance = this.props.oContext.instance ?? '0';
        const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;

        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            const isAlive = !!state?.val;
            this.setState({ alive: isAlive });

            // Subscribe to alive state changes
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);
        } catch (error) {
            console.error('[PageQREditor] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
    }

    // Callback for alive state changes
    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            console.log('[PageQREditor] Alive state changed:', { wasAlive, isAlive });
            this.setState({ alive: isAlive });
        }
    };

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
                        disabled={!this.state.alive}
                    />
                </Box>

                {/* QR Type Selection */}
                <Box sx={{ mb: 2 }}>
                    <FormControl
                        component="fieldset"
                        disabled={!this.state.alive}
                    >
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
                                value={0}
                                control={<Radio />}
                                label={this.getText('qr_type_free')}
                            />
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
                    disabled={!this.state.alive}
                />

                {/* SSID/URL/TEL field */}
                <TextField
                    fullWidth
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={(() => {
                        switch (entry.selType) {
                            case 0:
                                return this.getText('qr_content_free');
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
                    disabled={!this.state.alive}
                />

                {/* WiFi-specific fields */}
                {entry.selType === 1 && (
                    <Box sx={{ mb: 2 }}>
                        {/* WLAN Type */}
                        <FormControl
                            variant="standard"
                            sx={{ mb: 2, minWidth: 240 }}
                            disabled={!this.state.alive}
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
                                disabled={!this.state.alive}
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
                                disabled={!this.state.alive}
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
                                disabled={!this.state.alive}
                            />
                        </Box>

                        {/* Set State field */}
                        <Box sx={{ mb: 2 }}>
                            <EntitySelector
                                label={this.getText('qr_set_state')}
                                value={entry.setState ?? undefined}
                                onChange={(v: string) => {
                                    this.handleFieldChange('setState', v);
                                }}
                                socket={oContext.socket}
                                theme={theme}
                                themeType={theme?.palette?.mode || 'light'}
                                dialogName="selectState"
                                filterFunc={(obj: ioBroker.Object) => {
                                    return !!(
                                        obj &&
                                        obj.type === 'state' &&
                                        obj.common &&
                                        obj.common.type === 'boolean' &&
                                        obj.common.write &&
                                        obj.common.read
                                    );
                                }}
                                disabled={!this.state.alive}
                            />
                        </Box>
                    </Box>
                )}

                {/* REMOVED: Common fields (hidden, alwaysOn) - now in NavigationAssignmentPanel */}
            </Box>
        );
    }
}
