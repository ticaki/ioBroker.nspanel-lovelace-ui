# TODO: Empfangsschleife `tmSerial` auf allen Seiten korrigieren (HMI 6.2)

Auftrag für eine neue Session. Gefunden im Bild-Experiment (Branch `feat/hmi-image`, Commit `9f16eae8`, Details
in dessen `doc/ideas/image-transfer.md`). Dort ist es nur auf der Testseite `page0` umgesetzt; hier in `feat/hmi-6.2`
soll es auf **alle Seiten** aller drei HMIs (EU `HMI/nspanel-v6.2.0.HMI`, `HMI/us-l/…`, `HMI/us-p/…`).
Diese Datei nach der Umsetzung löschen.

## Befund

Der Timer `tmSerial` jeder Seite (Intervall 50 ms) läuft mit `while(bufferPos<usize)` Byte für Byte durch den
Empfangspuffer `u[]` und sucht den Kopf `55 BB`.

1. **Unvollständige Nachricht:** Ist der Kopf gefunden, die Nachricht aber noch nicht komplett
   (`if(3<usize)` bzw. `if(payloadLength<usize)` falsch), läuft die Schleife trotzdem bis zum Pufferende weiter –
   bei jedem Tick erneut. Gemessen ~0,35 ms pro Byte: Eine Nachricht mit ~900 Byte braucht dadurch 200–380 ms bis zur
   Quittung statt ~40–150 ms (betrifft jede größere Nachricht, z. B. `weatherUpdate`).
2. **Rahmen nicht ganz gelöscht:** `payloadLength` = Länge + 5 (aus `u[2..3]`, dann `+=3`, `+=2`); der Rahmen ist
   2 Kopf + 2 Länge + Nutzlast + 2 CRC = `payloadLength+1` Byte. Gelöscht wird aber nur `udelete payloadLength-1`,
   die **2 CRC-Bytes bleiben liegen**, bis der nächste Tick sie als Müll vor dem nächsten Kopf entfernt. Bei schneller
   Folge (Berry-Treiber 13 mit Pipelining, erst recht bei 921600 Baud) kommt die nächste volle Nachricht (1023 Byte)
   vorher → 2 + 1023 > 1023 → **Pufferüberlauf 0x24**, Display reagiert nicht mehr.

## Umsetzung (Vorlage: `HMI/tools/image_page0_fast.py` und `image_page0_udelete.py` im Branch `feat/hmi-image`)

1. In beiden Unvollständig-Fällen die Schleife beenden (`bufferPos=usize`, danach folgt `bufferPos++`) – **aber nur,
   wenn die angekündigte Länge plausibel ist** (z. B. `payloadLength` ≤ ~1024). Sonst wie bisher weitersuchen,
   damit ein zufälliges `55 BB` im Müll mit unsinniger Länge die Schleife nicht für immer blockiert.
   Nextion rechnet nicht in `if`-Bedingungen → Vergleichswert vorher in eine Variable.
2. `udelete payloadLength-1` → `udelete payloadLength+1` an beiden Stellen je Seite (pageType-Zweig und Ende des
   User-Codes). Gezählt in 6.2 EU: 33 Seiten mit diesem Muster (alle mit tmSerial außer pageTest mit nur einer Stelle;
   pageIcons, cardLChart2, pageSplash haben keins). us-l/us-p ebenso prüfen.
3. Vorsicht, schon vorhanden: Bei einem pageType mit **unbekannter tId** läuft der Code bis zum zweiten `udelete` am
   Ende weiter und löscht doppelt – mit `+1` gingen 2 Byte mehr der Folgenachricht verloren. Den Fall mitbehandeln
   (z. B. nach dem pageType-Zweig nicht noch einmal löschen).
4. Bei CRC-Fehler gibt es heute **kein** `udelete` (kein else nach `if(crcval==recvCrc)`); der Rahmen bleibt, bis ein
   späterer Kopf ihn als Müll entfernt. Entscheiden, ob er sofort gelöscht wird (`udelete payloadLength+1`).
5. Generator-Skript unter `HMI/tools/` (Eingabe/Ausgabe als Argumente, erwartete Zeilen prüfen, `Hmi(...).check()`,
   Round-Trip, nur Seiten-Sektionen geändert), RAM bleibt gleich (kein neues Objekt nötig, ggf. eine Hilfsvariable –
   dann RAM prüfen, popupThermo EU liegt bei 3580/3584).
6. Test am Panel (ns_panel4, 192.168.1.146; hat derzeit die Experiment-TFT img6 + Berry 13): Seitenwechsel,
   Screensaver, große `weatherUpdate`, Popups; mit Berry 12 und Berry 13. Keine `0x24` in der Tasmota-Konsole.

## Danach

- Changelog-Eintrag (WIP) im README.
- Im Bild-Experiment kann die Adapter-Grenze `IMAGE_TEST_MAX_BYTES` (1013) wieder auf 1017.
