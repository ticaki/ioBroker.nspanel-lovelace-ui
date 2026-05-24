# Dokumentations-Fortschritt

Legende: ✅ Fertig | 🔄 In Arbeit | ⚠️ Zu prüfen | ❌ Stub/leer | 🕐 Warten | ⏳ folgt mit DE-Phase

> **Hinweis EN-Dateien:** EN-Versionen entstehen jeweils zusammen mit der DE-Phase. Aktuell existieren 13 EN-Dateien von 39 DE-Dateien — das ist plangemäß und kein Fehler. Die EN-Sidebar zeigt fehlende Seiten als „in progress".

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
| ColorThemes.md | 5512 B | ⚠️ prüfen | ⏳ folgt mit DE | 1.4 | |

## Konfigurationsskript

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| ScriptConfig.md | ~30 KB | ✅ Fertig (2.1+2.2) | ✅ Fertig (2.3) | 2.1–2.3 | Hauptdoku vollständig gegen `config-manager.d.ts`, `ConfigButtonFunction` und Adapter-Code verifiziert. **2.1:** Seiten-Konfiguration + optionale Parameter. **2.2:** PageItems (alle Felder, colorScale-Modi, Custom/Native-Items) + Hardwarebutton; fragmentierte Doku konsolidiert, ABLAGE aufgelöst. **2.3:** EN-Version mit identischer Heading-Struktur, `en-`-Links |
| GlobalPages.md | ~25 KB | ✅ Fertig (2.4) | ✅ Fertig (2.4) | 2.4 | Gegen `config-manager.d.ts` (`globalPagesConfig`, `PageTypeGlobal`, `PageLink`) + `config-manager.ts` Merge-Logik verifiziert. Korrekturen: `prev`-Auto-Hinzufügen (nicht nur `next`), doppelter `uniqueName`-Abbruch, nicht referenzierte globale Seiten landen trotzdem in subPages. `version` wird vom Skript automatisch injiziert. |
| screensaver.md | 56 KB | ⚠️ prüfen | ⏳ folgt mit DE | 4 | Groß → 2 Sessions |

## Standard Pages

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| cardAlarm.md | ~7 KB | ✅ Fertig (3.1) | ✅ Fertig (3.1) | 3.1 | Gegen `PageAlarm`-Typ, `pageAlarm.ts` (Zustandsmaschine, States, PIN), Admin `UnlockEntry`/`PageAlarmEditor.tsx` + i18n verifiziert. Konfiguration komplett im Admin-PageConfig-Tab; Skript-`items` bei cardAlarm/cardQR/cardUnlock nicht ausgewertet (`config-manager.ts:725`). Unlock-Variante nur erwähnt (pageUnlock 🕐). |
| pageUnlock.md | 80 B | 🕐 warten | 🕐 warten | — | Warte auf Tests; kein Sidebar-Link |
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
| Developer-Templates.md | 23 KB | ⚠️ prüfen | ⏳ folgt mit DE | 5 | |
| ALIAS.md | 14 KB | ⚠️ prüfen | ⏳ folgt mit DE | 5 | |
| Developer-News-(Latest).md | 11 KB | ⚠️ prüfen | ⏳ folgt mit DE | 5 | Regelmäßig aktualisieren |
| Developer-Readme.md | 5849 B | ⚠️ prüfen | ⏳ folgt mit DE | 5 | |

## Installation

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| NSPanel-flashen.md | 3233 B | ⚠️ prüfen | ⏳ folgt mit DE | 5 | |
| Adapter-Installation.md | 3192 B | ⚠️ prüfen | ⏳ folgt mit DE | 5 | |
| NSPanel-Nextion-Editor.md | 5727 B | ⚠️ prüfen | ⏳ folgt mit DE | 5 | |

## Infrastruktur

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| Home.md | 534 B | ❌ praktisch leer (nur Bilder/Headlines) | ✅ Stub | 6 | Einstiegsseite, sichtbar im Wiki |
| _Sidebar.md | 2078 B | ⚠️ prüfen | ✅ Stub | 6 | ⚠️ Z.13 war Leerlink → auf `User-NSPanel-Funktionalität` korrigiert |
| _Footer.md | 191 B | ✅ OK | ✅ Fertig | — | EN: „Back to top" |
| kommt-noch.md | 59 B | 🕐 Platzhalter | — | — | Catch-all für tote Adapter-Links, kein Inhalt geplant |
| User-NSPanel-Funktionalität.md | 9 B | ❌ STUB | — | — | Ziel von `_Sidebar.md` → Funktionsübersicht, noch leer |

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

Diese Seiten sind im Sidebar oder einer anderen Seite verlinkt, aber noch nicht fertiggestellt — sichtbar für Wiki-Leser:

| Seite | Problem | Ziel |
|-------|---------|------|
| `Home.md` | Nur Bilder und Headlines, kein beschreibender Text | Phase 6 |
| `User-NSPanel-Funktionalität.md` | Nur „Im Aufbau", Sidebar verlinkt darauf | Phase 6 |

---

*Zuletzt aktualisiert: 2026-05-23 (Phase 3 abgeschlossen: alle Standard-Pages DE gegen Code verifiziert/ergänzt + EN-Versionen. cardAlarm neu, cardGrid neu strukturiert, PageQR_old gelöscht, Pages-Typtabelle korrigiert, PagePopup/cardTrash als Nicht-PageTypes gekennzeichnet.)*
