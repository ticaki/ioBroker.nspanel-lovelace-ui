# Media player (cardMedia)

**Supported adapters — exactly these five:** `alexa2`, `spotify-premium`, `mpd`, `sonos`, `squeezeboxrpc`.
Anything else is rejected with a log line. Older names such as `volumio`, `bosesoundtouch` or `squeezebox`
still appear in the type files but are no longer evaluated anywhere.

> **This card only exists in the configuration script.** The admin does not know the page type `cardMedia`;
> the *PageConfig* tab cannot create a media page. It is therefore the exception to the rule „everything in
> the admin" — the description of the script route on this page is the only route there is.

The card **`cardMedia`** shows a media player with title/artist, play/pause, volume and much more.
Depending on the adapter, different functions are detected automatically (playlists, shuffle, seek …).

---

## Minimal setup

```ts
const pageMediaTest1: PageType = {
  type: 'cardMedia',
  heading: 'main',
  uniqueName: 'main',
  media: {
    id: 'sonos.0.root.192_168_178_209', // your player
  },
  items: [],
};
```

> **`heading` is not shown on this card.** The headline comes from `media.name`; without it the adapter
> works it out from the device itself.

### `media.id` – examples
- **alexa2**: `alexa2.0.Echo-Devices.<YOUR_ID>`
- **spotify-premium**: `spotify-premium.0`
- **mpd**: `mpd.0`
- **sonos**: `sonos.0.root.192_168_178_209`
- **squeezeboxrpc**: `squeezeboxrpc.0.Players.<PLAYERNAME>` (the name as in the object tree, e.g. `K_che` for „Küche")

> **Note:** if only the adapter name is given, without an instance number, the **lowest existing instance**
> is used automatically. The name has to match **exactly** — `spotify-premium` finds an instance,
> `spotify` does not; the page then stays empty and the log reports the missing adapter.

---

## Your own page items
`items` behaves as it does on `cardGrid`/`cardEntities`. You can add your own page items — note that page
items have no `template` field at all; that only exists for the screensaver.

> **The option bar holds five slots at most.** Whatever the adapter creates as standard items counts
> towards that; anything beyond is paged.

---

## The important `media` options

| Option | Meaning | Notes/examples |
|---|---|---|
| `id` | Source/player (folder/device/channel, **not a state**) | see the examples above |
| `name` | Display name | leave empty → the name is worked out automatically |
| `colorMediaIcon` | Colour of the media icon | **use colour names** (e.g. `Blue`, `MSRed`) |
| `colorMediaArtist` | Colour of the artist line | see colour |
| `colorMediaTitle` | Colour of the title line | see colour |
| `speakerList` | Which speakers are offered | whitelist; **empty or unset = all**. With Sonos and Squeezebox the entry only appears once at least two players remain |
| `favoriteList` | **Whitelist** for favourite playlists | empty or unset = show all. **Squeezebox:** names as in `Favorites.*.Name` |
| `playList` | Available playlists | **Alexa/Spotify:** from the adapter. **Sonos:** user-generated. **Squeezebox:** whitelist of the stored LMS playlists (empty = all). **mpd has no lists at all** — no playlists, no track list, no speaker selection |
| `minValue` | Lower end of the **device** volume | mapped onto 0 % of the panel |
| `maxValue` | Upper end of the **device** volume | mapped onto 100 % of the panel |
| `volumePresets` | Fixed volumes as `"name?value"` | clamped to `minValue`/`maxValue` |
| `itemsColorOn` | On colour of individual standard page items | per item, see below |
| `itemsColorOff` | Off colour of individual standard page items | see below |
| `deactivateDefaultItems` | Hide standard page items | see below plus example |

### Standard page items (for colours / hiding)
- `online`, `speakerList`, `playList`, `trackList`, `favoriteList`, `repeat`, `equalizer`, `crossfade`, `clock`, `reminder`, `volumePresets`

Not every adapter knows all of them — hiding an item that does not exist there has no effect:

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

`reminder` is **off** by default and only appears with `deactivateDefaultItems: { reminder: false }`.

> **Using colours:** here **please use colour names** such as `Blue`, `MSRed`, `HMIOn`, `HMIOff` – **own
> colours are possible too**, then written as `{ r: …, g: …, b: … }`.

---

## Examples

### 1) Override colours per item
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

### 2) Hide standard items
```ts
media: {
  id: 'alexa2.0.Echo-Devices.YOUR_ID',
  deactivateDefaultItems: {
    equalizer: true,   // only alexa2 has one at all
    playList: true,
    clock: true,
  },
}
```

### 3) Whitelist for favourites / own playlists
```ts
media: {
  id: 'sonos.0.root.192_168_178_209',
  favoriteList: ['Best of 90s', 'Morning Vibes'], // whitelist – show only these
  playList: ['Living Room Mix', 'Party'],         // Sonos: user-generated
}
```

### 4) Give the device's volume range
```ts
media: {
  id: 'mpd.0',
  minValue: 5,   // 0 % on the panel equals 5 on the device
  maxValue: 80,  // 100 % on the panel equals 80 on the device
}
```

> **This does not limit the slider.** The slider on the panel stays 0–100; the two values only tell the
> adapter which section of the device scale to map onto it.

---

## Squeezebox (`squeezeboxrpc`)

The page belongs to one **room player** (`media.id`). If that player is part of a sync group, the page
automatically controls the **master** of the group (as the coordinator does with Sonos).

- **Speaker list:** opens a grid with every player (or those from `speakerList`). Tapping adds a room to
  the group or takes it out, and the slider sets that room's volume.
- **Group volume:** with an active group, a change on the main slider (e.g. +2) is added to **every**
  player of the group (clamped to 0–100). The distances between the rooms stay as they are until one room
  hits 0 or 100.
- **Shuffle** cycles: off → track → album.
- **Repeat** cycles: off → playlist → track.
- **On/off** switches the player's `Power`.
- **Logo:** a seek slider across the track length (`Time`/`Duration` → `cmdGoTime`).
- **Favourites** are read at runtime from `squeezeboxrpc.X.Favorites.*` (playable entries only, subfolders
  are not shown) and started through `cmdPlayFavorite`.
- **Playlists:** the stored playlists are fetched from the LMS through `sendTo` when the list opens and
  started through `cmdGeneral` (`playlistcontrol cmd:load`). `playList` acts as a whitelist.
- **Track list:** the current queue from `Players.<NAME>.Playlist`, jumping through `PlaylistCurrentIndex`.
- When muted, the volume slider shows 0.

**Requirements in the squeezeboxrpc adapter:** enable „load favourites" and „provide playlist
information". Telnet signalling (`usetelnet`) is recommended as well, otherwise changes to the title and
the lists arrive with a delay of up to ~10 s.

```ts
media: {
  id: 'squeezeboxrpc.0.Players.Livingroom',
  speakerList: ['Livingroom', 'Kitchen', 'Bath'], // optional: only these rooms in the grid
  favoriteList: ['Radio: Deutschlandfunk'],       // optional: whitelist
}
```

---

## Notes & behaviour
- **Whatever the adapter does not find simply drops out**: the button is then missing and the page is built
  anyway. That is the most common reason for a card without previous and next buttons.
- **The equalizer only exists for `alexa2`.**
- **A second route to a media page:** a page item can point at an **alias channel with the role `media`**.
  The channel needs exactly one state `STATE` (`media.state`, boolean), and that state has to be an alias
  onto one of the five adapters. If everything fits, the adapter creates the media page itself and links
  the page item to it; otherwise the build stops with a message in the log.
- The adapter collects the matching states of the source automatically (title, artist, isPlaying, shuffle,
  volume …) and creates **matching page items**. Not every adapter can do everything (playlists, for
  instance).
- **Seek/play/pause/shuffle/volume**: the controls appear when the source offers them.
- **Logo field**: depending on the source, the logo may toggle play/pause or open a seek popup.

---

## Pictures of the cardMedia

Main page, e.g. Alexa or Spotify  
<img alt='alexa2' src='../Pictures/pageMedia/alexa2.png' width= '45%'> <img alt='spotify' src='../Pictures/pageMedia/spotify.png' width='45%'>  
  
Equalizer and track list  
<img alt='equalizer' src='../Pictures/pageMedia/equalizer.png' width= '45%'> <img alt='tracklist' src='../Pictures/pageMedia/tracklist.png' width='45%'>  
  
Speakers and playlist  
<img alt='speaker' src='../Pictures/pageMedia/speaker.png' width= '45%'> <img alt='playlist' src='../Pictures/pageMedia/playlist.png' width='45%'>  
  
The pictures may differ depending on the configuration, or be missing entirely.

```typescript
// For reference only – the explanation is above.
// Please use colour names (e.g. Blue, MSRed).

type RGB = { r: number; g: number; b: number };

type MediaOptions = {
  id: string;
  name?: string;
  colorMediaIcon?: RGB;
  colorMediaArtist?: RGB;
  colorMediaTitle?: RGB;
  speakerList?: string[];
  /** whitelist of favourites; empty/missing → show all */
  favoriteList?: string[];
  /** playlists: Alexa/Spotify from the adapter; Sonos user-generated */
  playList?: string[];
  /** range of the device volume, mapped onto the panel's 0–100 */
  minValue?: number;
  maxValue?: number;
  /** fixed volumes, format "name?value" */
  volumePresets?: string[];

  /** on/off colours per default item */
  itemsColorOn?: Partial<Record<
    'trackList' | 'speakerList' | 'repeat' | 'equalizer' | 'playList' | 'online' | 'reminder' | 'crossfade' | 'favoriteList' | 'clock',
    RGB
  >>;
  itemsColorOff?: Partial<Record<
    'trackList' | 'speakerList' | 'repeat' | 'equalizer' | 'playList' | 'online' | 'reminder' | 'crossfade' | 'favoriteList' | 'clock',
    RGB
  >>;

  /** hide default items */
  deactivateDefaultItems?: Partial<Record<
    'trackList' | 'speakerList' | 'repeat' | 'equalizer' | 'playList' | 'online' | 'reminder' | 'clock' | 'favoriteList' | 'crossfade' | 'volumePresets',
    boolean
  >>;
};
```
