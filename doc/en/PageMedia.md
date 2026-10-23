# Page Media (cardMedia)

The media page shows a player with a title and artist line, a volume slider, play/pause, on/off and —
depending on the source — speaker selection, playlists, favourites, track list, shuffle, repeat and an
equalizer.

> **This card only exists in the configuration script.** The admin does not know the page type
> `cardMedia` yet; the *PageConfig* tab cannot create a media page. It is therefore the exception to the
> rule „everything in the admin".

**Supported adapters — exactly these five:** `alexa2`, `spotify-premium`, `mpd`, `sonos` and
`squeezeboxrpc`. Anything else is rejected with a log line („not supported - only alexa2,
spotify-premium, mpd, sonos and squeezeboxrpc!"). Older names such as `volumio`, `bosesoundtouch` or
`squeezebox` still appear in the type files but are no longer evaluated anywhere.

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

> If only the **adapter name** is given (`spotify-premium`, `mpd`, …), the adapter takes the **lowest
> existing instance**. The name has to match exactly — `spotify` finds no instance, the page stays empty
> and the log says the adapter was not found.

---

## The second route: an alias with the role `media`

A page item on a menu page can point at an **alias channel with the role `media`**. The channel needs
exactly one state `STATE` (`media.state`, boolean), and that state has to be an **alias** onto one of the
five supported adapters. If everything fits, the adapter creates the media page itself (`media-<id>`) and
links the page item to it. If something is wrong — no `STATE`, no alias, the wrong target — the build
stops with a clear message in the log.

---

## Your own page items

`items` behaves as it does on `cardGrid`/`cardEntities`; own page items are possible. Keep in mind that
the **option bar holds five slots at most**. Whatever the adapter creates as standard items counts
towards that; anything beyond is paged.

---

## The important `media` options

| Option | Meaning | Notes |
|---|---|---|
| `id` | Source/player (folder, device or channel — **not a state**) | see above |
| `name` | Headline of the page | empty → the adapter works it out |
| `colorMediaIcon`, `colorMediaArtist`, `colorMediaTitle` | Colours for the icon, artist and title line | colour names such as `Blue`, `MSRed` or `{ r, g, b }` |
| `speakerList` | Which speakers appear in the selection grid | **empty = all**; with Sonos and Squeezebox the entry only appears from two players on |
| `favoriteList` | Whitelist for favourites | empty = all |
| `playList` | Whitelist for playlists | **mpd has no lists** — no playlists, no track list and no speaker selection there |
| `minValue` / `maxValue` | Volume range of the **device** | mapped onto the panel scale 0–100, see below |
| `volumePresets` | Fixed volumes as `"name?value"` | clamped to `minValue`/`maxValue` |
| `itemsColorOn` / `itemsColorOff` | Colours of individual standard items | names below |
| `deactivateDefaultItems` | Hide standard items | only items this adapter actually has |

**Standard items:** `online`, `speakerList`, `playList`, `trackList`, `favoriteList`, `repeat`,
`equalizer`, `crossfade`, `clock`, `reminder`, `volumePresets`.

Not every adapter knows all of them:

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

`reminder` is **off** by default and only appears once it is switched on explicitly
(`deactivateDefaultItems: { reminder: false }`). Hiding an item the source does not have has no effect.

> **Volume: `minValue`/`maxValue` do not limit anything.** They tell the adapter which range the **device**
> uses, and it maps that onto the panel's 0–100. The slider on the panel always stays 0–100 — it just
> covers a different section of the device scale.

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
    equalizer: true,
    playList: true,
    clock: true,
  },
}
```

### 3) Whitelist for favourites and playlists

```ts
media: {
  id: 'sonos.0.root.192_168_178_209',
  favoriteList: ['Best of 90s', 'Morning Vibes'],
  playList: ['Living Room Mix', 'Party'],
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

---

## Squeezebox (`squeezeboxrpc`)

The page belongs to one **room player** (`media.id`). If that player is part of a sync group, the page
automatically controls the **master** of the group (as the coordinator does with Sonos).

- **Speaker list:** opens a grid with every player (or those from `speakerList`). Tapping adds a room to
  the group or takes it out, and the slider sets that room's volume.
- **Group volume:** with an active group, a change on the main slider is added to **every** player
  (clamped to 0–100); the distances between rooms stay as they are until one hits 0 or 100.
- **Shuffle** cycles off → track → album. **Repeat** cycles off → playlist → track.
- **On/off** switches the player's `Power`.
- **Logo:** a seek slider across the track length (`Time`/`Duration` → `cmdGoTime`).
- **Favourites** are read at runtime from `squeezeboxrpc.X.Favorites.*` (playable entries only) and
  started through `cmdPlayFavorite`.
- **Playlists** are fetched from the LMS through `sendTo` when the list opens and started with
  `playlistcontrol cmd:load`.
- **Track list** from `Players.<NAME>.Playlist`, jumping through `PlaylistCurrentIndex`.
- When muted, the slider shows 0.

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

## What the adapter finds by itself

The adapter collects the matching states of the source — title, artist, playback state, volume, shuffle,
previous/next. **Whatever it does not find simply drops out**: the button is then missing and the page is
built anyway. That is the most common reason for a card without previous and next buttons.

---

## Pictures of the cardMedia

Main page, e.g. Alexa or Spotify  
<img alt='alexa2' src='../Pictures/pageMedia/alexa2.png' width= '45%'> <img alt='spotify' src='../Pictures/pageMedia/spotify.png' width='45%'>  
  
Equalizer and track list  
<img alt='equalizer' src='../Pictures/pageMedia/equalizer.png' width= '45%'> <img alt='tracklist' src='../Pictures/pageMedia/tracklist.png' width='45%'>  
  
Speakers and playlist  
<img alt='speaker' src='../Pictures/pageMedia/speaker.png' width= '45%'> <img alt='playlist' src='../Pictures/pageMedia/playlist.png' width='45%'>  
  
The pictures may differ depending on the configuration, or be missing entirely.
