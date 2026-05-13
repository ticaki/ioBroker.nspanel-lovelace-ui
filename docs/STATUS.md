# Dokumentations-Fortschritt

Legende: ✅ Fertig | 🔄 In Arbeit | ⚠️ Zu prüfen | ❌ Stub/leer | 🕐 Warten

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
| ColorThemes.md | 5512 B | ⚠️ prüfen | ❌ | 1.4 | |

## Konfigurationsskript

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| ScriptConfig.md | 34 KB | ⚠️ prüfen | ❌ | 2.1–2.3 | Hauptdoku; ⚠️ doppelte H1/H2 „Seiten-Konfiguration" (Z.46 + Z.404 → Anker `seiten-konfiguration-1`), bei Phase 2 bereinigen |
| GlobalPages.md | 22 KB | ⚠️ prüfen | ❌ | 2.4 | |
| screensaver.md | 56 KB | ⚠️ prüfen | ❌ | 4 | Groß → 2 Sessions |

## Standard Pages

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| cardAlarm.md | 94 B | ❌ STUB | ❌ | 3 | |
| pageUnlock.md | 80 B | 🕐 warten | 🕐 | — | Warte auf Tests |
| PageConfig.md | 3195 B | ⚠️ prüfen | ❌ | 3 | |
| cardGrid.md | 2620 B | ⚠️ prüfen | ❌ | 3 | |
| cardQR.md | 4065 B | ⚠️ prüfen | ❌ | 3 | |
| PageQR_old.md | 4674 B | 🕐 veraltet | — | — | Ggf. löschen |
| PagePower.md | 5959 B | ⚠️ prüfen | ❌ | 3 | |
| PageChart.md | 3139 B | ⚠️ prüfen | ❌ | 3 | |
| PageMedia.md | 5434 B | ⚠️ prüfen | ❌ | 3 | |
| PageThermo2.md | 9872 B | ⚠️ prüfen | ❌ | 3 | |
| PagePopup.md | 3971 B | ⚠️ prüfen | ❌ | 3 | |
| cardTrash.md | 2939 B | ⚠️ prüfen | ❌ | 3 | |
| Pages.md | 503 B | ⚠️ prüfen | ❌ | 3 | Übersichtsseite |

## Developer

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| Developer-Templates.md | 23 KB | ⚠️ prüfen | ❌ | 5 | |
| ALIAS.md | 14 KB | ⚠️ prüfen | ❌ | 5 | |
| Developer-News-(Latest).md | 11 KB | ⚠️ prüfen | ❌ | 5 | Regelmäßig aktualisieren |
| Developer-Readme.md | 5849 B | ⚠️ prüfen | ❌ | 5 | |

## Installation

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| NSPanel-flashen.md | 3233 B | ⚠️ prüfen | ❌ | 5 | |
| Adapter-Installation.md | 3192 B | ⚠️ prüfen | ❌ | 5 | |
| NSPanel-Nextion-Editor.md | 5727 B | ⚠️ prüfen | ❌ | 5 | |

## Infrastruktur

| Seite (de) | Größe | Status DE | Status EN | Phase | Hinweis |
|-----------|-------|-----------|-----------|-------|---------|
| Home.md | 534 B | ⚠️ prüfen | ✅ Stub | 6 | |
| _Sidebar.md | 2078 B | ⚠️ prüfen | ✅ Stub | 6 | |
| _Footer.md | 191 B | ✅ OK | — | — | Nur Footer |
| kommt-noch.md | 59 B | 🕐 Platzhalter | — | — | |
| User-NSPanel-Funktionalität.md | 9 B | ❌ STUB | — | — | |

## Bekannte Befunde / technische Schulden

| Datei / Bereich | Befund | Aktion |
|-----------------|--------|--------|
| `src/lib/adapter-config.d.ts` Z.12 | `adminOverridesScriptPages` — nicht in Admin-UI, wird intern in `src/lib/configuration/admin.ts:301` genutzt. Kein Doku-Eintrag nötig. | — |
| `src/lib/adapter-config.d.ts` Z.34 | `deactivateDebugLog` — deklariert, aber nirgends in Admin-UI oder Code aktiv genutzt (verwaist). Kein Doku-Eintrag. | Ggf. im Code entfernen |
| `ScriptConfig.md` Z.46 + Z.404 | Doppelte Überschrift „Seiten-Konfiguration" (einmal `##`, einmal `#`). Erzeugt zweiten Anker `seiten-konfiguration-1`; Sidebar-Link auf ersten Anker funktioniert noch. | Bei Phase 2.1 bereinigen |

---

*Zuletzt aktualisiert: 2026-05-13 (Phase 1.4 — Admin-UI vollständig, Review-Befunde dokumentiert)*
