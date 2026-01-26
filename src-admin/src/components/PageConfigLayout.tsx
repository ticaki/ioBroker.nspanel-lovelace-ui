import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    IconButton,
    Divider,
    Select,
    MenuItem,
    FormControl,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ConfirmDialog from './ConfirmDialog';
import NavigationAssignmentPanel from './NavigationAssignmentPanel';
import type { NavigationAssignmentList, PageConfigEntry } from '../../../src/lib/types/adminShareConfig';

export type PageCardType = 'cardTrash' | 'cardAlarm' | 'cardQR' | 'all'; // 'all' = alle Typen anzeigen

export interface PageConfigLayoutProps {
    entries: PageConfigEntry[];
    selected: string;
    selectedCardType: PageCardType;
    onSelectedChange: (name: string) => void;
    onCardTypeChange: (cardType: PageCardType) => void;
    onAdd: (name: string, cardType: PageCardType) => void;
    onDelete: (name: string) => void;
    onAssign: (uniqueName: string, assignments: NavigationAssignmentList) => void;
    children: React.ReactNode;
    oContext: any;
    getText: (key: string) => string;
    navigationPanelProps: any;
}

interface PageConfigLayoutState {
    newName: string;
    confirmDeleteOpen: boolean;
    confirmDeleteName: string | null;
}

export class PageConfigLayout extends React.Component<PageConfigLayoutProps, PageConfigLayoutState> {
    constructor(props: PageConfigLayoutProps) {
        super(props);
        this.state = {
            newName: '',
            confirmDeleteOpen: false,
            confirmDeleteName: null,
        };
    }

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private handleAdd = (): void => {
        const name = this.state.newName.trim();
        if (!name || this.props.selectedCardType === 'all') {
            return;
        }
        this.props.onAdd(name, this.props.selectedCardType);
        this.setState({ newName: '' });
        this.props.onSelectedChange(name);
    };

    private handleDeleteClick = (name: string): void => {
        this.setState({
            confirmDeleteOpen: true,
            confirmDeleteName: name,
        });
    };

    private handleDeleteConfirm = (): void => {
        const name = this.state.confirmDeleteName;
        if (!name) {
            this.setState({ confirmDeleteOpen: false, confirmDeleteName: null });
            return;
        }
        this.props.onDelete(name);
        this.setState({ confirmDeleteOpen: false, confirmDeleteName: null });
    };

    private handleDeleteCancel = (): void => {
        this.setState({ confirmDeleteOpen: false, confirmDeleteName: null });
    };

    render(): React.JSX.Element {
        const {
            entries,
            selected,
            selectedCardType,
            onSelectedChange,
            onCardTypeChange,
            onAssign,
            children,
            oContext,
            navigationPanelProps,
        } = this.props;
        const uniqueNames = Array.from(new Set(entries.map(e => e.uniqueName))).filter(Boolean);

        // Filter entries by selected card type
        const filteredEntries = selectedCardType === 'all' ? entries : entries.filter(e => e.card === selectedCardType);
        const filteredUniqueNames = Array.from(new Set(filteredEntries.map(e => e.uniqueName))).filter(Boolean);

        const currentEntry = entries.find(e => e.uniqueName === selected);
        const currentAssignments = currentEntry?.navigationAssignment || [];
        const docUrl = `https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/${encodeURIComponent(selectedCardType === 'all' ? (currentEntry?.card ? currentEntry.card : 'PageConfig') : 'PageConfig')}`;
        return (
            <Box
                sx={{
                    height: 'calc(100vh - 64px)',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    p: 1,
                }}
            >
                {/* Left sidebar: 20% width */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '20%' },
                        pr: { xs: 0, md: 1 },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {/* Page Type Selector - oberhalb der Überschrift */}
                    <Paper
                        sx={{ p: 0, mb: 1, backgroundColor: 'transparent' }}
                        elevation={0}
                    >
                        <FormControl
                            fullWidth
                            variant="standard"
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    mb: 1,
                                    fontWeight: 600,
                                    color: 'primary.main',
                                    fontSize: '1rem',
                                }}
                            >
                                {this.getText('page_type')}
                            </Typography>
                            <Select
                                value={selectedCardType}
                                onChange={e => {
                                    onCardTypeChange(e.target.value as PageCardType);
                                }}
                                sx={{
                                    backgroundColor: 'transparent',
                                    px: 1,
                                }}
                            >
                                <MenuItem value="all">{this.getText('page_type_all')}</MenuItem>
                                <MenuItem value="cardAlarm">{this.getText('page_type_alarm')}</MenuItem>
                                <MenuItem value="cardQR">{this.getText('page_type_qr')}</MenuItem>
                                <MenuItem value="cardTrash">{this.getText('page_type_trash')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Paper>
                    <Typography
                        variant="h6"
                        sx={{
                            mt: 1,
                            fontWeight: 600,
                            color: 'primary.main',
                            fontSize: '1rem',
                        }}
                    >
                        {this.getText('pages')}
                    </Typography>
                    {/* Add new page - nur anzeigen wenn nicht 'all' ausgewählt */}
                    {selectedCardType !== 'all' && (
                        <Paper
                            sx={{ p: 0, backgroundColor: 'transparent' }}
                            elevation={0}
                        >
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    aria-label="new-name"
                                    label={this.getText('new_page')}
                                    value={this.state.newName}
                                    onChange={e => {
                                        this.setState({ newName: e.target.value });
                                    }}
                                    variant="standard"
                                    placeholder={this.getText('New item')}
                                    InputProps={{
                                        sx: { backgroundColor: 'transparent', px: 1 },
                                    }}
                                    sx={{
                                        flex: 1,
                                        '& .MuiInput-underline:before': {
                                            borderBottomColor: 'primary.main',
                                        },
                                        '& .MuiInput-underline:hover:before': {
                                            borderBottomColor: 'primary.main',
                                        },
                                        '& .MuiInput-underline:after': {
                                            borderBottomColor: 'primary.main',
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'primary.main',
                                        },
                                        '& .MuiInputLabel-root.Mui-focused': {
                                            color: 'primary.main',
                                        },
                                    }}
                                />
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={this.handleAdd}
                                    disabled={
                                        !this.state.newName.trim() || uniqueNames.includes(this.state.newName.trim())
                                    }
                                >
                                    +
                                </Button>
                            </Box>
                        </Paper>
                    )}
                    {/* Pages list */}
                    <Paper
                        sx={{ overflow: 'auto', p: 0, backgroundColor: 'transparent' }}
                        elevation={0}
                    >
                        {filteredUniqueNames.length === 0 ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {this.getText('No items')}
                            </Typography>
                        ) : (
                            filteredUniqueNames.map(name => (
                                <Box
                                    key={name}
                                    onClick={() => {
                                        onSelectedChange(name);
                                    }}
                                    sx={{
                                        p: 1,
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        backgroundColor: selected === name ? 'action.selected' : 'transparent',
                                        mb: 0.5,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        '&:hover .delete-icon': {
                                            opacity: 1,
                                        },
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    >
                                        {name}
                                    </Typography>
                                    <IconButton
                                        className="delete-icon"
                                        edge="end"
                                        aria-label="delete"
                                        size="small"
                                        onClick={e => {
                                            e.stopPropagation();
                                            this.handleDeleteClick(name);
                                        }}
                                        sx={{
                                            color: 'error.main',
                                            opacity: { xs: 1, md: 0 },
                                            transition: 'opacity 0.2s',
                                        }}
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))
                        )}
                    </Paper>
                    <Divider sx={{ my: 1 }} />
                    {/* Documentation link */}
                    {docUrl && (
                        <Box sx={{ mb: 2 }}>
                            <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    fontSize: '0.875rem',
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'primary.main',
                                        textDecoration: 'underline',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            opacity: 0.8,
                                        },
                                    }}
                                >
                                    {this.getText('documentation')}
                                </Typography>
                            </a>
                        </Box>
                    )}
                </Box>

                <ConfirmDialog
                    open={this.state.confirmDeleteOpen}
                    onClose={this.handleDeleteCancel}
                    onConfirm={this.handleDeleteConfirm}
                    title={this.getText('delete_confirm_title')}
                    description={
                        this.getText('delete_confirm_text') +
                        (this.state.confirmDeleteName ? `: ${this.state.confirmDeleteName}` : '')
                    }
                    cancelText={this.getText('Cancel1')}
                    confirmText={this.getText('Delete')}
                    ariaTitleId="unlock-delete-confirm-title"
                    ariaDescId="unlock-delete-confirm-description"
                />

                {/* Right area: main content + navigation panel */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '90%' },
                        pl: { xs: 0, md: 2 },
                        mt: { xs: 2, md: 0 },
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 1,
                        position: 'relative',
                    }}
                >
                    {/* Main content area - dynamically loaded panel */}
                    <Box
                        sx={{
                            width: { xs: '100%', md: '95%' },
                            borderLeft: { xs: 'none', md: '1px solid' },
                            borderColor: 'divider',
                        }}
                    >
                        <Paper
                            sx={{ height: '100%', p: 2 }}
                            elevation={1}
                        >
                            {children}
                        </Paper>
                    </Box>

                    {/* Navigation assignment panel */}
                    <NavigationAssignmentPanel
                        {...navigationPanelProps}
                        widthPercent={30}
                        uniqueName={selected}
                        currentAssignments={currentAssignments}
                        oContext={oContext}
                        onAssign={onAssign}
                    />
                </Box>
            </Box>
        );
    }
}
