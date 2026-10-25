import React from 'react';
import { CardAlarm } from '../cardAlarm/CardAlarm';
import type { CardProps } from '../CardContract';
import type { CardUnlockModel } from './parse';

/** `cardUnlock` looks exactly like `cardAlarm` (see parse.ts of this module) */
export class CardUnlock extends React.Component<CardProps<CardUnlockModel>> {
    render(): React.JSX.Element {
        return <CardAlarm {...this.props} />;
    }
}
