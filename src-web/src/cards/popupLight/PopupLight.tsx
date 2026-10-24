import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss, color565ToRgb } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupTitle } from '../popupSlider/fields';
import { PopupHeader, POPUP_HEADER_HEIGHT } from '../popupSlider/PopupHeader';
import { Slider } from '../popupSlider/Slider';
import { Toggle } from '../popupSlider/Toggle';
import { ColorWheel, WHEEL_SIZE } from './ColorWheel';
import type { PopupLightModel } from './parse';

interface PopupLightState {
    /** colour wheel instead of the colour temperature slider (only when both exist) */
    showWheel: boolean;
}

const LEFT = 20;
const SLIDER_LENGTH = 380;
/** 0 = cold (blue) … 100 = warm (orange), see `getSliderCTFromValue` in the adapter */
const CT_TRACK = 'linear-gradient(90deg, #7fb2ff 0%, #ffffff 50%, #ffb347 100%)';

/**
 * `popupLight` / `popupLightNew`: switch, brightness slider, colour temperature slider and
 * colour wheel, each only when the adapter enabled it. Events:
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

    private renderLabel(text: string, top: number, left = LEFT): React.JSX.Element {
        return (
            <div
                style={{
                    position: 'absolute',
                    left,
                    top,
                    fontSize: 18,
                    lineHeight: '24px',
                    color: theme.foreground,
                    whiteSpace: 'nowrap',
                }}
            >
                {text}
            </div>
        );
    }

    private renderSliderRow(
        name: string,
        iconName: string,
        top: number,
        value: number,
        onCommit: (v: number) => void,
        track?: string,
    ): React.JSX.Element {
        return (
            <div
                style={{
                    position: 'absolute',
                    left: LEFT,
                    top,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                }}
            >
                <Icon
                    name={iconName}
                    size={28}
                    color={theme.foreground}
                />
                <Slider
                    name={name}
                    value={value}
                    min={0}
                    max={100}
                    length={SLIDER_LENGTH}
                    track={track}
                    trackThickness={track ? 10 : 4}
                    knobColor={track ? '#ffffff' : undefined}
                    onCommit={onCommit}
                />
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, press } = this.props;
        const id = this.id;
        const color = model.color !== undefined ? color565ToCss(model.color) : theme.foreground;
        const hasCt = model.colorTemp !== undefined;
        const hasBrightness = model.brightness !== undefined;
        const wheel = model.hueMode && (this.state.showWheel || !hasCt);
        const canSwitchView = model.hueMode && hasCt;
        const elements: React.JSX.Element[] = [];

        // row below the header: colour label + palette (left), effect list and switch (right)
        const rowTop = POPUP_HEADER_HEIGHT + 10;
        if (model.hueMode) {
            elements.push(
                <div
                    key="color"
                    style={{ position: 'absolute', left: LEFT, top: rowTop, display: 'flex', alignItems: 'center' }}
                >
                    <span style={{ fontSize: 18, color: theme.foreground, marginRight: 16 }}>{model.colorLabel}</span>
                    <div
                        data-palette=""
                        onClick={
                            canSwitchView ? (): void => this.setState({ showWheel: !this.state.showWheel }) : undefined
                        }
                        style={{ cursor: canSwitchView ? 'pointer' : 'default', display: 'flex' }}
                    >
                        <Icon
                            name="palette"
                            size={28}
                            color={wheel || !canSwitchView ? theme.foreground : theme.accent}
                        />
                    </div>
                </div>,
            );
        }
        if (model.power !== undefined) {
            elements.push(
                <div
                    key="power"
                    style={{ position: 'absolute', right: LEFT, top: rowTop - 2 }}
                >
                    <Toggle
                        name="power"
                        on={model.power}
                        onToggle={(on): void => press(id, 'OnOff', on ? 1 : 0)}
                    />
                </div>,
            );
        }
        if (model.effectList) {
            elements.push(
                <div
                    key="effects"
                    data-effects=""
                    onClick={(): void =>
                        this.props.openPopup('popupInSel', id, popupTitle(ctx, model.entityName), model.icon)
                    }
                    style={{
                        position: 'absolute',
                        right: LEFT + 76,
                        top: rowTop - 6,
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <Icon
                        name="playlist-play"
                        size={30}
                        color={theme.foreground}
                    />
                </div>,
            );
        }

        if (wheel) {
            const wheelTop = POPUP_HEADER_HEIGHT + 4;
            elements.push(
                <div
                    key="wheel"
                    style={{ position: 'absolute', left: (480 - WHEEL_SIZE) / 2, top: wheelTop }}
                >
                    <ColorWheel
                        color={model.color !== undefined ? color565ToRgb(model.color) : undefined}
                        onPick={(x, y, size): void => press(id, 'colorWheel', `${x}|${y}|${size}`)}
                    />
                </div>,
            );
            if (hasBrightness) {
                const top = wheelTop + WHEEL_SIZE + 6;
                elements.push(this.renderLabel(model.brightnessLabel, top));
                elements.push(
                    this.renderSliderRow('brightness', 'brightness-6', top + 28, model.brightness ?? 0, v =>
                        press(id, 'brightnessSlider', v),
                    ),
                );
            }
        } else {
            let top = POPUP_HEADER_HEIGHT + (model.hueMode || model.power !== undefined ? 50 : 10);
            if (hasCt) {
                elements.push(this.renderLabel(model.colorTempLabel, top));
                elements.push(
                    this.renderSliderRow(
                        'colorTemp',
                        'thermometer',
                        top + 30,
                        model.colorTemp ?? 0,
                        v => press(id, 'colorTempSlider', v),
                        CT_TRACK,
                    ),
                );
                top += 86;
            }
            if (hasBrightness) {
                elements.push(this.renderLabel(model.brightnessLabel, top));
                elements.push(
                    this.renderSliderRow('brightness', 'brightness-6', top + 30, model.brightness ?? 0, v =>
                        press(id, 'brightnessSlider', v),
                    ),
                );
            }
        }

        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, color: theme.foreground }}
            >
                <PopupHeader
                    title={popupTitle(ctx, model.entityName)}
                    icon={model.icon}
                    iconColor={color}
                    onClose={(): void => press(id, 'bExit')}
                />
                {elements.map((el, i) => (
                    <React.Fragment key={el.key ?? i}>{el}</React.Fragment>
                ))}
            </div>
        );
    }
}
