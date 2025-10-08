import React from 'react';
import icons from './icons.json';
import { Autocomplete, TextField, Box, Typography, Grid } from '@mui/material';
import { withTheme } from '@mui/styles';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';

interface IconSelectState extends ConfigGenericState {
    test: string;
    iconValue: string | null;
    icons: { name: string; base64: string }[];
}

class IconSelect extends ConfigGeneric<ConfigGenericProps & { theme?: any }, IconSelectState> {
    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
        const savedValue = ConfigGeneric.getValue(props.data, props.attr!);
        this.state = {
            ...this.state,
            test: '',
            iconValue: typeof savedValue === 'string' ? savedValue : null,
            icons: Array.isArray(icons) ? icons : [],
            inputValue: '',
        } as IconSelectState & { inputValue: string };
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        // Debug: Props ausgeben
        // console.log('IconSelect props:', this.props);
        const icons = this.state.icons;
        const theme = this.props.theme;
        const inputValue = (this.state as any).inputValue || '';
        const filteredIcons =
            inputValue.length < 2
                ? icons.filter(icon => icon.name.toLowerCase().includes(inputValue.toLowerCase())).slice(0, 200)
                : icons.filter(icon => icon.name.toLowerCase().includes(inputValue.toLowerCase()));

        return (
            <>
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
                            getOptionLabel={option => option.name}
                            value={icons.find(opt => opt.name === this.state.iconValue) || null}
                            inputValue={inputValue}
                            onInputChange={(_, newInputValue) => {
                                this.setState({ ...(this.state as any), inputValue: newInputValue });
                            }}
                            onChange={(_, newValue) => {
                                this.setState({ ...(this.state as any), iconValue: newValue ? newValue.name : null });
                                void this.onChange(this.props.attr!, newValue ? newValue.name : '');
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
                                            this.props.schema.label || this.props.attr || 'Symbol auswÃ¤hlen',
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
                            isOptionEqualToValue={(opt, val) => opt.name === val.name}
                            style={{ width: '100%' }}
                        />
                    </Grid>
                </Grid>
            </>
        );
    }
}

export default withTheme(IconSelect);
