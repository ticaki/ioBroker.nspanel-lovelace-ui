# PageTrash  

> **Hinweis:** PageTrash ist **kein** eigener Skript-Seitentyp. Sie wird im Admin-**PageConfig**-Tab (Kartentyp **Abfall**, `cardTrash`) erstellt; intern erzeugt der Adapter daraus eine `cardEntities`- bzw. `cardSchedule`-Seite.

<img alt='panel-Ansicht-4' src='Pictures/pageTrash/panel-ansicht-4.png' width="40%"><img alt='panel-Ansicht-6' src='Pictures/pageTrash/panel-ansicht-6.png' width="40%">  
  
Die PageTrash ersetzt das [externe Script](https://github.com/tt-tom17/MyScripts/blob/main/Sonoff_NSPanel/Abfall_to%20NSPanel.ts) von tt-tom(tt-tom17) und die Seiten-Konfiguration im Script als cardEntities bzw. cardSchedule.  
in der Konfiguration kann die Termindatei (ics-Format) vom Entsorger direkt in den Adapter geladen bzw. auch weiterhin der Datenpunkt **table** vom iCal-Adapter geutzt werden.  
  
<img alt='pageConfigiCal' src='Pictures/pageTrash/config_ical.png' width="45%">
<img alt='pageConfig' src='Pictures/pageTrash/config.png' width="45%">  
  
---
### Beschreibung der Felder 
#### Überschrift  
=> sollte klar sein ;)  
  
#### Layout  
=> bestimmt wie viele Termine eingelesen werden und welche Card dafür genutzt wird. siehe oben  
  
#### Importtype  
=> hier wird entschieden, ob der Datenpunkt vom iCal - Adapter geutzt wird oder die .ics-Datei direkt gelesen werden soll  

<table>
<thead>
<tr>
<th>iCal-Adapter</th>
<th>ics Datei</th>
</tr>
</thead>
<tbody>
<tr>
<td><b>JSON State - Button "..."</b><br/><br/>=> Über den Button wird der Datenpunkt vom iCal-Adapter ausgewählt, der die Abfalltermine enthält. z.B. ical.0.data.table<br/><br/><b>Button "Ereignisse suchen"</b><br/><br/>Wenn der State ausgewählt ist, den Button klicken, um die Ergebnisse aus dem iCal-Adapter zusehen. </td>
<td><b>.ics-Datei inkl. Pfad</b><br/><br/>=> wenn die Datei schon auf dem ioBroker liegt, muss hier der direkte Pfad angegeben werden<br/><br/><b>Button "Datei hochladen"</b><br/><br/>Mit klick auf den Button öffnet sich ein Fenster zur Auswahl der .ics-Datei. Nachdem Hochladen wird der Pfad automatisch in das Textfeld eingetragen und die Ergebnisse angezeigt.</td>
</tr>
<tr>
<td colspan="2"><b>Gefundene Ergebnisse</b><br/><br/>Die gewünschten Abfallarten auswählen und Übernehmen. Die Daten werden unten in den Abfallarten automatisch eingetragen.</td>
</tr>
</tbody>
</table>  
  

<img alt='trash_select' src='Pictures/pageTrash/trash_select.png'>  
  
---
#### Farbfeld  
=> Auswahl der Iconfarbe   

#### Abfallart  
=> hier den Suchtext eingeben für die Abfallart. Kleines Beispiel: in den Daten vom iCal-Adapter gibt es einen Wert **event** der die Abfallart enthält.  
```json
{"date":"03.02.2026  ","event":"Ort - Straße - Papier",
"_class":"ical_Abfall ","_date":"2026-02-02T23:00:00.000Z",
"_end":"2026-02-03T23:00:00.000Z", ...
}
````
Um dieses Event zu finden muss als Suchtext **Papier** eingetragen werden. Beachtet das bei der Suche die Groß/Kleinschreibung beachtet wird.  
  
#### Optional eigene Bezeichnung  
=> hier kann ein eigener Text eingetragen werden der angezeigt werden soll. z.B. Papiertonne an statt Papier.  
  
<img alt='trash_layout' src='Pictures/pageTrash/trash_layout.png'>  
