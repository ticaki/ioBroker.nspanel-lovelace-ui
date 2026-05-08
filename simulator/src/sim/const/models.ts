export type ModelId = 'eu' | 'us-l' | 'us-p';

export const SUPPORTED_MODELS: readonly ModelId[] = ['eu', 'us-l', 'us-p'] as const;

export function isModelId(v: unknown): v is ModelId {
    return typeof v === 'string' && (SUPPORTED_MODELS as readonly string[]).includes(v);
}
