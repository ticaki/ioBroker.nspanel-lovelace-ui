import React from 'react';
import { Icon } from '../../components/Icon';
import { theme } from '../../style/theme';

export interface PopupHeaderProps {
    title: string;
    /** glyph of the entity icon, none when empty */
    icon?: string;
    /** css colour of the icon */
    iconColor?: string;
    /** the X at the right */
    onClose: () => void;
}

/** Height of the popup header in stage pixels */
export const POPUP_HEADER_HEIGHT = 60;

/**
 * The head of every popup: entity icon at the left, name, X at the right
 * (the HMI sends `bExit` for it).
 */
export class PopupHeader extends React.Component<PopupHeaderProps> {
    render(): React.JSX.Element {
        const { title, icon, iconColor = theme.foreground, onClose } = this.props;
        return (
            <div
                data-popup-header=""
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: POPUP_HEADER_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    paddingLeft: 16,
                }}
            >
                <div style={{ width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon ? (
                        <Icon
                            glyph={icon}
                            size={32}
                            color={iconColor}
                        />
                    ) : null}
                </div>
                <div
                    style={{
                        flex: '1 1 auto',
                        paddingLeft: 16,
                        fontSize: 22,
                        fontWeight: 400,
                        color: theme.foreground,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {title}
                </div>
                <div
                    data-close=""
                    onClick={onClose}
                    style={{
                        width: POPUP_HEADER_HEIGHT,
                        height: POPUP_HEADER_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flex: '0 0 auto',
                    }}
                >
                    <Icon
                        name="close"
                        size={30}
                        color={theme.foreground}
                    />
                </div>
            </div>
        );
    }
}
