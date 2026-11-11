import React from 'react';
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import { I18n } from '@iobroker/gui-components';
import type { PageSecretField } from '../../../src/lib/types/panelConfigExport';

export interface PanelExportSecretsDialogProps {
    open: boolean;
    /** name of the exported panel */
    panelName: string;
    /** pages of the panel holding a PIN or password */
    pages: { uniqueName: string; fields: PageSecretField[] }[];
    /** closed without export */
    onCancel: () => void;
    /** export started; `includeSecrets` true only after the explicit choice */
    onExport: (includeSecrets: boolean) => void;
}

/**
 * Asked before a panel export whose pages hold PINs or passwords: export without them (default) or - explicitly -
 * with them in plain text.
 */
export default class PanelExportSecretsDialog extends React.Component<PanelExportSecretsDialogProps> {
    /**
     * @param field secret field of a page
     * @returns label of the field
     */
    private static fieldLabel(field: PageSecretField): string {
        return I18n.t(field === 'pin' ? 'exportSecretsFieldPin' : 'exportSecretsFieldQrPass');
    }

    render(): React.JSX.Element {
        const { open, panelName, pages, onCancel, onExport } = this.props;
        return (
            <Dialog
                open={open}
                onClose={onCancel}
                maxWidth="sm"
                fullWidth
                aria-labelledby="panel-export-secrets-title"
            >
                <DialogTitle id="panel-export-secrets-title">
                    {I18n.t('exportSecretsTitle').replace('%s', panelName)}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>{I18n.t('exportSecretsText')}</DialogContentText>
                    <List dense>
                        {pages.map(page => (
                            <ListItem key={page.uniqueName}>
                                <ListItemText
                                    primary={page.uniqueName}
                                    secondary={page.fields.map(f => PanelExportSecretsDialog.fieldLabel(f)).join(', ')}
                                />
                            </ListItem>
                        ))}
                    </List>
                    <Alert severity="warning">{I18n.t('exportSecretsPlainText')}</Alert>
                </DialogContent>
                <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Button
                        variant="text"
                        onClick={onCancel}
                    >
                        {I18n.t('exportSecretsCancel')}
                    </Button>
                    <Button
                        variant="outlined"
                        color="warning"
                        onClick={(): void => onExport(true)}
                    >
                        {I18n.t('exportSecretsWith')}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        autoFocus
                        onClick={(): void => onExport(false)}
                    >
                        {I18n.t('exportSecretsWithout')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
