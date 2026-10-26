import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss, color565ToRgb } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupIconColor565, popupTitle } from '../popupSlider/fields';
import { PopupHeader, TAP_SIZE } from '../popupSlider/PopupHeader';
import { Toggle } from '../popupSlider/Toggle';
import { ColorWheel, WHEEL_SIZE } from './ColorWheel';
import { LightSlider } from './LightSlider';
import type { PopupLightModel } from './parse';

interface PopupLightState {
    /** colour wheel instead of the colour temperature slider (only when both exist) */
    showWheel: boolean;
}

/** positions of the HMI (stage pixels) */
const TOGGLE_POS = { left: 16, top: 90 };
const PALETTE_CENTER = { x: 38, y: 172 };
const EFFECTS_CENTER = { x: 38, y: 240 };
const BRIGHTNESS_POS = { left: 88, top: 64 };
const CT_POS = { left: 262, top: 64 };
const WHEEL_CENTER = { x: 313, y: 185 };
/**
 * Colour temperature slider: 0 (cold) at the bottom, 100 (warm) at the top like
 * `getSliderCTFromValue`; the picture of the HMI runs from a cool grey-blue at the top
 * to orange and red at the bottom.
 */
const CT_TRACK = 'linear-gradient(180deg, #aeb6c8 0%, #c4b9ac 35%, #cf9a5c 65%, #d46a10 88%, #e02000 100%)';

/**
 * `popupLight` / `popupLightNew`: switch, brightness slider, colour temperature slider and
 * colour wheel, each only when the adapter enabled it. Layout like the HMI: the title is
 * centred, the switch sits at the left, the sliders are vertical (100 x 240) and the
 * colour wheel (160 px) replaces the colour temperature slider; the palette icon below
 * the switch toggles between both. Events:
 * `OnOff,1|0`, `brightnessSlider,<0-100>`, `colorTempSlider,<0-100>`, `colorWheel,x|y|160`,
 * `bExit` for the X and `pageOpenDetail,popupInSel,<id>` for the effect list button.
 */
export class PopupLight extends React.Component<CardProps<PopupLightModel>, PopupLightState> {
    constructor(props: CardProps<PopupLightModel>) {
        super(props);
        this.state = { showWheel: true };
    }

    private get id(): string {
        return popupEntityId(this.props.ctx, this.props.model.entityName);
    }

    private renderIconButton(
        key: string,
        dataAttr: string,
        centre: { x: number; y: number },
        iconName: string,
        color: string,
        onClick: (() => void) | undefined,
    ): React.JSX.Element {
        const attrs: Record<string, string> = { [dataAttr]: '' };
        return (
            <div
                key={key}
                {...attrs}
                onClick={onClick}
                style={{
                    position: 'absolute',
                    left: centre.x - TAP_SIZE / 2,
                    top: centre.y - TAP_SIZE / 2,
                    width: TAP_SIZE,
                    height: TAP_SIZE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: onClick ? 'pointer' : 'default',
                }}
            >
                <Icon
                    name={iconName}
                    size={26}
                    color={color}
                />
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, press } = this.props;
        const id = this.id;
        const sliderColor = model.color !== undefined ? color565ToCss(model.color) : undefined;
        const hasCt = model.colorTemp !== undefined;
        const hasBrightness = model.brightness !== undefined;
        const wheel = model.hueMode && (this.state.showWheel || !hasCt);
        const canSwitchView = model.hueMode && hasCt;
        const elements: React.JSX.Element[] = [];

        if (model.power !== undefined) {
            elements.push(
                <div
                    key="power"
                    style={{ position: 'absolute', left: TOGGLE_POS.left, top: TOGGLE_POS.top }}
                >
                    <Toggle
                        name="power"
                        on={model.power}
                        onToggle={(on): void => press(id, 'OnOff', on ? 1 : 0)}
                    />
                </div>,
            );
        }
        if (model.hueMode) {
            elements.push(
                this.renderIconButton(
                    'palette',
                    'data-palette',
                    PALETTE_CENTER,
                    'palette',
                    theme.foreground,
                    canSwitchView ? (): void => this.setState({ showWheel: !this.state.showWheel }) : undefined,
                ),
            );
        }
        if (model.effectList) {
            elements.push(
                this.renderIconButton(
                    'effects',
                    'data-effects',
                    EFFECTS_CENTER,
                    'playlist-play',
                    theme.foreground,
                    () =>
                        this.props.openPopup(
                            'popupInSel',
                            id,
                            popupTitle(ctx, model.entityName),
                            model.icon,
                            model.color ?? popupIconColor565(ctx),
                        ),
                ),
            );
        }
        if (hasBrightness) {
            elements.push(
                <div
                    key="brightness"
                    style={{ position: 'absolute', left: BRIGHTNESS_POS.left, top: BRIGHTNESS_POS.top }}
                >
                    <LightSlider
                        name="brightness"
                        value={model.brightness ?? 0}
                        fill={sliderColor}
                        onCommit={(v): void => press(id, 'brightnessSlider', v)}
                    />
                </div>,
            );
        }
        if (wheel) {
            elements.push(
                <div
                    key="wheel"
                    style={{
                        position: 'absolute',
                        left: WHEEL_CENTER.x - WHEEL_SIZE / 2,
                        top: WHEEL_CENTER.y - WHEEL_SIZE / 2,
                    }}
                >
                    <ColorWheel
                        color={model.color !== undefined ? color565ToRgb(model.color) : undefined}
                        onPick={(x, y, size): void => press(id, 'colorWheel', `${x}|${y}|${size}`)}
                    />
                </div>,
            );
        } else if (hasCt) {
            elements.push(
                <div
                    key="colorTemp"
                    style={{ position: 'absolute', left: CT_POS.left, top: CT_POS.top }}
                >
                    <LightSlider
                        name="colorTemp"
                        value={model.colorTemp ?? 0}
                        track={CT_TRACK}
                        onCommit={(v): void => press(id, 'colorTempSlider', v)}
                    />
                </div>,
            );
        }

        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, color: theme.foreground }}
            >
                <PopupHeader
                    title={popupTitle(ctx, model.entityName)}
                    titleAlign="center"
                    onClose={(): void => press(id, 'bExit')}
                />
                {elements}
            </div>
        );
    }
}
