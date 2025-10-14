import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import { JsonConfigComponent } from '@iobroker/json-config';
import { I18n, type ThemeName, type ThemeType, type IobTheme } from '@iobroker/adapter-react-v5';
import type { ConfigItemPanel, ConfigItemObjectId } from '@iobroker/json-config';

type ObjectIdSelectorPopupProps = {
    open: boolean;
    onClose: () => void;
    onSelect?: (objectId: string) => void;
    socket: any;
    themeName: ThemeName;
    themeType: ThemeType;
    theme: IobTheme;
    adapterName?: string;
    instance?: number;
    /** Optional: filter configuration for the objectId selector */
    objectIdConfig?: Partial<Omit<ConfigItemObjectId, 'type' | 'label'>>;
};

interface ObjectIdSelectorPopupState {
    selectedObjectId: string;
    data: Record<string, any>;
}

/**
 * FileSelectorPopup - Popup with JsonConfigComponent for ObjectID selection
 * Uses the built-in objectId selector from @iobroker/json-config
 */
class ObjectIdSelectorPopup extends React.Component<ObjectIdSelectorPopupProps, ObjectIdSelectorPopupState> {
    private schema: ConfigItemPanel;

    constructor(props: ObjectIdSelectorPopupProps) {
        super(props);
        this.state = {
            selectedObjectId: '',
            data: {
                testObjectId: '',
            },
        };

        // Schema definition for JsonConfigComponent with objectId selector
        // Merge user-provided objectIdConfig with defaults
        const objectIdItem: ConfigItemObjectId = {
            type: 'objectId',
            label: 'Select an object',
            sm: 12,
            md: 12,
            lg: 12,
            ...this.props.objectIdConfig,
        };

        this.schema = {
            type: 'panel',
            label: 'Object Selector Test',
            items: {
                testObjectId: objectIdItem,
            },
        };
    }

    private handleClose = (): void => {
        if (this.props.onClose) {
            this.props.onClose();
        }
    };

    private handleSelect = (): void => {
        if (this.props.onSelect && this.state.data.testObjectId) {
            this.props.onSelect(this.state.data.testObjectId);
        }
        this.handleClose();
    };

    private handleChange = (data: Record<string, any>): void => {
        this.setState({ data });
    };

    render(): React.JSX.Element {
        const { open, socket, themeName, themeType, theme, adapterName, instance } = this.props;

        return (
            <Dialog
                open={open}
                onClose={this.handleClose}
                maxWidth="md"
                fullWidth
                aria-labelledby="object-selector-dialog-title"
            >
                <DialogTitle id="object-selector-dialog-title">{I18n.t('Object Selector Test')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 2 }}>
                        {/* JsonConfigComponent renders the objectId selector */}
                        <JsonConfigComponent
                            socket={socket}
                            themeName={themeName}
                            themeType={themeType}
                            theme={theme}
                            adapterName={adapterName || 'nspanel-lovelace-ui'}
                            instance={instance || 0}
                            schema={this.schema}
                            data={this.state.data}
                            onChange={this.handleChange}
                            isFloatComma={false}
                            dateFormat="DD.MM.YYYY"
                            onError={() => {}}
                        />
                        <Box sx={{ mt: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                            {I18n.t('Selected object')}: {this.state.data.testObjectId || <em>—</em>}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={this.handleClose}
                        color="secondary"
                    >
                        {I18n.t('Cancel')}
                    </Button>
                    <Button
                        onClick={this.handleSelect}
                        color="primary"
                        variant="contained"
                        disabled={!this.state.data.testObjectId}
                    >
                        {I18n.t('Select')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default ObjectIdSelectorPopup;
