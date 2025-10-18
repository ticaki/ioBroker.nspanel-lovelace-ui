import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Divider,
} from '@mui/material';
import { ArrowBack, Delete } from '@mui/icons-material';
import type { PageItemButtonEntry } from '../../../src/lib/types/adminShareConfig';
import ConfirmDialog from './ConfirmDialog';
import { SelectID } from '@iobroker/adapter-react-v5';

export interface PageItemEditorProps {
    item: PageItemButtonEntry | null; // null = create new
    onSave: (item: PageItemButtonEntry) => void;
    onDelete?: () => void;
    onBack: () => void;
    getText: (key: string) => string;
    socket: any;
    theme: any;
    themeName: any;
    themeType: any;
    instance: number;
}

interface PageItemEditorState {
    editedItem: PageItemButtonEntry;
    confirmDeleteOpen: boolean;
    showSelectDialogEntity1?: boolean;
    showSelectDialogEntity2?: boolean;
}

// Icon mapping for modeScr
const MODE_SCR_ICONS: Record<NonNullable<PageItemButtonEntry['modeScr']>, string> = {
    left: '◧', // Left edge
    bottom: '⬜', // Bottom edge
    indicator: '●', // Indicator
    favorit: '💎', // Favorite
    alternate: '⇄', // Alternate
};

export class PageItemEditor extends React.Component<PageItemEditorProps, PageItemEditorState> {
    constructor(props: PageItemEditorProps) {
        super(props);

        // Initialize with provided item or create empty one
        const defaultItem: PageItemButtonEntry = {
            type: 'button',
            headline: '',
            modeScr: 'left',
            data: {
                text: undefined,
                text1: undefined,
                icon: undefined,
                color: undefined,
                entity1: undefined,
                entity2: undefined,
                entity3: undefined,
                entity4: undefined,
                filter: undefined,
                setValue1: undefined,
                setValue2: undefined,
                setNavi: undefined,
                confirm: undefined,
                popup: undefined,
                enabled: undefined,
                additionalId: undefined,
                setTrue: false,
                setFalse: false,
            },
        };

        this.state = {
            editedItem: props.item ? { ...props.item } : defaultItem,
            confirmDeleteOpen: false,
        };
    }

    private handleFieldChange = (field: keyof PageItemButtonEntry, value: any): void => {
        this.setState(prevState => ({
            editedItem: {
                ...prevState.editedItem,
                [field]: value,
            },
        }));
    };

    private handleDataFieldChange = (field: keyof PageItemButtonEntry['data'], value: any): void => {
        this.setState(prevState => ({
            editedItem: {
                ...prevState.editedItem,
                data: {
                    ...prevState.editedItem.data,
                    [field]: value || undefined,
                },
            },
        }));
    };

    private handleSave = (): void => {
        this.props.onSave(this.state.editedItem);
    };

    private handleDeleteClick = (): void => {
        this.setState({ confirmDeleteOpen: true });
    };

    private handleDeleteConfirm = (): void => {
        this.setState({ confirmDeleteOpen: false });
        if (this.props.onDelete) {
            this.props.onDelete();
        }
    };

    private handleDeleteCancel = (): void => {
        this.setState({ confirmDeleteOpen: false });
    };

    render(): React.JSX.Element {
        const { item, onBack, onDelete, getText, socket, theme, themeType } = this.props;
        const { editedItem } = this.state;
        const isNew = !item;
        const isIndicator = editedItem.modeScr === 'indicator';

        return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header with back button and title */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 3,
                        gap: 2,
                    }}
                >
                    <IconButton
                        onClick={onBack}
                        sx={{
                            color: 'primary.main',
                        }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography
                        variant="h6"
                        sx={{ flex: 1 }}
                    >
                        {isNew ? getText('pageItem_new') : getText('pageItem_edit')}
                    </Typography>
                    {!isNew && onDelete && (
                        <IconButton
                            onClick={this.handleDeleteClick}
                            sx={{
                                color: 'error.main',
                            }}
                        >
                            <Delete />
                        </IconButton>
                    )}
                </Box>

                <Paper
                    sx={{
                        p: 3,
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                        {/* Type Selection - nur bei indicator */}
                        {isIndicator && (
                            <FormControl fullWidth>
                                <InputLabel>{getText('pageItem_type')}</InputLabel>
                                <Select
                                    value={editedItem.type}
                                    label={getText('pageItem_type')}
                                    onChange={e => this.handleFieldChange('type', e.target.value as 'text' | 'button')}
                                >
                                    <MenuItem value="button">{getText('pageItem_type_button')}</MenuItem>
                                    <MenuItem value="text">{getText('pageItem_type_text')}</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        {/* Headline (used as label below icon) */}
                        <TextField
                            fullWidth
                            label={getText('pageItem_headline')}
                            value={editedItem.headline || ''}
                            onChange={e => this.handleFieldChange('headline', e.target.value)}
                            helperText={getText('pageItem_headline_hint')}
                        />

                        {/* Mode Scr Selection with Icon Preview */}
                        <FormControl fullWidth>
                            <InputLabel>{getText('pageItem_modeScr')}</InputLabel>
                            <Select
                                value={editedItem.modeScr || 'left'}
                                label={getText('pageItem_modeScr')}
                                onChange={e => {
                                    const newMode = e.target.value as PageItemButtonEntry['modeScr'];
                                    this.handleFieldChange('modeScr', newMode);
                                    // Bei nicht-indicator immer type='text' setzen
                                    if (newMode !== 'indicator') {
                                        this.handleFieldChange('type', 'text');
                                    }
                                }}
                            >
                                <MenuItem value="left">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <span style={{ fontSize: '1.5rem' }}>{MODE_SCR_ICONS.left}</span>
                                        {getText('pageItem_modeScr_left')}
                                    </Box>
                                </MenuItem>
                                <MenuItem value="bottom">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <span style={{ fontSize: '1.5rem' }}>{MODE_SCR_ICONS.bottom}</span>
                                        {getText('pageItem_modeScr_bottom')}
                                    </Box>
                                </MenuItem>
                                <MenuItem value="indicator">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <span style={{ fontSize: '1.5rem' }}>{MODE_SCR_ICONS.indicator}</span>
                                        {getText('pageItem_modeScr_indicator')}
                                    </Box>
                                </MenuItem>
                                <MenuItem value="favorit">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <span style={{ fontSize: '1.5rem' }}>{MODE_SCR_ICONS.favorit}</span>
                                        {getText('pageItem_modeScr_favorit')}
                                    </Box>
                                </MenuItem>
                                <MenuItem value="alternate">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <span style={{ fontSize: '1.5rem' }}>{MODE_SCR_ICONS.alternate}</span>
                                        {getText('pageItem_modeScr_alternate')}
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <Divider />

                        {/* Data Section */}
                        <Typography
                            variant="h6"
                            sx={{ mt: 1 }}
                        >
                            {getText('pageItem_data')}
                        </Typography>

                        {/* Text - nur wenn nicht indicator */}
                        {!isIndicator && (
                            <TextField
                                fullWidth
                                label={getText('pageItem_data_text')}
                                value={editedItem.data.text || ''}
                                onChange={e => this.handleDataFieldChange('text', e.target.value)}
                                helperText={getText('pageItem_data_text_hint')}
                            />
                        )}

                        {/* Icon */}
                        <TextField
                            fullWidth
                            label={getText('pageItem_data_icon')}
                            value={editedItem.data.icon || ''}
                            onChange={e => this.handleDataFieldChange('icon', e.target.value)}
                            helperText={getText('pageItem_data_icon_hint')}
                        />

                        {/* Entity1 - inline TextField + SelectID */}
                        <Box sx={{ mb: 1 }}>
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}
                            >
                                {getText('pageItem_data_entity1')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    value={editedItem.data.entity1 || ''}
                                    onChange={e => this.handleDataFieldChange('entity1', e.target.value)}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={() =>
                                        this.setState({ showSelectDialogEntity1: true } as PageItemEditorState)
                                    }
                                    sx={{ minWidth: 48 }}
                                >
                                    ...
                                </Button>

                                {this.state.showSelectDialogEntity1 && (
                                    <SelectID
                                        socket={socket}
                                        selected={editedItem.data.entity1 || ''}
                                        onOk={(selectedId: string | string[] | undefined) => {
                                            const id = Array.isArray(selectedId) ? selectedId[0] : selectedId;
                                            this.handleDataFieldChange('entity1', id || '');
                                            this.setState({ showSelectDialogEntity1: false } as PageItemEditorState);
                                        }}
                                        onClose={() =>
                                            this.setState({ showSelectDialogEntity1: false } as PageItemEditorState)
                                        }
                                        filterFunc={(obj: ioBroker.Object): boolean => {
                                            return !!(obj?.type === 'state');
                                        }}
                                        dialogName="nspanel-pageitem-editor-entity1"
                                        theme={theme}
                                        themeType={themeType || 'light'}
                                    />
                                )}
                            </Box>
                        </Box>

                        {/* Entity2 - inline TextField + SelectID */}
                        <Box sx={{ mb: 1 }}>
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}
                            >
                                {getText('pageItem_data_entity2')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    value={editedItem.data.entity2 || ''}
                                    onChange={e => this.handleDataFieldChange('entity2', e.target.value)}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={() =>
                                        this.setState({ showSelectDialogEntity2: true } as PageItemEditorState)
                                    }
                                    sx={{ minWidth: 48 }}
                                >
                                    ...
                                </Button>

                                {this.state.showSelectDialogEntity2 && (
                                    <SelectID
                                        socket={socket}
                                        selected={editedItem.data.entity2 || ''}
                                        onOk={(selectedId: string | string[] | undefined) => {
                                            const id = Array.isArray(selectedId) ? selectedId[0] : selectedId;
                                            this.handleDataFieldChange('entity2', id || '');
                                            this.setState({ showSelectDialogEntity2: false } as PageItemEditorState);
                                        }}
                                        onClose={() =>
                                            this.setState({ showSelectDialogEntity2: false } as PageItemEditorState)
                                        }
                                        filterFunc={(obj: ioBroker.Object): boolean => {
                                            return !!(obj?.type === 'state');
                                        }}
                                        dialogName="nspanel-pageitem-editor-entity2"
                                        theme={theme}
                                        themeType={themeType || 'light'}
                                    />
                                )}
                            </Box>
                        </Box>

                        {/* SetNavi (for navigation) */}
                        <TextField
                            fullWidth
                            label={getText('pageItem_data_setNavi')}
                            value={editedItem.data.setNavi || ''}
                            onChange={e => this.handleDataFieldChange('setNavi', e.target.value)}
                            helperText={getText('pageItem_data_setNavi_hint')}
                        />

                        {/* Save Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={this.handleSave}
                            >
                                {getText('save')}
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    open={this.state.confirmDeleteOpen}
                    onClose={this.handleDeleteCancel}
                    onConfirm={this.handleDeleteConfirm}
                    title={getText('pageItem_delete_confirm_title')}
                    description={getText('pageItem_delete_confirm_text')}
                    cancelText={getText('Cancel')}
                    confirmText={getText('Delete')}
                    ariaTitleId="pageitem-delete-confirm-title"
                    ariaDescId="pageitem-delete-confirm-description"
                />
            </Box>
        );
    }
}

// Export the icon mapping for use in other components
export { MODE_SCR_ICONS };
