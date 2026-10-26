import type React from 'react';
import type { GlobalState } from '../protocol/types';

export interface ParseContext {
    /** active pageType, e.g. `cardGrid2` */
    pageType: string;
    /** arguments after `pageType~<type>~…`, e.g. the entity name and id of a popup */
    pageArgs: string[];
}

export interface CardProps<M> {
    model: M;
    ctx: ParseContext;
    /** time, date, dim, timeout, model */
    global: GlobalState;
    /** sends a raw display event, e.g. `event,pageOpenDetail,popupLight,light.x` */
    send: (event: string) => void;
    /** sends `event,buttonPress2,<id>,<action>[,<value>]` */
    press: (id: string, action: string, value?: string | number) => void;
    /**
     * Opens a popup the way the real display does: switches to the popup page locally
     * (`pageArgs` = `[id, title, icon, iconColor]`, `iconColor` = RGB565 of the entity as string,
     * empty when none) and sends `event,pageOpenDetail,<popup>,<id>`; the adapter answers with
     * `entityUpdateDetail~…`. `bExit` returns to the card.
     */
    openPopup: (popup: string, id: string, title?: string, icon?: string, iconColor?: number) => void;
}

export interface CardModule<M> {
    readonly pageTypes: readonly string[];
    readonly initial: () => M;
    /** `entityUpd~…`; args without the leading `entityUpd` */
    parseEntityUpd(args: string[], prev: M, ctx: ParseContext): M;
    /** `entityUpdateDetail~…` (popups); `undefined` = not handled, the model stays */
    parseEntityUpdateDetail?(args: string[], prev: M, ctx: ParseContext): M | undefined;
    /**
     * every other command for the active page (weatherUpdate, statusUpdate, notify, color, …);
     * `undefined` = not handled (logged), the model stays
     */
    handleCommand?(cmd: string, args: string[], prev: M, ctx: ParseContext): M | undefined;
    readonly Component: React.ComponentType<CardProps<M>>;
}

/** A card module whose model type is not known to the caller (registry, store) */
export type AnyCardModule = CardModule<unknown>;

/**
 * Erases the model type of a module for the registry. The store only ever passes a
 * module its own model back (`initial()` -> `parse*` -> `Component`), so the cast is safe.
 *
 * @param module the typed module
 */
export function defineCard<M>(module: CardModule<M>): AnyCardModule {
    return module as unknown as AnyCardModule;
}
