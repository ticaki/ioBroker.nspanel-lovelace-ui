import React from 'react';

import { Button } from '@mui/material';

// important to make from package and not from some children.
// invalid
// import ConfigGeneric from '@iobroker/json-config/ConfigGeneric';
// valid
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { ColorPicker } from '@iobroker/adapter-react-v5';

const styles: Record<string, React.CSSProperties> = {
    button: {
        minWidth: 150,
    },
};

interface ExampleComponentState extends ConfigGenericState {
    test: string;
}

export default class ExampleComponent extends ConfigGeneric<ConfigGenericProps, ExampleComponentState> {
    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
            test: '',
        };
    }
    componentDidMount(): void {
        super.componentDidMount();
        void this.props.oContext.socket.getState('system.adapter.admin.0.alive').then(result => console.log(result));
    }

    buttonHandler = (): void => {
        window.alert('button event');
    };

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr!);

        return (
            <>
                <Button
                    style={styles.button}
                    color="secondary"
                    variant="contained"
                    onClick={this.buttonHandler}
                >
                    Example Button
                </Button>
                <ColorPicker
                    value={value}
                    onChange={color => {
                        void this.onChange(this.props.attr!, color);
                    }}
                />
            </>
        );
    }
}
