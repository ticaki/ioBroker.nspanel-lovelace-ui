import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from '@mui/material';
import { I18n } from '@iobroker/adapter-react-v5';
import type { ChannelMinMaxConfig } from '../../../src/lib/types/adminShareConfig';

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
    valIcon_min: number;
    /** Maximalwert */
    valIcon_max: number;
    /** Optionaler bester Wert */
    valIcon_best?: number;
}

/**
 * Dialog zum Konfigurieren von Min/Max-Einstellungen für PageItems
 */
class ChannelMinMaxDialog extends React.Component<ChannelMinMaxDialogProps, ChannelMinMaxDialogState> {
    constructor(props: ChannelMinMaxDialogProps) {
        super(props);
        this.state = {
            open: false,
            valIcon_min: 0,
            valIcon_max: 100,
            valIcon_best: undefined,
        };
    }

    private handleSave = (): void => {
        const { valIcon_min, valIcon_max, valIcon_best } = this.state;
        this.props.onSave?.({
            valIcon_min,
            valIcon_max,
            valIcon_best,
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
            valIcon_min: config?.valIcon_min ?? 0,
            valIcon_max: config?.valIcon_max ?? 100,
            valIcon_best: config?.valIcon_best,
        });
    }

    render(): React.JSX.Element {
        const { open, valIcon_min, valIcon_max, valIcon_best } = this.state;

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
                                value={valIcon_min}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    this.setState({ valIcon_min: Number(e.target.value) })
                                }
                                fullWidth
                            />
                            <TextField
                                variant="standard"
                                type="number"
                                label={I18n.t('channelConfigColor_valIconMax')}
                                value={valIcon_max}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    this.setState({ valIcon_max: Number(e.target.value) })
                                }
                                fullWidth
                            />
                            <TextField
                                variant="standard"
                                type="number"
                                label={I18n.t('channelConfigColor_valIconBest')}
                                value={valIcon_best}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    this.setState({ valIcon_best: Number(e.target.value) })
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
