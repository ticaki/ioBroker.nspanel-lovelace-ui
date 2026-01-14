import React from 'react';
import { Box, TextField } from '@mui/material';
import { EntitySelector } from './EntitySelector';
import type { TrashEntry } from '../../../src/lib/types/adminShareConfig';

export interface PageTrashEditorProps {
    entry: TrashEntry;
    onEntryChange: (updated: TrashEntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
}

export class PageTrashEditor extends React.Component<PageTrashEditorProps> {
    private getText(key: string): string {
        return this.props.getText(key);
    }

    private handleFieldChange(field: keyof TrashEntry, value: any): void {
        const updated = { ...this.props.entry, [field]: value };
        this.props.onEntryChange(updated);
    }

    render(): React.JSX.Element {
        const { entry, oContext, theme } = this.props;

        return (
            <Box>
                {/* UniqueName display */}
                <Box
                    sx={{
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: 'action.hover',
                    }}
                >
                    <TextField
                        fullWidth
                        variant="standard"
                        type="text"
                        label={this.getText('unique_label')}
                        value={entry.uniqueName}
                        onChange={e => {
                            const newUniqueName = e.target.value;
                            if (newUniqueName.trim()) {
                                this.props.onUniqueNameChange(entry.uniqueName, newUniqueName);
                            }
                        }}
                        InputProps={{
                            sx: {
                                backgroundColor: 'transparent',
                                px: 1,
                                fontWeight: 600,
                                width: '50%',
                            },
                        }}
                    />
                </Box>

                {/* Headline */}
                <TextField
                    fullWidth
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('headline')}
                    value={entry.headline ?? ''}
                    onChange={e => {
                        this.handleFieldChange('headline', e.target.value);
                    }}
                    InputProps={{
                        sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
                    }}
                    sx={{ mb: 2 }}
                />

                {/* Object ID Selector */}
                <Box sx={{ mb: 2 }}>
                    <EntitySelector
                        label={this.getText('trash_state')}
                        value={entry.trashState ?? ''}
                        onChange={(v: string) => {
                            this.handleFieldChange('trashState', v);
                        }}
                        socket={oContext.socket}
                        theme={theme}
                        themeType={theme?.palette?.mode || 'light'}
                        dialogName="selectTrashState"
                        filterFunc={(obj: ioBroker.Object) => {
                            return !!(obj && obj.type === 'state');
                        }}
                    />
                </Box>

                {/* Zahlenfelder: Links und Rechts */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        variant="standard"
                        type="number"
                        label={this.getText('trash_left_number')}
                        value={entry.leftNumber ?? 0}
                        onChange={e => {
                            const value = parseFloat(e.target.value) || 0;
                            this.handleFieldChange('leftNumber', value);
                        }}
                        InputProps={{
                            sx: { backgroundColor: 'transparent', px: 1 },
                        }}
                        sx={{ flex: 1 }}
                    />
                    <TextField
                        variant="standard"
                        type="number"
                        label={this.getText('trash_right_number')}
                        value={entry.rightNumber ?? 0}
                        onChange={e => {
                            const value = parseFloat(e.target.value) || 0;
                            this.handleFieldChange('rightNumber', value);
                        }}
                        InputProps={{
                            sx: { backgroundColor: 'transparent', px: 1 },
                        }}
                        sx={{ flex: 1 }}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ mb: 2 }}>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <TextField
                                key={num}
                                fullWidth
                                variant="standard"
                                type="color"
                                label={this.getText(`trash_icon_color_${num}`)}
                                value={entry[`iconColor${num}` as keyof TrashEntry] ?? '#FFFFFF'}
                                onChange={e => {
                                    this.handleFieldChange(`iconColor${num}` as keyof TrashEntry, e.target.value);
                                }}
                                InputProps={{
                                    sx: { backgroundColor: 'transparent', px: 1 },
                                }}
                            />
                        ))}
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        {/* 6 Textfelder Trashname*/}
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <TextField
                                key={num}
                                fullWidth
                                variant="standard"
                                type="text"
                                autoComplete="off"
                                label={this.getText(`trash_text_field_${num}`)}
                                value={entry[`textTrash${num}` as keyof TrashEntry] ?? ''}
                                onChange={e => {
                                    this.handleFieldChange(`textTrash${num}` as keyof TrashEntry, e.target.value);
                                }}
                                InputProps={{
                                    sx: { backgroundColor: 'transparent', px: 1 },
                                }}
                                sx={{ mb: 2 }}
                            />
                        ))}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        {/* 6 Textfelder Customname*/}
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <TextField
                                key={num}
                                fullWidth
                                variant="standard"
                                type="text"
                                autoComplete="off"
                                label={this.getText(`custom_text_field_${num}`)}
                                value={entry[`customTrash${num}` as keyof TrashEntry] ?? ''}
                                onChange={e => {
                                    this.handleFieldChange(`customTrash${num}` as keyof TrashEntry, e.target.value);
                                }}
                                InputProps={{
                                    sx: { backgroundColor: 'transparent', px: 1 },
                                }}
                                sx={{ mb: 2 }}
                            />
                        ))}
                    </Box>
                </Box>
            </Box>
        );
    }
}
