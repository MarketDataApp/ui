import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// The jsdom test environment makes import.meta.url an https: URL, so resolve
// from the project root (vitest's cwd) instead.
const componentsSrc = resolve(process.cwd(), 'css/components.src.css');
const reviewsCss = resolve(process.cwd(), 'css/reviews.css');

// Regression guard for issue #37: the review widget is a shared, JS-rendered
// component, so its styles must live in components.src.css — the single import
// (`@marketdataapp/ui/css/components.src`) a Tailwind v4 source consumer uses
// to get every other shared component. Previously they only lived in a
// standalone css/reviews.css that had no export path, leaving the widget
// unstyled for source consumers.
describe('reviews widget CSS packaging (#37)', () => {
  const src = readFileSync(componentsSrc, 'utf8');

  it('ships the .resena-widget rules inside components.src.css', () => {
    expect(src).toContain('.resena-widget');
  });

  it('includes both the large and small widget variants', () => {
    expect(src).toContain('.resena-widget:not(.resena-small)');
    expect(src).toContain('.resena-widget.resena-small');
  });

  it('includes the star and logo fills the widget renders', () => {
    expect(src).toContain('.estrella__fondo');
    expect(src).toContain('.logo__estrella');
  });

  it('no longer keeps the styles in a separate, unexported css/reviews.css', () => {
    expect(existsSync(reviewsCss)).toBe(false);
  });
});
