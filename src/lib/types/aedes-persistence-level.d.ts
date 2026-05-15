declare module 'aedes-persistence-level' {
    import { Level } from 'level';
    function aedesPersistenceLevel(db: Level): unknown;
    export = aedesPersistenceLevel;
}
