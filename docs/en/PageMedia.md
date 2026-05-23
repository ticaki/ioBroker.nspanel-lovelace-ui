# Media player (`cardMedia`)

**Supported adapters:** `spotify-premium`, `alexa2`, `mpd`, `sonos`

The **`cardMedia`** card shows a media player with title/artist, play/pause, volume and much more. Depending on the adapter, different functions are detected automatically (e.g. playlists, shuffle, seek).

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

### `media.id` – examples
- **alexa2**: `alexa2.0.Echo-Devices.<YOUR_ID>`
- **spotify**: `spotify-premium.0`
- **mpd**: `mpd.0`
- **sonos**: `sonos.0.root.192_168_178_209`

> **Note:** If you give only the adapter name without an instance number (e.g. `spotify`), the **lowest available instance** is used automatically.

---

## Custom PageItems
`items` behaves like in `cardGrid`/`cardEntities`. You can add your own PageItems. **Adapter-internal templates** are not applicable to `cardMedia`.

---

## Important `media` options (overview)

| Option | Meaning | Notes/examples |
|---|---|---|
| `id` | source/player (folder/device/channel, **not a state**) | see examples above |
| `name` | display name | leave empty → name is detected automatically |
| `colorMediaIcon` | colour of the media icon | **use colour names** (e.g. `Blue`, `MSRed`) |
| `colorMediaArtist` | colour of the artist line | see colour |
| `colorMediaTitle` | colour of the title line | see colour |
| `speakerList` | list of allowed/displayed speakers | **Sonos/Spotify:** selection without a list → no speakers. **Others:** whitelist (empty = all) |
| `favoriteList` | **whitelist** for favourite playlists | empty or unset = show all |
| `playList` | list of available playlists | **Alexa/Spotify:** from adapter. **Sonos:** user-generated (adapter cannot read them) |
| `minValue` | minimum volume (panel) | mapping to device scale |
| `maxValue` | maximum volume (panel) | mapping to device scale |
| `volumePresets` | volume presets as `"name?value"` | e.g. `["quiet?5","loud?95"]`; value is clamped to `minValue`/`maxValue` (only **mpd** and **spotify-premium**) |
| `itemsColorOn` | on colour for individual default PageItems | overridable per item (see below) |
| `itemsColorOff` | off colour for individual default PageItems | see below |
| `deactivateDefaultItems` | hide default PageItems selectively | see below + example |

### Default PageItems (for colours/deactivation)
- `trackList`, `speakerList`, `repeat`, `equalizer`, `playList`, `online`, `reminder`, `clock`, `favoriteList`, `crossfade`, `volumePresets`

> **Note:** Which of these default items actually appear depends on the adapter. `itemsColorOn`/`itemsColorOff` additionally for `clock` and `volumePresets`; `deactivateDefaultItems` without `volumePresets`.

> **Using colours:** use colour names like `Blue`, `MSRed`, `HMIOn`, `HMIOff` etc. – it is also possible to use your own `{red:…, green:…, blue:…}` object.

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

### 2) Hide default items
```ts
media: {
  id: 'alexa2.0.Echo-Devices.YOUR_ID',
  deactivateDefaultItems: {
    trackList: true,
    equalizer: true,
    crossfade: true,
  },
}
```

### 3) Whitelist for favourites / custom playlists
```ts
media: {
  id: 'sonos.0.root.192_168_178_209',
  favoriteList: ['Best of 90s', 'Morning Vibes'], // whitelist – show only these
  playList: ['Living Room Mix', 'Party'],         // Sonos: user-generated
}
```

### 4) Limit the volume range on the panel
```ts
media: {
  id: 'mpd.0',
  minValue: 5,   // panel does not go below 5
  maxValue: 80,  // and not above 80
}
```

---

## Notes & behaviour
- Depending on the source, the adapter automatically collects matching states (title, artist, isPlaying, shuffle, volume …) and creates **matching PageItems**. Not every adapter can do everything (e.g. playlists).
- **Seek/Play/Pause/Shuffle/Volume**: if the source offers it, the controls are shown.
- **Logo field**: depending on the source the logo may e.g. toggle play/pause or open a seek popup.

---

```typescript
// For reference only – the explanation is above. Excerpt from PageMediaItem
// (src/lib/types/config-manager.d.ts). Colours as an RGB object {red,green,blue}
// or as a colour name (e.g. Blue, MSRed).

type RGB = { red: number; green: number; blue: number };

type PageMediaItem = {
  id: string;            // folder/device/channel, NOT a state – determines the player instance
  name?: string;
  colorMediaIcon?: RGB;
  colorMediaArtist?: RGB;
  colorMediaTitle?: RGB;
  speakerList?: string[];
  /** Whitelist of favourites; empty/missing → show all */
  favoriteList?: string[];
  /** Playlists: Alexa/Spotify from adapter; Sonos user-generated */
  playList?: string[];
  /** Volume presets "name?value" (only mpd & spotify-premium) */
  volumePresets?: string[];
  /** Volume limits (panel side) */
  minValue?: number;
  maxValue?: number;

  /** On/off colours per default item */
  itemsColorOn?: Partial<Record<
    'trackList' | 'speakerList' | 'repeat' | 'equalizer' | 'playList' | 'online' | 'reminder' | 'crossfade' | 'favoriteList' | 'clock' | 'volumePresets',
    RGB
  >>;
  itemsColorOff?: Partial<Record<
    'trackList' | 'speakerList' | 'repeat' | 'equalizer' | 'playList' | 'online' | 'reminder' | 'crossfade' | 'favoriteList' | 'clock' | 'volumePresets',
    RGB
  >>;

  /** Hide default items */
  deactivateDefaultItems?: Partial<Record<
    'trackList' | 'speakerList' | 'repeat' | 'equalizer' | 'playList' | 'online' | 'reminder' | 'clock' | 'favoriteList' | 'crossfade',
    boolean
  >>;
};
```

> The fields `mediaDevice`, `equalizerList`, `repeatList` and `globalTracklist` do exist in the `PageMediaItem` type, but are not evaluated by the current `cardMedia` implementation.
