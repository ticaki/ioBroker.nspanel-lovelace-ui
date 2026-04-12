import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from '@mui/material';
import { I18n } from '@iobroker/adapter-react-v5';

export interface ChannelMinMaxConfig {
    valIconMin?: number;
    valIconMax?: number;
}

export interface ChannelMinMaxDialogProps {
    socket: any;
    adapterName?: string;
    instance?: number;
    onSave?: (config: ChannelMinMaxConfig) => void;
    /** Aktuelle Channel-Rolle, bestimmt die Default-Farben */
    channelRole: string | null;
}

interface ChannelMinMaxDialogState {
    open: boolean;
    /** Minimalwert */
    valIconMin: number | undefined;
    /** Maximalwert */
    valIconMax: number | undefined;
}

/**
 * Dialog zum Konfigurieren von Min/Max-Einstellungen für PageItems
 */
class ChannelMinMaxDialog extends React.Component<ChannelMinMaxDialogProps, ChannelMinMaxDialogState> {
    constructor(props: ChannelMinMaxDialogProps) {
        super(props);
        this.state = {
            open: false,
            valIconMin: undefined,
            valIconMax: undefined,
        };
    }

    private handleSave = (): void => {
        const { valIconMin, valIconMax } = this.state;
        this.props.onSave?.({
            valIconMin,
            valIconMax,
        });
        this.setState({ open: false });
    };

    private handleCancel = (): void => {
        this.setState({ open: false });
    };

    /**
     * Opens the dialog and pre-fills all fields from an existing config.
     *
     * @param config  Optional existing configuration to restore
     */
    public openWith(config?: Partial<ChannelMinMaxConfig>): void {
        this.setState({
            open: true,
            valIconMin: config?.valIconMin,
            valIconMax: config?.valIconMax,
        });
    }

    render(): React.JSX.Element {
        const { open, valIconMin, valIconMax } = this.state;

        return (
            <Dialog
                open={open}
                onClose={(event, reason) => {
                    // Dialog darf nur über Button geschlossen werden
                    if (reason === 'backdropClick') {
                        return;
                    }
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{I18n.t('channelConfigMinMax_title')}</DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            mt: 2,
                            p: 2,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', mb: 1 }}
                        >
                            {I18n.t('channelConfigMinMax_description')}
                        </Typography>

                        {/* Min/Max Felder */}
                        {/* valIcon_min und valIcon_max */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                variant="standard"
                                type="number"
                                label={I18n.t('channelConfigColor_valIconMin')}
                                value={valIconMin}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    this.setState({ valIconMin: Number(e.target.value) })
                                }
                                fullWidth
                            />
                            <TextField
                                variant="standard"
                                type="number"
                                label={I18n.t('channelConfigColor_valIconMax')}
                                value={valIconMax}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    this.setState({ valIconMax: Number(e.target.value) })
                                }
                                fullWidth
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleCancel}>{I18n.t('channelConfigMinMax_cancel')}</Button>
                    <Button
                        onClick={this.handleSave}
                        variant="contained"
                        color="primary"
                    >
                        {I18n.t('channelConfigMinMax_apply')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default ChannelMinMaxDialog;
