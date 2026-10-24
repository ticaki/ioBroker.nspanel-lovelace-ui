import React from 'react';
import { theme } from '../../style/theme';

export interface ToggleProps {
    on: boolean;
    /** called with the new state */
    onToggle: (on: boolean) => void;
    name?: string;
}

/** The on/off switch of the HMI: a pill with a knob, blue when on, grey when off */
export class Toggle extends React.Component<ToggleProps> {
    render(): React.JSX.Element {
        const { on, onToggle, name } = this.props;
        const width = 56;
        const height = 28;
        const knob = 22;
        return (
            <div
                data-toggle={name}
                data-on={on ? '1' : '0'}
                onClick={(): void => onToggle(!on)}
                style={{
                    position: 'relative',
                    width,
                    height,
                    borderRadius: height / 2,
                    background: on ? 'rgba(26,143,227,0.45)' : '#4a4a4a',
                    cursor: 'pointer',
                    flex: '0 0 auto',
                    transition: 'background 0.15s',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: (height - knob) / 2,
                        left: on ? width - knob - 3 : 3,
                        width: knob,
                        height: knob,
                        borderRadius: '50%',
                        background: on ? theme.accent : theme.muted,
                        transition: 'left 0.15s',
                    }}
                />
            </div>
        );
    }
}
