# Changelog

## 4.17.0

### New

- **`.form-checkbox-label` — companion label utility for cross-container checkbox/radio rows.** The kit already handles labels that sit next to their input via `:where(.checkbox-input, .radio-button-input):disabled ~ label` (adjacent sibling) and `label:has(input:disabled)` (wrapping label), and 4.15.0 added cross-container coverage via the `disabled-labels` JS helper which toggles `label[disabled]`. But for the visual styling of those cross-container labels, consumers had no utility shape: `.form-label` adds `mb-2` + `font-medium` (stacked-field affordances that are wrong for an inline checkbox companion), and a bare `<label>` only inherits sibling rules when it shares a parent with the input. Consumers ended up writing per-call-site overrides on top of `.form-label` that then, at higher selector specificity (e.g. `.am-element-title > label[for="X"]`, specificity 0,2,1), strip the global `label[disabled]` rule (0,1,1) — forcing each override to re-implement the disabled color and cursor. The new `@utility form-checkbox-label` is `font-normal text-sm text-heading cursor-pointer leading-none` with an `&[disabled]` block that mirrors the global `label[disabled]` rule. The duplication of the disabled block is intentional: when `@apply`'d, the rule lands at the same selector specificity as the consumer's override, so the disabled styling survives. Docs/index.html grows two demo rows in the existing Cross-container disabled labels grid plus an explainer paragraph; the Form Classes chip list is extended. Closes #27.

## 4.16.1

### Fixes

- **`.form-input` and `.form-dropdown-input` disabled state now visibly dims the text in light mode.** Prior rule was `disabled:text-gray-900 dark:disabled:text-gray-400`, but `text-gray-900` is the same color as `text-heading`'s default in light mode — so a disabled field looked identical to an enabled one apart from a barely-perceptible `gray-50 → gray-100` bg shift. Adopting Flowbite's "dim the text" disabled philosophy (without adopting Flowbite's tokens — staying on hardcoded grays) collapses both modes to `disabled:text-gray-400`, which reads as muted on both `gray-50` and `gray-700` backgrounds.
- **`.form-input-disabled` standalone utility now uses `text-gray-400` in both modes** for the same reason. Previously `text-gray-900` in light mode rendered at full heading contrast.
- **`.form-input` read-only state now keeps `text-heading`** (full contrast) instead of dimming the text. The prior `read-only:text-gray-900` was a no-op in light mode anyway, but the intent — "value is visible but not editable" rather than "muted" — matches Flowbite's read-only pattern and is now explicit.
- **Dropped redundant `dark:disabled:bg-gray-700` and `dark:read-only:bg-gray-700` overrides** from `.form-input` and `.form-dropdown-input`. They equalled the normal dark-mode bg (`dark:bg-gray-700`), so removing them changes nothing visually but makes the rules less misleading.

## 4.16.0

### New

- **`.progress-bar-fill` now ships four color variants.** The base utility keeps the brand orange gradient as the default. New modifier classes: `.progress-bar-fill-blue` (brand blue gradient — same as the resting state of `btn-blue-to-orange`), `.progress-bar-fill-info` (solid Flowbite blue, `bg-brand` token), `.progress-bar-fill-success` (solid Flowbite green), `.progress-bar-fill-danger` (solid Flowbite red). The solid variants explicitly set `background-image: none` so they actually override the default gradient — adding `bg-success` directly to `.progress-bar-fill` didn't work because `background-image` paints over `background-color` (the demo at `docs/index.html` was visually broken before this release). All semantic-color variants use Flowbite tokens that auto-swap for dark mode.

- **`LongProgress` accepts a `barVariant` option** mapping to the new progress-bar variants: `'orange' | 'blue' | 'info' | 'success' | 'danger'`. Default `'info'` preserves the prior solid-blue look. The constructor now rejects unknown values with `RangeError`.

### Internal

- **`.long-progress-bar` and `.long-progress-bar-fill` now reuse the kit's `.progress-bar` / `.progress-bar-fill` utilities** instead of duplicating their track + fill rules. The rendered template applies both class pairs (e.g. `class="progress-bar long-progress-bar"`); the `long-progress-*` classes only carry the per-instance overrides (slimmer `h-1.5`, starting `width: 0%`, and the variable-duration `transition` driven by `--long-progress-fill-duration`). The color now comes from the `progress-bar-fill-*` modifier the JS picks via `barVariant`. Net: one set of color tokens used everywhere progress is shown.

- **Docs/index.html progress-bar demos rewritten.** The two `bg-success` / `bg-danger` rows (which had been silently rendering orange because the gradient overrode the bg-color) are replaced with `.progress-bar-fill-success` and `.progress-bar-fill-danger`. New demo rows for the blue gradient and info solid. Chip list extended.

- **`docs/long-progress.html`** gets a `barVariant` row in the API table and a new "Demo: bar color variants" section with one button per variant so each color is clickable.

## 4.15.0

### New

- **`@marketdataapp/ui/disabled-labels` — sync `<label for="">` with disabled-input state across container boundaries.** The kit's existing CSS dims labels via `:where(.checkbox-input, .radio-button-input):disabled ~ label` (adjacent-sibling) and `label:has(input:disabled)` (wrapping label), but both require label and input to share a parent. When a `<label for="X">` lives in a different container from `#X` — common in two-column form grids, or the aMember `.am-element-title` / `.am-element` cell pattern — the input grays but the label stays at full strength, so the row reads as half-disabled. CSS can't fix this: there's no selector that compares a label's `for` attribute against another element's `id`. The new helper resolves the link in JS (`label.htmlFor` → `getElementById`) and toggles a `disabled` attribute on the label that the kit's CSS picks up. A `MutationObserver` keeps state in sync as inputs flip, labels change `for=""`, ids change, and nodes are added/removed. Opt-in per scope: `initDisabledLabels({ root = document.body })` returns a cleanup function. Existing sibling/wrapping rules stay in place as the no-JS fallback for the basic cases. Closes #26.

- **`label[disabled]` is now a styled selector in `components.src.css`** — dims the label to `var(--color-fg-disabled)` with `cursor: not-allowed`, plus the inner `:where(.text-heading, .radio-button-helper)` override so spans inside disabled wrapping labels follow the dim color. The `disabled` attribute is non-standard on `<label>` but harmless — pure style hook driven by the `disabled-labels` helper. Consumers who want declarative-only styling can set the attribute themselves without using the JS module.

## 4.14.1

### Fixes

- **`.checkbox-input` and `.radio-button-input` now show `cursor: pointer` in the enabled state.** Both utilities declared `disabled:cursor-not-allowed` but left the enabled state at the browser default (arrow), so a hover over an interactive checkbox/radio gave no affordance and downstream consumers had to patch around it per call site (e.g. `@apply checkbox-input cursor-pointer` on the marketdata-amember employer-website attestation row). The existing `&:disabled { cursor: not-allowed }` correctly overrides the new base rule. Closes #25.
- **`.form-dropdown-input` now shows `cursor: pointer` in the enabled state.** Same omission shape as the checkbox/radio fix — native `<select>` doesn't get a pointer cursor by default, and the utility already set `disabled:cursor-not-allowed`, so the enabled state was inheriting the default arrow.

## 4.14.0

### New

- **`LongProgress` reusable progress card** — lifts the long-running progress card pattern from [marketdata-amember](https://github.com/MarketDataApp/marketdata-amember), where it's currently duplicated across the verify-my-account takeover, the per-document upload card, and the clarify-answers re-eval flow. Imported from `@marketdataapp/ui/long-progress`; the API is class-based per the issue sketch: `new LongProgress(sectionEl, opts).start()` mounts the card and kicks off a phase timeline; `setBytesProgress(fraction)` drives the bar from a real `xhr.upload.progress` signal (capped at a configurable `bytes.capPct` so server-side processing phases can take the rest); `fastForward({ holdMs })` returns a promise so callers can `await` the bar reaching 100% before swapping content; `restore(message?)` puts the original `innerHTML` back, re-runs `window.htmx.process()` if HTMX is loaded, and inserts a danger admonition with `role="alert"` above an optional `errorInsertBefore` target. An optional `bindHtmx(formEl, { errorMessages })` wires the standard HTMX lifecycle events (`beforeRequest` → `start`, `beforeSwap` → `fastForward`, `responseError` / `sendError` / `timeout` → `restore`) and returns an unbind function. Sensible defaults make `new LongProgress(el).start()` "just work" with no config — a generic 4-phase ~22s timeline and the load-bearing "don't refresh" hint. New demo page at [docs/long-progress.html](docs/long-progress.html) walks through the four flow shapes (vanilla defaults, custom verify-account timeline, bytes + phases upload, pure upload bar). Closes #24.

### Internal

- **Bar fill and percent counter share a single `@property <integer>` custom prop.** `--long-progress-pct` is registered as a transitionable integer; the percent text is fully CSS-generated via `counter()` in `.long-progress-percent::after`, so the counter steps through 1, 2, 3, … to target on every phase. The bar's `width` is animated separately as a regular `width` transition on the fill element (sub-pixel smooth, not quantized to whole-percent steps) but shares `--long-progress-fill-duration` with the counter so the two stay in lockstep. Worked around Tailwind v4's universal `*, ::before, ::after { --long-progress-pct: 0 }` reset (emitted for every registered property) by forcing `--long-progress-pct: inherit` on the percent descendant. No `requestAnimationFrame` loop in JS — the animation is purely declarative.

- **Layout is consistently left-anchored.** The header row puts the step text on the left and the percent on the right (`flex justify-between`); the step is the primary label (`text-base font-semibold text-heading`) and updates in place as phases fire. The bar follows full-width. The warning hint sits directly under the bar with a Heroicons exclamation-triangle prefix in `text-fg-warning`. No card surface chrome — the component embeds in whatever surface the consumer provides (form section, dashboard panel, upload row). The `inline` modifier scales the step down to `text-sm` for in-list upload rows.

- **`Phase` shape is just `{ step, fillPct, durationMs }`** — phases run back-to-back starting at `t=0` (or at upload-complete when `setBytesProgress(1)` fires in bytes mode). Each phase's bar fills from the previous phase's `fillPct` to this one's `fillPct` over `durationMs`; the next phase fires when this one ends. The earlier draft separated `atMs` and `fillDurationMs` to allow "jump and rest" patterns; the smooth back-to-back model is cleaner and matches the actual UX the component is selling.

- **Error banner reuses `admonition admonition-danger`.** Restore inserts the kit's existing Docusaurus-style admonition (light/dark variants already wired via `flowbite-theme.css`) instead of rolling a separate alert utility.

## 4.13.2

### Fixes

- **`.form-input :-webkit-autofill` now preserves the focus ring and paints a visible caret.** The 4.13.1 autofill rule set `-webkit-box-shadow: 0 0 0 1000px <bg> inset` as a single-layer shadow. In Chromium, `-webkit-box-shadow` is an alias for `box-shadow`, so on `:-webkit-autofill:focus` it replaced Tailwind's composed `box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)` — wiping out the `focus:ring-1 focus:ring-brand` ring layer and leaving an autofilled focused input with only a thin border. The rule also didn't set `caret-color`, so Chromium kept a black caret in autofilled dark-mode fields even when `-webkit-text-fill-color` was forced white. Composed the autofill repaint with the full Tailwind v4 shadow stack (`0 0 0 1000px <bg> inset, var(--tw-inset-shadow, 0 0 #0000), …, var(--tw-shadow, 0 0 #0000)`) so the brand focus ring paints over the autofilled background, and added explicit `caret-color: var(--color-gray-900)` (light) / `var(--color-white)` (dark) inside both autofill blocks. Closes #23.

## 4.13.1

### Fixes

- **`.form-input` now styles browser autofill correctly in both themes.** Chrome (and other Chromium browsers) paints `:-webkit-autofill` fields with its own pale yellow background and dark text, overriding the kit's `bg-gray-50` / `dark:bg-gray-700` + `text-heading` tokens — most visibly in dark mode, where an autofilled email/password field rendered as a pale-yellow strip with dark text against the dark form surface. Added nested `&:-webkit-autofill{,:hover,:focus}` rules inside the `@utility form-input` body that repaint the field with our tokens using the standard 1000px-inset-shadow trick (`-webkit-box-shadow: 0 0 0 1000px var(--color-gray-50) inset` in light, `var(--color-gray-700)` under `&:where(.dark, .dark *, [data-theme='dark'], [data-theme='dark'] *)`), pair it with `-webkit-text-fill-color` so the text matches `text-heading`, and add `transition: background-color 5000s` to defer Chrome's repaint past any realistic session. Nested inside `@utility` so scoped `@apply form-input` in consumer CSS propagates the autofill rules at the consumer's specificity — the per-page autofill workaround in marketdata-amember (e.g. `body#page-login input:-webkit-autofill { … }`) can be removed once upgraded. Closes #22.

## 4.13.0

### New

- **`.next-link` / `.back-link` utilities** — directional companions to the existing `.external-link` decorator. `.next-link` appends a Heroicons `arrow-right` via `::after`; `.back-link` prepends a Heroicons `arrow-left` via `::before`. Both use the same drop-in mechanism as `.external-link`: sizing in `em` so the icon scales with the parent font-size, `mask-image` + `currentColor` so the arrow inherits color through `:hover`, dark mode, and any context override automatically. No companion classes, no inline SVG, no sizing or color props at the call site. New "Back & Next Links" subsection in the Links section of [docs/index.html](docs/index.html).

## 4.12.1

### Fixes

- **No-reset CSS bundle now ships every `@utility`.** The no-reset build (`dist/css/components.no-reset.css`, used by Docusaurus / framework consumers) uses `@import 'tailwindcss/utilities' source(none)` to disable automatic content detection, then relies on `@source "./components.classes"` as an explicit allowlist of utilities to emit. The allowlist was maintained by hand and silently drifted: `.spinner` (added in 4.10.0), `.card-surface`, and most of the `.copy-input-*` / `.copy-icon-*` family (added in 4.10.0) were never written into the allowlist, so they were missing from the no-reset bundle — Docusaurus consumers couldn't use any of these classes. The classes shipped fine in the full reset bundle (`dist/css/components.css`) because that build uses automatic content detection and picked them up from `docs/index.html`, which is why the regression went unnoticed.

### Internal

- **New `build:classes` step regenerates the allowlist from the source.** `scripts/build-classes.js` parses every `@utility <name>` declaration from `css/components.src.css` and writes the names to `css/components.classes`. Wired into `npm run build` ahead of `build:css`. Drift between utility definitions and the no-reset allowlist is now impossible — every utility you define ships to every consumer automatically. Eliminates the dual source of truth that caused the regressions above.

## 4.12.0

### New

- **`.progress-bar` / `.progress-bar-fill` utilities** — Flowbite-style thin determinate progress bar. The track uses the `bg-neutral-quaternary` semantic token (gray-200 / gray-700) so dark mode is automatic, and matches both Flowbite's canonical "progress" component and the existing hand-rolled `bg-gray-200 dark:bg-gray-700` track in [marketdata-amember `css/pages/employment-evaluation.css`](https://github.com/MarketDataApp/amember/blob/main/css/pages/employment-evaluation.css#L294-L296) — the consumer migration is a pure class rename with zero visual change. Default size is `h-2`; override the track with `h-1.5` (small) or `h-2.5` (large) to match Flowbite's size variants. The fill ships in the brand orange gradient (`bg-gradient-orange`); consumers add any `bg-*` utility on the fill element (e.g. `bg-success`, `bg-danger`) to override for status semantics. Width is driven by inline `style="width: N%"` (or a CSS custom property), and transitions over 400ms so JS/PHP updates feel smooth. New "Progress Bar" section in [docs/index.html](docs/index.html). Closes #21.

## 4.11.1

### Fixes

- **Button loading-state rules now propagate through scoped `@apply`.** The 4.11 loading-state additions (`.htmx-request` / `aria-busy` shimmer, `[data-btn-default]` / `[data-btn-loading]` visibility toggle, `:has(> [data-btn-loading])` `inline-flex → inline-grid` switch) were declared as separate top-level selectors. `@apply` only inlines what's inside an `@utility` body, so consumers re-emitting a button via scoped `@apply btn-orange-to-blue` (a common pattern when fighting higher-specificity environment resets like aMember's `.am-body-content button { … }` at 0,1,1) lost every state rule — most visibly the layout switch, which let the consumer's scoped `display: inline-flex` win at 0,3,0 over the kit's top-level `display: inline-grid` at 0,3,0, causing the button to grow horizontally and render both spans side-by-side during requests. Moved every loading-state rule **inside** the `@utility btn-orange-to-blue { … }` and `@utility btn-blue-to-orange { … }` bodies using `&` nesting (same pattern the kit already uses for `:hover`, `:focus`, and dark mode), so scoped `@apply` now propagates the full state set at the consumer's specificity. Direct-class usage is unchanged. Closes #19.

## 4.11.0

### New

- **Loading state for primary buttons** — `.btn-orange-to-blue` and `.btn-blue-to-orange` now render a shimmer effect whenever HTMX adds `.htmx-request` during an in-flight request, or whenever `aria-busy="true"` is set manually. The gradient's angle and color stops are registered as `@property <angle>` / `<color>` so they're individually transitionable: on entry the colors morph to the button's hover palette (blue or orange) and the angle starts rotating; on exit both transition back to the resting palette and the angle decelerates forward to its rest position (rotates forward rather than counter-rotating, courtesy of a 463deg base value that's visually equivalent to 103deg). `pointer-events: none` is baked into the loading state so consumers don't double-submit. Zero consumer JS required for HTMX; for manual use, the consumer just toggles `aria-busy`.

- **Optional button content swap** — wrap default button content in `<span data-btn-default>` and a sibling `<span data-btn-loading>`. During the loading state the button switches from `inline-flex` to `inline-grid` (scoped via `:has(> [data-btn-loading])` so non-swap buttons are unaffected); both spans share the same grid cell with the default one held at `visibility: hidden`. The default's width is preserved as a floor, so the button can grow if the loading label is wider but never shrinks if it's shorter. See the new "Loading state" subsection in the Buttons section of [docs/index.html](docs/index.html).

- **State-aware focus rings on all six gradient buttons** — the focus ring color now tracks the button's current visual state instead of being fixed for the lifetime of the element. Implemented via a registered `--btn-focus-color` custom property that overrides `--tw-ring-color` inside `:focus`. Pink while the orange palette is showing, brand-blue while blue is showing, transitioning smoothly between the two. Applies to `.btn-orange-to-blue`, `.btn-blue-to-orange`, `.btn-outline-to-orange`, `.btn-outline-to-blue`, `.btn-orange-to-outline`, `.btn-blue-to-outline`.

### Fixes

- **`.copy-input` colors now match the overlay button.** Switched the input from extending `form-input` (plain `bg-gray-*` palette) to using the same Flowbite semantic tokens as `.copy-input-button` (`bg-neutral-secondary-medium`, `border-default-medium`, `text-body`, `placeholder:text-body`, `shadow-xs`). Light and dark mappings come from `flowbite-theme.css`, so the field and the button read as one widget instead of two design systems.

- **Inline-text copy button height matches Flowbite's reference (34px → 30px).** Added an explicit `line-height: 1rem` to the `[data-copy-button] > [data-copy-default]` / `[data-copy-success]` inner spans. Without it, the button's `leading-5` was propagating via `--tw-leading` through `text-xs`'s `line-height: var(--tw-leading, …)` fallback, expanding the inline content to 20px tall (4px more than the icon and 4px taller than the Flowbite reference). 16px matches the `.copy-icon` height so the inline-flex container collapses cleanly.

### Internal

- **Hover gradient swap is now smooth** on `.btn-orange-to-blue` and `.btn-blue-to-orange`. Hover sets the same `--btn-shimmer-from` / `--btn-shimmer-to` custom properties the loading rule sets, so the gradient colors transition over 0.5s instead of snapping — and clicking-while-hovered no longer triggers a brief "flash to resting palette" before the loading state takes over, because the value of the color vars matches what the loading rule sets.

- **Experiment page** — [docs/button-shimmer.html](docs/button-shimmer.html) compares six candidate shimmer treatments (sheen sweep, angle rotation, position slide, pulse, conic spin, sheen+pulse). The angle-rotation variant won and shipped to the main button; the page is kept as reference. Uses `<base href="../">` so relative URLs survive `serve.json`'s trailing-slash redirect.

## 4.10.0

### New

- **Copy-to-clipboard input** — `.copy-input-group`, `.copy-input`, `.copy-input-compact`, `.copy-input-button`, `.copy-input-icon-button`, `.copy-input-action`, `.copy-input-tooltip` plus `.copy-icon` / `.copy-icon-clipboard` / `.copy-icon-check`. A readonly text input with a copy button overlaid on the trailing edge, in two visual variants: a labeled "Copy" / "Copied" button, and a compact icon-only button with a Flowbite-style tooltip ("Copy to clipboard" / "Copied!"). Auto-init with a single `initCopyButton()` call — the script scans the DOM for `[data-copy-input-group]` wrappers and wires every pair. The button copies `data-copy-value` if set, otherwise `input.value`. Success state holds for 2s, then the tooltip auto-hides and stays hidden until the user fully disengages (no hover and no focus) — matching Flowbite's `tooltip.hide()` semantics without pulling in the Flowbite JS runtime. Icon paths (clipboard + clipboard-with-check) live entirely in CSS via `mask-image`, so consumer markup is just `<span class="copy-icon copy-icon-clipboard"></span>` with no duplicated SVG. Exported as `@marketdataapp/ui/copy-button`; demo in the new "Copy Input" section of [docs/index.html](docs/index.html).

- **`.spinner` utility** — indeterminate loading indicator. Single empty wrapper with `role="status"` and an `sr-only` label; the two-color SVG (neutral track ring + brand-colored rotating arc) is rendered entirely in CSS via stacked `::before` / `::after` mask layers, so there's no inline SVG markup. Default size is `w-8 h-8`; override with any Tailwind width/height utility. Arc color follows `currentColor` (set with any `text-*` utility); track color defaults to `neutral-tertiary` and can be overridden via the `--spinner-track` custom property. New "Spinner" section in [docs/index.html](docs/index.html) demonstrates the size and color customization.

## 4.9.3

### Fixes

- **Danger semantic tokens now use Tailwind's red palette instead of rose.** Repointed `--color-danger-soft/-/-medium/-strong/-subtle` and `--color-fg-danger/-strong` in [css/flowbite-theme.css](css/flowbite-theme.css) from `--color-rose-*` to the same steps of `--color-red-*`, in both the light root block and the `.dark` block. Rose has a pink cast that read more like a brand accent than an error state next to our blue/orange brand colors; standard red matches what consumers expect for danger/error UI. The MarketData-specific Docusaurus admonition colors in [css/theme.css](css/theme.css) (`--color-danger-bg/-border/-text/-darkbg/-darkborder/-darktext`) are unchanged — those are tuned to match the Docusaurus admonition palette, not Tailwind red.

## 4.9.2

### Fixes

- **Dark-mode background for disabled / readonly `form-input` and `form-dropdown-input`.** Follow-up to v4.9.1: the new `disabled:bg-gray-100` and `read-only:bg-gray-100` modifiers had no `dark:` companion, so they won in both modes and overrode the base `dark:bg-gray-700`. In dark mode a disabled input rendered with a light gray-100 background against gray-400 text — hard to read and visually popped out as if active. Added `dark:disabled:bg-gray-700` and `dark:read-only:bg-gray-700` to `form-input`, and `dark:disabled:bg-gray-700` to `form-dropdown-input`, so the disabled/readonly background now tracks the active theme (matches the existing `form-input-disabled` utility's light+dark pairing).

Closes #18.

## 4.9.1

### Fixes

- **`form-input` and `form-dropdown-input` now auto-style `disabled` / `readonly` states.** Both utilities previously left the disabled-state wiring to consumers, so any input with `class="form-input"` and the `disabled` attribute kept its active styling (light bg, focus ring) and visually invited interaction it couldn't accept. Every consuming property was patching this with the same one-line bridge rule (`input:disabled { @apply form-input-disabled }`). The fix bakes `disabled:` and `read-only:` modifiers directly into `form-input` (gray-100 bg, `cursor-not-allowed`, dimmed text) and `disabled:` into `form-dropdown-input`, so the correct state styling now travels with the base utility. `form-input-disabled` is unchanged and remains available for fake-disabled / loading states. `readonly` is included because read-only inputs ARE submitted with the form (unlike disabled) and consumers occasionally use them when they want the value to flow; visually they're indistinguishable from disabled to the user. The Forms section in [docs/index.html](docs/index.html) now demonstrates the new behavior with both a disabled `form-input`, a readonly `form-input`, and a disabled `form-dropdown-input`.

Closes #17.

## 4.9.0

### New

- **`.external-link` utility** — drop-in decorator for outbound links. Add `class="external-link"` to any `<a>` and a trailing Heroicons "arrow-top-right-on-square" icon is rendered via `::after`. No companion classes, no inline SVG, no sizing or color props from the caller. The icon is sized in `em` so it scales with the parent font-size (a link in an `<h2>` gets a proportionally larger arrow than one in `<small>`), and masked with `currentColor` so it tracks the link's color through `:hover`, dark mode, and any context override automatically. Replaces the duplicated inline-SVG + companion-class pattern currently in `marketdata-amember`'s FINRA and legal-documents pages. New "Links" section in [docs/index.html](docs/index.html) demonstrates the size and color inheritance.

Closes #16.

## 4.8.0

### New

- **Admonition components** — `.admonition` plus type modifiers (`.admonition-note`, `.admonition-tip`, `.admonition-info`, `.admonition-warning`, `.admonition-danger`) and sub-components (`.admonition-heading`, `.admonition-icon`, `.admonition-content`). Type modifiers set `--admonition-bg`/`--border`/`--text`/`--icon` custom properties that cascade into the heading and icon, so consumers using `@apply admonition admonition-note` on their own classes get the full styling without descendant selectors. Icons are masked with `currentColor` using the exact SVG paths from Docusaurus's classic theme, so they always match the active text color. Supports custom titles, multiple paragraphs, lists, links, inline code, and a heading-less variant. The "Semantic Colors" preview in [docs/index.html](docs/index.html) is now a real token-swatch reference and is followed by a new Admonitions section demonstrating each variation.

## 4.6.1

### Fixes

- **Button labels no longer wrap in narrow containers.** Added `whitespace-nowrap` to all six `btn-*` utilities (`btn-orange-to-blue`, `btn-blue-to-orange`, `btn-outline-to-orange`, `btn-outline-to-blue`, `btn-orange-to-outline`, `btn-blue-to-outline`) so labels stay on a single line by default. Consumers that were locally patching this with a wrapper class can drop the workaround on next package bump.

## 4.6.0

### Changed

- **Renamed outlined-default buttons to follow the `btn-{from}-to-{to}` matrix.** `btn-hover-orange` → `btn-outline-to-orange` and `btn-hover-blue` → `btn-outline-to-blue`. The "hover" naming predates the full matrix and isn't descriptive now that every button changes on hover; the new names describe the starting and ending states symmetrically, matching the rest of the button family (`btn-orange-to-blue`, `btn-blue-to-orange`, `btn-orange-to-outline`, `btn-blue-to-outline`).

### Deprecated

- **`btn-hover-orange` and `btn-hover-blue`** — kept as aliases that fully inline the new utilities' properties, so existing consumers continue to work without any change. Prefer the new names in new code. The aliases may be removed in a future major version.

## 4.5.0

### New

- **`btn-orange-to-outline`** — new primary-CTA button utility that starts as an orange-filled button with the pink drop shadow and transitions to an outlined button with an inset line border on hover. Completes the `btn-hover-orange` pair in reverse (that one starts outlined and fills in; this one starts filled and de-emphasizes). Designed for in-page primary CTAs like "Send Message", "Contact Sales", and hero calls-to-action.
- **`btn-blue-to-outline`** — symmetric blue-filled → outlined variant, added for matrix completeness alongside the orange counterpart.
- **Icon-ready button utilities** — all six `btn-*` utilities now include `items-center gap-2` in their base layout. Consumers can drop an icon child next to the text without manually patching alignment. Previously, `inline-flex` without `items-center` defaulted to baseline alignment and icons sat slightly above the text.

Closes #15.

## 4.4.0

### Fixes

- **Override Flowbite's broken `--leading-none: 1px` token.** Flowbite v4.0.1 ships a typo in its default theme (`--leading-none: 1px` instead of unitless `1`) that crushes line-height to a single pixel on every button utility (`btn-orange-to-blue`, `btn-blue-to-orange`, `btn-hover-orange`, `btn-hover-blue`), since they all `@apply leading-none`. Added `--leading-none: 1` to [css/theme.css](css/theme.css) so the override propagates to any consumer that imports our theme after Flowbite's default. Also fixed the same typo in [css/flowbite-theme.css](css/flowbite-theme.css) (a reference copy of upstream) to kill the latent trap if a future consumer ever imports it directly.

Closes #14.

## 4.3.0

### New

- **Symmetric theme DOM contract** — `applyTheme()` and the inline FOUC snippets now write both `.dark` / `.light` classes and `[data-theme="dark"]` / `[data-theme="light"]` attributes symmetrically in both branches. All four selectors are present from first paint and after every toggle, so consumers can write rules like `html.light { … }` or `html[data-theme="light"] { … }` reliably.
- **`syncThemeCookie()`** export from `@marketdataapp/ui/theme` — subscribes the cross-subdomain theme cookie to live DOM theme changes via the shared `onThemeChange` observer. Intended for consumers whose theme toggle flips DOM attributes directly (e.g. Docusaurus's built-in switcher) and therefore can't call `setThemeCookie()` themselves. Includes a **system-mode safeguard**: only writes the cookie when one already exists, so users following OS preference (no cookie) stay OS-following even when their OS flips dark. Returns an unsubscribe function.
- **`migrateLocalStoragePreference()`** export from `@marketdataapp/ui/theme` — one-shot migration of any legacy `localStorage.theme` value into the cross-subdomain cookie. No-op if a cookie already exists. `syncThemeCookie()` calls it automatically on subscribe, so most consumers don't need to call it directly.

### Changed

- **`getUserThemePreference()` is now a pure getter.** It previously had a surprising side effect of writing a cookie during a read, when falling back to `localStorage`. The migration logic moved to the new `migrateLocalStoragePreference()` function. Consumers who relied on the implicit migration should call `syncThemeCookie()` (or `migrateLocalStoragePreference()` directly) on page load.

### Fixes

- **[docs/navbar-overflow.html](docs/navbar-overflow.html)** was missing the inline FOUC theme-init snippet, causing a flash of wrong theme on first paint. Added.

### Compatibility

- Adding the `.light` class is additive — existing consumers using `html.dark` selectors or Tailwind `dark:` variants are unaffected.
- `theme.js`'s internal `_resolveTheme()` already reads `data-theme` first with a fallback to the `.dark` class, so existing reactive consumers of `onThemeChange()` keep working.

Closes #13.

## 4.2.0

### New

- **TypeScript type declarations** — every JS module entry point (`./theme`, `./navbar-overflow`, `./user`, `./user-profile`, `./user-state`, `./theme-toggle`, `./reviews`, `./dark-images`) now ships with a `.d.ts` file alongside its `.js`. TypeScript consumers can import named exports cleanly without `as any` casts, and get full autocomplete and parameter type checking.
- Type declarations are generated from the existing JSDoc comments via `tsc --allowJs --emitDeclarationOnly`, so they stay in sync with the implementation automatically.
- **`User` type** exported from `@marketdataapp/ui/user` — describes the user object shape (`login`, `name`, `email`, `paid`, `trial`, `products`).

### Fixes

- Corrected several JSDoc annotations that either had non-standard syntax or did not match runtime behavior:
  - `onThemeChange()` callback parameter type
  - `initThemeToggle()` return type (actually returns `{ cleanup, resetToSystem }`, was documented as `() => void`)
  - `getThemeCookie()`, `getEffectiveTheme()`, `getUserThemePreference()`, `getBrowserThemePreference()` now declare their literal union return types

Closes #12.

## 4.0.0

### Breaking Changes

- **`fetchUser()` and `_clearCache()` are no longer exported from `@marketdataapp/ui/user-profile`**. Import them from `@marketdataapp/ui/user` instead.
- **`fetchUser()` no longer accepts an `onInvalidate` callback**. Use `onUserChange()` from `@marketdataapp/ui/user` to subscribe to user state changes (including logout).
- **`fetchUser()` now has a 1-minute TTL cache**. Calls within 60 seconds of the last fetch return cached data without triggering a background revalidation. Previously, every call with cached data triggered a background fetch.

### New

- **`@marketdataapp/ui/user` module** — standalone user state management, decoupled from the user-profile UI component. Multiple components can share user state without redundant API calls.
- **`onUserChange(callback)`** — subscribe to user state changes. Returns an unsubscribe function. Callbacks receive the new user object or `null` on logout.
- **Request deduplication** — concurrent `fetchUser()` calls share a single in-flight request.

### Migration

```js
// Before
import { fetchUser, _clearCache } from '@marketdataapp/ui/user-profile';

// After
import { fetchUser, _clearCache, onUserChange } from '@marketdataapp/ui/user';

// Before (onInvalidate callback)
const user = await fetchUser({ onInvalidate: renderLoggedOut });

// After (subscriber pattern)
const unsub = onUserChange((user) => {
  if (!user) renderLoggedOut();
});
const user = await fetchUser();
```

## 3.2.0

### New

- **`.card-surface` utility** — shared visual base (background, border, responsive padding, shadow, rounded corners) used by `.grid-content-container` and `.form-container`. Available standalone for custom card layouts.
- **`.grid-content-position` now includes edge spacing** — adds `mx-4` / `md:mx-6` on small screens and removes it at `xl`+, matching `.grid-content-container`. Consumers no longer need to manage their own horizontal margin or padding to keep content off the viewport edges.

### Changed

- **`.grid-content-container`** — removes horizontal margin at `xl`+ so the container's outer edge aligns flush with `.grid-content-position`. Upgraded from `shadow` to `shadow-md`. Now composes `card-surface` internally.
- **`.form-container`** — now composes `card-surface` internally. Background and border use semantic tokens (`bg-neutral-primary-medium`, `border-neutral-quaternary`) instead of raw color values. Padding step-up changed from `p-4 lg:p-8` to `p-4 sm:p-6 xl:p-8` for consistency.

### Migration

- If you were adding your own horizontal margin/padding around `.grid-content-position` or `.grid-content-container` on small screens, you can remove it — edge spacing is now built in.
- `.form-container` padding now starts stepping up at `sm` instead of staying at `p-4` until `lg`. If you relied on the tighter padding at medium screen sizes, you may need to adjust.

## 3.0.0

### Breaking Changes

- `initThemeToggle()` now returns `{ cleanup, resetToSystem }` instead of a bare cleanup function. Update calls from `const cleanup = initThemeToggle(...)` to `const { cleanup } = initThemeToggle(...)`.

### New

- `clearThemeCookie()` export from `theme.js` — deletes the theme cookie, reverting to system/OS preference.
- `isSystemMode()` export from `theme.js` — returns `true` when the user has no explicit theme preference.
- `resetToSystem()` method on the `initThemeToggle()` return object — clears the cookie and re-applies the current OS theme.

### Fixed

- OS theme changes are now followed live when the user has no explicit preference (system mode). Previously, the `matchMedia` change listener only updated toggle icons without applying the theme.
