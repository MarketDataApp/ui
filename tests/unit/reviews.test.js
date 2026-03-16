import { initResenaWidget, reviewRating, reviewCount, reviewLabel } from '../../dist/reviews.js';

describe('initResenaWidget', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders a large widget by default', () => {
    initResenaWidget({ container });
    expect(container.querySelector('.clientes-dicen')).not.toBeNull();
  });

  it('renders a small widget when version is "small"', () => {
    initResenaWidget({ container, version: 'small' });
    expect(container.querySelector('.resena-enlace')).not.toBeNull();
    expect(container.querySelector('.clientes-dicen')).toBeNull();
  });

  it('displays the review rating', () => {
    initResenaWidget({ container });
    expect(container.textContent).toContain(reviewRating);
  });

  it('displays the review count', () => {
    initResenaWidget({ container });
    expect(container.textContent).toContain(reviewCount);
  });

  it('displays the review label in large widget', () => {
    initResenaWidget({ container });
    expect(container.textContent).toContain(reviewLabel);
  });

  it('sets the platform brand name at runtime via SVG titles', () => {
    initResenaWidget({ container });
    const title = container.querySelector('.titulo-logo');
    expect(title).not.toBeNull();
    expect(title.textContent.length).toBeGreaterThan(0);
  });

  it('has clickable review links', () => {
    initResenaWidget({ container });
    const links = container.querySelectorAll('.resena-enlace');
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].style.cursor).toBe('pointer');
  });

  it('cleanup removes the widget from DOM', () => {
    const cleanup = initResenaWidget({ container });
    expect(container.children.length).toBeGreaterThan(0);
    cleanup();
    expect(container.children.length).toBe(0);
  });

  it('exports review data constants', () => {
    expect(typeof reviewRating).toBe('string');
    expect(typeof reviewCount).toBe('string');
    expect(typeof reviewLabel).toBe('string');
    expect(parseFloat(reviewRating)).toBeGreaterThan(0);
    expect(parseInt(reviewCount)).toBeGreaterThan(0);
  });
});
