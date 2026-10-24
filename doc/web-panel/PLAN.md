# Web-Panel: NSPanel-Oberfläche im Browser

Stand: 2026-10-24, Branch `feature/web-panel`

## Ziel

Der Adapter stellt Endpoints bereit, über die die NSPanel-Oberfläche in einem Webbrowser
dargestellt wird. Der Browser verhält sich 1:1 wie ein NSPanel: er versteht die gleichen
Strings (`entityUpd~…`, `pageType~…`, …), schickt die gleichen Events
(`event,buttonPress2,…`) und quittiert Nachrichten wie der Berry-Treiber (`Done`).
Damit bekommen Tablets, Handys oder beliebige Geräte dieselbe Visu, ohne dass die
Seitenlogik doppelt gebaut wird.

## Entscheidungen (abgestimmt 2026-10-24)

| Thema | Entscheidung |
| --- | --- |
| Konfiguration | Das Web-Panel ist **vorerst ein Klon** eines echten Panels (gleiche NSPanel-Konfiguration). Eine eigene NSPanel-Konfiguration pro Web-Panel kommt später, der Weg dahin darf nicht verbaut werden (`kind: 'web'` in der Panel-Konfiguration vorsehen). Technische Einstellungen wie Port sind erlaubt. |
| Server | Eigener HTTP + WebSocket-Server im Adapter (kein ioBroker.web-Zwang). Port als Admin-Feld, Default 8090. |
| Login | Vorerst ohne Login. Server hat einen `authorize`-Hook, das Frontend einen `PanelTransport`-Vertrag, damit später Token oder eine Anbindung über ioBroker socket/web nachrüstbar ist. |
| Instanzen | Ein virtuelles Panel **pro Browser-Sitzung**. Die Sitzung bleibt nach Verbindungsabbruch sehr großzügig erhalten (Default 24 h) und wird beim Reconnect wieder angebunden. |
| URL | `http://<host>:<port>/<topic>`; die MAC-ID aus der Panel-Tabelle wird als Fallback akzeptiert. |
| Tasmota | Relais, Sensoren, tempOffset, Restart, Rules, Status-Abfragen entfallen. Der **Buzzer wird simuliert** (Web Audio). Die beiden Hardware-Taster werden als Bildschirm-Buttons angeboten und verhalten sich wie detached Buttons. |
| Dimmode / Timeout | Beides wird im Browser visuell bzw. zeitlich nachgebildet. |
| Modell | Das virtuelle Panel übernimmt das Modell des echten Panels (eu, us-l, us-p). Umschalten im Betrieb gibt es nicht, später über die Konfiguration. Erste Umsetzung: `eu` (480×320 quer). |
| Optik | Nachbau nach Wiki-Bildern und HMI-Readme reicht, pixelgenau nach HMI ist nicht gefordert. Fehlende Bilder: siehe `MISSING_PICTURES.md`. |
| Simulator | Das alte `simulator/`-Verzeichnis (nur dist, keine Quellen) wurde entfernt. |
| Globale Aktionen | Virtuelle Panels zählen als Online-Panels (z. B. für `setPopupNotification`). |
| Umsetzung | Eigener Branch, Backend und Frontend-Kern parallel, danach Karten massiv parallel per Worker. |

## Phasen

1. **Backend-Fundament** – `PanelChannel`-Abstraktion, `VirtualPanelChannel`, `kind: 'web'`
   in der Panel-Klasse, `VirtualPanelManager`, HTTP/WS-Server, Admin-Felder, Tests.
2. **Frontend-Kern** (`src-web/`) – Vite + React, Protokoll-Parser, Store, Geräte-Rahmen,
   WebSocket-Transport, Icons, Farben, Startseite, Timeout/Dim/Buzzer, Karten-Registry mit Stubs.
3. **Karten** – parallel: Screensaver (3 Varianten), Entities/Grid/Schedule, Media/QR,
   Thermo/Thermo2, Alarm/Unlock/Power, Chart/LChart/Trash, Popups.
4. **Integration** – Build nach `www/`, Lint, Tests, Changelog, Wiki-Seite.
5. **Admin-Vorschau** (Idee vom 2026-10-24) – Das Web-Panel wird im Admin als Vorschau
   eingebettet (iframe auf `http://<adapter-host>:<webPort>/<topic>`), z. B. in der
   Panel-Übersicht oder neben der Seitenkonfiguration, damit der Nutzer sein Panel ohne
   Hardware testen kann. Weil jede Browser-Sitzung ein eigener Klon ist, beeinflusst die
   Vorschau das echte Panel nicht. Voraussetzungen, die schon jetzt gelten: der Server
   setzt keine Frame-Sperre (`X-Frame-Options`/CSP `frame-ancestors`), das Frontend läuft
   ohne feste Fenstergröße, und der Admin kann Host und Port aus `system.adapter.<ns>`
   bzw. `native.webPort` ermitteln. Offen: Mixed Content, wenn der Admin über HTTPS
   läuft und das Web-Panel über HTTP (dann Hinweis plus Link in neuem Tab statt iframe).

Der Architektur-Vertrag für alle Beteiligten steht in `ARCHITECTURE.md`.
