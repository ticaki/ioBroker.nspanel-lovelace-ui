import React from 'react';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Grid2,
    TextField,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import { green, grey, orange, red } from '@mui/material/colors';
import { type IobTheme, type ThemeName, type ThemeType } from '@iobroker/adapter-react-v5';

import RefreshIcon from '@mui/icons-material/Refresh';
import { ADAPTER_NAME } from '../../src/lib/types/adminShareConfig';

interface MaintainPanelInfo {
    _Headline: string;
    _name: string;
    _ip: string;
    _online: 'yes' | 'no';
    _topic: string;
    _id: string;
    _tftVersion: string;
    _tasmotaVersion: string;
    _ScriptVersion: string;
    _nsPanelModel: string;
    _check?: boolean;
}

interface MaintainPanelProps {
    oContext?: any;
    themeType: ThemeType;
    themeName: ThemeName;
    theme: IobTheme;
}

interface MaintainPanelState extends ConfigGenericState {
    panels: MaintainPanelInfo[];
    loading: boolean;
    error: string | null;
    processingPanel: string | null;
    alive?: boolean;
}

interface ConfirmDialogState {
    open: boolean;
    title: string;
    text: string;
    onConfirm: () => void;
}

class MaintainPanel extends ConfigGeneric<ConfigGenericProps & MaintainPanelProps, MaintainPanelState> {
    private confirmDialog: ConfirmDialogState | null = null;
    private timeoutHandle: NodeJS.Timeout | null = null;

    constructor(props: ConfigGenericProps & MaintainPanelProps) {
        super(props);
        this.state = {
            ...this.state,
            panels: [],
            loading: false,
            error: null,
            processingPanel: null,
            alive: false,
        };
    }

    componentWillUnmount(): void {
        // Unsubscribe from alive state changes
        const instance = this.props.oContext.instance ?? '0';
        const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;
        this.props.oContext.socket.unsubscribeState(aliveStateId, this.onAliveChanged);
        // Unsubscribe from panel online state changes
        for (const panel of this.props.data.panels) {
            this.props.oContext.socket.unsubscribeState(
                `${this.props.oContext.adapterName}.${this.props.oContext.instance ?? '0'}.panels.${panel.id}.info.isOnline`,
                this.onPanelOnlineChanged,
            );
        }
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = null;
        }
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount();

        // Get initial alive state and subscribe to changes
        const instance = this.props.oContext.instance ?? '0';
        const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;

        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            const isAlive = !!state?.val;
            this.setState({ alive: isAlive });

            // Subscribe to alive state changes
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);

            // If adapter is alive, start loading pages
            if (isAlive) {
                console.log('[Maintain] Adapter is alive, ready to load settings.');
                await this.refreshPanels();
            }
            for (const panel of this.props.data.panels) {
                // nspanel-lovelace-ui.0.panels.7C_87_CE_C6_1B_74.info.isOnline
                console.log(`[Maintain] Subscribing to online state for panel ${panel.name} (${panel.id})`);
                await this.props.oContext.socket.subscribeState(
                    `${this.props.oContext.adapterName}.${this.props.oContext.instance ?? '0'}.panels.${panel.id}.info.isOnline`,
                    this.onPanelOnlineChanged,
                );
            }
        } catch (error) {
            console.error('[Maintain] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
    }

    // Callback for alive state changes
    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            console.log('[Maintain] Alive state changed:', { wasAlive, isAlive });
            this.setState({ alive: isAlive });
        }
    };

    // Callback for panel online state changes
    onPanelOnlineChanged = (_id: string, _state: ioBroker.State | null | undefined): void => {
        console.log('[Maintain] Panel online state changed, refreshing panels');
        void this.refreshPanels();
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
        }
        this.timeoutHandle = setTimeout(() => {
            void this.refreshPanels();
        }, 5000);
    };

    private async refreshPanels(): Promise<void> {
        if (!this.state.alive) {
            this.setState({ error: this.getText('adapterNotAlive'), loading: false });
            return;
        }
        this.setState({ loading: true, error: null });

        try {
            const result = await this.props.oContext.socket.sendTo(
                `${this.props.oContext.adapterName}.${this.props.oContext.instance ?? '0'}`,
                'refreshMaintainTable',
                { internalServerIp: this.props.data.internalServerIp },
            );
            console.log('[Maintain] refreshMaintainTable result:', result);

            if (result && result.native && Array.isArray(result.native._maintainPanels)) {
                this.setState({ panels: result.native._maintainPanels, loading: false });
            } else {
                this.setState({ error: this.getText('invalidResponseFromAdapter'), loading: false });
            }
        } catch (err) {
            this.setState({ error: String(err), loading: false });
            return;
        }
    }

    private showConfirmDialog(title: string, text: string, onConfirm: () => void): void {
        this.confirmDialog = {
            open: true,
            title,
            text,
            onConfirm,
        };
        this.forceUpdate();
    }

    private closeConfirmDialog(): void {
        this.confirmDialog = null;
        this.forceUpdate();
    }

    private handleTasmotaUpdate(panel: MaintainPanelInfo): void {
        this.showConfirmDialog(this.getText('tasmotaUpdate'), this.getText('updateTasmotaText'), async () => {
            this.closeConfirmDialog();
            this.setState({ processingPanel: panel._name });

            try {
                const result = await this.props.oContext.socket.sendTo(
                    `${this.props.oContext.adapterName}.${this.props.oContext.instance ?? '0'}`,
                    'updateTasmota',
                    { topic: panel._topic },
                );

                if (result && typeof result === 'object' && 'error' in result) {
                    this.setState({ error: String(result.error), processingPanel: null });
                } else {
                    await this.refreshPanels();
                    this.setState({ processingPanel: null });
                }
            } catch (err) {
                this.setState({ error: String(err), processingPanel: null });
            }
        });
    }

    private handleTftInstall(panel: MaintainPanelInfo): void {
        this.showConfirmDialog(
            this.getText('tftInstallSendToMQTT'),
            `${this.getText('tftInstallSendToMQTTText')}\n\nPanel: ${panel._name}\nTFT - Version: ${panel._tftVersion}`,
            async () => {
                this.closeConfirmDialog();
                this.setState({ processingPanel: panel._name });

                try {
                    console.log('[Maintain] Sending TFT install command to MQTT for panel:', panel._name);
                    const result = await this.props.oContext.socket.sendTo(
                        `${this.props.oContext.adapterName}.${this.props.oContext.instance ?? '0'}`,
                        'tftInstallSendToMQTT',
                        {
                            tasmotaIP: panel._ip,
                            topic: panel._topic,
                            internalServerIp: this.props.data.internalServerIp,
                            useBetaTFT: this.props.data.useBetaTFT || false,
                            online: panel._online,
                            model: panel._nsPanelModel,
                        },
                    );
                    if (result && typeof result === 'object' && 'error' in result) {
                        this.setState({ error: String(result.error), processingPanel: null });
                    } else {
                        await this.refreshPanels();
                        this.setState({ processingPanel: null });
                    }
                } catch (err) {
                    this.setState({ error: String(err), processingPanel: null });
                }
            },
        );
    }

    private async handleCreateScript(panel: MaintainPanelInfo): Promise<void> {
        this.setState({ processingPanel: panel._name });

        try {
            const result = await this.props.oContext.socket.sendTo(
                `${this.props.oContext.adapterName}.${this.props.oContext.instance ?? '0'}`,
                'createScript',
                { name: panel._name, topic: panel._topic },
            );

            if (result && typeof result === 'object' && 'error' in result) {
                this.setState({ error: String(result.error), processingPanel: null });
            } else {
                await this.refreshPanels();
                this.setState({ processingPanel: null });
            }
        } catch (err) {
            this.setState({ error: String(err), processingPanel: null });
        }
    }

    private async handleOpenTasmotaConsole(panel: MaintainPanelInfo): Promise<void> {
        try {
            const result = await this.props.oContext.socket.sendTo(
                `${this.props.oContext.adapterName}.${this.props.oContext.instance ?? '0'}`,
                'openTasmotaConsole',
                { ip: panel._ip },
            );

            if (result && typeof result === 'object' && 'openUrl' in result) {
                window.open(result.openUrl as string, '_blank');
            }
        } catch (err) {
            this.setState({ error: String(err) });
        }
    }

    private isPanelUpdateable(panel: MaintainPanelInfo): boolean {
        const hasValidIp = panel._ip && /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(panel._ip);
        const hasValidTopic = panel._topic && /^[a-zA-Z][\w/]+$/.test(panel._topic);
        const hasValidData = this.props.data.mqttPort && this.props.data.mqttUsername && this.props.data.mqttPassword;
        const hasValidServer = this.props.data.mqttServer
            ? this.props.data.internalServerIp &&
              /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(this.props.data.internalServerIp) &&
              this.props.data.internalServerIp !== '127.0.0.1'
            : this.props.data.mqttIp;

        return !!(hasValidIp && hasValidTopic && hasValidData && hasValidServer && panel._online !== 'no');
    }

    private getPanelCardStyle(panel: MaintainPanelInfo): { backgroundColor: string; borderColor: string } {
        // Use state.themeName which is updated via interval
        console.log(`[Maintain] themeType: ${this.props.themeType}, themeName: ${this.props.themeName}`);
        const isDark = this.props.themeName === 'dark';

        if (!this.state.alive) {
            return {
                backgroundColor: isDark ? grey[800] : grey[300],
                borderColor: isDark ? grey[700] : grey[400],
            };
        }
        if (panel._online === 'no') {
            return {
                backgroundColor: isDark ? red[900] : red[100],
                borderColor: red[700],
            };
        }
        if (panel._check) {
            return {
                backgroundColor: isDark ? orange[900] : orange[100],
                borderColor: orange[700],
            };
        }
        return {
            backgroundColor: isDark ? green[900] : green[100],
            borderColor: green[700],
        };
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const { panels, loading, error, processingPanel } = this.state;
        const confirmDialog = this.confirmDialog;

        return (
            <Box sx={{ p: 2 }}>
                {/* Header with refresh button */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5">{this.getText('headerMaintain')}</Typography>
                    <Button
                        variant="outlined"
                        startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                        onClick={() => this.refreshPanels()}
                        disabled={loading}
                    >
                        {this.getText('RefreshMaintainTable')}
                    </Button>
                </Box>

                {/* Beta warning */}
                {this.props.data.useBetaTFT && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 2 }}
                    >
                        {this.getText('useBetaVersionText')}
                    </Alert>
                )}

                {/* Link to wiki */}
                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="text"
                        color="primary"
                        href="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/Adapter-Installation"
                        target="_blank"
                        sx={{ color: 'red' }}
                    >
                        {this.getText('openLinkAdapterInsatllation')}
                    </Button>
                </Box>

                {/* Error display */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        onClose={() => this.setState({ error: null })}
                    >
                        {error}
                    </Alert>
                )}

                {/* Panels as Cards */}
                <Grid2
                    container
                    spacing={2}
                >
                    {panels.map((panel, index) => {
                        const cardStyle = this.getPanelCardStyle(panel);
                        return (
                            <Grid2
                                size={{ xs: 12, md: 6, lg: 4 }}
                                key={panel._id || index}
                            >
                                <Card
                                    sx={{
                                        border: 3,
                                        borderColor: cardStyle.borderColor,
                                        backgroundColor: cardStyle.backgroundColor,
                                        opacity: !this.state.alive ? 0.6 : 1,
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: panel._check ? 'bold' : 'normal',
                                                mb: 2,
                                            }}
                                        >
                                            {panel._Headline}
                                        </Typography>

                                        {/* Version Info */}
                                        <Box sx={{ mb: 2 }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: { xs: 'column', sm: 'row' },
                                                    gap: 1,
                                                    mb: 1,
                                                    alignItems: { xs: 'stretch', sm: 'center' },
                                                }}
                                            >
                                                <TextField
                                                    label={this.getText('vTasmota')}
                                                    value={panel._tasmotaVersion}
                                                    InputProps={{ readOnly: true }}
                                                    size="small"
                                                    error={panel._tasmotaVersion.includes(')')}
                                                    sx={{ minWidth: { xs: 'auto', sm: 200 } }}
                                                />
                                                <Button
                                                    variant="contained"
                                                    onClick={() => this.handleTasmotaUpdate(panel)}
                                                    disabled={
                                                        !this.isPanelUpdateable(panel) ||
                                                        processingPanel === panel._name ||
                                                        !this.state.alive
                                                    }
                                                    size="small"
                                                    sx={{ minWidth: { xs: 'auto', sm: 200 } }}
                                                >
                                                    {processingPanel === panel._name ? (
                                                        <CircularProgress size={20} />
                                                    ) : (
                                                        this.getText('tasmotaUpdate')
                                                    )}
                                                </Button>
                                            </Box>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: { xs: 'column', sm: 'row' },
                                                    gap: 1,
                                                    mb: 1,
                                                    alignItems: { xs: 'stretch', sm: 'center' },
                                                }}
                                            >
                                                <TextField
                                                    label={this.getText('vTFT')}
                                                    value={panel._tftVersion}
                                                    InputProps={{ readOnly: true }}
                                                    size="small"
                                                    error={panel._tftVersion.includes(')')}
                                                    sx={{ minWidth: { xs: 'auto', sm: 200 } }}
                                                />
                                                <Button
                                                    variant="contained"
                                                    onClick={() => this.handleTftInstall(panel)}
                                                    disabled={
                                                        panel._online === 'no' ||
                                                        !panel._ip ||
                                                        processingPanel === panel._name ||
                                                        !this.state.alive
                                                    }
                                                    size="small"
                                                    sx={{ minWidth: { xs: 'auto', sm: 200 } }}
                                                >
                                                    {processingPanel === panel._name ? (
                                                        <CircularProgress size={20} />
                                                    ) : (
                                                        this.getText('tftInstallSendToMQTT')
                                                    )}
                                                </Button>
                                            </Box>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: { xs: 'column', sm: 'row' },
                                                    gap: 1,
                                                    alignItems: { xs: 'stretch', sm: 'center' },
                                                }}
                                            >
                                                <TextField
                                                    label={this.getText('vScript')}
                                                    value={panel._ScriptVersion}
                                                    InputProps={{ readOnly: true }}
                                                    size="small"
                                                    error={panel._ScriptVersion.includes(')')}
                                                    sx={{ minWidth: { xs: 'auto', sm: 200 } }}
                                                />
                                                <Button
                                                    variant="contained"
                                                    onClick={() => this.handleCreateScript(panel)}
                                                    disabled={
                                                        !panel._name ||
                                                        !panel._topic ||
                                                        processingPanel === panel._name ||
                                                        !this.state.alive
                                                    }
                                                    size="small"
                                                    sx={{ minWidth: { xs: 'auto', sm: 200 } }}
                                                >
                                                    {processingPanel === panel._name ? (
                                                        <CircularProgress size={20} />
                                                    ) : (
                                                        this.getText('createScript')
                                                    )}
                                                </Button>
                                            </Box>
                                        </Box>

                                        {/* Action Buttons */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                onClick={() => this.handleOpenTasmotaConsole(panel)}
                                                disabled={!panel._ip || !this.state.alive}
                                                size="small"
                                            >
                                                {this.getText('openTasmotaConsole')}
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid2>
                        );
                    })}
                </Grid2>

                {/* Confirmation Dialog */}
                {confirmDialog && (
                    <Dialog
                        open={confirmDialog.open}
                        onClose={() => this.closeConfirmDialog()}
                    >
                        <DialogTitle>{confirmDialog.title}</DialogTitle>
                        <DialogContent>
                            <DialogContentText sx={{ whiteSpace: 'pre-line' }}>{confirmDialog.text}</DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => this.closeConfirmDialog()}>{this.getText('Cancel1')}</Button>
                            <Button
                                onClick={() => {
                                    if (confirmDialog.onConfirm) {
                                        confirmDialog.onConfirm();
                                    }
                                }}
                                variant="contained"
                                color="primary"
                            >
                                {this.getText('Updating')}
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}
            </Box>
        );
    }
}
export default MaintainPanel;
