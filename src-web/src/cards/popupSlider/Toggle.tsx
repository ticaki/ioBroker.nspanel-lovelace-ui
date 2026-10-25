import React from 'react';
import { theme } from '../../style/theme';

export interface ToggleProps {
    on: boolean;
    /** called with the new state */
    onToggle: (on: boolean) => void;
    name?: string;
}

/** size of the switch in stage pixels (45 x 25 on the HMI) */
export const TOGGLE_WIDTH = 45;
export const TOGGLE_HEIGHT = 25;
const PILL_HEIGHT = 18;
const KNOB = 25;

/**
 * The on/off switch of the HMI: a flat pill with a bigger round knob that carries an
 * `I` (on, blue) or an `O` (off, grey).
 */
export class Toggle extends React.Component<ToggleProps> {
    render(): React.JSX.Element {
        const { on, onToggle, name } = this.props;
        return (
            <div
                data-toggle={name}
                data-on={on ? '1' : '0'}
                onClick={(): void => onToggle(!on)}
                style={{
                    position: 'relative',
                    width: TOGGLE_WIDTH,
                    height: TOGGLE_HEIGHT,
                    cursor: 'pointer',
                    flex: '0 0 auto',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: (TOGGLE_HEIGHT - PILL_HEIGHT) / 2,
                        height: PILL_HEIGHT,
                        borderRadius: PILL_HEIGHT / 2,
                        background: on ? '#0d4f73' : '#3a3a3a',
                        transition: 'background 0.15s',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: on ? TOGGLE_WIDTH - KNOB : 0,
                        width: KNOB,
                        height: KNOB,
                        borderRadius: '50%',
                        background: on ? theme.accent : '#6a6a6a',
                        transition: 'left 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                    }}
                >
                    {on ? (
                        <div style={{ width: 3, height: 12, background: '#b8c4cc', borderRadius: 1 }} />
                    ) : (
                        <div
                            style={{
                                width: 11,
                                height: 11,
                                borderRadius: '50%',
                                border: '2.5px solid #a8a8a8',
                                boxSizing: 'border-box',
                            }}
                        />
                    )}
                </div>
            </div>
        );
    }
}
