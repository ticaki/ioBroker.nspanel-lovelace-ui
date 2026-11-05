# Mediaplayer (cardMedia)

**Unterstützte Adapter — genau diese fünf:** `alexa2`, `spotify-premium`, `mpd`, `sonos`, `squeezeboxrpc`.
Alles andere lehnt der Adapter mit einer Logzeile ab. Ältere Namen wie `volumio`, `bosesoundtouch` oder
`squeezebox` stehen zwar noch in den Typdateien, werden aber nirgends mehr ausgewertet.

> **Diese Karte gibt es nur im Konfigurationsskript.** Der Admin kennt den Seitentyp `cardMedia` nicht; im
> Tab *PageConfig* lässt sich keine Medienseite anlegen. Sie ist damit die Ausnahme von der Regel „alles im
> Admin" — die Beschreibung des Skriptwegs auf dieser Seite ist hier also der einzige Weg.

Die Karte **`cardMedia`** zeigt einen Mediaplayer mit Titel/Artist, Play/Pause, Lautstärke u.v.m. an. Je nach Adapter werden unterschiedliche Funktionen automatisch erkannt (z. B. Playlisten, Shuffle, Seek).

---

## Minimal-Setup

```ts
const pageMediaTest1: PageType = {
  type: 'cardMedia',
  heading: 'main',
  uniqueName: 'main',
  media: {
    id: 'sonos.0.root.192_168_178_209', // Dein Player
  },
  items: [],
};
```

> **`heading` wird bei dieser Karte nicht angezeigt.** Die Überschrift kommt aus `media.name`; fehlt die,
> ermittelt der Adapter sie selbst aus dem Gerät.

### `media.id` – Beispiele
- **alexa2**: `alexa2.0.Echo-Devices.<DEINE_ID>`
- **spotify**: `spotify-premium.0`
- **mpd**: `mpd.0`
- **sonos**: `sonos.0.root.192_168_178_209`
- **squeezeboxrpc**: `squeezeboxrpc.0.Players.<PLAYERNAME>` (Name wie im Objektbaum, z. B. `K_che` für „Küche“)

> **Hinweis:** Gibst du nur den Adapternamen ohne Instanznummer an, wird automatisch die **kleinste
> vorhandene Instanz** verwendet. Der Name muss dabei **genau** stimmen — `spotify-premium` findet eine
> Instanz, `spotify` nicht; dann bleibt die Seite leer und das Log meldet den fehlenden Adapter.

---

## Eigene PageItems
`items` verhält sich wie bei `cardGrid`/`cardEntities`. Du kannst eigene PageItems hinzufügen — Pageitems
kennen allerdings generell kein `template`-Feld, das gibt es nur beim Bildschirmschoner.

> **Die Optionsleiste hat höchstens fünf Plätze.** Was der Adapter an Standard-Items erzeugt, zählt mit;
> mehr Einträge werden durchgeblättert.

---

## Wichtige `media`‑Optionen (Kurzüberblick)

| Option | Bedeutung | Hinweise/Beispiele |
|---|---|---|
| `id` | Quelle/Player (Ordner/Device/Channel, **kein State**) | Siehe Beispiele oben |
| `name` | Anzeigename | Leer lassen → Name wird automatisch ermittelt |
| `colorMediaIcon` | Farbe für das Media‑Icon | **Verwende Farbnamen** (z. B. `Blue`, `MSRed`)  |
| `colorMediaArtist` | Farbe für die Artist‑Zeile | s. Farbe |
| `colorMediaTitle` | Farbe für die Titel‑Zeile | s. Farbe |
| `speakerList` | Liste erlaubter/angezeigter Lautsprecher | Whitelist; **leer oder nicht gesetzt = alle**. Bei Sonos und Squeezebox erscheint der Eintrag erst, wenn mindestens zwei Player übrig bleiben |
| `favoriteList` | **Whitelist** für Favoriten‑Playlists | Leer oder nicht gesetzt = zeige alle. **Squeezebox:** Namen wie in `Favorites.*.Name` |
| `playList` | Liste verfügbarer Playlists | **Alexa/Spotify:** aus dem Adapter. **Sonos:** nutzergeneriert. **Squeezebox:** Whitelist der gespeicherten LMS-Playlists (leer = alle). **mpd hat gar keine Listen** — dort gibt es weder Playlisten noch Titel- oder Lautsprecherauswahl |
| `minValue` | Unteres Ende der **Geräte**-Lautstärke | wird auf 0 % des Panels abgebildet |
| `maxValue` | Oberes Ende der **Geräte**-Lautstärke | wird auf 100 % des Panels abgebildet |
| `volumePresets` | Feste Lautstärken als `"Name?Wert"` | werden an `minValue`/`maxValue` angepasst |
| `itemsColorOn` | On‑Farbe für einzelne Standard‑PageItems | pro Item überschreibbar (s. unten) |
| `itemsColorOff` | Off‑Farbe für einzelne Standard‑PageItems | s. unten |
| `deactivateDefaultItems` | Standard‑PageItems gezielt ausblenden | s. unten + Beispiel |

### Standard‑PageItems (für Farben/Deaktivieren)
- `online`, `speakerList`, `playList`, `trackList`, `favoriteList`, `repeat`, `equalizer`, `crossfade`, `clock`, `reminder`, `volumePresets`

Nicht jeder Adapter kennt jedes davon — ein Item auszublenden, das es dort nicht gibt, hat keine Wirkung:

| Item | alexa2 | spotify-premium | mpd | sonos | squeezeboxrpc |
|---|:--:|:--:|:--:|:--:|:--:|
| `online` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `speakerList` | ✓ | ✓ | – | ✓ | ✓ |
| `playList` | ✓ | ✓ | – | ✓ | ✓ |
| `trackList` | – | ✓ | – | ✓ | ✓ |
| `favoriteList` | – | – | – | ✓ | ✓ |
| `repeat` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `equalizer` | ✓ | – | – | – | – |
| `crossfade` | – | – | ✓ | ✓ | – |
| `clock` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `reminder` | ✓ | – | – | – | – |
| `volumePresets` | ✓ | ✓ | ✓ | ✓ | ✓ |

`reminder` ist standardmäßig **aus** und erscheint erst mit `deactivateDefaultItems: { reminder: false }`.

> **Farben verwenden:** An dieser Stelle **bitte Farbnamen** wie `Blue`, `MSRed`, `HMIOn`, `HMIOff` etc. benutzen – **es ist auch möglich eigene zu verwenden**, dann als `{ r: …, g: …, b: … }`.  
> (Nur in Beispielen unten werden Farbnamen gezeigt – es gibt keine separate Farbtabelle in dieser Doku.)

---

## Beispiele

### 1) Farben pro Item überschreiben
```ts
media: {
  id: 'spotify-premium.0',
  itemsColorOn: {
    playList: Blue,
    speakerList: MSRed,
  },
  itemsColorOff: {
    playList: Gray,
  },
}
```

### 2) Standard‑Items ausblenden
```ts
media: {
  id: 'alexa2.0.Echo-Devices.DEINE_ID',
  deactivateDefaultItems: {
    equalizer: true,   // nur alexa2 hat ihn überhaupt
    playList: true,
    clock: true,
  },
}
```

### 3) Whitelist für Favoriten / eigene Playlists
```ts
media: {
  id: 'sonos.0.root.192_168_178_209',
  favoriteList: ['Best of 90s', 'Morning Vibes'], // Whitelist – nur diese anzeigen
  playList: ['Living Room Mix', 'Party'],        // Sonos: nutzergeneriert
}
```

### 4) Den Lautstärkebereich des Geräts angeben
```ts
media: {
  id: 'mpd.0',
  minValue: 5,   // 0 % am Panel entspricht 5 am Gerät
  maxValue: 80,  // 100 % am Panel entspricht 80 am Gerät
}
```

> **Das begrenzt den Regler nicht.** Der Schieberegler am Panel bleibt 0–100; die beiden Werte sagen dem
> Adapter nur, welchen Ausschnitt der Geräteskala er darauf abbilden soll.

---

## Squeezebox (`squeezeboxrpc`)

Die Seite gehört zu einem **Raum-Player** (`media.id`). Ist der Player Teil einer Sync-Gruppe, steuert die Seite automatisch den **Master** der Gruppe (wie bei Sonos der Koordinator).

- **Speaker-Liste:** öffnet ein Grid mit allen Playern (bzw. denen aus `speakerList`). Antippen schaltet einen Raum zur Gruppe dazu bzw. nimmt ihn heraus, der Slider regelt die Lautstärke des jeweiligen Raums.
- **Gruppenlautstärke:** Ist eine Gruppe aktiv, wird eine Änderung am Hauptregler (z. B. +2) auf **jeden** Player der Gruppe addiert (begrenzt auf 0–100). Die Abstände zwischen den Räumen bleiben erhalten, solange kein Raum an 0 oder 100 anstößt.
- **Shuffle** schaltet reihum: aus → Titel → Alben.
- **Repeat** schaltet reihum: aus → Playlist → Titel.
- **Ein/Aus** schaltet `Power` des Players.
- **Logo:** Seek-Slider über die Titellänge (`Time`/`Duration` → `cmdGoTime`).
- **Favoriten:** werden zur Laufzeit aus `squeezeboxrpc.X.Favorites.*` gelesen (nur abspielbare Einträge, Unterordner werden nicht angezeigt) und über `cmdPlayFavorite` gestartet.
- **Playlisten:** die gespeicherten Playlisten werden beim Öffnen per `sendTo` vom LMS abgefragt und über `cmdGeneral` (`playlistcontrol cmd:load`) gestartet. `playList` wirkt als Whitelist.
- **Trackliste:** aktuelle Wiedergabeliste aus `Players.<NAME>.Playlist`, Sprung über `PlaylistCurrentIndex`.
- Bei Stummschaltung zeigt der Lautstärkeregler 0.

**Voraussetzungen im squeezeboxrpc-Adapter:** „Favoriten laden“ und „Playlist-Informationen bereitstellen“ aktivieren. Empfohlen ist außerdem die Telnet-Signalisierung (`usetelnet`), sonst kommen Titel- und Listenänderungen erst mit bis zu ~10 s Verzögerung an.

```ts
media: {
  id: 'squeezeboxrpc.0.Players.Wohnzimmer',
  speakerList: ['Wohnzimmer', 'Küche', 'Bad'], // optional: nur diese Räume im Grid
  favoriteList: ['Radio: Deutschlandfunk'],   // optional: Whitelist
}
```

---

## Hinweise & Verhalten
- **Was der Adapter nicht findet, fällt lautlos weg**: die Taste erscheint dann nicht, die Seite baut sich trotzdem auf. Das ist der häufigste Grund für eine Karte ohne Vor-/Zurück-Tasten.
- **Der Equalizer existiert nur für `alexa2`.**
- **Zweiter Weg zur Medienseite:** Ein Pageitem kann auf einen **Alias-Kanal mit der Rolle `media`** zeigen. Der Kanal braucht genau einen Datenpunkt `STATE` (`media.state`, boolean), und dieser muss ein Alias auf einen der fünf Adapter sein. Passt alles, legt der Adapter die Medienseite selbst an und verlinkt das Pageitem dorthin; sonst bricht der Aufbau mit einer Meldung im Log ab.
- Der Adapter sammelt je nach Quelle automatisch passende States (Titel, Artist, isPlaying, Shuffle, Volume …) und erzeugt **passende PageItems**. Nicht jeder Adapter kann alles (z. B. Playlists).
- **Seek/Play/Pause/Shuffle/Volume**: Wenn die Quelle es anbietet, werden die Controls eingeblendet.
- **Logo‑Feld**: Je nach Quelle kann das Logo z. B. Play/Pause toggeln oder ein Seek‑Popup öffnen.

---

## Bilder zur cardMedia

Hauptseite z.B.  Alexa oder Spotify  
<img alt='alexa2' src='../Pictures/pageMedia/alexa2.png' width= '45%'> <img alt='spotify' src='../Pictures/pageMedia/spotify.png' width='45%'>  
  
Equalizer und Trakliste  
<img alt='equalizer' src='../Pictures/pageMedia/equalizer.png' width= '45%'> <img alt='trakliste' src='../Pictures/pageMedia/tracklist.png' width='45%'>  
  
Speaker und Playlist  
<img alt='speaker' src='../Pictures/pageMedia/speaker.png' width= '45%'> <img alt='playliste' src='../Pictures/pageMedia/playlist.png' width='45%'>  
  
Bilder können je nach Konfiguration abweichen oder nicht vorhanden sein  

```typescript
// Nur als Referenz – die Erklärung steht oben.
// Farben bitte als Symbolnamen (z. B. Blue, MSRed) nutzen.

type RGB = { r: number; g: number; b: number };

type MediaOptions = {
  id: string;
  name?: string;
  colorMediaIcon?: RGB;
  colorMediaArtist?: RGB;
  colorMediaTitle?: RGB;
  speakerList?: string[];
  /** Whitelist von Favoriten; leer/fehlend → zeige alle */
  favoriteList?: string[];
  /** Playlisten: Alexa/Spotify aus Adapter; Sonos nutzergeneriert */
  playList?: string[];
  /** Bereich der Geräte-Lautstärke, wird auf 0–100 des Panels abgebildet */
  minValue?: number;
  maxValue?: number;
  /** feste Lautstärken, Format "Name?Wert" */
  volumePresets?: string[];

  /** On-/Off-Farben pro Default-Item */
  itemsColorOn?: Partial<Record<
    'trackList' | 'speakerList' | 'repeat' | 'equalizer' | 'playList' | 'online' | 'reminder' | 'crossfade' | 'favoriteList',
    RGB
  >>;
  itemsColorOff?: Partial<Record<
    'trackList' | 'speakerList' | 'repeat' | 'equalizer' | 'playList' | 'online' | 'reminder' | 'crossfade' | 'favoriteList',
    RGB
  >>;

  /** Default-Items ausblenden */
  deactivateDefaultItems?: Partial<Record<
    'trackList' | 'speakerList' | 'repeat' | 'equalizer' | 'playList' | 'online' | 'reminder' | 'clock' | 'favoriteList' | 'crossfade',
    boolean
  >>;
};
```
      
