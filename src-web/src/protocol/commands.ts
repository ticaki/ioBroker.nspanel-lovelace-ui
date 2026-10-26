import { splitTilde } from './split';
import type { ParsedCommand } from './types';

/** Commands handled by the store itself, everything else goes to the active card */
export const GLOBAL_COMMANDS = ['pageType', 'time', 'date', 'timeout', 'dimmode'] as const;

/**
 * Splits a CustomSend payload into command and arguments:
 * `entityUpd~Title~…` -> `{ cmd: 'entityUpd', args: ['Title', …] }`
 *
 * @param raw the payload as sent by the adapter
 */
export function parseCommand(raw: string): ParsedCommand {
    const fields = splitTilde(raw);
    return { cmd: fields[0] ?? '', args: fields.slice(1), raw };
}

/**
 * Builds a display event: `event,buttonPress2,<id>,<action>[,<value>]`
 *
 * @param id internal name of the entity (or `screensaver`, `bSubPrev`, …)
 * @param action action name (`button`, `OnOff`, `bExit`, …)
 * @param value optional value
 */
export function buttonPress2(id: string, action: string, value?: string | number): string {
    return `event,buttonPress2,${id},${action}${value === undefined ? '' : `,${value}`}`;
}

/** HMI project version reported in `event,startup` - the adapter does not evaluate it */
export const HMI_PROJECT_VERSION = 55;

/** `event,startup,<hmiProjectVersion>,<model>,<tftVersion>` - the first message of a display */
export function startupEvent(hmiProjectVersion: number, model: string, tftVersion: string): string {
    return `event,startup,${hmiProjectVersion},${model},${tftVersion}`;
}

/** `event,renderCurrentPage,<pageType>` - sent after a page change was rendered */
export function renderCurrentPageEvent(pageType: string): string {
    return `event,renderCurrentPage,${pageType}`;
}

/** `event,sleepReached,<pageType>` - sent when the screensaver timeout expired */
export function sleepReachedEvent(pageType: string): string {
    return `event,sleepReached,${pageType}`;
}

/** `event,pageOpenDetail,<popupType>,<id>` - request a popup for an entity */
export function pageOpenDetailEvent(popupType: string, id: string): string {
    return `event,pageOpenDetail,${popupType},${id}`;
}

/** `event,button1` / `event,button2` - the two hardware buttons */
export function hardwareButtonEvent(button: 1 | 2): string {
    return `event,button${button}`;
}

export function isScreensaverPage(pageType: string): boolean {
    return pageType.startsWith('screensaver');
}

export function isPopupPage(pageType: string): boolean {
    return pageType.startsWith('popup');
}
