declare module 'aedes-persistence-level' {
    import type { Level } from 'level';
    function aedesPersistenceLevel(db: Level): unknown;
    export = aedesPersistenceLevel;
}
