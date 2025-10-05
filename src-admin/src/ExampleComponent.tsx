import React from 'react';
import icons from './icons.json';
import { Autocomplete, TextField, Box, Typography, Button, Grid } from '@mui/material';
import { withTheme } from '@mui/styles';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';

interface ExampleComponentState extends ConfigGenericState {
    test: string;
    iconValue: string | null;
    icons: { name: string; base64: string }[];
}

const styles: Record<string, React.CSSProperties> = {
    button: { minWidth: 150 },
};

class ExampleComponent extends ConfigGeneric<ConfigGenericProps & { theme?: any }, ExampleComponentState> {
    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
        this.state = {
            ...this.state,
            test: '',
            iconValue: null,
            icons: Array.isArray(icons) ? icons : [],
        };
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const icons = this.state.icons;
        const theme = this.props.theme;
        const inputValue = this.state.iconValue || '';
        const filteredIcons =
            inputValue.length < 2
                ? icons.slice(0, 50)
                : icons.filter(icon => icon.name.toLowerCase().includes(inputValue.toLowerCase()));

        return (
            <>
                <Button
                    style={styles.button}
                    color="secondary"
                    variant="contained"
                    onClick={() => window.alert('button event')}
                >
                    Example Button
                </Button>
                <Grid
                    container
                    spacing={2}
                >
                    <Grid
                        item
                        xs={12}
                        md={4}
                        lg={3}
                    >
                        <Autocomplete
                            options={filteredIcons}
                            getOptionLabel={option => option.name}
                            value={icons.find(opt => opt.name === this.state.iconValue) || null}
                            onChange={(_, newValue) => {
                                this.setState({ iconValue: newValue ? newValue.name : null });
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
                                        label="Symbol auswählen"
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
                                    />
                                );
                            }}
                            isOptionEqualToValue={(opt, val) => opt.name === val.name}
                        />
                    </Grid>
                </Grid>
            </>
        );
    }
}

export default withTheme(ExampleComponent);
