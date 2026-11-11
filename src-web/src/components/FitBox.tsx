import React from 'react';
import { fitScale } from './FitText';

interface FitBoxProps {
    /** the content; its first element is measured (`scrollWidth` against `clientWidth`) */
    children: React.ReactNode;
}

interface FitBoxState {
    scale: number;
    /** css transform origin: the left edge and the vertical centre of the content */
    origin: string;
}

/**
 * Scales its content down (from its left edge) when the first child element is wider than its own box - a value
 * in a big font (cardGrid3 `useValue`, e.g. `21,4°C` in the 80 px font) would otherwise be cut at the tile or run
 * into the neighbour tile. The box fills its positioned parent.
 */
export class FitBox extends React.Component<FitBoxProps, FitBoxState> {
    private readonly ref = React.createRef<HTMLDivElement>();

    constructor(props: FitBoxProps) {
        super(props);
        this.state = { scale: 1, origin: '0 50%' };
    }

    componentDidMount(): void {
        this.measure();
    }

    componentDidUpdate(): void {
        this.measure();
    }

    private measure(): void {
        const content = this.ref.current?.firstElementChild;
        if (!(content instanceof HTMLElement)) {
            return;
        }
        // transforms do not change the layout sizes, the ratio is that of the unscaled content
        const scale = fitScale(content.scrollWidth, content.clientWidth);
        // a too wide content starts at the left edge of its box: scaled from there it fills the box exactly
        const origin = `${content.offsetLeft}px ${Math.round(content.offsetTop + content.offsetHeight / 2)}px`;
        if (Math.abs(scale - this.state.scale) > 0.01 || origin !== this.state.origin) {
            this.setState({ scale, origin });
        }
    }

    render(): React.JSX.Element {
        const { scale } = this.state;
        return (
            <div
                ref={this.ref}
                style={{
                    position: 'absolute',
                    inset: 0,
                    transform: scale < 1 ? `scale(${scale})` : undefined,
                    transformOrigin: this.state.origin,
                }}
            >
                {this.props.children}
            </div>
        );
    }
}
