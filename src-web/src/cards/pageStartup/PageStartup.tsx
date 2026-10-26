import React from 'react';
import { StartupPage } from '../../components/StartupPage';
import type { CardProps } from '../CardContract';
import type { PageStartupModel } from './parse';

export class PageStartup extends React.Component<CardProps<PageStartupModel>> {
    render(): React.JSX.Element {
        return <StartupPage model={this.props.global.model} />;
    }
}
