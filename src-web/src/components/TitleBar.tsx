import React from 'react';
import { color565ToCss } from '../protocol/color';
import { isEmptyEntity } from '../protocol/split';
import type { Entity6, Navigation } from '../protocol/types';
import { theme } from '../style/theme';
import { Icon } from './Icon';

export interface TitleBarProps {
    title: string;
    navigation: Navigation;
    /** `press(id, 'button')` is sent for the navigation entities (bSubPrev, bUp, bSubNext, bHome, …) */
    press: (id: string, action: string, value?: string | number) => void;
    /** css colour of the title, white by default */
    titleColor?: string;
    /** font size of the title in stage pixels */
    titleSize?: number;
}

/**
 * The head of every card: navigation icon left, title centred, navigation icon right.
 * Height is `theme.titleBarHeight`, the card draws its content below.
 */
export class TitleBar extends React.Component<TitleBarProps> {
    private renderNav(entity: Entity6, side: 'left' | 'right'): React.JSX.Element {
        const empty = isEmptyEntity(entity) || entity.icon === '';
        return (
            <div
                data-nav={side}
                style={{
                    width: theme.titleBarHeight,
                    height: theme.titleBarHeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: empty ? 'default' : 'pointer',
                    flex: '0 0 auto',
                }}
                onClick={empty ? undefined : (): void => this.props.press(entity.id, 'button')}
            >
                {empty ? null : (
                    <Icon
                        glyph={entity.icon}
                        size={theme.navIconSize}
                        color={color565ToCss(entity.iconColor)}
                    />
                )}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { title, navigation, titleColor = theme.foreground, titleSize = 28 } = this.props;
        return (
            <div
                data-titlebar=""
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: theme.titleBarHeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    paddingLeft: 4,
                    paddingRight: 4,
                }}
            >
                {this.renderNav(navigation.left, 'left')}
                <div
                    style={{
                        flex: '1 1 auto',
                        textAlign: 'center',
                        color: titleColor,
                        fontSize: titleSize,
                        fontWeight: 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {title}
                </div>
                {this.renderNav(navigation.right, 'right')}
            </div>
        );
    }
}
