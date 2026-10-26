import React from 'react';
import { glyphToName, iconPath } from '../icons/iconData';

export { glyphToName, iconPath } from '../icons/iconData';

export interface IconProps {
    /** glyph as sent in the payload (private use character) */
    glyph?: string;
    /** MDI name, used when no glyph is given */
    name?: string;
    /** width and height in stage pixels */
    size?: number;
    /** css colour */
    color?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

/**
 * Draws a MDI icon for a glyph of the HMI font. A glyph that is not an icon (plain text,
 * e.g. `<`) is shown as text, an unknown private use glyph as a small placeholder box.
 */
export class Icon extends React.Component<IconProps> {
    render(): React.JSX.Element {
        const { glyph, size = 24, color = '#ffffff', className, style, onClick } = this.props;
        const name = this.props.name ?? (glyph ? glyphToName(glyph) : undefined);
        const d = name ? iconPath(name) : undefined;
        const box: React.CSSProperties = {
            display: 'inline-block',
            width: size,
            height: size,
            lineHeight: `${size}px`,
            verticalAlign: 'middle',
            flex: '0 0 auto',
            ...style,
        };
        if (d) {
            return (
                <svg
                    viewBox="0 0 24 24"
                    width={size}
                    height={size}
                    className={className}
                    style={box}
                    onClick={onClick}
                    aria-label={name}
                >
                    <path
                        d={d}
                        fill={color}
                    />
                </svg>
            );
        }
        const text = glyph ?? '';
        const unknownIcon = name !== undefined || /[-\uDB80-\uDBFF]/.test(text);
        return (
            <span
                className={className}
                style={{
                    ...box,
                    color,
                    fontSize: size * 0.8,
                    textAlign: 'center',
                    border: unknownIcon ? `1px dashed ${color}` : undefined,
                    boxSizing: 'border-box',
                    opacity: unknownIcon ? 0.5 : 1,
                }}
                onClick={onClick}
                title={unknownIcon ? `unknown icon ${name ?? text.codePointAt(0)?.toString(16) ?? ''}` : undefined}
            >
                {unknownIcon ? '?' : text}
            </span>
        );
    }
}
