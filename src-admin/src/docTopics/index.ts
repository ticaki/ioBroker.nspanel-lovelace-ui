/**
 * All help topics of the admin: the places in the user documentation the `?` icons (`DocHelp`)
 * and documentation buttons (`DocButton`) link to.
 *
 * Every area keeps its topics in its own file (`docTopics/<area>.ts`, keys prefixed with the area),
 * this index only merges them. `docTopics.test.ts` checks each topic against `doc/de` and `doc/en`.
 */
import { slug } from '../docAnchors';
import { docPageUrl, type DocLanguage } from '../docLink';
import { dialogsTopics } from './dialogs';
import { maintainTopics } from './maintain';
import { navigationTopics } from './navigation';
import { pageitemsTopics } from './pageitems';
import { pages1Topics } from './pages1';
import { pages2Topics } from './pages2';
import { screensaverTopics } from './screensaver';
import type { DocTopic } from './types';

export type { DocTopic } from './types';

/** Every help topic by key. */
export const DOC_TOPICS = {
    ...screensaverTopics,
    ...pages1Topics,
    ...pages2Topics,
    ...pageitemsTopics,
    ...dialogsTopics,
    ...navigationTopics,
    ...maintainTopics,
} satisfies Record<string, DocTopic>;

/** Key of a help topic, e.g. `screensaver.itemDialog`. */
export type DocTopicKey = keyof typeof DOC_TOPICS;

/** A registered topic by key, or a topic built on the fly (e.g. the page of a card type). */
export type DocTopicRef = DocTopicKey | DocTopic;

/**
 * Resolves a topic reference.
 *
 * @param ref Key or topic.
 * @returns The topic.
 */
export function resolveDocTopic(ref: DocTopicRef): DocTopic {
    return typeof ref === 'string' ? DOC_TOPICS[ref] : ref;
}

/**
 * Heading of the topic's section in the given language.
 *
 * @param topic The topic.
 * @param language Documentation language.
 * @returns The heading text, or `undefined` if the topic is a whole page.
 */
export function docTopicTitle(topic: DocTopic, language: DocLanguage): string | undefined {
    return language === 'de' ? topic.de : topic.en;
}

/**
 * Link to the topic: the page in the given language, at the section if the topic names one.
 *
 * @param topic The topic.
 * @param language Documentation language.
 * @returns Absolute url.
 */
export function docTopicUrl(topic: DocTopic, language: DocLanguage): string {
    const heading = docTopicTitle(topic, language);
    return docPageUrl(language, topic.page, heading ? slug(heading) : undefined);
}

/** Card types that have their own documentation page (`doc/<lang>/<card>.md`). */
export const CARD_DOC_PAGES: readonly string[] = [
    'cardAlarm',
    'cardChart',
    'cardEntities',
    'cardGrid',
    'cardGrid2',
    'cardGrid3',
    'cardMedia',
    'cardPChart',
    'cardPower',
    'cardQR',
    'cardSchedule',
    'cardThermo',
    'cardThermo2',
    'cardTrash',
    'pageLink',
    'pageMenu',
];

/**
 * Documentation page of a card type; the PageConfig overview for a card type without its own page.
 *
 * @param card Card type, e.g. `cardChart`, or `undefined`.
 * @returns A whole-page topic.
 */
export function cardDocTopic(card: string | undefined): DocTopic {
    // cardEntities2 is cardEntities with five rows - no page of its own
    const page = card === 'cardEntities2' ? 'cardEntities' : card;
    return { page: page && CARD_DOC_PAGES.includes(page) ? page : 'PageConfig' };
}
