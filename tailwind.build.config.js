/**
 * Tailwind build config — generates css/components.css
 *
 * Content is empty because addComponents() classes are always emitted
 * regardless of content scanning. Run: npm run build:css
 */
module.exports = {
  presets: [require('./preset')],
  // Scan preset.js so @apply can resolve the utility classes it references
  content: ['./preset.js'],
  // Cover both Tailwind (.dark) and Docusaurus ([data-theme="dark"]) dark mode
  darkMode: ['selector', ':is(.dark, [data-theme="dark"])'],
};
