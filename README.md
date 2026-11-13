# phost.co.uk

The holding page for phost.co.uk: a ghost drifting through a lava lamp, with the word "phost" made of
the same wax. It is a vanity page, not a front for anything, and says nothing about what runs on the
server.

On each visit the colour scheme, the kind of ghost and the line at the bottom are picked at random.
The ghost follows the cursor but keeps its distance, wanders when left alone, is startled by a click,
turns into the next kind of ghost when clicked itself, and says something now and then.

Built with [Vite](https://vite.dev) and TypeScript. The output is plain static files: one HTML page,
one small script, one stylesheet, a 1 KB font and the icons. Nothing is loaded from other sites.

## Commands

```sh
npm install        # once
npm run dev        # dev server with live reload: http://localhost:8124/
npm run build      # type-check, then build to dist/
npm run preview    # serve dist/ at http://localhost:8124/
npm run typecheck  # type-check only
```

Node 20.19 or later is needed (the server uses the version in `.nvmrc`).

## Layout

| Path | What it is |
|---|---|
| `index.html` | The page. Vite's entry point. |
| `src/main.ts` | Picks the colour scheme, ghost and tagline, then runs the animation. |
| `src/settings.ts` | The tuned look: wax, ghost and type settings. |
| `src/palettes.ts` | The colour schemes. Each gives the "p" its own colour. |
| `src/words.ts` | The taglines and the ghost's sayings. |
| `src/wax/` | The lava lamp: plain WebGL 1. `wax.ts` moves the blobs and draws, `letters.ts` draws the word for the shader, `shaders/` holds the GLSL. |
| `src/ghost/` | The ghost: `ghost.ts` moves, blinks and talks, `shapes.ts` draws the six kinds. |
| `src/styles.css` | Page styles, including the fallback when WebGL isn't available. |
| `public/` | Copied to the site as-is: font, icons, `robots.txt`, `.htaccess` (redirects, caching and security headers). |
| `deploy.sh` | Builds the site on the server after each deployment (see below). |
| `tools/` | Helpers to regenerate the icons. Not deployed. |

## How it works

The wax is metaballs: each blob adds `r² / d²` to a field and the shader colours wax wherever the field
passes 1, so blobs bulge towards each other and merge. The word is drawn, slightly blurred, into a
texture that adds to the same field, so it is wax too and blobs merge into it. The texture's red
channel holds the whole word and its green channel only "host", which lets the shader give the "p" its
own colour. The ghost subtracts from the field, nudging the wax away.

The ghost is drawn on a 2D canvas above the wax. Its glow and the tagline get a CSS `hue-rotate` that
follows the slow colour drift of the wax.

## The font

The word uses [Unbounded](https://github.com/googlefonts/unbounded) SemiBold (600), under the SIL Open
Font Licence (`public/fonts/OFL-Unbounded.txt`). The file is subset to the five letters of the word.
To regenerate it (for example to change weight), download the subset from the Google Fonts CSS API:

```sh
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
url=$(curl -fsS -A "$UA" "https://fonts.googleapis.com/css2?family=Unbounded:wght@600&text=phost" | grep -o 'https://[^)]*')
curl -fsS -A "$UA" -o public/fonts/unbounded-600-phost.woff2 "$url"
```

## Deployment

The site is deployed by the Plesk Git extension. After each pull, Plesk runs `bash deploy.sh` as an
additional deployment action. The script finds Plesk's Node (`/opt/plesk/node/<major>/bin`), runs
`npm ci` and builds into `dist.next`, then swaps that in as `dist`. The domain's document root points at
`dist`, so the live site only changes once a build has succeeded.

## Notes

- `public/.htaccess` sends any address that isn't a real file to the home page (302).
- With `prefers-reduced-motion` the page is a still frame. The ghost can still be clicked to change it.
- Without WebGL the word is shown as plain styled text, and the ghost still works.
- The page is designed for a dark background only; it has no light theme.
