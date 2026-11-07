import type { PanelModel } from '../protocol/types';
import { stageSize } from '../style/theme';

/**
 * pageTypes that have no layout of their own for the web models (`web-p`, `web-l`) yet.
 * On a web model they are drawn in the geometry of their base model ({@link baseModel}) and
 * centred on the bigger stage; the card sees the base model in `global.model`.
 *
 * A card that gets a real web layout is **removed from this list** - from then on it is drawn
 * on the full stage and sees `web-p` / `web-l` in `global.model`. Nothing else has to change.
 */
export const CENTERED_ON_WEB: ReadonlySet<string> = new Set([
    'pageStartup',
    'cardThermo',
    'cardAlarm',
    'cardUnlock',
    'cardQR',
    'cardPower',
    'cardChart',
    'cardLChart',
    'cardPChart',
]);

/**
 * The hardware model whose geometry a centred card uses: `web-l` -> `eu`, `web-p` -> `us-p`,
 * the hardware models stay as they are.
 *
 * @param model the panel model
 */
export function baseModel(model: PanelModel): PanelModel {
    switch (model) {
        case 'web-l':
            return 'eu';
        case 'web-p':
            return 'us-p';
        default:
            return model;
    }
}

/** Where a card is drawn on the stage and which model it sees */
export interface CardStage {
    /** the model the card gets in `global.model` */
    model: PanelModel;
    /** position and size of the card area in stage pixels */
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * The area of the stage a page is drawn in: the full stage, or - for a pageType in
 * {@link CENTERED_ON_WEB} on a web model - the stage of the base model, centred
 * (web-l: 480x320 at x 80, web-p: 320x480 at y 80).
 *
 * @param pageType the active pageType
 * @param model the panel model
 */
export function cardStage(pageType: string, model: PanelModel): CardStage {
    const stage = stageSize(model);
    const target = CENTERED_ON_WEB.has(pageType) ? baseModel(model) : model;
    const size = stageSize(target);
    return {
        model: target,
        left: Math.floor((stage.width - size.width) / 2),
        top: Math.floor((stage.height - size.height) / 2),
        width: size.width,
        height: size.height,
    };
}
