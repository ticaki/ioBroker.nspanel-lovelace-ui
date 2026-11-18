import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LIGHT_SLIDER_HEIGHT, LightSlider, type LightSliderProps } from './LightSlider';

/** the knob is 28 px high, its top travels from 0 (value at the top) to height - 28 */
const KNOB_TRAVEL = LIGHT_SLIDER_HEIGHT - 28;

function knobTop(props: Omit<LightSliderProps, 'onCommit'>): number {
    const html = renderToStaticMarkup(
        React.createElement(LightSlider, {
            ...props,
            onCommit: (): void => {},
        }),
    );
    const match = /data-knob=""[^>]*top:(-?[\d.]+)(?:px)?;/.exec(html);
    if (!match) {
        throw new Error(`no knob in ${html}`);
    }
    return Number(match[1]);
}

function pointer(pointerId: number, clientY: number): React.PointerEvent<HTMLDivElement> {
    const target = {
        hasPointerCapture: (): boolean => false,
        setPointerCapture: (): void => {},
        releasePointerCapture: (): void => {},
    };
    return {
        pointerId,
        clientX: 50,
        clientY,
        preventDefault: (): void => {},
        currentTarget: target,
    } as unknown as React.PointerEvent<HTMLDivElement>;
}

/** a slider in a 100 x 240 box at 0/0, the value sent on a tap at clientY */
function tap(inverted: boolean, clientY: number): number[] {
    const sent: number[] = [];
    const slider = new LightSlider({ value: 50, inverted, onCommit: v => sent.push(v) });
    slider['root'].current = {
        getBoundingClientRect: (): { left: number; top: number; width: number; height: number } => ({
            left: 0,
            top: 0,
            width: 100,
            height: LIGHT_SLIDER_HEIGHT,
        }),
    } as HTMLDivElement;
    // the component is not mounted, setState only warns
    slider.setState = (): void => {};
    slider['onPointerDown'](pointer(1, clientY));
    slider['onPointerUp'](pointer(1, clientY));
    return sent;
}

describe('LightSlider', () => {
    it('brightness: 100 at the top, 0 at the bottom', () => {
        expect(knobTop({ value: 100 })).toBe(0);
        expect(knobTop({ value: 0 })).toBe(KNOB_TRAVEL);
        expect(tap(false, 0)).toEqual([100]);
        expect(tap(false, LIGHT_SLIDER_HEIGHT)).toEqual([0]);
    });

    it('colour temperature (inverted like hTempSlider of the HMI): 0 (cold) at the top, 100 (warm) at the bottom', () => {
        expect(knobTop({ value: 0, inverted: true })).toBe(0);
        expect(knobTop({ value: 100, inverted: true })).toBe(KNOB_TRAVEL);
        expect(knobTop({ value: 25, inverted: true })).toBe(KNOB_TRAVEL / 4);
        expect(tap(true, 0)).toEqual([0]);
        expect(tap(true, LIGHT_SLIDER_HEIGHT)).toEqual([100]);
        // a quarter of the travel below the top is 25
        expect(tap(true, 14 + KNOB_TRAVEL / 4)).toEqual([25]);
    });

    it('data-value is the protocol value', () => {
        const html = renderToStaticMarkup(
            React.createElement(LightSlider, { value: 30, inverted: true, onCommit: (): void => {} }),
        );
        expect(html).toContain('data-value="30"');
    });
});
