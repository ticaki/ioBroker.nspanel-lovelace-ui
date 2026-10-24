import React from 'react';
import type { RGB } from '../../protocol/color';

/** Diameter the HMI uses for the wheel; `Color.pos_to_color` of the adapter assumes a radius of 80 */
export const WHEEL_SIZE = 160;

export interface ColorWheelProps {
    /** diameter in stage pixels, 160 like the HMI */
    size?: number;
    /** current colour, draws the marker */
    color?: RGB;
    /** the user tapped the wheel: x, y in wheel pixels (0..size) and the diameter */
    onPick: (x: number, y: number, size: number) => void;
}

/**
 * Colour of a wheel position, same maths as `Color.pos_to_color` in
 * `src/lib/const/Color.ts`: hue = angle (counter-clockwise, red at the right),
 * saturation = distance from the centre.
 */
export function wheelPositionToColor(x: number, y: number, size: number): RGB {
    const r = size / 2;
    const nx = Math.round(((x - r) / r) * 100) / 100;
    const ny = Math.round(((r - y) / r) * 100) / 100;
    const dist = Math.sqrt(nx * nx + ny * ny);
    const sat = dist > 1 ? 0 : dist;
    const hue = (360 + (180 * Math.atan2(ny, nx)) / Math.PI) % 360;
    return hsvToRgb(hue, sat, 1);
}

/** Position of a colour on the wheel (inverse of {@link wheelPositionToColor}) */
export function colorToWheelPosition(color: RGB, size: number): { x: number; y: number } {
    const { hue, sat } = rgbToHueSat(color);
    const r = size / 2;
    const rad = (hue * Math.PI) / 180;
    return { x: r + sat * r * Math.cos(rad), y: r - sat * r * Math.sin(rad) };
}

function hsvToRgb(hue: number, saturation: number, value: number): RGB {
    const c = value * saturation;
    const h = (hue % 360) / 60;
    const x = c * (1 - Math.abs((h % 2) - 1));
    const m = value - c;
    let rgb: [number, number, number];
    switch (Math.floor(h)) {
        case 0:
            rgb = [c, x, 0];
            break;
        case 1:
            rgb = [x, c, 0];
            break;
        case 2:
            rgb = [0, c, x];
            break;
        case 3:
            rgb = [0, x, c];
            break;
        case 4:
            rgb = [x, 0, c];
            break;
        default:
            rgb = [c, 0, x];
            break;
    }
    return {
        r: Math.round((rgb[0] + m) * 255),
        g: Math.round((rgb[1] + m) * 255),
        b: Math.round((rgb[2] + m) * 255),
    };
}

function rgbToHueSat(color: RGB): { hue: number; sat: number } {
    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const sat = max === 0 ? 0 : delta / max;
    let hue = 0;
    if (delta !== 0) {
        if (max === r) {
            hue = 60 * (((g - b) / delta) % 6);
        } else if (max === g) {
            hue = 60 * ((b - r) / delta + 2);
        } else {
            hue = 60 * ((r - g) / delta + 4);
        }
    }
    return { hue: (hue + 360) % 360, sat };
}

/**
 * The colour wheel of the light popup: hue around (red at the right, counter-clockwise like
 * the adapter's `pos_to_color`), white in the centre. A tap reports the wheel coordinates,
 * the display sends them as `colorWheel,x|y|size`.
 */
export class ColorWheel extends React.Component<ColorWheelProps> {
    private readonly root = React.createRef<HTMLDivElement>();

    private readonly onPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
        const el = this.root.current;
        if (!el) {
            return;
        }
        const size = this.props.size ?? WHEEL_SIZE;
        const rect = el.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * size);
        const y = Math.round(((e.clientY - rect.top) / rect.height) * size);
        const r = size / 2;
        if ((x - r) * (x - r) + (y - r) * (y - r) > r * r) {
            return;
        }
        this.props.onPick(x, y, size);
    };

    render(): React.JSX.Element {
        const size = this.props.size ?? WHEEL_SIZE;
        const marker = this.props.color ? colorToWheelPosition(this.props.color, size) : undefined;
        return (
            <div
                ref={this.root}
                data-colorwheel=""
                onPointerUp={this.onPointerUp}
                style={{
                    position: 'relative',
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    touchAction: 'none',
                    flex: '0 0 auto',
                    // clockwise from the right: red, magenta, blue, cyan, green, yellow = hue decreasing,
                    // which is the counter-clockwise hue of pos_to_color
                    background:
                        'radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0.85) 10%, rgba(255,255,255,0) 72%), ' +
                        'conic-gradient(from 90deg, #ff0000, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)',
                }}
            >
                {marker ? (
                    <div
                        data-marker=""
                        style={{
                            position: 'absolute',
                            left: marker.x - 7,
                            top: marker.y - 7,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            border: '2px solid #000',
                            boxShadow: '0 0 0 1px #fff',
                            boxSizing: 'border-box',
                            background: `rgb(${this.props.color?.r ?? 255}, ${this.props.color?.g ?? 255}, ${this.props.color?.b ?? 255})`,
                            pointerEvents: 'none',
                        }}
                    />
                ) : null}
            </div>
        );
    }
}
