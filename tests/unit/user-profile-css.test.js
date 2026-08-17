import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDS, ruleBody } from './helpers/css.js';

// Issue #38: the login pill wrapped to two lines whenever the navbar flex row
// ran short of space. Nothing stopped it — the pill was the one button in this
// package without `whitespace-nowrap`, so its min-content width was the width
// of "Log", and the row happily squeezed it that far.
//
// These assertions read the BUILT artifacts, not the `@apply` source, because
// dist/css is what consumers link. A rule that never emitted would pass a
// source-string check and still ship a wrapping pill.

describe.each(BUILDS)('login pill layout in %s (#38)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const pill = ruleBody(css, '.user-profile-wrapper .user-profile-login-pill');
  const pillSvg = ruleBody(css, '.user-profile-wrapper .user-profile-login-pill svg');

  it('emits the login pill rule', () => {
    expect(pill).not.toBeNull();
    expect(pillSvg).not.toBeNull();
  });

  it('keeps the label on one line', () => {
    expect(pill).toMatch(/white-space:\s*nowrap/);
  });

  it('refuses to be compressed by the navbar flex row', () => {
    expect(pill).toMatch(/flex-shrink:\s*0/);
  });

  // WCAG 2.5.8 wants 24x24 minimum and 44x44 for the AAA bar. The pill's
  // content box measures 42px (py-2.5 + leading-5 + border), so a 44px floor
  // centres that content without touching the padding.
  it('holds a 44px minimum height for the touch target', () => {
    expect(pill).toMatch(/min-height:\s*calc\(var\(--spacing\) \* 11\)/);
  });

  it('stops the icons absorbing the squeeze before the text does', () => {
    expect(pillSvg).toMatch(/flex-shrink:\s*0/);
  });
});

// Issue #40: the container reserves space so the navbar holds still while the
// user fetch is in flight. It reserved the avatar's 40px on the height axis,
// but an anonymous visitor always lands the 44px pill, so the bar grew by 4px
// on hydration and opened a band under any fixed header with a set spacer.
describe.each(BUILDS)('container height reservation in %s (#40)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const container = ruleBody(css, '.user-profile-container');

  it('emits the container rule', () => {
    expect(container).not.toBeNull();
  });

  // The pill is the taller of the two states the container can land, so the
  // reservation has to match it — 44px, the same floor the pill rule asserts.
  it('reserves the pill height, not the avatar height', () => {
    expect(container).toMatch(/min-height:\s*calc\(var\(--spacing\) \* 11\)/);
  });

  // Per #9, the width axis reserves the full pill at 118px. The compact
  // container drops that floor itself; this is the uncompacted default.
  it('keeps the 118px width reservation from #9', () => {
    expect(container).toMatch(/min-width:\s*7\.375rem/);
  });
});

// Issue #38: the full pill needs 444px of navbar row and never fits a phone,
// so consumers add .user-profile-compact to the container at whatever width
// their own navbar collapses. The package ships no media query — Docusaurus
// switches to a hamburger at 996px and marketdata.app at 640px, so any
// breakpoint we picked would be wrong for someone.
describe.each(BUILDS)('compact login pill in %s (#38)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const container = ruleBody(css, '.user-profile-container.user-profile-compact');
  const pill = ruleBody(
    css,
    '.user-profile-compact .user-profile-wrapper .user-profile-login-pill',
  );
  const label = ruleBody(
    css,
    '.user-profile-compact .user-profile-wrapper .user-profile-login-label',
  );
  const chevron = ruleBody(
    css,
    '.user-profile-compact .user-profile-wrapper .user-profile-login-chevron',
  );

  it('emits every compact rule', () => {
    expect(container).not.toBeNull();
    expect(pill).not.toBeNull();
    expect(label).not.toBeNull();
    expect(chevron).not.toBeNull();
  });

  // The 118px floor is a CLS guard for the skeleton phase. Left at 118px it
  // reserves nearly three times the width a 44px pill renders into.
  it('drops the container floor to the width the compact pill renders', () => {
    expect(container).toMatch(/min-width:\s*calc\(var\(--spacing\) \* 11\)/);
  });

  it('holds a 44x44 box', () => {
    expect(pill).toMatch(/min-width:\s*calc\(var\(--spacing\) \* 11\)/);
    // min-height comes from the base pill rule, which every build asserts above.
  });

  it('centres the lone icon and drops the label gap', () => {
    expect(pill).toMatch(/justify-content:\s*center/);
    expect(pill).toMatch(/gap:\s*(0px?|calc\(var\(--spacing\) \* 0\))/);
  });

  it('keeps the label as the accessible name rather than removing it', () => {
    expect(label).toMatch(/position:\s*absolute/);
    expect(label).toMatch(/clip-path:\s*inset\(50%\)/);
  });

  // The consumer's mobile audit flags any element whose scrollHeight exceeds
  // its clientHeight while overflow is hidden. The standard sr-only recipe
  // trips it on every page, so the clip-path technique replaces it here.
  it('hides the label without overflow: hidden', () => {
    expect(label).not.toMatch(/overflow:\s*hidden/);
  });

  it('hides the chevron', () => {
    expect(chevron).toMatch(/display:\s*none/);
  });
});
