# Flowbite Base Form Styles Reference

Extracted from Flowbite's `plugin.js` (`themesberg/flowbite` on GitHub).
These styles are injected via `addBase()` — they apply globally to all matching
elements when the Flowbite plugin is active with `forms: true` (the default).

Our `@marketdataapp/ui` does NOT use the Flowbite plugin. This file exists so we
can audit our component classes (`css/components.src.css`) against Flowbite's
defaults and stay aligned where it matters.

---

## Text Inputs, Textarea, Select (base reset)

Selector:

```
[type='text'], [type='email'], [type='url'], [type='password'],
[type='number'], [type='date'], [type='datetime-local'], [type='month'],
[type='search'], [type='tel'], [type='time'], [type='week'],
[multiple], textarea, select
```

```css
appearance: none;
background-color: #fff;
border-color: var(--color-body);
border-width: 1px; /* borderWidth.DEFAULT */
border-radius: 0; /* borderRadius.none — component overrides this */
padding: 0.5rem 0.75rem; /* spacing[2] spacing[3] */
font-size: 1rem; /* baseFontSize */
line-height: 1.5rem; /* baseLineHeight */
--tw-shadow: 0 0 #0000;
```

### Focus state

```css
:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  --tw-ring-inset: var(--tw-empty, /*!*/ /*!*/);
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: var(--color-brand);
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width)
    var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width))
    var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  border-color: var(--color-brand);
}
```

Key takeaway: **1px focus ring**, color is `var(--color-brand)`, border changes to brand on focus.

---

## Placeholders

```css
input::placeholder,
textarea::placeholder {
  color: var(--color-body);
  opacity: 1;
}
```

---

## Select (dropdown arrow)

```css
select:not([size]) {
  background-image: url('<chevron-down SVG stroke=gray-500>');
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 0.75em 0.75em;
  padding-right: 2.5rem; /* spacing[10] */
  print-color-adjust: exact;
}
```

RTL variant flips `background-position` and padding.

`[multiple]` resets `background-image` back to `initial`.

---

## Checkbox & Radio (base reset)

Selector: `[type='checkbox'], [type='radio']`

```css
position: relative;
appearance: none;
padding: 0;
print-color-adjust: exact;
display: inline-block;
vertical-align: middle;
background-origin: border-box;
user-select: none;
flex-shrink: 0;
height: 1rem; /* spacing[4] */
width: 1rem; /* spacing[4] */
color: var(--color-brand);
background-color: #fff;
border-color: var(--color-default);
border-width: 1px; /* borderWidth.DEFAULT */
--tw-shadow: 0 0 #0000;
```

Checkbox gets `border-radius: 0`. Radio gets `border-radius: 100%`.

### Focus state

```css
[type='checkbox']:focus,
[type='radio']:focus {
  outline: 1px solid transparent;
  --tw-ring-inset: var(--tw-empty, /*!*/ /*!*/);
  --tw-ring-offset-color: #fff;
  --tw-ring-color: var(--color-brand);
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width)
    var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width))
    var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
```

Note: `outline-offset` and `--tw-ring-offset-width` are commented out in source
with `// TODO: conflict with radio`.

### Checked state

```css
/* Checkbox + radio (light + dark) */
background-color: currentColor !important;
background-size: 0.85em 0.85em !important;
background-position: center;
background-repeat: no-repeat;

/* Checkbox only */
border-color: currentColor !important;
background-image: url('<checkmark SVG stroke=white>');
background-size: 0.75em 0.75em;
```

### Radio checked (pseudo-elements)

```css
[type='radio']:checked::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 100%;
  background-color: var(--color-brand);
  width: 0.9em !important;
  height: 0.9em !important;
}

[type='radio']:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 100%;
  background-color: var(--color-white);
  width: 0.35em !important;
  height: 0.35em !important;
}
```

Dark mode duplicates the same rules under `.dark` prefix.

### Indeterminate checkbox

```css
[type='checkbox']:indeterminate {
  background-image: url('<horizontal-line SVG stroke=white>');
  background-color: currentColor !important;
  border-color: transparent !important;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 1.55em 1.55em;
}
```

---

## File Input

```css
[type='file'] {
  background: unset;
  border-color: inherit;
  border-width: 0;
  border-radius: 0;
  padding: 0;
  font-size: unset;
  line-height: inherit;
}

input[type='file']::file-selector-button {
  color: var(--color-body);
  background: var(--color-neutral-quaternary);
  border: 0;
  font-weight: 500; /* fontWeight.medium */
  font-size: 0.875rem; /* fontSize.sm */
  cursor: pointer;
  padding: 0.625rem 1rem 0.625rem 2rem;
  margin-inline: -1rem 1rem;
}
```

---

## Range Slider

```css
input[type='range']::-webkit-slider-thumb {
  height: 1.25rem; /* spacing[5] */
  width: 1.25rem;
  background: var(--color-brand);
  border-radius: 9999px;
  border: 0;
  appearance: none;
  cursor: pointer;
}

input[type='range']:focus::-webkit-slider-thumb {
  /* 4px ring — larger than form inputs */
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width))
    var(--tw-ring-color);
  --tw-ring-color: rgb(164 202 254 / 1); /* blue-200-ish, hardcoded */
}
```

---

## Toggle

```css
.toggle-bg::after {
  content: '';
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  background: white;
  border-color: var(--color-default);
  border-width: 1px;
  border-radius: 9999px;
  height: 1.25rem;
  width: 1.25rem;
  transition:
    background-color,
    border-color,
    color,
    fill,
    stroke,
    opacity,
    box-shadow,
    transform,
    filter,
    backdrop-filter 0.15s;
  box-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width))
    var(--tw-ring-color);
}

input:checked + .toggle-bg::after {
  transform: translateX(100%);
  border-color: white;
}

input:checked + .toggle-bg {
  background: var(--color-brand);
  border-color: var(--color-brand);
}
```

---

## Comparison with @marketdataapp/ui

### Text inputs

| Property           | Flowbite base        | Our `form-input`     |
| ------------------ | -------------------- | -------------------- |
| border-radius      | `0` (reset)          | `rounded-lg`         |
| border-width       | `1px`                | `border` (1px)       |
| padding            | `0.5rem 0.75rem`     | `p-2.5` (0.625rem)   |
| font-size          | `1rem`               | `text-sm` (0.875rem) |
| focus ring width   | **1px**              | **`ring-1`** (1px)   |
| focus ring color   | `var(--color-brand)` | `ring-brand`         |
| focus border-color | `var(--color-brand)` | `border-brand`       |
| shadow             | `0 0 #0000` (none)   | `shadow-none`        |

### Checkbox / Radio

| Property         | Flowbite base                        | Our `radio-button-input`    |
| ---------------- | ------------------------------------ | --------------------------- |
| size             | `1rem` (spacing[4])                  | `w-4 h-4` (1rem)            |
| color            | `var(--color-brand)`                 | `text-brand`                |
| focus ring width | **1px**                              | **`ring-1`** (1px)          |
| focus ring color | `var(--color-brand)`                 | `ring-brand-medium`         |
| checked style    | `::before`/`::after` pseudo-elements | `background-image` data URI |

### Key differences

1. **Padding/font-size**: Our form inputs are slightly smaller (0.875rem / p-2.5) vs Flowbite's reset (1rem / p-2 p-3). This is intentional — our components override the base anyway.
2. **Radio checked implementation**: Flowbite uses `::before`/`::after` pseudo-elements with brand color fill + white dot. We use a background-image SVG data URI. Both produce visually similar results.
3. **Focus ring width**: Aligned at 1px after brand token migration.
4. **Brand color**: Flowbite defaults `--color-brand` to blue-700. We map it to blue-600 (light) / blue-500 (dark).
