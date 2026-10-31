import React from 'react';

/** Hold time after which a touch counts as a long press (`event,buttonPress3,…`) */
export const LONG_PRESS_MS = 600;

export interface PressableProps {
    onPress?: () => void;
    /**
     * when given, holding longer than {@link LONG_PRESS_MS} (or `longPressMs`) calls this instead of `onPress`.
     * Only touch areas with a `tmLP` timer in the HMI pass it: the grid tiles (cardGrid / cardGrid2 / cardGrid3)
     * and the entities of cardMedia / cardThermo2; without it a held touch is a normal press.
     */
    onLongPress?: () => void;
    /**
     * hold time in ms for `onLongPress`, default {@link LONG_PRESS_MS}. Pages pass the `tim` of their
     * `tmLP` timer in the HMI (cardMedia 500 ms, cardThermo2 300 ms).
     */
    longPressMs?: number;
    disabled?: boolean;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
    'data-role'?: string;
    'data-id'?: string;
}

interface PressableState {
    pressed: boolean;
}

/**
 * A touch area with short and long press. Uses pointer events so it works with mouse and
 * touch alike; the stage is scaled with css transforms, which pointer events handle fine.
 */
export class Pressable extends React.Component<PressableProps, PressableState> {
    private timer: ReturnType<typeof setTimeout> | undefined;
    private longFired = false;

    constructor(props: PressableProps) {
        super(props);
        this.state = { pressed: false };
    }

    componentWillUnmount(): void {
        this.clearTimer();
    }

    private clearTimer(): void {
        if (this.timer !== undefined) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    private readonly onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.props.disabled) {
            return;
        }
        e.stopPropagation();
        this.longFired = false;
        this.setState({ pressed: true });
        if (this.props.onLongPress) {
            this.clearTimer();
            this.timer = setTimeout(() => {
                this.timer = undefined;
                this.longFired = true;
                this.setState({ pressed: false });
                this.props.onLongPress?.();
            }, this.props.longPressMs ?? LONG_PRESS_MS);
        }
    };

    private readonly onPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.props.disabled || !this.state.pressed) {
            return;
        }
        e.stopPropagation();
        this.clearTimer();
        this.setState({ pressed: false });
        if (!this.longFired) {
            this.props.onPress?.();
        }
    };

    private readonly onPointerCancel = (): void => {
        this.clearTimer();
        if (this.state.pressed) {
            this.setState({ pressed: false });
        }
    };

    render(): React.JSX.Element {
        const { disabled, style, className, children } = this.props;
        const active = !disabled && (this.props.onPress !== undefined || this.props.onLongPress !== undefined);
        return (
            <div
                className={className}
                data-pressable={active ? '' : undefined}
                data-role={this.props['data-role']}
                data-id={this.props['data-id']}
                onPointerDown={active ? this.onPointerDown : undefined}
                onPointerUp={active ? this.onPointerUp : undefined}
                onPointerCancel={active ? this.onPointerCancel : undefined}
                onPointerLeave={active ? this.onPointerCancel : undefined}
                style={{
                    cursor: active ? 'pointer' : 'default',
                    opacity: this.state.pressed ? 0.6 : 1,
                    ...style,
                }}
            >
                {children}
            </div>
        );
    }
}
