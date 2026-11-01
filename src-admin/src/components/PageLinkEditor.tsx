import React from 'react';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import type { PageConfigEntry, PageLinkEntry } from '../../../src/lib/types/adminShareConfig';
import { isMainPageEntry, isPageLinkEntry, pageLinkProblem } from '../../../src/lib/types/adminShareConfig';
import { getDisplayName } from './PageConfigLayout';

export interface PageLinkEditorProps {
    entry: PageLinkEntry;
    /** all admin pages, the targets are taken from them */
    entries: PageConfigEntry[];
    alive: boolean;
    onEntryChange: (updated: PageLinkEntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    /** selects another page of the list */
    onSelectPage: (uniqueName: string) => void;
    getText: (key: string) => string;
}

/**
 * Editor of a page link: name, headline and the linked page. Navigation, hidden and alwaysOn are
 * set in the navigation panel on the right like on every other page.
 */
export class PageLinkEditor extends React.Component<PageLinkEditorProps> {
    private getText(key: string): string {
        return this.props.getText(key);
    }

    private handleFieldChange<K extends keyof PageLinkEntry>(field: K, value: PageLinkEntry[K]): void {
        this.props.onEntryChange({ ...this.props.entry, [field]: value });
    }

    render(): React.JSX.Element {
        const { entry, entries, alive } = this.props;
        const targets = entries
            .filter(e => e && !isPageLinkEntry(e) && e.uniqueName !== entry.uniqueName)
            .sort((a, b) => a.uniqueName.localeCompare(b.uniqueName));
        const target = targets.find(e => e.uniqueName === entry.target);
        const problem = pageLinkProblem(entry, entries);
        const targetHeadline = target ? ('headline' in target && target.headline) || target.uniqueName : '';

        return (
            <Box>
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
                        required
                        variant="standard"
                        type="text"
                        label={this.getText('unique_label')}
                        value={entry.uniqueName}
                        disabled={!alive || isMainPageEntry(entry)}
                        onChange={e => {
                            const newUniqueName = e.target.value;
                            if (newUniqueName.trim()) {
                                this.props.onUniqueNameChange(entry.uniqueName, newUniqueName);
                            }
                        }}
                        slotProps={{
                            input: {
                                sx: {
                                    backgroundColor: 'transparent',
                                    px: 1,
                                    fontWeight: 600,
                                    width: '50%',
                                },
                            },
                        }}
                        helperText={isMainPageEntry(entry) ? this.getText('page_name_main_locked') : undefined}
                    />
                </Box>

                <TextField
                    fullWidth
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('headline')}
                    value={entry.headline ?? ''}
                    disabled={!alive}
                    onChange={e => {
                        this.handleFieldChange('headline', e.target.value);
                    }}
                    placeholder={targetHeadline}
                    helperText={this.getText('page_link_headline_hint')}
                    slotProps={{
                        input: {
                            sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
                        },
                        inputLabel: { shrink: true },
                    }}
                    sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 2 }}>
                    <FormControl
                        variant="standard"
                        required
                        error={!!problem}
                        sx={{ minWidth: 250 }}
                    >
                        <InputLabel id="page-link-target-label">{this.getText('page_link_target')}</InputLabel>
                        <Select
                            labelId="page-link-target-label"
                            value={target ? entry.target : ''}
                            disabled={!alive}
                            onChange={e => {
                                this.handleFieldChange('target', e.target.value);
                            }}
                        >
                            {targets.map(t => (
                                <MenuItem
                                    key={t.uniqueName}
                                    value={t.uniqueName}
                                >
                                    {getDisplayName(t)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {target && (
                        <Button
                            size="small"
                            startIcon={<LinkIcon />}
                            onClick={() => {
                                this.props.onSelectPage(target.uniqueName);
                            }}
                        >
                            {this.getText('page_link_open_target')}
                        </Button>
                    )}
                </Box>

                {problem && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 2 }}
                    >
                        {entry.target
                            ? this.getText('page_link_target_missing').replace('%s', entry.target)
                            : this.getText('page_link_target_required')}
                    </Alert>
                )}

                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {this.getText('page_link_description')}
                </Typography>
            </Box>
        );
    }
}
