import React from 'react';
import { withTheme } from '@mui/styles';
import PageConfigManager from './PageConfigManager';
import type { ConfigGenericProps } from '@iobroker/json-config';

// Wrapper-Komponente für Backward-Kompatibilität
class UnlockPage extends React.Component<ConfigGenericProps & { theme?: any }> {
    render(): React.JSX.Element {
        return <PageConfigManager {...this.props} />;
    }
}

export default withTheme(UnlockPage);
