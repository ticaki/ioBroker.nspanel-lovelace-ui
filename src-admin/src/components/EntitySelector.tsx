import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { SelectID } from '@iobroker/adapter-react-v5';

interface EntitySelectorProps {
    label: string;
    value: string | undefined;
    onChange: (value: string) => void;
    /** Wird beim Verlassen des Textfelds (blur) und bei Enter ausgelöst – auch nach SelectID-Auswahl. */
    onCommit?: (value: string) => void;
    socket: any;
    theme: any;
    themeType: string;
    dialogName: string;
    filterFunc?: (obj: ioBroker.Object) => boolean;
    /**
     * Wird nach der Auswahl im SelectID-Dialog aufgerufen und erlaubt die
     * gewählte ID zu transformieren (z. B. auf den übergeordneten Channel kürzen).
     * Rückwärtskompatibel – ohne Prop wird die ID unverändert übernommen.
     */
    onTransformSelectedId?: (id: string) => string;
    disabled?: boolean;
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
        const {
            label,
            value,
            onChange,
            onCommit,
            socket,
            theme,
            themeType,
            dialogName,
            filterFunc,
            onTransformSelectedId,
            disabled,
        } = this.props;
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
                        onBlur={() => onCommit?.(value || '')}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                onCommit?.(value || '');
                            }
                        }}
                        disabled={disabled}
                    />
                    <Button
                        variant="outlined"
                        onClick={() => this.setState({ showSelectDialog: true })}
                        sx={{ minWidth: 48 }}
                        disabled={disabled}
                    >
                        ...
                    </Button>

                    {showSelectDialog && (
                        <SelectID
                            socket={socket}
                            selected={value || ''}
                            onOk={(selectedId: string | string[] | undefined) => {
                                const raw = Array.isArray(selectedId) ? selectedId[0] : selectedId;
                                const id = onTransformSelectedId ? onTransformSelectedId(raw || '') : raw || '';
                                onChange(id);
                                onCommit?.(id);
                                this.setState({ showSelectDialog: false });
                            }}
                            onClose={() => this.setState({ showSelectDialog: false })}
                            filterFunc={filterFunc ?? ((obj: ioBroker.Object): boolean => !!(obj?.type === 'state'))}
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
