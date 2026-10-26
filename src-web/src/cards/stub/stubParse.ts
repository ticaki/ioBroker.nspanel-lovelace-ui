import type { ParseContext } from '../CardContract';

/**
 * Model of a card that is not implemented yet: keeps the raw arguments of the last
 * `entityUpd`, the last `entityUpdateDetail` and the last 10 other commands.
 */
export interface StubModel {
    entityUpd: string[] | undefined;
    entityUpdateDetail: string[] | undefined;
    commands: { cmd: string; args: string[] }[];
}

export function stubInitial(): StubModel {
    return { entityUpd: undefined, entityUpdateDetail: undefined, commands: [] };
}

export function stubParseEntityUpd(args: string[], prev: StubModel, _ctx: ParseContext): StubModel {
    return { ...prev, entityUpd: args };
}

export function stubParseEntityUpdateDetail(args: string[], prev: StubModel, _ctx: ParseContext): StubModel {
    return { ...prev, entityUpdateDetail: args };
}

export function stubHandleCommand(cmd: string, args: string[], prev: StubModel, _ctx: ParseContext): StubModel {
    return { ...prev, commands: [...prev.commands.slice(-9), { cmd, args }] };
}
