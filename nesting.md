# CSS Nesting Inside `@utility` in Tailwind v4

## Issue

After converting component classes from plain CSS to `@utility` blocks (commits `75e8a71`, `4b65393`), radio buttons lost their checked state styling. The filled dot no longer appeared when selecting a radio option.

## Root Cause

The original CSS used native CSS nesting for the `:checked` pseudo-class:

```css
.radio-button-input {
  @apply w-4 h-4 ... appearance-none;
  background-position: center;
  background-repeat: no-repeat;
  &:checked {
    background-color: #2563eb;
    border-color: transparent;
    background-image: url('data:image/svg+xml,...');
    background-size: 100% 100%;
  }
}
```

During the `@utility` conversion, the `&:checked` block was incorrectly extracted into a separate utility class:

```css
@utility radio-button-input {
  /* ... base styles ... */
}

/* Orphaned — nothing ever applies this class */
@utility radio-button-input-checked {
  background-color: var(--color-brand);
  /* ... */
}
```

Since `appearance: none` removes the native radio dot, and nothing applied the `-checked` class, the checked state was invisible.

## Resolution

Nesting **does work** inside `@utility` in Tailwind v4. The official docs confirm this with an example:

```css
@utility scrollbar-hidden {
  &::-webkit-scrollbar {
    display: none;
  }
}
```

Source: https://tailwindcss.com/docs/adding-custom-styles

The fix was to put `&:checked` back inside the `@utility` block:

```css
@utility radio-button-input {
  @apply w-4 h-4 text-brand bg-gray-100 border border-gray-300 rounded-full appearance-none;
  /* ... */
  background-position: center;
  background-repeat: no-repeat;
  &:checked {
    background-color: var(--color-brand);
    border-color: transparent;
    background-image: url('data:image/svg+xml,...');
    background-size: 100% 100%;
  }
}
```

The build (`tailwindcss v4.2.1`) compiled it correctly — the `&:checked` rule appears in the output `components.css`.

## Takeaway

When converting classes to `@utility`, **preserve nested rules** (`&:hover`, `&:checked`, `&::before`, etc.) inside the block. They are supported and compile correctly. Do not split them into separate utility classes — those become orphaned classes that nothing applies.

### What works inside `@utility`

- `&:checked`, `&:hover`, `&:focus`, `&:disabled` (pseudo-classes)
- `&::before`, `&::after`, `&::-webkit-scrollbar` (pseudo-elements)
- `@media` queries
- `@apply` directives
- Plain CSS properties

### Related links

- Tailwind v4 custom styles docs: https://tailwindcss.com/docs/adding-custom-styles
- Nested `@apply` bug (fixed): https://github.com/tailwindlabs/tailwindcss/issues/16935
