import React from 'react';
import { Icon } from '../../components/Icon';
import { theme } from '../../style/theme';

export interface PopupHeaderProps {
    title: string;
    /** glyph of the entity icon, none when empty */
    icon?: string;
    /** css colour of the icon */
    iconColor?: string;
    /**
     * `left` (default): icon at the left, title next to it like popupShutter2, popupFan, …;
     * `center`: no icon, the title centred over the stage (popupLight)
     */
    titleAlign?: 'left' | 'center';
    /** the X at the right */
    onClose: () => void;
}

/** Height of the popup header in stage pixels */
export const POPUP_HEADER_HEIGHT = 60;
/** centre of the X of every popup on the HMI */
export const CLOSE_CENTER = { x: 421, y: 34 } as const;
/** centre of the entity icon of the popups with a left aligned title */
export const HEADER_ICON_CENTER = { x: 33, y: 38 } as const;
/** left edge of a left aligned title */
export const HEADER_TITLE_LEFT = 90;
/** vertical centre of the title */
export const HEADER_TITLE_CENTER_Y = 36;
/** font size of the small texts of the popups (labels, buttons, titles) */
export const POPUP_FONT_SIZE = 18;
export const CLOSE_ICON_SIZE = 30;
export const HEADER_ICON_SIZE = 28;
/** tap area of the icon buttons */
export const TAP_SIZE = 48;

/**
 * The X of every popup, at the position of the HMI (the HMI sends `bExit` for it).
 */
export class CloseButton extends React.Component<{ onClose: () => void }> {
    render(): React.JSX.Element {
        return (
            <div
                data-close=""
                onClick={this.props.onClose}
                style={{
                    position: 'absolute',
                    left: CLOSE_CENTER.x - TAP_SIZE / 2,
                    top: CLOSE_CENTER.y - TAP_SIZE / 2,
                    width: TAP_SIZE,
                    height: TAP_SIZE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                }}
            >
                <Icon
                    name="close"
                    size={CLOSE_ICON_SIZE}
                    color={theme.foreground}
                />
            </div>
        );
    }
}

/**
 * The head of a popup: entity icon at the left, name, X at the right - placed like on
 * the HMI (icon centre 33/38, title at x 90, X centre 421/34).
 */
export class PopupHeader extends React.Component<PopupHeaderProps> {
    render(): React.JSX.Element {
        const { title, icon, iconColor = theme.foreground, titleAlign = 'left', onClose } = this.props;
        const centered = titleAlign === 'center';
        return (
            <div
                data-popup-header=""
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: POPUP_HEADER_HEIGHT }}
            >
                {icon && !centered ? (
                    <div
                        style={{
                            position: 'absolute',
                            left: HEADER_ICON_CENTER.x - TAP_SIZE / 2,
                            top: HEADER_ICON_CENTER.y - TAP_SIZE / 2,
                            width: TAP_SIZE,
                            height: TAP_SIZE,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon
                            glyph={icon}
                            size={HEADER_ICON_SIZE}
                            color={iconColor}
                        />
                    </div>
                ) : null}
                <div
                    data-title=""
                    style={
                        centered
                            ? {
                                  position: 'absolute',
                                  // the HMI centres the title at x 221 (a text box that leaves room for the X)
                                  left: 40,
                                  width: 362,
                                  top: HEADER_TITLE_CENTER_Y - 18,
                                  height: 36,
                                  lineHeight: '36px',
                                  fontSize: 24,
                                  textAlign: 'center',
                                  color: theme.foreground,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                              }
                            : {
                                  position: 'absolute',
                                  left: HEADER_TITLE_LEFT,
                                  right: 480 - (CLOSE_CENTER.x - TAP_SIZE / 2),
                                  top: HEADER_TITLE_CENTER_Y - 14,
                                  height: 28,
                                  lineHeight: '28px',
                                  fontSize: POPUP_FONT_SIZE,
                                  color: theme.foreground,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                              }
                    }
                >
                    {title}
                </div>
                <CloseButton onClose={onClose} />
            </div>
        );
    }
}
