import type { Entity6, EntityUpdHeader, Navigation } from './types';

/** number of fields of an {@link Entity6} */
export const ENTITY_FIELDS = 6;

/** Splits a payload at `~` - the field separator of the HMI protocol */
export function splitTilde(payload: string): string[] {
    return payload.split('~');
}

/**
 * Parses a number field, `fallback` when the field is missing or not numeric.
 *
 * @param field the raw field
 * @param fallback value used when the field is not a number
 */
export function toNumber(field: string | undefined, fallback = 0): number {
    if (field === undefined || field === '') {
        return fallback;
    }
    const n = Number(field);
    return Number.isFinite(n) ? n : fallback;
}

/** Field `index` of `fields`, empty string when missing */
export function field(fields: readonly string[], index: number): string {
    return fields[index] ?? '';
}

export function emptyEntity(): Entity6 {
    return { type: '', id: '', icon: '', iconColor: 65535, displayName: '', optionalValue: '' };
}

/**
 * Parses one entity tuple `type~id~icon~iconColor~displayName~optionalValue`.
 *
 * @param fields the fields of the payload
 * @param offset index of the `type` field
 */
export function parseEntity6(fields: readonly string[], offset = 0): Entity6 {
    return {
        type: field(fields, offset),
        id: field(fields, offset + 1),
        icon: field(fields, offset + 2),
        iconColor: toNumber(fields[offset + 3], 65535),
        displayName: field(fields, offset + 4),
        optionalValue: field(fields, offset + 5),
    };
}

/** `true` when the entity is a placeholder (`delete` or no type) and nothing has to be drawn */
export function isEmptyEntity(entity: Entity6): boolean {
    return entity.type === '' || entity.type === 'delete';
}

/**
 * Parses a list of entity tuples; an incomplete trailing tuple is padded with empty fields.
 *
 * @param fields the fields of the payload
 * @param offset index of the first `type` field
 * @param max maximum number of entities, unlimited by default
 */
export function parseEntityList(fields: readonly string[], offset = 0, max = Infinity): Entity6[] {
    const result: Entity6[] = [];
    for (let i = offset; i < fields.length && result.length < max; i += ENTITY_FIELDS) {
        result.push(parseEntity6(fields, i));
    }
    return result;
}

/**
 * Parses the two navigation entities of an `entityUpd`.
 *
 * @param fields the fields of the payload
 * @param offset index of the `type` field of the left navigation entity
 */
export function parseNavigation(fields: readonly string[], offset: number): Navigation {
    return {
        left: parseEntity6(fields, offset),
        right: parseEntity6(fields, offset + ENTITY_FIELDS),
    };
}

/**
 * Parses the common head of an `entityUpd`: `title~[nav left]~[nav right]~…`.
 *
 * @param args the fields after `entityUpd` (so `args[0]` is the title)
 */
export function parseEntityUpdHeader(args: readonly string[]): EntityUpdHeader {
    return {
        title: field(args, 0),
        navigation: parseNavigation(args, 1),
        rest: args.slice(1 + 2 * ENTITY_FIELDS),
    };
}
