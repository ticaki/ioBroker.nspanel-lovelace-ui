# Wiederaufnahme 2026-11-04 — cardLChart2 mit Waveform (4 Kanäle)

Branch: `feat/screensaver4` (Repo unverändert, alles Folgende liegt nur in `/mnt/projekte`).

## Aufgabe (Armilar)

1. Code für eine cardLChart mit Waveform anstatt `m0`.
2. Die 4 Kanäle müssen adressierbar sein, auch über das Serial-Protokoll vom Adapter.
3. Sonst alles gleich. X-/Y-Achse: noch offen.

## Stand

| Datei (`/mnt/projekte/`) | Inhalt |
|---|---|
| `nspanel-v6.0.2.screensaver4.HMI` | Basis, unverändert |
| `nspanel-v6.0.2.screensaver4.chartAdd.HMI` | Prinzip-Demo Folgenachricht: `cardLChart` (`20.pa`) + Befehl `chartAdd~<farbe>` zeichnet ein Dreieck in die Mitte von `m0`, ohne zu löschen |
| `nspanel-v6.0.2.screensaver4.wave.HMI` | **die eigentliche Arbeit:** `cardLChart2` (`29.pa`) neu aufgebaut |

Geprüft: Prüfsummen ok (`Hmi(...).check()`), jeweils nur die eine Seite geändert. **Noch nicht** im
Nextion-Editor kompiliert und **nicht** auf dem Panel getestet.

### Aufbau `cardLChart2` (wave.HMI)

- Kopie von `cardLChart` (Navigation, Heading, Timeout, Dimmen, pageType unverändert), Seitenkopf von der
  alten `29.pa` (Name `cardLChart2`, steht schon im pageType-Umschalter aller Seiten).
- `m0` ersetzt durch Waveform `s0` (aus der alten Testseite `cardLChart2`): x8 y75 w434 h235, `ch=4`,
  `dis=100`, `dir=1`, Grid `gdc/gdw/gdh` unverändert. Alte `h0`/`b0` entfernt.
- Load-Event: zusätzlich `s0.bco=defaultBcoColor`; `cardLChart.bco` → `cardLChart2.bco`.
- `va*`-Variablen und `t0` liegen noch auf der Seite, werden aber nicht mehr benutzt.

### Protokoll

| Nachricht | Wirkung |
|---|---|
| `entityUpd~…` | Felder 1–13 wie cardLChart (Heading, Navigation); Feld 14 = Farbe Kanal 0 → `s0.pco0`; dann `cle s0.id,255`. Achsen-/Linien-Code ist entfernt. |
| `waveData~<kanal 0..3>~<farbe RGB565 dez, leer = unverändert>~<daten>` | setzt `s0.pcoN`, `cle s0.id,N`, speist alle Punkte per `add s0.id,N,v` ein |

Daten: 2 Zeichen je Punkt aus `0`..`?` (0x30..0x3F), Wert = `(c1-48)*16 + (c2-48)` = 0..255 px.
Das Display liest die Bytes direkt aus `u[]` (Payload liegt in `u[4]..u[payloadLength-2]`, Daten nach dem
dritten `~`), kein `spstr` pro Punkt. Pro Nachricht ~850 Punkte möglich (`strCommand.txt_maxl` 1750),
Fläche ist 434 px breit.

## Test (nächster Schritt)

1. `nspanel-v6.0.2.screensaver4.wave.HMI` im Nextion-Editor öffnen, kompilieren (zeigt, ob `s0.pco0=` zur
   Laufzeit, `cle`, `u[sys2+1]` akzeptiert werden), TFT flashen.
2. In der Tasmota-Konsole nacheinander (erst wenn die Seite steht – ein `entityUpd` vom Adapter nach
   `renderCurrentPage` leert die Kanäle):

```
CustomSend pageType~cardLChart2
CustomSend waveData~0~65504~73787=81868;9094999=:2:6:::?;3;7;:;><2<5<8<<<?=1=4=7=9=;===?>0>2>3>4>5>5>6>6>6>6>5>5>4>3>2>0=?===;=9=7=4=1<?<<<8<5<2;>;:;7;3:?:::6:29=9994908;86817=78736>6965605;56524=4944403<37332?2<2824211>1:1715120?0=0;09070604030201010000000001010203040607090;0=0?1215171:1>2124282<2?33373<4044494=52565;6065696>
CustomSend waveData~1~63488~>6>6>6>5>4>3>2>1>0=>=<=:=8=5=3=0<=<:<7<3<0;<;9;5;1:<:8:4:09;97928=89847?7:75716<67625=59544?4;46423>3935312=2:26231?1<191613110>0<0:080605040302010000000000010203040506080:0<0>111316191<1?23262:2=31353:3>42464;4?54595=62676<71757:7?84898=92979;:0:4:8:<;1;5;9;<<0<3<7<:<==0=3=5=8=:=<=>>0>1>2>3>4>5>6>6
CustomSend waveData~2~2016~000203050608090;0<0>0?1113141617191:1<1=1?2022242527282:2;2=2>303133343638393;3<3>3?4142444547494:4<4=4?5052535556585:5;5=5>606163646667696;6<6>6?7172747577787:7;7=7?808283858688898;8<8>909193949697999:9<9=9?:1:2:4:5:7:8:::;:=:>;0;2;3;5;6;8;9;;;<;>;?<1<2<4<6<7<9<:<<<=<?=0=2=3=5=7=8=:=;===>>0>1>3>4>6
CustomSend waveData~3~65535~737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373737373
```

Erwartet: Sinus (gelb), Kosinus (rot), Sägezahn (grün), Konstante 115 (weiß), je 150 px breit.

Mögliche Befunde: Kurven abgeschnitten → Konsolen-Befehlslänge; Kurve gespiegelt / läuft falsch herum → `dir`.

## Offen

- Achsen (X/Y): Varianten — weiter per `line`/`xstr` um `s0` herum zeichnen (s0 dann kleiner) oder
  Beschriftung als Textfelder. Mit Armilar klären.
- Adapter-Seite: Werte auf 0..235 px vorskalieren, äquidistante x-Abstände (Waveform = 1 Punkt pro px),
  eine `waveData`-Nachricht pro Kanal nach dem `entityUpd`.
- Danach Übernahme in die HMI-Varianten us-l/us-p.

## Werkzeuge

`HMI/tools/hmi.py` + `HMI/tools/pagefile.py` (Seiten lesen/ändern, append-only schreiben, Prüfsummen).
Die Bauskripte dieser Session lagen nur im Session-Scratchpad und sind nicht Teil des Repos.
