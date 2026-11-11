import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss, color565ToRgb } from '../../protocol/color';
import type { PanelModel } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupIconColor565, popupTitle } from '../popupSlider/fields';
import { popupFrame } from '../popupSlider/layout';
import { PopupHeader, TAP_SIZE } from '../popupSlider/PopupHeader';
import { Toggle } from '../popupSlider/Toggle';
import { ColorWheel, WHEEL_SIZE } from './ColorWheel';
import { LIGHT_SLIDER_HEIGHT, LightSlider } from './LightSlider';
import type { PopupLightModel } from './parse';

interface PopupLightState {
    /** colour wheel instead of the colour temperature slider (only when both exist) */
    showWheel: boolean;
}

/** positions of the elements of popupLight in stage pixels */
export interface LightGeometry {
    toggle: { left: number; top: number };
    palette: { x: number; y: number };
    effects: { x: number; y: number };
    brightness: { left: number; top: number };
    colorTemp: { left: number; top: number };
    /** height of both vertical sliders */
    sliderHeight: number;
    wheel: { x: number; y: number; size: number };
}

/**
 * The layout of popupLight per model. Landscape like the HMI (eu: switch at 16/90, palette and
 * effect icons below it at x 38, brightness slider at 88/64, colour temperature at 262/64, both
 * 100 x 240, colour wheel 160 px centred at 313/185), centred on `web-l`. Portrait (us-p,
 * web-p): both sliders side by side and taller (300 / 400 px), the colour wheel (140 px) in
 * place of the colour temperature slider, switch, palette and effect icons in one row below.
 *
 * @param model the panel model the popup sees
 */
export function lightGeometry(model: PanelModel): LightGeometry {
    const { height, portrait, euLeft } = popupFrame(model);
    if (portrait) {
        const tall = height >= 640;
        const top = tall ? 90 : 80;
        const sliderHeight = tall ? 400 : 300;
        const controlsY = tall ? 570 : 430;
        return {
            toggle: { left: 40, top: controlsY - 12 },
            palette: { x: 160, y: controlsY },
            effects: { x: 250, y: controlsY },
            brightness: { left: 40, top },
            colorTemp: { left: 180, top },
            sliderHeight,
            wheel: { x: 230, y: top + sliderHeight / 2, size: 140 },
        };
    }
    return {
        toggle: { left: euLeft + 16, top: 90 },
        palette: { x: euLeft + 38, y: 172 },
        effects: { x: euLeft + 38, y: 240 },
        brightness: { left: euLeft + 88, top: 64 },
        colorTemp: { left: euLeft + 262, top: 64 },
        sliderHeight: LIGHT_SLIDER_HEIGHT,
        wheel: { x: euLeft + 313, y: 185, size: WHEEL_SIZE },
    };
}
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
        const g = lightGeometry(this.props.global.model);
        const elements: React.JSX.Element[] = [];

        if (model.power !== undefined) {
            elements.push(
                <div
                    key="power"
                    style={{ position: 'absolute', left: g.toggle.left, top: g.toggle.top }}
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
                    g.palette,
                    'palette',
                    theme.foreground,
                    canSwitchView ? (): void => this.setState({ showWheel: !this.state.showWheel }) : undefined,
                ),
            );
        }
        if (model.effectList) {
            elements.push(
                this.renderIconButton('effects', 'data-effects', g.effects, 'playlist-play', theme.foreground, () =>
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
                    style={{ position: 'absolute', left: g.brightness.left, top: g.brightness.top }}
                >
                    <LightSlider
                        name="brightness"
                        height={g.sliderHeight}
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
                        left: g.wheel.x - g.wheel.size / 2,
                        top: g.wheel.y - g.wheel.size / 2,
                    }}
                >
                    <ColorWheel
                        size={g.wheel.size}
                        color={model.color !== undefined ? color565ToRgb(model.color) : undefined}
                        onPick={(x, y, size): void => press(id, 'colorWheel', `${x}|${y}|${size}`)}
                    />
                </div>,
            );
        } else if (hasCt) {
            elements.push(
                <div
                    key="colorTemp"
                    style={{ position: 'absolute', left: g.colorTemp.left, top: g.colorTemp.top }}
                >
                    <LightSlider
                        name="colorTemp"
                        height={g.sliderHeight}
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
                    model={this.props.global.model}
                />
                {elements}
            </div>
        );
    }
}
