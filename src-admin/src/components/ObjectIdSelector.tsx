import React from 'react';
import { Box } from '@mui/material';
import { JsonConfigComponent } from '@iobroker/json-config';
import { I18n, type ThemeName, type ThemeType, type IobTheme } from '@iobroker/adapter-react-v5';
import type { ConfigItemPanel, ConfigItemObjectId } from '@iobroker/json-config';

type ObjectIdSelectorProps = {
    value: string;
    onChange: (objectId: string) => void;
    socket: any;
    themeName: ThemeName;
    themeType: ThemeType;
    theme: IobTheme;
    adapterName?: string;
    instance?: number;
    /** Optional: filter configuration for the objectId selector */
    objectIdConfig?: Partial<Omit<ConfigItemObjectId, 'type' | 'label'>>;
    /** Optional: show selected object below selector */
    showSelected?: boolean;
};

interface ObjectIdSelectorState {
    data: Record<string, any>;
}

/**
 * ObjectIdSelector - Component for ObjectID selection without popup/dialog
 * Uses the built-in objectId selector from @iobroker/json-config
 */
class ObjectIdSelector extends React.Component<ObjectIdSelectorProps, ObjectIdSelectorState> {
    private schema: ConfigItemPanel;

    constructor(props: ObjectIdSelectorProps) {
        super(props);
        this.state = {
            data: {
                objectId: props.value || '',
            },
        };

        // Schema definition for JsonConfigComponent with objectId selector
        // Merge user-provided objectIdConfig with defaults
        const objectIdItem: ConfigItemObjectId = {
            type: 'objectId',
            label: 'Select an object',
            sm: 12,
            md: 12,
            lg: 12,
            ...this.props.objectIdConfig,
        };

        this.schema = {
            type: 'panel',
            label: 'Object Selector',
            items: {
                objectId: objectIdItem,
            },
        };
    }

    componentDidUpdate(prevProps: ObjectIdSelectorProps): void {
        // Update internal state if value prop changes externally
        if (prevProps.value !== this.props.value && this.props.value !== this.state.data.objectId) {
            this.setState({
                data: {
                    objectId: this.props.value || '',
                },
            });
        }
    }

    private handleChange = (data: Record<string, any>): void => {
        this.setState({ data });

        // Notify parent component of change
        if (this.props.onChange && data.objectId !== this.props.value) {
            this.props.onChange(data.objectId);
        }
    };

    render(): React.JSX.Element {
        const { socket, themeName, themeType, theme, adapterName, instance, showSelected } = this.props;

        return (
            <Box sx={{ width: '100%' }}>
                {/* JsonConfigComponent renders the objectId selector */}
                <JsonConfigComponent
                    socket={socket}
                    themeName={themeName}
                    themeType={themeType}
                    theme={theme}
                    adapterName={adapterName || 'nspanel-lovelace-ui'}
                    instance={instance || 0}
                    schema={this.schema}
                    data={this.state.data}
                    onChange={this.handleChange}
                    isFloatComma={false}
                    dateFormat="DD.MM.YYYY"
                    onError={() => {}}
                />
                {showSelected && (
                    <Box sx={{ mt: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                        {I18n.t('Selected object')}: {this.state.data.objectId || <em>—</em>}
                    </Box>
                )}
            </Box>
        );
    }
}

export default ObjectIdSelector;
