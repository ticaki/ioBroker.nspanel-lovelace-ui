import React from 'react';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import {
    Box,
    Button,
    Typography,
    TextField,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import { green, grey, orange, red, blue, yellow } from '@mui/material/colors';
import { type IobTheme, type ThemeName, type ThemeType } from '@iobroker/adapter-react-v5';

interface MaintainPanelInfo {
    _Headline: string;
    _name: string;
    _ip: string;
    _online: 'yes' | 'no';
    _flashing: boolean;
    _topic: string;
    _id: string;
    _tftVersion: string;
    _tasmotaVersion: string;
    _ScriptVersion: string;
    _nsPanelModel: string;
    _check?: boolean;
    _check_tasmota?: boolean;
    _check_tft?: boolean;
    _check_script?: boolean;
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
    private instance = this.props.oContext.instance ?? '0';
    private adapterName = this.props.oContext.adapterName;

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
        const aliveStateId = `system.adapter.${this.adapterName}.${this.instance}.alive`;
        this.props.oContext.socket.unsubscribeState(aliveStateId, this.onAliveChanged);
        // Unsubscribe from panel online state changes
        for (const panel of this.props.data.panels) {
            this.props.oContext.socket.unsubscribeState(
                `${this.adapterName}.${this.instance}.panels.${panel.id}.info.isOnline`,
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
        const aliveStateId = `system.adapter.${this.adapterName}.${this.instance}.alive`;

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
                    `${this.adapterName}.${this.instance}.panels.${panel.id}.info.isOnline`,
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
                `${this.adapterName}.${this.instance}`,
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
                this.onPanelOnlineChanged('', null); // Trigger immediate refresh to update online status
                const result = await this.props.oContext.socket.sendTo(
                    `${this.adapterName}.${this.instance}`,
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
                    this.onPanelOnlineChanged('', null);
                    const result = await this.props.oContext.socket.sendTo(
                        `${this.adapterName}.${this.instance}`,
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
                `${this.adapterName}.${this.instance}`,
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
                `${this.adapterName}.${this.instance}`,
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
        const data = this.props.data;
        const hasValidIp = panel._ip && /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(panel._ip);
        const hasValidTopic = panel._topic && /^[a-zA-Z][\w/]+$/.test(panel._topic);
        const hasValidData = data.mqttPort && data.mqttUsername && data.mqttPassword;
        const hasValidServer = data.mqttServer
            ? data.internalServerIp &&
              /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(data.internalServerIp) &&
              data.internalServerIp !== '127.0.0.1'
            : data.mqttIp;

        return !!(
            hasValidIp &&
            hasValidTopic &&
            hasValidData &&
            hasValidServer &&
            panel._online !== 'no' &&
            !panel._flashing
        );
    }

    private getPanelCardStyle(panel: MaintainPanelInfo): {
        backgroundColor: string;
        borderColor: string;
        buttonTasmotaColor: string;
        buttonTftColor: string;
        buttonScriptColor: string;
    } {
        // Use state.themeName which is updated via interval
        console.log(`[Maintain] themeType: ${this.props.themeType}, themeName: ${this.props.themeName}`);
        const isDark = this.props.themeName === 'dark';

        if (!this.state.alive) {
            return {
                backgroundColor: isDark ? grey[800] : grey[300],
                borderColor: isDark ? grey[700] : grey[400],
                buttonTasmotaColor: 'primary',
                buttonTftColor: 'primary',
                buttonScriptColor: 'primary',
            };
        }
        if (panel._flashing) {
            return {
                backgroundColor: isDark ? yellow[900] : yellow[100],
                borderColor: isDark ? yellow[700] : yellow[400],
                buttonTasmotaColor: 'primary',
                buttonTftColor: 'primary',
                buttonScriptColor: 'primary',
            };
        }
        if (panel._online === 'no') {
            return {
                backgroundColor: isDark ? red[900] : red[100],
                borderColor: red[700],
                buttonTasmotaColor: 'primary',
                buttonTftColor: 'primary',
                buttonScriptColor: 'primary',
            };
        }
        if (panel._check) {
            return {
                backgroundColor: isDark ? orange[900] : orange[100],
                borderColor: orange[700],
                buttonTasmotaColor: panel._check_tasmota ? blue[600] : blue[200],
                buttonTftColor: panel._check_tft ? blue[600] : blue[200],
                buttonScriptColor: panel._check_script ? blue[600] : blue[200],
            };
        }
        return {
            backgroundColor: isDark ? green[900] : green[100],
            borderColor: green[700],
            buttonTasmotaColor: 'primary',
            buttonTftColor: 'primary',
            buttonScriptColor: 'primary',
        };
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        // Expert Mode from props (provided by json-config system)
        //const isExpertMode = this.props.expertMode ?? false;

        const { panels, error, processingPanel } = this.state;
        const confirmDialog = this.confirmDialog;

        return (
            <Box sx={{ p: 2 }}>
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

                {/* Panels as Boxes */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {panels.map((panel, index) => {
                        const cardStyle = this.getPanelCardStyle(panel);
                        return (
                            <Box
                                key={panel._id || index}
                                sx={{
                                    width: 'fit-content',
                                    maxWidth: '100%',
                                    minWidth: 320,
                                    border: 3,
                                    borderColor: cardStyle.borderColor,
                                    backgroundColor: cardStyle.backgroundColor,
                                    opacity: !this.state.alive ? 0.6 : 1,
                                    p: 2,
                                    borderRadius: 1,
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: panel._check ? 'bold' : 'normal',
                                        mb: 2,
                                    }}
                                >
                                    {panel._Headline}
                                </Typography>

                                {/* Version Info with Flexbox */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {/* Tasmota */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            label={this.getText('vTasmota')}
                                            value={panel._tasmotaVersion}
                                            slotProps={{ input: { readOnly: true } }}
                                            size="small"
                                            sx={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300 }}
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
                                            sx={{
                                                flex: '0 0 auto',
                                                minWidth: 200,
                                                ...(cardStyle.buttonTasmotaColor !== 'primary' && {
                                                    backgroundColor: cardStyle.buttonTasmotaColor,
                                                    '&:hover': {
                                                        backgroundColor: cardStyle.buttonTasmotaColor,
                                                        filter: 'brightness(0.9)',
                                                    },
                                                }),
                                            }}
                                        >
                                            {processingPanel === panel._name ? (
                                                <CircularProgress size={20} />
                                            ) : (
                                                this.getText('tasmotaUpdate')
                                            )}
                                        </Button>
                                    </Box>

                                    {/* TFT */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            label={this.getText('vTFT')}
                                            value={panel._tftVersion}
                                            slotProps={{ input: { readOnly: true } }}
                                            size="small"
                                            sx={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300 }}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={() => this.handleTftInstall(panel)}
                                            disabled={
                                                panel._online === 'no' ||
                                                panel._flashing ||
                                                !panel._ip ||
                                                processingPanel === panel._name ||
                                                !this.state.alive
                                            }
                                            size="small"
                                            sx={{
                                                flex: '0 0 auto',
                                                minWidth: 200,
                                                ...(cardStyle.buttonTftColor !== 'primary' && {
                                                    backgroundColor: cardStyle.buttonTftColor,
                                                    '&:hover': {
                                                        backgroundColor: cardStyle.buttonTftColor,
                                                        filter: 'brightness(0.9)',
                                                    },
                                                }),
                                            }}
                                        >
                                            {processingPanel === panel._name ? (
                                                <CircularProgress size={20} />
                                            ) : (
                                                this.getText('tftInstallSendToMQTT')
                                            )}
                                        </Button>
                                    </Box>

                                    {/* Script */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            label={this.getText('vScript')}
                                            value={panel._ScriptVersion}
                                            slotProps={{ input: { readOnly: true } }}
                                            size="small"
                                            sx={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300 }}
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
                                            sx={{
                                                flex: '0 0 auto',
                                                minWidth: 200,
                                                ...(cardStyle.buttonScriptColor !== 'primary' && {
                                                    backgroundColor: cardStyle.buttonScriptColor,
                                                    '&:hover': {
                                                        backgroundColor: cardStyle.buttonScriptColor,
                                                        filter: 'brightness(0.9)',
                                                    },
                                                }),
                                            }}
                                        >
                                            {processingPanel === panel._name ? (
                                                <CircularProgress size={20} />
                                            ) : (
                                                this.getText('createScript')
                                            )}
                                        </Button>
                                    </Box>

                                    {/* Console Button */}
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => this.handleOpenTasmotaConsole(panel)}
                                        disabled={!panel._ip || !this.state.alive}
                                        size="small"
                                        sx={{ mt: 1 }}
                                    >
                                        {this.getText('openTasmotaConsole')}
                                    </Button>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

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
