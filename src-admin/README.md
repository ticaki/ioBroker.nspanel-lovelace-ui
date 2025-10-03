# Custom React Components for NSPanel Lovelace UI Admin

This directory contains custom React components that can be used in the admin configuration interface.

## Structure

```
src-admin/
├── src/
│   ├── CustomTextField.tsx    # Example custom text field component
│   └── index.tsx               # Export all custom components
├── package.json                # Dependencies for React development
├── tsconfig.json               # TypeScript configuration
├── craco.config.js             # Build configuration
└── .gitignore                  # Git ignore file
```

## Development

### Setup

First, install dependencies:

```bash
npm run install:admin
```

### Building

To build the custom components:

```bash
npm run build:admin
```

This will compile the React components and place them in `admin/custom/` directory.

### Watching for changes

During development, you can use watch mode:

```bash
npm run watch:admin
```

## Creating Custom Components

### 1. Create a new component

Create a new TypeScript/React file in `src-admin/src/`:

```typescript
import React from 'react';
import type { ConfigItemText } from '@iobroker/adapter-react-v5/types';

interface MyCustomComponentProps {
    attr: string;
    schema: ConfigItemText;
    data: Record<string, any>;
    onChange: (attr: string, value: any) => void;
}

const MyCustomComponent: React.FC<MyCustomComponentProps> = ({ attr, schema, data, onChange }) => {
    // Your component implementation
    return <div>My Custom Component</div>;
};

export default MyCustomComponent;
```

### 2. Export the component

Add your component to `src-admin/src/index.tsx`:

```typescript
import CustomTextField from './CustomTextField';
import MyCustomComponent from './MyCustomComponent';

export default {
    CustomTextField,
    MyCustomComponent,
};
```

### 3. Use in jsonConfig.json5

Reference your custom component in `admin/jsonConfig.json5`:

```json5
{
    "type": "custom",
    "url": "custom/customComponents.js",
    "name": "admin/custom.CustomTextField",
    "attr": "myCustomField",
    "label": "My Custom Field"
}
```

## Example: CustomTextField

The `CustomTextField` component demonstrates a basic custom text field with Material-UI styling. It shows:

- How to receive props from the admin interface
- How to handle value changes
- How to integrate with Material-UI components
- How to respect schema properties (label, help, placeholder, disabled)

## References

- [ioBroker JSON Config Documentation](https://github.com/ioBroker/ioBroker.admin/blob/master/packages/jsonConfig/README.md#custom)
- [ioBroker Adapter React Documentation](https://github.com/ioBroker/adapter-react-v5)
- [Material-UI Documentation](https://mui.com/)
