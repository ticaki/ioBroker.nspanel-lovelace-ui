import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { I18n } from '@iobroker/gui-components';

export interface NavigationScopeDialogProps {
    open: boolean;
    /** Name of the page whose link is about to change */
    pageName: string;
    /** Display name of the panel the change was made on */
    panelName: string;
    /** Write the change into the assignment that applies to all panels */
    onAll: () => void;
    /** Write the change into a panel-specific assignment that takes precedence */
    onPanel: () => void;
    onCancel: () => void;
}

/**
 * Asks where a navigation change of a page assigned to all panels should be written to.
 *
 * Such a page has no row of its own for the panel the flow shows, so the change can either apply
 * to every panel or create a panel-specific row that takes precedence from then on.
 */
export default class NavigationScopeDialog extends React.PureComponent<NavigationScopeDialogProps> {
    render(): React.ReactElement {
        const { open, pageName, panelName, onAll, onPanel, onCancel } = this.props;
        return (
            <Dialog
                open={open}
                onClose={onCancel}
                aria-labelledby="navigation-scope-dialog-title"
                aria-describedby="navigation-scope-dialog-description"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle id="navigation-scope-dialog-title">{I18n.t('nav_edit_scope_title')}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="navigation-scope-dialog-description">
                        {I18n.t('nav_edit_scope_text').replace('%s', pageName).replace('%p', panelName)}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={onAll}
                    >
                        {I18n.t('nav_edit_scope_all')}
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={onPanel}
                    >
                        {I18n.t('nav_edit_scope_panel').replace('%p', panelName)}
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={onCancel}
                    >
                        {I18n.t('nav_edit_scope_cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
