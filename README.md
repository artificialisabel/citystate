# citystate

`citystate` is a procedural painterly city builder that runs in the browser.
Nothing is modelled by hand and nothing is loaded from disk: every building,
window, cloud, tree and bird is generated from a seed at runtime with
Three.js, then pushed through a shader-based painterly post stack.

**Live demo:** [citystate.artificialisabel.com](https://citystate.artificialisabel.com)

It is a toy and a control panel. The toolbar exposes the whole generator —
palette, layout, building shape, windows, atmosphere, camera, post — so you can
pull a skyline apart and put it back together.

## Run

Node.js `20.19+` or `22.12+` is required (matching Vite 8's supported runtime).

```bash
npm install
npm run dev
```

Open the local URL Vite prints. To build a static bundle:

```bash
npm run build
npm run preview
```

The output in `dist/` is plain static files and can be hosted anywhere.

## View modes

- **city** — the full skyline on a grid, the default view.
- **single** — one building, framed close, for working on shape and detail.
- **texture** — a full-screen 2D view of the procedural facade texture, so you
  can tune noise, contrast, gating and the Kuwahara pass on their own.
- **play** — drop an avatar into the city and walk it. `WASD` or the arrow keys
  move and turn, `shift` runs, `space` jumps; double jump and wall bounce are
  toggles in the HUD. Drag the canvas to orbit, scroll to zoom, and drag the
  handle on the HUD (or double-click) to drop the avatar on a street or a
  rooftop. On touch screens a joystick and jump button take over; the tuning
  toolbar collapses automatically and can be reopened with the top-right button.
- **react** — microphone-driven. Start the mic in the *react input* panel and
  the skyline breathes with what it hears: bass drives the short buildings,
  treble the tall ones, and the *pulse* panel tunes how far that goes. The mic
  is released when you leave the mode. Starting the mic also enters react mode,
  and a permission response that arrives after you leave is discarded and stopped.

## Controls

The filter row above the mode row narrows the toolbar to one group —
`environment`, `architecture`, `texture`, `play` or `react` — or shows
everything when nothing is selected.

- **colour** — a five-colour palette (sky, highlight, shadow, two accents) on a
  hue/saturation wheel, plus highlight reach, sky gradient band and accent
  scatter.
- **camera** — lens, height, distance, yaw, pitch. Left alone, the camera drifts
  on a slow ambient move.
- **city layout** — seed, grid size, density, lot spacing, street gaps, front and
  back heights, skyline variance, and the idle building pulse.
- **pulse** — how the audio reaction is distributed across the skyline.
- **building shape** — widths, depths, tiers, tier inset, deformation, domes.
- **windows + details** — window grid, size, jitter and glow, edge chunks, roof
  detail, spires.
- **texture lab** — the procedural facade texture: noise scale, block size,
  brightness, contrast, shadow and highlight gates, gradient, accent dodge and
  the Kuwahara smoothing.
- **environment** — time of day, sun and moon orbit, moon phase, stars, fog,
  clouds, rain, wind, storm, birds, trees, ambient fill, floor.
- **post** — grain, bloom, pixelation, palette quantisation, dither, chromatic
  aberration, focal shift.
- **performance** — render scale and frame cap.

`day`, `sunset` and `night` are full scene presets; `randomise` rolls every
generator parameter and the palette at once. Everything you change is kept in
`localStorage`, so a reload picks up where you left off.

The app makes no background network requests and has no analytics, account,
backend or personal-data integration. Microphone samples stay inside the current
browser tab and are never recorded or uploaded. The single Instagram link in the
about panel is an ordinary, user-initiated outbound navigation.

## How it works

- `src/main.js` — the whole app: the toolbar, the generator, the scene graph,
  the play-mode character controller and the audio reaction.
- `src/glass-chrome/` — a vendored, unmodified copy of the shared glass UI
  system: translucent panels, hairline edges, compact mono controls. It owns
  how the toolbar looks; `src/styles.css` only owns where things sit.
- Building geometry is merged per building (`mergeGeometries`) and windows are
  instanced, so a full grid stays a handful of draw calls.
- Randomness is a seeded `mulberry32`, so the same seed always rebuilds the same
  city.
- Facade textures are painted into a canvas at runtime — value noise, fBm,
  gated tone bands, accent scatter, and a Kuwahara filter for the painterly
  smear — and uploaded as `CanvasTexture`.
- The sky is a single shader sphere: gradient, layered fBm clouds, a sun/moon
  disc on a real orbit, and a separate star shader.
- Post is an `EffectComposer` chain: bloom, a painterly pass (pixelation,
  palette steps, dither, aberration, focal shift) and a grain pass.

## Tech

Three.js, Vite, vanilla JS and CSS. No framework, no build-time assets, no
backend. `vercel.json` adds a restrictive network/content policy and standard
browser security headers for the public static deployment.

## Licence

No licence granted. Look, run it locally, take ideas from it — but please don't
redistribute it as your own.
