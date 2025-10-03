import React from 'react';
import { TextField } from '@mui/material';

interface CustomTextFieldProps {
    attr: string;
    schema: {
        label?: string;
        help?: string;
        placeholder?: string;
        disabled?: boolean;
        [key: string]: any;
    };
    data: Record<string, any>;
    onChange: (attr: string, value: any) => void;
}

/**
 * Example custom text field component for NSPanel Lovelace UI
 * This component demonstrates how to create custom React components for the admin interface
 *
 * @param root0 - Component props
 * @param root0.attr - Attribute name
 * @param root0.schema - Field schema configuration
 * @param root0.data - Current data values
 * @param root0.onChange - Callback for value changes
 * @returns CustomTextField component
 */
const CustomTextField: React.FC<CustomTextFieldProps> = ({ attr, schema, data, onChange }) => {
    const value = data[attr] || '';

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        onChange(attr, event.target.value);
    };

    return (
        <TextField
            fullWidth
            label={schema.label || attr}
            value={value}
            onChange={handleChange}
            variant="outlined"
            helperText={schema.help || 'Example custom text field'}
            placeholder={schema.placeholder}
            disabled={schema.disabled}
        />
    );
};

export default CustomTextField;
