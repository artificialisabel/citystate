# glass-chrome

A small, shared UI system: rounded translucent panels, hairline edges, an inset
gloss, compact Menlo controls, and almost no ornamental colour.

It is framework-neutral and dependency-free. `index.css` is the system;
`index.js` is an optional vanilla-DOM panel builder. App-specific positioning,
camera tools, and scene logic deliberately stay out.

## Use it

Copy this folder into a project, then load the CSS:

```js
import './glass-chrome/index.css';
```

Or from plain HTML:

```html
<link rel="stylesheet" href="./glass-chrome/index.css" />
```

Wrap your interface in `.gc-ui`, choose a theme, and compose the primitives:

```html
<aside class="gc-ui gc-panel controls" data-gc-theme="paper">
  <header class="gc-panel-head">
    <span class="gc-panel-title">Atmosphere</span>
    <span class="gc-panel-meta">03 / Live</span>
  </header>

  <details class="gc-section" open>
    <summary>Material</summary>
    <div class="gc-section-body">
      <label class="gc-control">
        <span class="gc-control-head">
          <span class="gc-label">Backdrop blur</span>
          <span class="gc-value">16 PX</span>
        </span>
        <input class="gc-range" type="range" min="0" max="30" value="16" />
      </label>

      <div class="gc-segmented">
        <button class="gc-chip is-active" aria-pressed="true">Soft</button>
        <button class="gc-chip" aria-pressed="false">Clear</button>
      </div>
    </div>
  </details>
</aside>
```

Position `.controls` in the consuming app. Glass-chrome owns appearance, not
layout:

```css
.controls {
  position: fixed;
  top: 20px;
  left: 20px;
  width: 288px;
}
```

Use `data-gc-theme="paper"` for the warm version, or `data-gc-theme="void"` for
the grayscale one. Authored prose can
opt out of the uppercase interface voice with `.gc-natural-case`.

## Optional DOM builder

For vanilla projects, `index.js` recreates the little factories that kept being
duplicated across the source projects:

```js
import { createGlassPanel } from './glass-chrome/index.js';

const panel = createGlassPanel({
  mount: document.querySelector('#hud'),
  title: 'Atmosphere',
  meta: '03 / live',
  theme: 'void',
  className: 'controls',
});

const material = panel.section('Material');
material.range({
  label: 'Backdrop blur', min: 0, max: 30, value: 16, step: 1,
  onInput: (value) => console.log(value),
});
material.segmented({
  label: 'Surface', options: ['soft', 'clear', 'dense'], value: 'soft',
  onChange: (value) => console.log(value),
});
material.toggle('Film grain', true, (enabled) => console.log(enabled));
material.note('The scene owns the colour. The interface stays quiet.');
```

React, Vue, Svelte, and other component projects should normally ignore the
builder and use the CSS classes directly in their own components.

## Primitive vocabulary

- Material: `gc-panel`, `gc-dense`, `gc-pill`, `gc-hint-strip`
- Structure: `gc-panel-head`, `gc-panel-title`, `gc-panel-meta`,
  `gc-panel-body`, `gc-section`, `gc-scroll`
- Controls: `gc-control`, `gc-control-head`, `gc-label`, `gc-value`,
  `gc-range`, `gc-chip`, `gc-row`, `gc-segmented`, `gc-tabs`
- Fields: `gc-field`, `gc-select`, `gc-textarea`, `gc-swatch`
- Readouts: `gc-masthead`, `gc-note`, `gc-stats`, `gc-stat`
- States: `is-active`, `is-danger`, `is-wide`, `disabled`, `aria-pressed`

The canonical variables are prefixed `--gc-`: `font`, `ink`, `ink-soft`,
`ink-faint`, `panel`, `control`, `surface`, `deep`, `accent`, `accent-soft`,
`accent-ink`, `danger`, `line`, `line-soft`, `edge`, `shadow`, `panel-radius`,
`control-radius`, `blur`, and `saturation`. Override them on any `.gc-ui` root:

```css
.gc-ui.my-project {
  --gc-accent: #60656b;
  --gc-accent-soft: rgba(96, 101, 107, 0.14);
  --gc-panel-radius: 24px;
}
```

## Design rules

- Let the world or artwork carry the colour; keep chrome neutral unless a
  selection needs one accent.
- Use 20px panel corners and 9px control corners as the default rhythm.
- Keep labels around 9–10px, uppercase, tracked, and tabular for numbers.
- The gloss comes from a translucent edge plus the inset top highlight in the
  shadow—not from gradients.
- Keep animation restrained: 120–160ms state transitions, no decorative drift.
- Scope the system with `.gc-ui`; never impose uppercase or overflow rules on
  the whole page.

## Provenance

Vendored from a shared UI system used across several of this author's projects.
Copied in rather than installed so it can be edited freely; re-sync by hand.
