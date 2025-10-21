import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { SelectID } from '@iobroker/adapter-react-v5';

interface EntitySelectorProps {
    label: string;
    value: string | undefined;
    onChange: (value: string) => void;
    socket: any;
    theme: any;
    themeType: string;
    dialogName: string;
    filterFunc?: (obj: ioBroker.Object) => boolean;
}

interface EntitySelectorState {
    showSelectDialog: boolean;
}

/**
 * EntitySelector - Reusable component for entity/state selection
 * Combines a TextField for manual input with a SelectID button dialog
 */
export class EntitySelector extends React.Component<EntitySelectorProps, EntitySelectorState> {
    constructor(props: EntitySelectorProps) {
        super(props);
        this.state = {
            showSelectDialog: false,
        };
    }

    render(): React.ReactNode {
        const { label, value, onChange, socket, theme, themeType, dialogName, filterFunc } = this.props;
        const { showSelectDialog } = this.state;

        return (
            <Box sx={{ mb: 1 }}>
                <Typography
                    variant="body2"
                    sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}
                >
                    {label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                        fullWidth
                        variant="standard"
                        value={value || ''}
                        onChange={e => onChange(e.target.value)}
                    />
                    <Button
                        variant="outlined"
                        onClick={() => this.setState({ showSelectDialog: true })}
                        sx={{ minWidth: 48 }}
                    >
                        ...
                    </Button>

                    {showSelectDialog && (
                        <SelectID
                            socket={socket}
                            selected={value || ''}
                            onOk={(selectedId: string | string[] | undefined) => {
                                const id = Array.isArray(selectedId) ? selectedId[0] : selectedId;
                                onChange(id || '');
                                this.setState({ showSelectDialog: false });
                            }}
                            onClose={() => this.setState({ showSelectDialog: false })}
                            filterFunc={
                                filterFunc ||
                                ((obj: ioBroker.Object): boolean => {
                                    return !!(obj?.type === 'state');
                                })
                            }
                            dialogName={dialogName}
                            theme={theme}
                            themeType={themeType}
                        />
                    )}
                </Box>
            </Box>
        );
    }
}
