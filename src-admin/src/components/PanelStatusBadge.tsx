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
}

export class PanelStatusBadge extends React.Component<PanelStatusBadgeProps, PanelStatusBadgeState> {
    constructor(props: PanelStatusBadgeProps) {
        super(props);
        this.state = {
            status: null,
            loading: true,
        };
    }

    async componentDidMount(): Promise<void> {
        await this.subscribeToStatus();
    }

    async componentDidUpdate(prevProps: PanelStatusBadgeProps): Promise<void> {
        if (prevProps.panelId !== this.props.panelId) {
            await this.unsubscribeFromStatus(prevProps.panelId);
            await this.subscribeToStatus();
        }
    }

    componentWillUnmount(): void {
        void this.unsubscribeFromStatus(this.props.panelId);
    }

    private getStatusStateId(): string {
        const { panelId, oContext, adapterName } = this.props;
        const adapter = adapterName || oContext.adapterName || 'nspanel-lovelace-ui';
        const instance = oContext.instance ?? '0';
        return `${adapter}.${instance}.panels.${panelId}.status`;
    }

    private async subscribeToStatus(): Promise<void> {
        const { oContext } = this.props;
        const statusStateId = this.getStatusStateId();

        try {
            const state = await oContext.socket.getState(statusStateId);
            this.onStatusChanged(statusStateId, state);

            await oContext.socket.subscribeState(statusStateId, this.onStatusChanged);
            console.log(`[PanelStatusBadge] Subscribed to status state: ${statusStateId}`);
        } catch (error) {
            console.error('[PanelStatusBadge] Failed to subscribe to status:', error);
            this.setState({ status: 'offline', loading: false });
        }
    }

    private async unsubscribeFromStatus(panelId: string): Promise<void> {
        const { oContext, adapterName } = this.props;
        const adapter = adapterName || oContext.adapterName || 'nspanel-lovelace-ui';
        const instance = oContext.instance ?? '0';
        const statusStateId = `${adapter}.${instance}.panels.${panelId}.status`;

        try {
            await oContext.socket.unsubscribeState(statusStateId, this.onStatusChanged);
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
        const { status, loading } = this.state;
        const { size = 'small', showLabel = true, showIcon = true, disableTooltip = false, alive = true } = this.props;
        const maxWidth = showLabel ? 150 : 24;

        if (loading) {
            return (
                <Chip
                    size={size}
                    icon={<CircularProgress size={16} />}
                    label={showLabel ? I18n.t('Loading...') : undefined}
                    variant="outlined"
                    disabled={!alive}
                    sx={{ maxWidth: maxWidth }}
                />
            );
        }

        if (!status || !alive) {
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

        const color = panelStatusColors[status];
        const label = this.getStatusLabel(status);
        console.log(`[PanelStatusBadge] Rendering status: ${status} with color ${color}`);

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
