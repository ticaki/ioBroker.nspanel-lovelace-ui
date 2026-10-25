import type { PanelModel } from '../../protocol/types';
import type { StartupBanner } from './sequence';
import l01 from './landscape/frame-01.webp';
import l02 from './landscape/frame-02.webp';
import l03 from './landscape/frame-03.webp';
import l04 from './landscape/frame-04.webp';
import l05 from './landscape/frame-05.webp';
import l06 from './landscape/frame-06.webp';
import l07 from './landscape/frame-07.webp';
import l08 from './landscape/frame-08.webp';
import l09 from './landscape/frame-09.webp';
import l10 from './landscape/frame-10.webp';
import l11 from './landscape/frame-11.webp';
import l12 from './landscape/frame-12.webp';
import lTitle from './landscape/title.webp';
import lWaiting from './landscape/waiting.webp';
import lLonger from './landscape/longer.webp';
import p01 from './portrait/frame-01.webp';
import p02 from './portrait/frame-02.webp';
import p03 from './portrait/frame-03.webp';
import p04 from './portrait/frame-04.webp';
import p05 from './portrait/frame-05.webp';
import p06 from './portrait/frame-06.webp';
import p07 from './portrait/frame-07.webp';
import p08 from './portrait/frame-08.webp';
import p09 from './portrait/frame-09.webp';
import p10 from './portrait/frame-10.webp';
import p11 from './portrait/frame-11.webp';
import p12 from './portrait/frame-12.webp';
import pTitle from './portrait/title.webp';
import pWaiting from './portrait/waiting.webp';
import pLonger from './portrait/longer.webp';

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * The pictures of the boot animation of one display model and where the HMI puts them.
 * The pictures are the ones of the HMI files (`HMI/nspanel-v*.HMI`, `HMI/us-p/*.HMI`),
 * converted to WebP.
 */
export interface StartupPictures {
    /** the frames of `p0` in the order of the HMI (pictures 101..112) */
    frames: readonly string[];
    /** the pictures of the banner `p1` (113 title, 114 waiting, 115 longer) */
    banners: Readonly<Record<StartupBanner, string>>;
    /** `p0` on the stage */
    picture: Rect;
    /** `p1` on the stage */
    banner: Rect;
}

const LANDSCAPE_FRAMES = [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10, l11, l12] as const;
const LANDSCAPE_BANNERS = { title: lTitle, waiting: lWaiting, longer: lLonger } as const;
const PORTRAIT_FRAMES = [p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12] as const;
const PORTRAIT_BANNERS = { title: pTitle, waiting: pWaiting, longer: pLonger } as const;

/**
 * The pictures and their places for a display model (`p0`/`p1` of `pageStartup` in the HMI:
 * eu at x 0, us-l centred at x 15, us-p below a 15 px margin).
 *
 * @param model the panel model
 */
export function startupPictures(model: PanelModel): StartupPictures {
    if (model === 'us-p') {
        return {
            frames: PORTRAIT_FRAMES,
            banners: PORTRAIT_BANNERS,
            picture: { x: 0, y: 15, w: 320, h: 350 },
            banner: { x: 0, y: 365, w: 320, h: 100 },
        };
    }
    const x = model === 'us-l' ? 15 : 0;
    return {
        frames: LANDSCAPE_FRAMES,
        banners: LANDSCAPE_BANNERS,
        picture: { x, y: 0, w: 450, h: 230 },
        banner: { x, y: 230, w: 450, h: 90 },
    };
}
