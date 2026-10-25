import React from 'react';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import {
    Alert,
    Box,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';

/** One registered key as the adapter reports it (`webFidoList`) */
interface FidoKeySummary {
    id: string;
    name: string;
    createdAt: number;
    lastUsedAt?: number;
    transports?: string[];
}

interface FidoListResult {
    credentials: FidoKeySummary[];
    /** FIDO2 is active in the running instance (HTTPS + enabled) */
    active: boolean;
    configured: boolean;
    secure: boolean;
}

interface WebFidoKeysState extends ConfigGenericState {
    keys: FidoKeySummary[];
    loading: boolean;
    error: string;
    active: boolean | undefined;
}

function isKeySummary(value: unknown): value is FidoKeySummary {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const v: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    return typeof v.id === 'string' && typeof v.name === 'string' && typeof v.createdAt === 'number';
}

function parseListResult(value: unknown): FidoListResult | undefined {
    if (typeof value !== 'object' || value === null || !('credentials' in value)) {
        return undefined;
    }
    const v: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    if (!Array.isArray(v.credentials)) {
        return undefined;
    }
    return {
        credentials: v.credentials.filter(isKeySummary),
        active: v.active === true,
        configured: v.configured === true,
        secure: v.secure === true,
    };
}

/**
 * List of the FIDO2 security keys registered for the web panels, with delete buttons.
 * The keys are registered on the web panel page `/auth/fido/register`; this component only
 * shows and removes them via `sendTo` (`webFidoList`, `webFidoDelete`).
 */
class WebFidoKeys extends ConfigGeneric<ConfigGenericProps, WebFidoKeysState> {
    private readonly instance = this.props.oContext.instance ?? '0';
    private readonly adapterName = this.props.oContext.adapterName;
    private mounted = false;

    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
            keys: [],
            loading: false,
            error: '',
            active: undefined,
        };
    }

    async componentDidMount(): Promise<void> {
        void super.componentDidMount();
        this.mounted = true;
        await this.load();
    }

    componentWillUnmount(): void {
        this.mounted = false;
        super.componentWillUnmount();
    }

    private async load(): Promise<void> {
        this.setState({ loading: true, error: '' });
        try {
            const result: unknown = await this.props.oContext.socket.sendTo(
                `${this.adapterName}.${this.instance}`,
                'webFidoList',
                {},
            );
            const parsed = parseListResult(result);
            if (!this.mounted) {
                return;
            }
            if (!parsed) {
                this.setState({ loading: false, error: this.getText('webFidoLoadError'), keys: [], active: undefined });
                return;
            }
            this.setState({ loading: false, keys: parsed.credentials, active: parsed.active });
        } catch {
            if (this.mounted) {
                this.setState({ loading: false, error: this.getText('webFidoLoadError'), active: undefined });
            }
        }
    }

    private async remove(key: FidoKeySummary): Promise<void> {
        if (!window.confirm(`${this.getText('webFidoDeleteConfirm')} "${key.name}"`)) {
            return;
        }
        this.setState({ loading: true, error: '' });
        try {
            const result: unknown = await this.props.oContext.socket.sendTo(
                `${this.adapterName}.${this.instance}`,
                'webFidoDelete',
                { id: key.id },
            );
            if (!this.mounted) {
                return;
            }
            const parsed = parseListResult(result);
            if (parsed) {
                this.setState({ loading: false, keys: parsed.credentials });
            } else {
                this.setState({ loading: false, error: this.getText('webFidoLoadError') });
            }
        } catch {
            if (this.mounted) {
                this.setState({ loading: false, error: this.getText('webFidoLoadError') });
            }
        }
    }

    private formatTime(value: number | undefined): string {
        if (!value) {
            return this.getText('webFidoNever');
        }
        try {
            return new Date(value).toLocaleString();
        } catch {
            return String(value);
        }
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const { keys, loading, error, active } = this.state;
        return (
            <Box sx={{ mt: 1, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{ flexGrow: 1 }}
                    >
                        {this.getText('webFidoKeys')}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        disabled={loading}
                        onClick={(): void => {
                            void this.load();
                        }}
                    >
                        {this.getText('webFidoRefresh')}
                    </Button>
                </Box>
                {error ? (
                    <Alert
                        severity="warning"
                        sx={{ mb: 1 }}
                    >
                        {error}
                    </Alert>
                ) : null}
                {active === false ? (
                    <Alert
                        severity="info"
                        sx={{ mb: 1 }}
                    >
                        {this.getText('webFidoInactive')}
                    </Alert>
                ) : null}
                {keys.length === 0 ? (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {this.getText('webFidoNoKeys')}
                    </Typography>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{this.getText('webFidoKeyName')}</TableCell>
                                <TableCell>{this.getText('webFidoCreated')}</TableCell>
                                <TableCell>{this.getText('webFidoLastUsed')}</TableCell>
                                <TableCell align="right" />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {keys.map(key => (
                                <TableRow key={key.id}>
                                    <TableCell>
                                        {key.name}
                                        {key.transports && key.transports.length > 0 ? (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ ml: 1 }}
                                            >
                                                {key.transports.join(', ')}
                                            </Typography>
                                        ) : null}
                                    </TableCell>
                                    <TableCell>{this.formatTime(key.createdAt)}</TableCell>
                                    <TableCell>{this.formatTime(key.lastUsedAt)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            disabled={loading}
                                            title={this.getText('webFidoDelete')}
                                            onClick={(): void => {
                                                void this.remove(key);
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Box>
        );
    }
}

export default WebFidoKeys;
