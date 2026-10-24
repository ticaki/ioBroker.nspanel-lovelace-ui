import React from 'react';
import { StartupPage, STARTUP_MEDIA_URL } from '../../components/StartupPage';
import type { CardProps } from '../CardContract';
import type { PageStartupModel } from './parse';

export class PageStartup extends React.Component<CardProps<PageStartupModel>> {
    render(): React.JSX.Element {
        return <StartupPage mediaUrl={STARTUP_MEDIA_URL} />;
    }
}
