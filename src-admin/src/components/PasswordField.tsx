import React from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

type PasswordFieldProps = {
    variant?: 'standard' | 'outlined' | 'filled';
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
    helperText?: string;
    placeholder?: string;
    fullWidth?: boolean;
    size?: 'small' | 'medium';
    sx?: Record<string, unknown>;
};

interface PasswordFieldState {
    showPassword: boolean;
}

class PasswordField extends React.Component<PasswordFieldProps, PasswordFieldState> {
    constructor(props: PasswordFieldProps) {
        super(props);
        this.state = {
            showPassword: false,
        };
    }

    private handleToggleVisibility = (): void => {
        this.setState(prevState => ({
            showPassword: !prevState.showPassword,
        }));
    };

    private handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.props.onChange(e.target.value);
    };

    render(): React.JSX.Element {
        const { showPassword } = this.state;
        const {
            variant = 'standard',
            label,
            value,
            disabled = false,
            error = false,
            helperText = '',
            placeholder = '',
            fullWidth = false,
            size = 'small',
            sx = {},
        } = this.props;

        return (
            <TextField
                variant={variant}
                fullWidth={fullWidth}
                sx={sx}
                label={label}
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={this.handleChange}
                disabled={disabled}
                error={error}
                helperText={helperText}
                placeholder={placeholder}
                size={size}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={this.handleToggleVisibility}
                                    disabled={disabled}
                                    edge="end"
                                    size="small"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
            />
        );
    }
}

export default PasswordField;
