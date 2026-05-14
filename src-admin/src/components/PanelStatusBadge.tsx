import React from 'react';
import { Chip, Tooltip, CircularProgress } from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';
import {
    panelStatusStates,
    panelStatusColors,
    panelStatusTranslationKeys,
    type PanelStatus,
} from '../../../src/lib/types/adminShareConfig';
import { I18n } from '@iobroker/adapter-react-v5';

export interface PanelStatusBadgeProps {
    panelId: string;
    oContext: any;
    adapterName?: string;
    size?: 'small' | 'medium';
    showLabel?: boolean;
    showIcon?: boolean;
    disableTooltip?: boolean;
    alive?: boolean;
}

interface PanelStatusBadgeState {
    status: PanelStatus | null;
    loading: boolean;
    activated: boolean | null;
}

export class PanelStatusBadge extends React.Component<PanelStatusBadgeProps, PanelStatusBadgeState> {
    private oContext = this.props.oContext;
    private instance = this.oContext.instance ?? '0';
    private adapter = this.props.adapterName || this.oContext.adapterName || 'nspanel-lovelace-ui';

    constructor(props: PanelStatusBadgeProps) {
        super(props);
        this.state = {
            status: null,
            loading: true,
            activated: null,
        };
    }

    async componentDidMount(): Promise<void> {
        await this.subscribeToStatus();
        await this.subscribeToActivated();
    }

    async componentDidUpdate(prevProps: PanelStatusBadgeProps): Promise<void> {
        if (prevProps.panelId !== this.props.panelId) {
            await this.unsubscribeFromStatus(prevProps.panelId);
            await this.unsubscribeFromActivated(prevProps.panelId);
            await this.subscribeToStatus();
            await this.subscribeToActivated();
        }
    }

    componentWillUnmount(): void {
        void this.unsubscribeFromStatus(this.props.panelId);
        void this.unsubscribeFromActivated(this.props.panelId);
    }

    private getStatusStateId(): string {
        return `${this.adapter}.${this.instance}.panels.${this.props.panelId}.status`;
    }

    private getActivatedStateId(panelId: string): string {
        return `${this.adapter}.${this.instance}.panels.${panelId}.cmd.activated`;
    }

    private async subscribeToActivated(): Promise<void> {
        const activatedStateId = this.getActivatedStateId(this.props.panelId);

        try {
            const state = await this.oContext.socket.getState(activatedStateId);
            this.onActivatedChanged(activatedStateId, state);
            await this.oContext.socket.subscribeState(activatedStateId, this.onActivatedChanged);
        } catch (error) {
            console.error('[PanelStatusBadge] Failed to subscribe to activated state:', error);
        }
    }

    private async unsubscribeFromActivated(panelId: string): Promise<void> {
        const activatedStateId = this.getActivatedStateId(panelId);

        try {
            await this.oContext.socket.unsubscribeState(activatedStateId, this.onActivatedChanged);
        } catch (error) {
            console.error('[PanelStatusBadge] Failed to unsubscribe from activated state:', error);
        }
    }

    private onActivatedChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        // null/undefined means state does not exist → treat as activated (true)
        const activated = state?.val !== undefined && state.val !== null ? !!state.val : true;
        if (activated !== this.state.activated) {
            this.setState({ activated });
        }
    };

    private async subscribeToStatus(): Promise<void> {
        const statusStateId = this.getStatusStateId();

        try {
            const state = await this.oContext.socket.getState(statusStateId);
            this.onStatusChanged(statusStateId, state);

            await this.oContext.socket.subscribeState(statusStateId, this.onStatusChanged);
            console.log(`[PanelStatusBadge] Subscribed to status state: ${statusStateId}`);
        } catch (error) {
            console.error('[PanelStatusBadge] Failed to subscribe to status:', error);
            this.setState({ status: 'offline', loading: false });
        }
    }

    private async unsubscribeFromStatus(panelId: string): Promise<void> {
        const statusStateId = `${this.adapter}.${this.instance}.panels.${panelId}.status`;

        try {
            await this.oContext.socket.unsubscribeState(statusStateId, this.onStatusChanged);
            console.log(`[PanelStatusBadge] Unsubscribed from status state: ${statusStateId}`);
        } catch (error) {
            console.error('[PanelStatusBadge] Failed to unsubscribe from status:', error);
        }
    }

    private onStatusChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const statusValue = state?.val;
        const status = this.getStatusFromValue(statusValue);
        if (status !== this.state.status) {
            this.setState({ status, loading: false });
            console.log(`[PanelStatusBadge] Status changed: ${statusValue} (${status})`);
        } else {
            console.log(
                `[PanelStatusBadge] Status change received but status is the same: ${statusValue} (${status}) this.state.status: ${this.state.status}`,
            ); // Debug log to check if status is actually changing
        }
    };

    private getStatusFromValue(value: any): PanelStatus {
        if (typeof value === 'number' && value in panelStatusStates) {
            return panelStatusStates[value];
        }
        return 'offline';
    }

    private getStatusLabel(status: PanelStatus): string {
        // Translate status to user-friendly text
        return I18n.t(panelStatusTranslationKeys[status]) || status;
    }

    render(): React.JSX.Element {
        const { status, loading, activated } = this.state;
        const { size = 'small', showLabel = true, showIcon = true, disableTooltip = false, alive = true } = this.props;
        const maxWidth = showLabel ? 150 : 24;

        // Panel is deactivated → always show deactivated badge
        const effectiveStatus: PanelStatus | null = activated === false ? 'deactivated' : status;

        if (loading) {
            return (
                <Chip
                    size={size}
                    icon={<CircularProgress size={16} />}
                    label={showLabel ? 'Loading...' : undefined}
                    variant="outlined"
                    disabled={!alive}
                    sx={{ maxWidth: maxWidth }}
                />
            );
        }

        if (!effectiveStatus || !alive) {
            return (
                <Chip
                    size={size}
                    icon={showIcon ? <CircleIcon sx={{ fontSize: 12, color: panelStatusColors.offline }} /> : undefined}
                    label={showLabel ? this.getStatusLabel('offline') : undefined}
                    variant="outlined"
                    sx={{ borderColor: panelStatusColors.offline, maxWidth: maxWidth }}
                    disabled={!alive}
                />
            );
        }

        const color = panelStatusColors[effectiveStatus];
        const label = this.getStatusLabel(effectiveStatus);
        console.log(`[PanelStatusBadge] Rendering status: ${effectiveStatus} with color ${color}`);

        const chipelement = (
            <Chip
                size={size}
                icon={showIcon ? <CircleIcon sx={{ fontSize: 12, color: color }} /> : undefined}
                label={showLabel ? label : undefined}
                variant="outlined"
                disabled={!alive}
                sx={{
                    maxWidth: maxWidth,
                    borderColor: color,
                    '& .MuiChip-label': {
                        color: color,
                    },
                    '& .MuiChip-icon': {
                        color: `${color} !important`,
                    },
                }}
            />
        );
        return disableTooltip ? (
            chipelement
        ) : (
            <Tooltip
                title={label}
                arrow
            >
                {chipelement}
            </Tooltip>
        );
    }
}
