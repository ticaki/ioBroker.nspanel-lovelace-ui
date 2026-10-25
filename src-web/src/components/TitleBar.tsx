import React from 'react';
import { color565ToCss } from '../protocol/color';
import { isEmptyEntity } from '../protocol/split';
import type { Entity6, Navigation, PanelModel } from '../protocol/types';
import { contentWidth, theme } from '../style/theme';
import { Icon } from './Icon';

export interface TitleBarProps {
    title: string;
    navigation: Navigation;
    /** `press(id, 'button')` is sent for the navigation entities (bSubPrev, bUp, bSubNext, bHome, …) */
    press: (id: string, action: string, value?: string | number) => void;
    /** the panel model, decides the width the title bar is laid out in (`eu` by default) */
    model?: PanelModel;
    /** css colour of the title, white by default */
    titleColor?: string;
    /** font size of the title in stage pixels, the 32 px Nextion font (24) by default */
    titleSize?: number;
}

/**
 * The head of every card: navigation icon left, title centred, navigation icon right. Laid out
 * like the HMI (eu): icons of 43 px centred at x 33 / 414, y 42, the title centred at x 223
 * with a cap height of 17 px. The card draws its content below `theme.titleBarHeight`.
 */
export class TitleBar extends React.Component<TitleBarProps> {
    private renderNav(entity: Entity6, side: 'left' | 'right', width: number): React.JSX.Element {
        const empty = isEmptyEntity(entity) || entity.icon === '';
        const box = 2 * theme.navIconCenter;
        return (
            <div
                data-nav={side}
                style={{
                    position: 'absolute',
                    left: side === 'left' ? 0 : width - box,
                    top: theme.titleBarCenter - box / 2,
                    width: box,
                    height: box,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: empty ? 'default' : 'pointer',
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
        const {
            title,
            navigation,
            model = 'eu',
            titleColor = theme.foreground,
            titleSize = theme.titleFontSize,
        } = this.props;
        const width = contentWidth(model);
        const box = 2 * theme.navIconCenter;
        const line = 2 * (theme.titleBarHeight - theme.titleBarCenter) + 20;
        return (
            <div
                data-titlebar=""
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width,
                    height: theme.titleBarHeight,
                }}
            >
                {this.renderNav(navigation.left, 'left', width)}
                <div
                    data-role="title"
                    style={{
                        position: 'absolute',
                        left: box,
                        width: width - 2 * box,
                        // the cap centre of the title sits 1 px above the icon centre
                        top: theme.titleBarCenter - 1 - line / 2,
                        height: line,
                        lineHeight: `${line}px`,
                        textAlign: 'center',
                        color: titleColor,
                        fontSize: titleSize,
                        fontWeight: 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}
                >
                    {title}
                </div>
                {this.renderNav(navigation.right, 'right', width)}
            </div>
        );
    }
}
