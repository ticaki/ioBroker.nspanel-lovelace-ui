/**
 * SVG paths (24x24 viewBox) for icon names without a drawing in `@mdi/svg` or
 * `script/icons.json`. The names are listed in `missing.json`. A card worker who needs one of
 * them adds the path here, it wins over `mdi-paths.json`.
 * The media logos of cardMedia (logo-spotify, ...) take the icon of their player, see
 * `scripts/gen-icons.ts`.
 */
export const customPaths: Readonly<Record<string, string>> = {};
