import type { ParseContext } from '../CardContract';

/** The startup page has no data - the adapter only ever sends `pageType~pageStartup` */
export interface PageStartupModel {
    /** commands that arrived while on the startup page (ignored by the real display) */
    ignored: number;
}

export function initial(): PageStartupModel {
    return { ignored: 0 };
}

export function parseEntityUpd(_args: string[], prev: PageStartupModel, _ctx: ParseContext): PageStartupModel {
    return { ignored: prev.ignored + 1 };
}

export function handleCommand(
    _cmd: string,
    _args: string[],
    prev: PageStartupModel,
    _ctx: ParseContext,
): PageStartupModel {
    return { ignored: prev.ignored + 1 };
}
