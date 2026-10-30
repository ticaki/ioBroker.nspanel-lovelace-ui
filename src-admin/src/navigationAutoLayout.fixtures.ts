/**
 * Test-Maps für das Auto-Layout (Unit-Tests und Offline-Rendering).
 *
 * Aufbau wie vom Adapter geliefert (panel.ts getNavigationArrayForFlow):
 * - Skript-Hauptseiten bilden einen Ring über den Service-Knoten (erste.prev = ///unlock,
 *   letzte.next = ///unlock), prev/next gegenseitig,
 * - Unterseiten tragen parent (links doppelt) / home (rechts doppelt) und ggf. prev/next,
 * - targetPages / targetPagesLongPress aus den Seitenelementen, `dp:<id>`-Datenpunkt-Knoten,
 * - erzeugte media-<id>-Seiten hinter Media-Elementen,
 * - Service-Seiten (system-templates.ts systemNavigation): ///unlock → target ///Overview
 *   (home main) → target auf die weiteren ///-Seiten, die per parent zurückverweisen.
 */
import type { NavigationMapEntry } from '../../src/lib/types/adminShareConfig';

export type FixtureEntry = NavigationMapEntry & { generated?: boolean };

class MapBuilder {
    readonly m = new Map<string, FixtureEntry>();

    p(page: string, props: Partial<FixtureEntry> = {}): FixtureEntry {
        let e = this.m.get(page);
        if (!e) {
            e = { page, label: page, origin: page.startsWith('///') ? 'system' : 'script' };
            this.m.set(page, e);
        }
        Object.assign(e, props);
        return e;
    }

    /**
     * gegenseitige prev/next-Kette; mit `ring` schließt sie letzte -> erste
     *
     * @param pages
     * @param ring
     */
    chain(pages: string[], ring = false): void {
        for (let i = 0; i < pages.length - 1; i++) {
            this.p(pages[i]).next = pages[i + 1];
            this.p(pages[i + 1]).prev = pages[i];
        }
        if (ring && pages.length > 1) {
            this.p(pages[pages.length - 1]).next = pages[0];
            this.p(pages[0]).prev = pages[pages.length - 1];
        }
    }

    tgt(from: string, ...to: string[]): void {
        const e = this.p(from);
        e.targetPages = [...(e.targetPages ?? []), ...to];
    }

    lp(from: string, ...to: string[]): void {
        const e = this.p(from);
        e.targetPagesLongPress = [...(e.targetPagesLongPress ?? []), ...to];
    }

    /**
     * Unterseiten per targetPages, jede mit parent = verweisende Seite und home = main
     *
     * @param from
     * @param to
     */
    subs(from: string, ...to: string[]): void {
        this.tgt(from, ...to);
        for (const t of to) {
            this.p(t, { parent: from, home: 'main' });
        }
    }

    states(page: string, ...ids: string[]): void {
        const e = this.p(page);
        for (const id of ids) {
            const nid = `dp:${id}`;
            const parts = id.split('.');
            this.p(nid, {
                nodeType: 'stateRef',
                label: parts.length <= 2 ? id : `…${parts.slice(-2).join('.')}`,
                origin: undefined,
            });
            e.usedStates = [...(e.usedStates ?? []), nid];
        }
    }

    media(from: string, id: string): string {
        const page = `media-${id}`;
        this.p(page, { generated: true, parent: from, origin: 'admin' });
        this.tgt(from, page);
        return page;
    }

    /**
     * Service-Seiten wie in system-templates.ts (`full` = alle optionalen Seiten)
     *
     * @param full
     */
    system(full: boolean): void {
        this.p('///Overview', { home: 'main' });
        this.tgt('///unlock', '///Overview');
        const subs = full
            ? [
                  '///Adapter-Info',
                  '///ScreensaverOptions',
                  '///RelaisOption',
                  '///DeviceOption',
                  '///NetworkOption',
                  '///SystemOption',
                  '///PopupInfo',
              ]
            : ['///Adapter-Info', '///ScreensaverOptions', '///SystemOption'];
        for (const s of subs) {
            this.p(s, { parent: '///Overview' });
        }
        this.tgt('///Overview', ...subs);
        this.p('///ScreensaverBrightness', { parent: '///ScreensaverOptions' });
        this.tgt('///ScreensaverOptions', '///ScreensaverBrightness');
        if (full) {
            this.p('///ScreensaverLayout', { parent: '///ScreensaverOptions' });
            this.tgt('///ScreensaverOptions', '///ScreensaverLayout');
            for (const s of ['///AdapterStoppedDetail', '///AdapterNotConnectedDetail', '///AdapterUpdate']) {
                this.p(s, { parent: '///Adapter-Info' });
                this.tgt('///Adapter-Info', s);
            }
        }
    }

    list(): FixtureEntry[] {
        return [...this.m.values()];
    }
}

/**
 * deterministischer Zufall
 *
 * @param seed
 */
function rng(seed: number): () => number {
    let s = seed >>> 0;
    return (): number => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

export function smallMap(): FixtureEntry[] {
    const b = new MapBuilder();
    b.chain(['main', 'Licht', 'Rollos'], true);
    b.p('Licht_Details', { parent: 'Licht', home: 'main' });
    b.tgt('Licht', 'Licht_Details');
    b.states('main', 'alias.0.Wohnen.Temperatur', 'alias.0.Wohnen.Feuchte', 'alias.0.Flur.Licht');
    b.states('Licht', 'alias.0.Wohnen.Decke', 'alias.0.Wohnen.Stehlampe');
    b.states('Rollos', 'alias.0.Wohnen.Rollo');
    return b.list();
}

export function typicalMap(): FixtureEntry[] {
    const b = new MapBuilder();
    const trunk = ['main', 'Wohnzimmer', 'Kueche', 'Schlafzimmer', 'Bad', 'Wetter', 'Energie', 'Musik', '///unlock'];
    b.chain(trunk, true);
    b.tgt('Wohnzimmer', 'WZ_Licht', 'WZ_Rollos');
    b.lp('Wohnzimmer', 'WZ_Szenen');
    b.p('WZ_Licht', { parent: 'Wohnzimmer' });
    b.chain(['WZ_Licht', 'WZ_Licht2']);
    b.p('WZ_Licht2', { home: 'main' });
    b.p('WZ_Rollos', { parent: 'Wohnzimmer', home: 'main' });
    b.p('WZ_Szenen', { parent: 'Wohnzimmer' });
    b.tgt('Kueche', 'Kueche_Geraete');
    b.p('Kueche_Geraete', { parent: 'Kueche' });
    b.tgt('Kueche_Geraete', 'Kueche_Timer');
    b.p('Kueche_Timer', { parent: 'Kueche_Geraete', home: 'main' });
    b.media('Kueche', 'alias.0.Kueche.Radio');
    b.tgt('Schlafzimmer', 'SZ_Klima');
    b.p('SZ_Klima', { prev: 'Schlafzimmer', home: 'main' });
    b.tgt('Bad', 'dp:0_userdata.0.nav.bad');
    b.p('dp:0_userdata.0.nav.bad', { nodeType: 'stateRef', label: '…nav.bad', origin: undefined });
    b.tgt('Wetter', 'Wetter_Woche', 'Wetter_Radar');
    b.chain(['Wetter_Woche', 'Wetter_Radar']);
    b.p('Wetter_Woche', { parent: 'Wetter' });
    b.p('Wetter_Radar', { parent: 'Wetter' });
    b.tgt('Energie', 'PV', 'Verbrauch', 'Batterie');
    b.chain(['PV', 'Verbrauch', 'Batterie'], true);
    for (const p of ['PV', 'Verbrauch', 'Batterie']) {
        b.p(p, { home: 'main' });
    }
    const sonos = b.media('Musik', 'alias.0.Wohnzimmer.Sonos');
    b.media('Musik', 'alias.0.Bad.Echo');
    b.lp('Musik', 'Musik_Favoriten');
    b.p('Musik_Favoriten', { parent: 'Musik' });
    b.tgt(sonos, 'Musik_Favoriten');
    b.system(false);
    b.states('main', 'alias.0.Aussen.Temperatur', 'alias.0.Flur.Licht', 'alias.0.Haus.Alarm');
    b.states('Wohnzimmer', 'alias.0.Wohnzimmer.Decke', 'alias.0.Wohnzimmer.Stehlampe', 'alias.0.Wohnzimmer.Rollo');
    b.states('WZ_Licht', 'alias.0.Wohnzimmer.Decke', 'alias.0.Wohnzimmer.LED');
    b.states('Kueche', 'alias.0.Kueche.Licht', 'alias.0.Kueche.Spuelmaschine');
    b.states('Schlafzimmer', 'alias.0.Schlafzimmer.Licht', 'alias.0.Schlafzimmer.Thermostat');
    b.states('Bad', 'alias.0.Bad.Licht', 'alias.0.Bad.Luefter');
    b.states('Energie', 'modbus.0.inputRegisters.PV_Leistung', 'modbus.0.inputRegisters.Netz');
    b.states('PV', 'modbus.0.inputRegisters.PV_Leistung');
    b.states('Batterie', 'modbus.0.inputRegisters.SOC');
    return b.list();
}

/**
 * kettenlastige generierte Konfiguration: `rooms` Hauptseiten, zufällige Unterseiten-Bäume
 *
 * @param rooms
 * @param seed
 * @param maxSub
 * @param fullSystem
 * @param statesPerRoom
 */
function generatedChains(
    rooms: number,
    seed: number,
    maxSub: number,
    fullSystem: boolean,
    statesPerRoom: number,
): FixtureEntry[] {
    const r = rng(seed);
    const b = new MapBuilder();
    const names = Array.from({ length: rooms }, (_, i) => (i === 0 ? 'main' : `Raum_${String(i).padStart(2, '0')}`));
    b.chain([...names, '///unlock'], true);
    let n = 0;
    const sub = (owner: string, depth: number): void => {
        const count = Math.floor(r() * (maxSub + 1 - depth));
        let i = 0;
        while (i < count) {
            const len = r() < 0.35 ? 2 + Math.floor(r() * 4) : 1;
            const chain: string[] = [];
            for (let k = 0; k < len && i < count + 2; k++, i++) {
                chain.push(`${owner.replace(/^Raum_/, 'R')}_S${++n}`);
            }
            const mode = r();
            if (mode < 0.55) {
                b.tgt(owner, chain[0]);
                b.p(chain[0], { parent: owner });
            } else if (mode < 0.75) {
                b.tgt(owner, chain[0]);
                b.p(chain[0], { prev: owner });
            } else if (mode < 0.9) {
                b.lp(owner, chain[0]);
                b.p(chain[0], { parent: owner });
            } else {
                b.tgt(owner, ...chain);
                for (const c of chain) {
                    b.p(c, { parent: owner });
                }
            }
            if (chain.length > 1) {
                b.chain(chain, r() < 0.2);
            }
            for (const c of chain) {
                if (r() < 0.6) {
                    b.p(c, { home: 'main' });
                }
            }
            for (const c of chain) {
                if (depth < 2 && r() < 0.25) {
                    sub(c, depth + 1);
                }
                if (r() < 0.3) {
                    b.states(c, `alias.0.${c}.Wert`);
                }
            }
            if (r() < 0.15 && depth === 0) {
                b.tgt(chain[chain.length - 1], names[Math.floor(r() * rooms)]);
            }
        }
        if (r() < 0.15) {
            b.media(owner, `alias.0.${owner}.Player`);
        }
    };
    for (const room of names) {
        sub(room, 0);
        const st: string[] = [];
        for (let k = 0; k < statesPerRoom; k++) {
            if (r() < 0.7) {
                st.push(`alias.0.${room}.Geraet${k}`);
            }
        }
        if (st.length) {
            b.states(room, ...st);
        }
    }
    b.system(fullSystem);
    return b.list();
}

export function largeMap(): FixtureEntry[] {
    return generatedChains(12, 7, 4, true, 3);
}

export function hugeMap(): FixtureEntry[] {
    return generatedChains(25, 42, 6, true, 3);
}

export function cyclesMap(): FixtureEntry[] {
    const b = new MapBuilder();
    b.chain(['main', 'Licht', 'Heizung', 'Kameras', 'Garten'], true);
    b.tgt('Kameras', 'Cam_Einfahrt');
    b.chain(['Cam_Einfahrt', 'Cam_Garten', 'Cam_Terrasse'], true);
    for (const c of ['Cam_Einfahrt', 'Cam_Garten', 'Cam_Terrasse']) {
        b.p(c, { home: 'main' });
    }
    b.tgt('Heizung', 'Hz_EG', 'Hz_OG');
    b.p('Hz_EG', { next: 'Hz_OG', parent: 'Heizung' });
    b.p('Hz_OG', { prev: 'Heizung', next: 'Hz_Keller' });
    b.p('Hz_Keller', { prev: 'Hz_OG', home: 'main' });
    b.tgt('Hz_Keller', 'Licht');
    b.chain(['Test_1', 'Test_2', 'Test_3', 'Test_4'], true);
    b.p('Alte_Seite', { home: 'main' });
    b.p('Entwurf');
    b.p('Entwurf_Detail', { parent: 'Entwurf' });
    b.tgt('Entwurf', 'Entwurf_Detail');
    b.lp('Garten', 'Garten');
    b.p('dp:0_userdata.0.unbenutzt', { nodeType: 'stateRef', label: '…0.unbenutzt', origin: undefined });
    b.states('Garten', 'alias.0.Garten.Pumpe', 'alias.0.Garten.Licht');
    return b.list();
}

/**
 * Baumlastige Konfiguration (~30 Seiten + Service-Seiten): main → targetPages auf Bereichsseiten →
 * targetPages auf Unterseiten, jede mit parent = verweisende Seite und home = main. Enthält
 * - eine Unterseite, die von zwei Seiten verlinkt wird, deren parent die ZWEITE ist (Szenen_Alle),
 * - eine Unterseite, die zuerst von einer anderen Seite als ihrem parent verlinkt wird (Wallbox),
 * - Long-Press-Ziele, eine kurze prev/next-Kette, 2 bis 10 Ziele je Seite.
 */
export function treeMap(): FixtureEntry[] {
    const b = new MapBuilder();
    b.chain(['main', '///unlock'], true);
    b.subs('main', 'Wohnen', 'Kueche', 'Schlafen', 'Garten', 'Technik', 'Bad');
    b.subs('Wohnen', 'WZ_Licht', 'WZ_Rollos', 'WZ_Medien');
    b.tgt('Wohnen', 'Szenen_Alle');
    b.subs('WZ_Licht', 'WZ_Decke', 'WZ_LED');
    b.media('WZ_Medien', 'alias.0.Wohnzimmer.Sonos');
    b.subs('Kueche', 'Kueche_Geraete');
    b.lp('Kueche', 'Kueche_Timer');
    b.p('Kueche_Timer', { parent: 'Kueche', home: 'main' });
    b.subs('Schlafen', 'SZ_Klima', 'Szenen_Alle');
    // Garten: kurze prev/next-Kette als Ziel, dazu ein Verweis auf die Wallbox (parent: Energie)
    b.tgt('Garten', 'Garten_Wasser', 'Wallbox');
    b.p('Garten_Wasser', { parent: 'Garten', home: 'main' });
    b.chain(['Garten_Wasser', 'Garten_Licht']);
    b.p('Garten_Licht', { home: 'main' });
    b.subs('Garten', 'Garten_Pool');
    b.subs('Technik', 'Heizung', 'Energie');
    b.subs(
        'Energie',
        'PV',
        'Batterie',
        'Netz',
        'Wallbox',
        'Waermepumpe',
        'Verbrauch',
        'Zaehler',
        'Prognose',
        'Historie',
        'Tarif',
    );
    b.lp('Energie', 'Energie_Einstellungen');
    b.p('Energie_Einstellungen', { parent: 'Energie', home: 'main' });
    b.subs('Bad', 'Bad_Lueftung', 'Bad_Heizung');
    b.system(true);
    b.states('main', 'alias.0.Aussen.Temperatur', 'alias.0.Haus.Alarm');
    b.states('Wohnen', 'alias.0.Wohnzimmer.Decke', 'alias.0.Wohnzimmer.Rollo');
    b.states('WZ_Licht', 'alias.0.Wohnzimmer.Decke', 'alias.0.Wohnzimmer.LED');
    b.states('PV', 'modbus.0.inputRegisters.PV_Leistung');
    b.states('Batterie', 'modbus.0.inputRegisters.SOC');
    b.states('Heizung', 'alias.0.Heizung.Vorlauf', 'alias.0.Heizung.Ruecklauf');
    return b.list();
}

/**
 * Große baumlastige Konfiguration (~80 Seiten + Service-Seiten), generiert: main → 10 Bereiche →
 * je 2 bis 10 Unterseiten → teils weitere Ebenen (bis 4 tief). Einzelne Unterseiten werden von
 * einem zweiten Bereich verlinkt (parent bleibt der eigentliche), einzelne Long-Press-Ziele und
 * kurze prev/next-Ketten.
 */
export function largeTreeMap(): FixtureEntry[] {
    const r = rng(2024);
    const b = new MapBuilder();
    b.chain(['main', '///unlock'], true);
    const areas = Array.from({ length: 10 }, (_, i) => `Bereich_${String(i + 1).padStart(2, '0')}`);
    b.subs('main', ...areas);
    let n = 0;
    const all: string[] = [];
    const grow = (owner: string, depth: number, count: number): void => {
        const kids: string[] = [];
        for (let i = 0; i < count; i++) {
            kids.push(`${owner.replace(/^Bereich_/, 'B')}_${++n}`);
        }
        for (const kid of kids) {
            all.push(kid);
            if (r() < 0.12) {
                b.lp(owner, kid);
                b.p(kid, { parent: owner, home: 'main' });
            } else {
                b.subs(owner, kid);
            }
        }
        if (kids.length >= 3 && r() < 0.3) {
            // kurze Kette: die nächste Seite hängt per prev/next am ersten Kind
            const extra = `${kids[0]}_weiter`;
            b.chain([kids[0], extra]);
            b.p(extra, { home: 'main' });
            all.push(extra);
        }
        if (depth < 4) {
            for (const kid of kids) {
                const p = depth === 2 ? 0.35 : 0.15;
                if (r() < p) {
                    grow(kid, depth + 1, 2 + Math.floor(r() * 3));
                }
            }
        }
    };
    const counts = [2, 10, 4, 3, 6, 2, 8, 3, 2, 5];
    areas.forEach((a, i) => grow(a, 2, counts[i]));
    // Mehrfachverweise: ein anderer Bereich verlinkt eine fremde Unterseite (vor deren parent)
    for (let i = 0; i < 6; i++) {
        const target = all[Math.floor(r() * all.length)];
        const from = areas[Math.floor(r() * 3)];
        if (b.m.get(target)?.parent !== from) {
            const e = b.p(from);
            e.targetPages = [target, ...(e.targetPages ?? [])];
        }
    }
    b.system(true);
    for (const a of areas) {
        if (r() < 0.7) {
            b.states(a, `alias.0.${a}.Licht`, `alias.0.${a}.Temperatur`);
        }
    }
    return b.list();
}

/** Alle Test-Maps nach Namen */
export const LAYOUT_TEST_MAPS: Record<string, () => FixtureEntry[]> = {
    S_klein: smallMap,
    T_typisch: typicalMap,
    C_zyklen: cyclesMap,
    L_gross: largeMap,
    XL_200: hugeMap,
    B_baum: treeMap,
    BL_baum_gross: largeTreeMap,
};
