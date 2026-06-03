# Dokumentations-Fortschritt

Legende: ✅ Fertig | 🔄 In Arbeit | ⚠️ Zu prüfen | ❌ Stub/leer | 🕐 Warten | ⏳ folgt mit DE-Phase

> **Hinweis EN-Dateien:** EN-Versionen entstehen jeweils zusammen mit der DE-Phase. Nach Phase 6 existiert für **jede** DE-Seite eine EN-Version (inkl. Platzhalter `kommt-noch` und `pageUnlock`). Die EN-Sidebar trägt keine „in progress"-Marker mehr.

## Admin-UI

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| globelSettings.md | ~4 KB | ✅ Fertig | ✅ Fertig | 1.1 | iA in Sidebar |
| Developer.md | ~4 KB | ✅ Fertig | ✅ Fertig | 1.2 | iA in Sidebar |
| Navigation.md | ~4 KB | ✅ Fertig (⚠️ Tab in Überarb.) | ✅ Fertig | 1.3 | iA in Sidebar |
| naviFlow.md | ~1 KB | ✅ Fertig | ✅ Fertig | 1.3 | iA in Sidebar |
| symbolOverview.md | ~1 KB | ✅ Fertig | ✅ Fertig | 1.4 | |
| Maintain.md | ~3 KB | ✅ Fertig | ✅ Fertig | 1.4 | |
| General.md | ~3 KB | ✅ Fertig | ✅ Fertig | 1.4 | MQTT-Einstellungen |
| NSPanelsetting.md | ~4 KB | ✅ Fertig | ✅ Fertig | 1.4 | |
| tasmotatools.md | ~2 KB | ✅ Fertig | ✅ Fertig | 1.4 | |
| ColorThemes.md | ~7 KB | ✅ Fertig (6) | ✅ Fertig (6) | 6 | Gegen `Color.ts` verifiziert: 5 Themes (default/topical/technical/sunset/volcano), Index 0–4 via `getThemeByIndex`. Index-Tabelle + Namens-Diskrepanz dokumentiert. „Im Aufbau" entfernt, EN erstellt. |

## Konfigurationsskript

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| ScriptConfig.md | ~30 KB | ✅ Fertig (2.1+2.2) | ✅ Fertig (2.3) | 2.1–2.3 | Hauptdoku vollständig gegen `config-manager.d.ts`, `ConfigButtonFunction` und Adapter-Code verifiziert. **2.1:** Seiten-Konfiguration + optionale Parameter. **2.2:** PageItems (alle Felder, colorScale-Modi, Custom/Native-Items) + Hardwarebutton; fragmentierte Doku konsolidiert, ABLAGE aufgelöst. **2.3:** EN-Version mit identischer Heading-Struktur, `en-`-Links |
| GlobalPages.md | ~25 KB | ✅ Fertig (2.4) | ✅ Fertig (2.4) | 2.4 | Gegen `config-manager.d.ts` (`globalPagesConfig`, `PageTypeGlobal`, `PageLink`) + `config-manager.ts` Merge-Logik verifiziert. Korrekturen: `prev`-Auto-Hinzufügen (nicht nur `next`), doppelter `uniqueName`-Abbruch, nicht referenzierte globale Seiten landen trotzdem in subPages. `version` wird vom Skript automatisch injiziert. |
| screensaver.md | 56 KB | ✅ Fertig (4) | ✅ Fertig (4) | 4 | Gegen `config-manager.d.ts` (`ScreenSaverElement`/`ScreenSaverMRElement`/`ScreenSaverNotifyElement`), `Color.ts` (Skala-Modi), `text.ts` (54 Templates) und `main.ts`/`panel.ts` (Notifications) verifiziert. Korrekturen: `colorScale:`→`ScreensaverEntityIconColor` (Screensaver-Feld), `log10` nur `'min'`/`'max'` (kein `'center'`), Modus `quadriGrad` ergänzt, `ScreensaverEntityValue*` als mrIcon-only markiert, `forecastDay4–6` ergänzt, Priority-Hinweis. EN neu erstellt (identische Struktur). **Befund:** `screensaverNotify`-Handler (`main.ts:2166-2167`) prüft `panel`, sucht aber per `topic` → Code-Inkonsistenz. |

## Standard Pages

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| cardAlarm.md | ~7 KB | ✅ Fertig (3.1) | ✅ Fertig (3.1) | 3.1 | Gegen `PageAlarm`-Typ, `pageAlarm.ts` (Zustandsmaschine, States, PIN), Admin `UnlockEntry`/`PageAlarmEditor.tsx` + i18n verifiziert. Konfiguration komplett im Admin-PageConfig-Tab; Skript-`items` bei cardAlarm/cardQR/cardUnlock nicht ausgewertet (`config-manager.ts:725`). Unlock-Variante nur erwähnt (pageUnlock 🕐). |
| pageUnlock.md | 80 B | 🕐 warten | 🕐 warten | — | Warte auf Tests; kein Sidebar-Link. EN-Platzhalter (6) ergänzt, damit `en-pageUnlock`-Verweis aus cardAlarm/Pages nicht ins Leere zeigt. |
| PageConfig.md | ~4 KB | ✅ Fertig (3.5) | ✅ Fertig (3.5) | 3.5 | Admin-Tab bestätigt (`PageConfigLayout.tsx`). Typenfilter: all/pageMenu/cardAlarm/cardQR/**cardPower**/cardTrash (Chart weiterhin eigener Tab). Menü-Seite-Link ergänzt. EN erstellt. |
| cardGrid.md | ~6 KB | ✅ Fertig (3.2) | ✅ Fertig (3.2) | 3.2 | Neu strukturiert: 3 Grid-Varianten (cardGrid 6 / cardGrid2 8 bzw. 9 us-p / cardGrid3 4 Kacheln, `pageMenu.ts`), Skript-Weg (PageGrid + PageItems) + Admin-Menü-Seite (cardMenue). Blättern/Filtern verlinkt auf ScriptConfig. |
| cardQR.md | ~5 KB | ✅ Fertig (3.2) | ✅ Fertig (3.2) | 3.2 | Gegen `QREntry`/`pageQR.ts` verifiziert: selType 0=FREE/1=Wifi/2=URL/3=TEL, wlantype-Werte, `setState`-Schalter. Skript-Verweis (PageQR, heading/items optional) ergänzt. |
| PageQR_old.md | — | 🗑️ gelöscht (3.2) | — | — | Veraltet, nicht verlinkt; auf Nachfrage gelöscht. cardQR.md ist die aktuelle Version. |
| PagePower.md | — | ✅ Fertig (3.3 / akt.) | ✅ Fertig (3.3 / akt.) | 3.3 | **Aktualisiert:** Konfiguration jetzt über **PageConfig** (Typ **Leistung** / `cardPower`, `PagePowerEditor.tsx`, `PageConfigManager.tsx`, `admin.ts:dataForCardPower`) – inkl. Navigation, Skript optional. Alter separater Tab `pagePowerdata` als Legacy markiert. DE+EN umgebaut (mirror cardAlarm/cardQR). |
| PageChart.md | 3139 B | ✅ Fertig (3.3) | ✅ Fertig (3.3) | 3.3 | Eigener Admin-Tab `pageChartdata`. Datenquelle `selInstanceDataSource` 0=oldScriptVersion / 1=dbAdapter (gegen `pageChart.ts`+jsonConfig verifiziert). Skript-Verweis `cardChart`/`cardLChart` ok. EN erstellt. |
| PageMedia.md | ~6 KB | ✅ Fertig (3.4) | ✅ Fertig (3.4) | 3.4 | Gegen `PageMediaItem` + `pageMedia.ts`/Player-Tools verifiziert. Korrekturen: falscher RGB-Typ `{r,g,b}`→`{red,green,blue}`, `volumePresets` (mpd/spotify) ergänzt, ungenutzte Typ-Felder (`mediaDevice`/`equalizerList`/`repeatList`/`globalTracklist`) als nicht ausgewertet markiert. EN erstellt. |
| PageThermo2.md | ~10 KB | ✅ Fertig (3.4) | ✅ Fertig (3.4) | 3.4 | Gegen `PageThermo2`/`PageThermo2Item` + `pageThermo2.ts` verifiziert. Fehlendes `sortOrder` (H/V/HM/VM/HB/VB, Default 'V') ergänzt; Heizkreis-Zuordnung über `filter` bestätigt. EN erstellt. |
| PagePopup.md | ~4 KB | ✅ Fertig (3.5) | ✅ Fertig (3.5) | 3.5 | **Kein** Skript-PageType: `setPopupNotification`-/`popupNotify`-Mechanismus (`pagePopup.ts`, `PagePopupDataDetails`). Hinweis ergänzt + H1-Titel; EN erstellt. |
| cardTrash.md | ~3 KB | ✅ Fertig (3.5) | ✅ Fertig (3.5) | 3.5 | **Kein** Skript-PageType: Admin-Karte `cardTrash` (`TrashEntry`, `admin.ts:dataForcardTrash`), intern cardEntities/cardSchedule. Hinweis ergänzt; EN erstellt. |
| Pages.md | ~2 KB | ✅ Fertig (3.5) | ✅ Fertig (3.5) | 3.5 | Seitentyp-Spalte gegen echte `type`-Strings korrigiert (cardPower/cardChart/cardThermo2/cardUnlock), PopupNotify+Trash als Nicht-PageType markiert, cardEntities/cardSchedule/cardThermo ergänzt. EN erstellt. |

## Developer

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| Developer-Templates.md | ~23 KB | ✅ Fertig (5) | ✅ Fertig (5) | 5 | Falsche Template-Namen korrigiert: `entities.departure-timetable`→`entities.fahrplan.departure-timetable`, `entities.departure-routes`→`entities.fahrplan.routes` (gegen `src/lib/templates/card.ts` verifiziert). Hinweis auf brightsky/openweathermap/pirate-weather-Pendants ergänzt. EN erstellt. |
| ALIAS.md | ~14 KB | ✅ Fertig (5) | ✅ Fertig (5) | 5 | Gegen `src/lib/const/config-manager-const.ts:199-376` (`checkedDatapoints`) verifiziert — alle Rollen und State-IDs stimmen überein. EN erstellt (Strukturkopie mit englischen Headlines + Notes). |
| Developer-News-(Latest).md | ~11 KB | ✅ Fertig (5) | ✅ Fertig (5) | 5 | Historische Changelog-Einträge (März 2024), bewusst nicht inhaltlich verändert. EN-Übersetzung erstellt. Regelmäßig aktualisieren. |
| Developer-Readme.md | ~6 KB | ✅ Fertig (5) | ✅ Fertig (5) | 5 | Checkliste aktualisiert: `cardAlarm`, `airCondition`, `media`, `level.timer` jetzt `[x]` (gegen `src/lib/configuration/admin.ts:126` und `src/lib/classes/config-manager.ts:1928/2082/2431/3610/4275/4421` verifiziert). EN erstellt. |

## Installation

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| NSPanel-flashen.md | 3233 B | ✅ Fertig (5) | ✅ Fertig (5) | 5 | Hardware-Anleitung, inhaltlich unverändert. EN erstellt. |
| Adapter-Installation.md | ~3.5 KB | ✅ Fertig (5) | ✅ Fertig (5) | 5 | Voraussetzungs-Abschnitt (js-controller ≥7.0.6, Node.js ≥22) ergänzt, kaputter `.md`-Link auf Wiki-Link umgestellt. EN erstellt. |
| NSPanel-Nextion-Editor.md | 5727 B | ✅ Fertig (5) | ✅ Fertig (5) | 5 | `.md`-Link zu Adapter-Installation in Wiki-Link umgewandelt. EN erstellt. |

## Infrastruktur

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| Home.md | ~2 KB | ✅ Fertig (6) | ✅ Fertig (6) | 6 | Einstiegsseite ausgebaut: Intro, Erste-Schritte, Doku-Übersicht, Community-Links (Bilder behalten). EN um Funktionsübersicht-Link ergänzt. |
| _Sidebar.md | ~2 KB | ✅ Fertig (6) | ✅ Fertig (6) | 6 | Alle „iA"-Marker entfernt (Seiten fertig), „(im Aufbau)" bei Funktionsübersicht gestrichen. EN: alle „(in progress)" entfernt + Introduction-Abschnitt mit Feature Overview ergänzt. |
| _Footer.md | 191 B | ✅ OK | ✅ Fertig | — | EN: „Back to top" |
| kommt-noch.md | 59 B | 🕐 Platzhalter | ✅ Fertig (6) | 6 | Catch-all für tote Adapter-Links, kein Inhalt geplant. EN-Platzhalter erstellt. |
| User-NSPanel-Funktionalität.md | ~4 KB | ✅ Fertig (6) | ✅ Fertig (6) | 6 | Funktionsübersicht neu geschrieben: Was ist NSPanel, Bedienkonzept, Seitentypen-Tabelle, Popups, Screensaver, Voraussetzungen, Nächste Schritte. EN erstellt. |

## Bekannte Befunde / technische Schulden

| Datei / Bereich | Befund | Aktion |
|-----------------|--------|--------|
| `src/lib/adapter-config.d.ts` Z.12 | `adminOverridesScriptPages` — nicht in Admin-UI, wird intern in `src/lib/configuration/admin.ts:301` genutzt. Kein Doku-Eintrag nötig. | — |
| `src/lib/adapter-config.d.ts` Z.34 | `deactivateDebugLog` — deklariert, aber nirgends in Admin-UI oder Code aktiv genutzt (verwaist). Kein Doku-Eintrag. | Ggf. im Code entfernen |
| `ScriptConfig.md` Z.46 + Z.404 | Doppelte Überschrift „Seiten-Konfiguration" (einmal `##`, einmal `#`). Erzeugt zweiten Anker `seiten-konfiguration-1`; Sidebar-Link auf ersten Anker funktioniert noch. | ✅ erledigt (Phase 2.1): ABLAGE-Duplikat „# Seiten-Konfiguration" inkl. doppelter „Optionale Parameter" entfernt, nützlichen `pages`/`subPages`-Test nach oben integriert |
| `config-manager.ts:725` | Bei `cardQR`/`cardAlarm`/`cardUnlock` `return` (statt `continue`) → das Skript-`items`-Array dieser Seiten wird nicht ausgewertet; Konfiguration kommt aus dem Admin. Wirkt wie vorzeitiger Abbruch der Seitenschleife. | Befund (3.1) — Code prüfen, ob `continue` gemeint ist; Doku beschreibt das Verhalten (items wird ignoriert). |
| `config-manager.d.ts` `PageMediaItem` | `mediaDevice`, `equalizerList`, `repeatList`, `globalTracklist` deklariert, aber von `pageMedia.ts`/Player-Tools nicht ausgewertet. | Befund (3.4) — in PageMedia.md als „nicht ausgewertet" markiert. |
| `config-manager.d.ts` `PageThermo2PageItems.heatCycleIndex` | Deklariert, aber `pageThermo2.ts` nutzt `filter` für die Heizkreis-Zuordnung. | Befund (3.4) — Doku dokumentiert `filter`. |
| Seitentypen ohne Wiki-Seite | `cardEntities`, `cardSchedule`, `cardThermo` sind in der `PageType`-Union, haben aber keine eigene Wiki-Seite (in [Pages](Pages) als „Weitere Seitentypen" gelistet, bei [cardGrid](cardGrid)/ScriptConfig mitbehandelt). | Befund (3.5) — bewusst keine Einzelseiten. |
| `PagePopup` / `cardTrash` | Beide sind **keine** `PageType`-Union-Mitglieder: PagePopup = `setPopupNotification`-Nachricht (`popupNotify`), cardTrash = Admin-PageConfig-Karte (intern cardEntities/cardSchedule). | ✅ Befund (3.5) — in den Doku-Seiten als solche gekennzeichnet. |

---

## Aktuell im Wiki verlinkter, unvollständiger Inhalt

Alle im Sidebar oder von anderen Seiten verlinkten Seiten sind fertiggestellt. Einzige bewusste Ausnahme:

| Seite | Status | Hinweis |
|-------|--------|---------|
| `pageUnlock.md` | 🕐 Platzhalter | Wartet auf Tests der Unlock-Funktion; **nicht** im Sidebar verlinkt. DE+EN sind Platzhalter, damit Verweise aus cardAlarm/Pages nicht ins Leere zeigen. |

---

*Zuletzt aktualisiert: 2026-06-03 (Phase 6 abgeschlossen: Infrastruktur-Seiten fertiggestellt. `User-NSPanel-Funktionalität.md` (Funktionsübersicht) neu geschrieben DE+EN; `Home.md` zur vollwertigen Einstiegsseite ausgebaut; `ColorThemes.md` gegen `Color.ts` verifiziert (Index 0–4, 5 Themes) + EN; `_Sidebar.md` DE+EN finalisiert (alle „iA"/„in progress"-Marker entfernt); EN-Platzhalter für `kommt-noch` und `pageUnlock` ergänzt. Damit hat jede DE-Seite eine EN-Version; keine toten internen Links, keine `.md`-Links.)*

---

*Phase 5 (2026-06-01): alle 4 Developer- und 3 Installations-Seiten DE gegen Code verifiziert + 7 EN-Versionen neu erstellt. Korrekturen: Developer-Readme-Checkliste auf aktuellen Code-Stand (cardAlarm, airCondition, media, level.timer = [x]); Developer-Templates falsche `entities.departure-*`-Namen gefixt; Adapter-Installation Voraussetzungen (Node.js ≥22) ergänzt; Wiki-Links bereinigt. ALIAS.md gegen `checkedDatapoints` (config-manager-const.ts) bestätigt – keine Abweichungen.*
