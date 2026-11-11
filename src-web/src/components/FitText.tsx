import React from 'react';

/** smallest factor the font size is reduced to - below that the text is cut like on the HMI */
export const FIT_MIN_SCALE = 0.5;

/**
 * Factor (<= 1, >= {@link FIT_MIN_SCALE}) a text of `natural` px width has to be scaled with to fit into `available` px.
 *
 * @param natural width of the text in its unscaled font size
 * @param available width of the box
 */
export function fitScale(natural: number, available: number): number {
    if (natural <= 0 || available <= 0 || natural <= available) {
        return 1;
    }
    return Math.max(FIT_MIN_SCALE, available / natural);
}

interface FitTextProps {
    /** the text, one line */
    text: string;
    /** position and font of the box; `width` and `fontSize` are required for the fitting */
    style: React.CSSProperties & { fontSize: number };
    /** `data-role` of the box */
    role?: string;
}

interface FitTextState {
    scale: number;
}

/**
 * One line of text in an absolutely positioned box that reduces its font size until the text fits into the
 * width of the box (a long date or a wide value would otherwise be cut off or run into the neighbour). The
 * HMI cuts such texts at the field; the browser has the room to show them completely.
 */
export class FitText extends React.Component<FitTextProps, FitTextState> {
    private readonly box = React.createRef<HTMLDivElement>();
    private readonly inner = React.createRef<HTMLSpanElement>();

    constructor(props: FitTextProps) {
        super(props);
        this.state = { scale: 1 };
    }

    componentDidMount(): void {
        this.measure();
    }

    componentDidUpdate(prev: FitTextProps): void {
        if (prev.text !== this.props.text || prev.style.fontSize !== this.props.style.fontSize) {
            if (this.state.scale !== 1) {
                this.setState({ scale: 1 });
                return;
            }
        }
        this.measure();
    }

    private measure(): void {
        const box = this.box.current;
        const inner = this.inner.current;
        if (!box || !inner) {
            return;
        }
        // the width of the text in the unscaled font
        const natural = inner.offsetWidth / this.state.scale;
        const scale = fitScale(natural, box.clientWidth);
        if (Math.abs(scale - this.state.scale) > 0.01) {
            this.setState({ scale });
        }
    }

    render(): React.JSX.Element | null {
        const { text, style, role } = this.props;
        if (text === '') {
            return null;
        }
        const { scale } = this.state;
        const fontSize = style.fontSize * scale;
        return (
            <div
                ref={this.box}
                data-role={role}
                style={{
                    position: 'absolute',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                    overflow: 'hidden',
                    ...style,
                    // a smaller font keeps the vertical centre of the line
                    fontSize,
                    paddingTop: scale < 1 ? Math.round((style.fontSize - fontSize) / 2) : undefined,
                }}
            >
                <span ref={this.inner}>{text}</span>
            </div>
        );
    }
}
