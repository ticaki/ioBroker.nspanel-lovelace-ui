import React from 'react';
import {
    Box,
    TextField,
    FormControl,
    FormLabel,
    FormControlLabel,
    RadioGroup,
    Radio,
    Button,
    Select,
    MenuItem,
    Tooltip,
    Typography,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
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
    private fileInputRef = React.createRef<HTMLInputElement>();

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private handleFieldChange(field: keyof TrashEntry, value: any): void {
        const updated = { ...this.props.entry, [field]: value };
        this.props.onEntryChange(updated);
    }

    private handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const { oContext } = this.props;
            const reader = new FileReader();

            reader.onload = async (e: ProgressEvent<FileReader>) => {
                const content = e.target?.result as string;
                if (!content) {
                    alert('Upload failed: No content');
                    return;
                }

                try {
                    // Sende Datei an Adapter via sendTo
                    const result = await oContext.socket.sendTo(
                        `${oContext.adapterName}.${oContext.instance}`,
                        'uploadIcs',
                        {
                            filename: file.name,
                            content: content,
                        },
                    );

                    if (result?.success) {
                        console.log('ICS-Datei erfolgreich hochgeladen:', result.path);
                        // Speichere relativen Pfad im Entry
                        this.handleFieldChange('trashFile', result.path);
                    } else {
                        throw new Error(result?.error);
                    }

                    // Reset file input
                    if (this.fileInputRef.current) {
                        this.fileInputRef.current.value = '';
                    }
                } catch (error: any) {
                    console.error('File upload failed:', error);
                    alert(`Upload failed: ${error.message}`);
                }
            };

            reader.onerror = () => {
                console.error('File reading failed');
                alert('Failed to read file');
            };

            // Lese Datei als Text
            reader.readAsText(file);
        } catch (error: any) {
            console.error('File upload failed:', error);
            alert(`Upload failed: ${error.message}`);
        }
    };

    private handleUploadClick = (): void => {
        this.fileInputRef.current?.click();
    };

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
                <Box sx={{ mb: 2 }}>
                    {/* Select number of entities (4 or 6) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Tooltip title={this.getText('trash_number_of_entities')}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mr: 0.5 }}
                            >
                                Layout
                            </Typography>
                        </Tooltip>
                    </Box>
                    <Select
                        size="small"
                        value={entry.countItems || 4}
                        onChange={e => {
                            this.handleFieldChange('countItems', e.target.value);
                        }}
                        sx={{
                            backgroundColor: 'transparent',
                            px: 1,
                        }}
                    >
                        <MenuItem value={4}>{this.getText('trash_4_entities')}</MenuItem>
                        <MenuItem value={6}>{this.getText('trash_6_entities')}</MenuItem>
                    </Select>
                </Box>
                {/* Option to choose between import via .ics file or ioBroker state */}
                <Box sx={{ mb: 2 }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">{this.getText('trash_import_type')}</FormLabel>
                        <RadioGroup
                            row
                            value={entry.trashImport}
                            onChange={e => {
                                const value = e.target.value === 'true';
                                this.handleFieldChange('trashImport', value);
                            }}
                        >
                            <FormControlLabel
                                value={true}
                                control={<Radio />}
                                label={this.getText('trash_import_state')}
                            />
                            <FormControlLabel
                                value={false}
                                control={<Radio />}
                                label={this.getText('trash_import_ics_file')}
                            />
                        </RadioGroup>
                    </FormControl>
                </Box>

                {/* Object ID Selector */}
                {entry.trashImport && (
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
                )}

                {/* ICS File Upload & Path */}
                {!entry.trashImport && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                            <TextField
                                fullWidth
                                variant="standard"
                                type="text"
                                autoComplete="off"
                                label={this.getText('trash_ics_file_path')}
                                value={entry.trashFile ?? ''}
                                onChange={e => {
                                    this.handleFieldChange('trashFile', e.target.value);
                                }}
                                InputProps={{
                                    sx: { backgroundColor: 'transparent', px: 1 },
                                }}
                                helperText={this.getText('trash_ics_file_path_help')}
                            />
                            <Button
                                variant="text"
                                startIcon={<UploadIcon />}
                                onClick={this.handleUploadClick}
                                sx={{ minWidth: 120, mb: 0.5 }}
                            >
                                {this.getText('upload_file')}
                            </Button>
                        </Box>
                        <input
                            ref={this.fileInputRef}
                            type="file"
                            accept=".ics"
                            style={{ display: 'none' }}
                            onChange={this.handleFileSelect}
                        />
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {/* 6 Farbwahlfelder für Icons */}
                    <Box sx={{ mb: 2 }}>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <TextField
                                key={num}
                                fullWidth
                                variant="standard"
                                type="color"
                                label={this.getText(`${num}`)}
                                value={entry[`iconColor${num}` as keyof TrashEntry] ?? '#d2d2d2'}
                                onChange={e => {
                                    this.handleFieldChange(`iconColor${num}` as keyof TrashEntry, e.target.value);
                                }}
                                InputProps={{
                                    sx: { backgroundColor: 'transparent', px: 1 },
                                }}
                                sx={{ mb: 2 }}
                            />
                        ))}
                    </Box>
                    {/* 6 Textfelder Trashname*/}
                    <Box sx={{ mb: 2 }}>
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
                    {/* 6 Textfelder Customname*/}
                    <Box sx={{ mb: 2 }}>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <TextField
                                key={num}
                                fullWidth
                                variant="standard"
                                type="text"
                                autoComplete="off"
                                label={this.getText(`trash_custom_text_field_${num}`)}
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
