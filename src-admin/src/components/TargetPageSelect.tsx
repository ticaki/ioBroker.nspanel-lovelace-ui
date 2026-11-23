/**
 * The selection of the target page of a navigation: the pages that can be chosen and the screensaver, a name can be
 * typed in as well. Used by the page item dialog (ChannelConfigDialog) and by the settings of a slot of the device
 * page (DevicePageSlotDialog, DevicePageSection).
 */
import React from 'react';
import { Autocomplete, Box, CircularProgress, TextField } from '@mui/material';
import { I18n } from '@iobroker/gui-components';
import { DocHelp } from './DocHelp';
import { screensaverTargetPage } from '../../../src/lib/types/adminShareConfig';
import type { DocTopicRef } from '../docTopics';

export interface TargetPageSelectProps {
    /** the pages that can be chosen, in the order they are offered - without the screensaver */
    pages: string[];
    /** the pages are being read: nothing is offered, the field is disabled */
    loading: boolean;
    /** the chosen page, '' = none */
    value: string;
    /**
     * @param value the chosen or typed page, '' = none
     */
    onChange: (value: string) => void;
    /** topic of the help link behind the field, missing = no link */
    docTopic?: DocTopicRef;
    /** the field is marked */
    error?: boolean;
    /** text below the field */
    helperText?: string;
}

/**
 * @param pages pages that can be chosen
 * @returns the options of a target page: the screensaver is a target as well
 */
export function targetPageOptions(pages: readonly string[]): string[] {
    return [...pages, screensaverTargetPage];
}

/**
 * @param option an option of a target page
 * @returns its text
 */
export function targetPageLabel(option: string): string {
    return option === screensaverTargetPage ? I18n.t('screensaver_target') : option;
}

/**
 * The field of a target page can be typed in and reports its text: the text of the screensaver means the target.
 *
 * @param text text of the field
 * @returns the value to store
 */
export function targetPageOfText(text: string): string {
    return text === I18n.t('screensaver_target') ? screensaverTargetPage : text;
}

export default class TargetPageSelect extends React.Component<TargetPageSelectProps> {
    render(): React.JSX.Element {
        const { pages, loading, value, onChange, docTopic, error, helperText } = this.props;
        return (
            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <Autocomplete
                    sx={{ flex: 1 }}
                    options={loading ? [] : targetPageOptions(pages)}
                    getOptionLabel={targetPageLabel}
                    value={value || null}
                    onChange={(_e, val) => onChange(targetPageOfText(val ?? ''))}
                    onInputChange={(_e, val) => onChange(targetPageOfText(val))}
                    disabled={loading}
                    freeSolo
                    forcePopupIcon
                    renderInput={params => (
                        <TextField
                            {...params}
                            variant="standard"
                            label={I18n.t('channelConfigDialog_targetPage')}
                            error={error}
                            helperText={helperText}
                            slotProps={{
                                ...params.slotProps,
                                input: {
                                    ...params.slotProps.input,
                                    endAdornment: (
                                        <>
                                            {loading && <CircularProgress size={16} />}
                                            {params.slotProps.input.endAdornment}
                                        </>
                                    ),
                                },
                            }}
                        />
                    )}
                />
                {docTopic ? (
                    <DocHelp
                        topic={docTopic}
                        sx={{ flexShrink: 0, mb: 0.5 }}
                    />
                ) : null}
            </Box>
        );
    }
}
