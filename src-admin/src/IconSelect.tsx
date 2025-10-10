import React from 'react';
import icons from './icons.json';
import { Autocomplete, TextField, Box, Typography, Grid } from '@mui/material';
import { withTheme } from '@mui/styles';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';

interface IconSelectState extends ConfigGenericState {
    test: string;
    iconValue: string | null;
    icons: { name: string; base64: string }[];
    inputValue: string;
    filteredIcons: { name: string; base64: string }[];
}

class IconSelect extends ConfigGeneric<ConfigGenericProps & { theme?: any }, IconSelectState> {
    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
        const savedValue = ConfigGeneric.getValue(props.data, props.attr!);
        const allIcons = Array.isArray(icons) ? icons : [];
        const initialInput = typeof savedValue === 'string' ? savedValue : '';

        this.state = {
            ...this.state,
            test: '',
            iconValue: typeof savedValue === 'string' ? savedValue : null,
            icons: allIcons,
            inputValue: initialInput,
            filteredIcons: this.filterIcons(allIcons, initialInput),
        };
    }

    /**
     * Filter icons based on input string.
     *
     * @param allIcons - full icon list
     * @param input - current input text
     */
    private filterIcons(
        allIcons: { name: string; base64: string }[],
        input: string,
    ): { name: string; base64: string }[] {
        const q = (input || '').toLowerCase();
        if (!q) {
            return allIcons.slice(0, 200);
        }
        return allIcons.filter(icon => icon.name.toLowerCase().includes(q)).slice(0, 200);
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const icons = this.state.icons;
        const theme = this.props.theme;
        const filteredIcons = this.state.filteredIcons;

        return (
            <Grid
                container
                spacing={2}
            >
                <Grid
                    item
                    xs={12}
                >
                    <Autocomplete
                        options={filteredIcons}
                        // disable internal filtering: we provide a refreshed list on every input change
                        filterOptions={opts => opts}
                        getOptionLabel={option => (typeof option === 'string' ? option : option.name)}
                        value={
                            // value should be an object from options or null
                            icons.find(opt => opt.name === this.state.iconValue) || null
                        }
                        inputValue={this.state.inputValue}
                        onInputChange={(_, newInputValue) => {
                            const newFilteredIcons = this.filterIcons(this.state.icons, newInputValue);
                            this.setState({
                                inputValue: newInputValue,
                                filteredIcons: newFilteredIcons,
                            });
                        }}
                        onChange={(_, newValue) => {
                            const newInput = newValue ? (typeof newValue === 'string' ? newValue : newValue.name) : '';
                            const newFilteredIcons = this.filterIcons(this.state.icons, newInput);
                            this.setState({
                                iconValue: newValue ? (typeof newValue === 'string' ? newValue : newValue.name) : null,
                                inputValue: newInput,
                                filteredIcons: newFilteredIcons,
                            });
                            void this.onChange(this.props.attr!, newInput);
                        }}
                        renderOption={(props, option) => (
                            <Box
                                component="li"
                                {...props}
                            >
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        width: 24,
                                        height: 24,
                                        marginRight: 8,
                                        color: theme?.palette?.secondary?.main || '#09f23fc1',
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: atob(
                                            option.base64.replace(/^data:image\/svg\+xml;base64,/, ''),
                                        ).replace(/<svg([^>]*)>/, '<svg$1 fill="currentColor">'),
                                    }}
                                />
                                <Typography>{option.name}</Typography>
                            </Box>
                        )}
                        renderInput={params => {
                            const selectedIcon = icons.find(opt => opt.name === this.state.iconValue);
                            return (
                                <TextField
                                    {...params}
                                    label={this.getText(
                                        this.props.schema.label || this.props.attr || 'Symbol auswählen',
                                    )}
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: selectedIcon ? (
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    width: 24,
                                                    height: 24,
                                                    marginRight: 8,
                                                    color: theme?.palette?.secondary?.main || '#09f23fc1',
                                                }}
                                                dangerouslySetInnerHTML={{
                                                    __html: atob(
                                                        selectedIcon.base64.replace(
                                                            /^data:image\/svg\+xml;base64,/,
                                                            '',
                                                        ),
                                                    ).replace(/<svg([^>]*)>/, '<svg$1 fill="currentColor">'),
                                                }}
                                            />
                                        ) : null,
                                    }}
                                    style={{ width: '100%' }}
                                />
                            );
                        }}
                        isOptionEqualToValue={(opt, val) => {
                            const vName = typeof val === 'string' ? val : val?.name;
                            return opt.name === vName;
                        }}
                        clearOnBlur={false}
                        freeSolo={false}
                        disableClearable={false}
                        style={{ width: '100%' }}
                    />
                </Grid>
            </Grid>
        );
    }
}

export default withTheme(IconSelect);
