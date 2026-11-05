# Page Alarm

Die **Alarm-Seite** und die daraus entstehende **Entsperrseite** werden ausschließlich **im Admin**
eingerichtet. Ein Konfigurationsskript kann diese Kartentypen nicht anlegen — es weist sie ausdrücklich ab
(„is only supported in the admin configuration! Skipped!"). Es gibt hier also keinen zweiten Weg und
entsprechend auch keine Skript-Beschreibung.

➡️ **[Alarm- und Entsperrseite – Konfiguration im Admin](PageAlarm-Admin)**

Dort stehen: Betriebsart *Alarm* / *Entsperren*, PIN, die acht Schaltflächen und ihre Zustände,
*Genehmigt*, der Haken `unlock_global`, das Sprungziel der Entsperrseite und die drei Datenpunkte
(`.status`, `.mode`, `.approve`), über die eine echte Alarmanlage angebunden wird.
