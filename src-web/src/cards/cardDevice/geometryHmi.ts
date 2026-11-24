import {
    box,
    shiftTable,
    type ButtonSlotGeometry,
    type DeviceGeometryTable,
    type InfoSlotGeometry,
    type StatusSlotGeometry,
    type SwitchSlotGeometry,
} from './geometry';

/*
 * The device pages of the hardware models (and of their web clones), pixel by pixel as the HMI places its
 * components. One table per model; a new model (us-p) is one more table here plus its entry in `layout.ts`.
 * The HMI tooling writes the boxes of all models to `doc/ideas/device-details/device-page-geometry.json`
 * (keys `eu`, `us-l`, `us-p`; x/y/w/h, font and alignment per box) - a table is that data in the shape of
 * `DeviceGeometryTable` (font/align only where they differ from the default of the element kind).
 */

const STATUS = box(10, 289, 390, 30);
const INFO = box(404, 288, 36, 32);

function info1(y: number): InfoSlotGeometry {
    return { kind: 'info', icon: box(126, y, 36, 34), name: box(164, y + 4, 164, 26), value: box(330, y + 4, 110, 26) };
}

/** the info rows of cardDevice1 next to a visible status block */
function info1Narrow(y: number): InfoSlotGeometry {
    return { kind: 'info', icon: box(204, y, 36, 34), name: box(242, y + 4, 86, 26), value: box(330, y + 5, 110, 26) };
}

function status1(x: number, y: number): StatusSlotGeometry {
    return { kind: 'status', cell: box(x, y, 38, 45) };
}

function button1(x: number): ButtonSlotGeometry {
    return { kind: 'button', icon: box(x, 190, 104, 52), name: box(x, 244, 104, 26) };
}

function info2(x: number): InfoSlotGeometry {
    return {
        kind: 'info',
        icon: box(x, 228, 34, 48),
        name: box(x + 36, 226, 104, 25),
        value: box(x + 36, 252, 104, 25),
    };
}

function info3(index: number): InfoSlotGeometry {
    const x = index % 2 === 0 ? 114 : 277;
    const y = 69 + Math.floor(index / 2) * 52;
    return {
        kind: 'info',
        icon: box(x, y, 34, 48),
        name: box(x + 36, y - 2, 125, 25),
        value: box(x + 36, y + 24, 125, 25),
    };
}

function switch3(x: number): SwitchSlotGeometry {
    return {
        kind: 'switch',
        icon: box(x, 236, 34, 34),
        name: box(x + 36, 240, 125, 26),
        toggle: box(x + 163, 228, 50, 50),
    };
}

/**
 * eu: the three device pages exactly as `doc/ideas/device-details/device-page-hmi.md` (section Geometrie)
 * places their components; the stage of the web panel uses the same pixels. Content x 10-439.
 */
export const EU_GEOMETRY: DeviceGeometryTable = {
    1: {
        main: { icon: box(10, 68, 110, 86), name: box(10, 156, 110, 26) },
        slots: [
            info1(76),
            info1(120),
            button1(10),
            button1(118),
            button1(226),
            button1(334),
            status1(124, 71),
            status1(161, 71),
            status1(124, 115),
            status1(161, 115),
        ],
        // with a visible status block the two info rows move right and get narrower
        withStatusBlock: { 0: info1Narrow(76), 1: info1Narrow(120) },
        extras: [],
        status: STATUS,
        statusAlign: 1,
        info: INFO,
    },
    2: {
        main: { icon: box(10, 67, 96, 82), name: box(10, 151, 96, 26) },
        slots: [
            { kind: 'value', icon: box(110, 90, 34, 36), value: box(146, 67, 190, 82), name: box(146, 151, 190, 26) },
            { kind: 'progress', name: box(10, 179, 429, 26), bar: box(10, 207, 429, 14) },
            info2(10),
            info2(154),
            info2(298),
            { kind: 'button', icon: box(340, 67, 100, 50), name: box(340, 119, 100, 26) },
        ],
        extras: [],
        status: STATUS,
        statusAlign: 1,
        info: INFO,
    },
    3: {
        main: { icon: box(10, 67, 100, 82), name: box(10, 151, 100, 26) },
        slots: [info3(0), info3(1), info3(2), info3(3), info3(4), info3(5), switch3(10), switch3(226)],
        extras: [],
        status: STATUS,
        statusAlign: 1,
        info: INFO,
    },
};

/**
 * The us-l HMI is the eu HMI moved to its visible area (x 15-464 instead of 0-449): in
 * `HMI/us-l/nspanel-us-l-v6.2.0.HMI` heading, arrows and every component of cardEntities and cardThermo2
 * sit 15 px further right than in `HMI/nspanel-v6.2.0.HMI` (the cells of cardGrid 16, of cardGrid2 14 px -
 * centring of their columns), y, width and height are the same.
 */
export const US_L_SHIFT = 15;

/** us-l: the eu pages {@link US_L_SHIFT} px to the right. Content x 25-454. */
export const US_L_GEOMETRY: DeviceGeometryTable = shiftTable(EU_GEOMETRY, US_L_SHIFT);
