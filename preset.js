/**
 * @marketdataapp/ui — Shared Tailwind preset for MarketData properties.
 *
 * Usage in consuming projects:
 *   // tailwind.config.js
 *   module.exports = {
 *     presets: [require('@marketdataapp/ui/preset')],
 *     content: [ ... ],          // project-specific
 *     plugins: [ ... ],          // project-specific (e.g. flowbite)
 *   }
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: ['selector'],

  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Ubuntu', 'Cantarell', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        quicksand: ['Quicksand', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-orange': 'linear-gradient(103deg, #E83155 0%, #FFDFB9 100%)',
        'gradient-blue': 'linear-gradient(103deg, #003286 0%, #0085f2 100%)',
      },
      boxShadow: {
        'line': '0 0 0 1px rgba(0, 26, 108, 0.2) inset',
        'darkline': '0 0 0 1px rgba(255, 255, 255, 0.4) inset',
        'diffuse': '0 20px 40px 0 rgba(232, 49, 85, 0.2)',
      },
      colors: {
        marketdata: {
          lightorange: '#FFDFB9',
          darkorange: '#E83155',
          lightblue: '#0085f2',
          darkblue: '#003286',
          bluebg: '#001A6C',
        },
        note: {
          bg: 'rgb(253, 253, 254)',
          border: 'rgb(212, 213, 216)',
          text: 'rgb(71, 71, 72)',
          darkbg: 'rgb(71, 71, 72)',
          darkborder: 'rgb(212, 213, 216)',
          darktext: 'rgb(253, 253, 254)',
        },
        tip: {
          bg: 'rgb(230, 246, 230)',
          border: 'rgb(0, 148, 0)',
          text: 'rgb(0, 49, 0)',
          darkbg: 'rgb(0, 49, 0)',
          darkborder: 'rgb(0, 148, 0)',
          darktext: 'rgb(230, 246, 230)',
        },
        info: {
          bg: 'rgb(238, 249, 253)',
          border: 'rgb(76, 179, 212)',
          text: 'rgb(25, 60, 71)',
          darkbg: 'rgb(25, 60, 71)',
          darkborder: 'rgb(76, 179, 212)',
          darktext: 'rgb(238, 249, 253)',
        },
        warning: {
          bg: 'rgb(255, 248, 230)',
          border: 'rgb(230, 167, 0)',
          text: 'rgb(77, 56, 0)',
          darkbg: 'rgb(77, 56, 0)',
          darkborder: 'rgb(230, 167, 0)',
          darktext: 'rgb(255, 248, 230)',
        },
        danger: {
          bg: 'rgb(255, 235, 236)',
          border: 'rgb(225, 50, 56)',
          text: 'rgb(75, 17, 19)',
          darkbg: 'rgb(75, 17, 19)',
          darkborder: 'rgb(225, 50, 56)',
          darktext: 'rgb(255, 235, 236)',
        },
      },
    },
  },

  plugins: [
    function({ addComponents }) {
      addComponents({
        /* ---- Buttons ---- */
        '.btn-orange-to-blue': {
          '@apply inline-flex max-w-max no-underline text-center py-2.5 px-7 lg:px-10 lg:py-3.5 rounded-3xl': {},
          '@apply font-quicksand text-xs lg:text-base lg:leading-none font-medium tracking-tight leading-none': {},
          '@apply border-none bg-gradient-orange text-white': {},
          '@apply shadow-diffuse': {},
          '@apply hover:bg-gradient-blue hover:shadow-none': {},
          '@apply cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gradient-orange disabled:hover:shadow-diffuse': {},
          '&:hover': {
            'text-decoration': 'none !important',
          },
        },
        '.btn-blue-to-orange': {
          '@apply inline-flex max-w-max no-underline text-center py-2.5 px-7 lg:px-10 lg:py-3.5 rounded-3xl': {},
          '@apply font-quicksand text-xs lg:text-base lg:leading-none font-medium tracking-tight leading-none': {},
          '@apply border-none bg-gradient-blue text-white': {},
          '@apply shadow-line': {},
          '@apply hover:bg-gradient-orange hover:shadow-diffuse': {},
          '@apply cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gradient-blue disabled:hover:shadow-line': {},
          '&:hover': {
            'text-decoration': 'none !important',
          },
        },
        '.btn-hover-orange': {
          '@apply inline-flex max-w-max no-underline text-center py-2.5 px-7 lg:px-10 lg:py-3.5 rounded-3xl': {},
          '@apply font-quicksand text-xs lg:text-base lg:leading-none font-medium tracking-tight leading-none': {},
          '@apply bg-transparent text-marketdata-darkblue': {},
          '@apply shadow-line dark:shadow-darkline dark:text-white': {},
          '@apply hover:bg-gradient-orange hover:text-white hover:shadow-diffuse': {},
          '@apply cursor-pointer disabled:cursor-not-allowed disabled:opacity-50': {},
          '@apply disabled:hover:bg-none disabled:hover:bg-transparent disabled:hover:text-marketdata-darkblue dark:disabled:hover:text-white disabled:hover:shadow-line dark:disabled:hover:shadow-darkline': {},
          '&:hover': {
            'text-decoration': 'none !important',
          },
        },
        '.btn-hover-blue': {
          '@apply inline-flex max-w-max no-underline text-center py-2.5 px-7 lg:px-10 lg:py-3.5 rounded-3xl': {},
          '@apply font-quicksand text-xs lg:text-base lg:leading-none font-medium tracking-tight leading-none': {},
          '@apply bg-transparent text-marketdata-darkblue': {},
          '@apply shadow-line dark:shadow-darkline dark:text-white': {},
          '@apply hover:bg-gradient-blue hover:text-white hover:shadow-none': {},
          '@apply cursor-pointer disabled:cursor-not-allowed disabled:opacity-50': {},
          '@apply disabled:hover:bg-none disabled:hover:bg-transparent disabled:hover:text-marketdata-darkblue dark:disabled:hover:text-white disabled:hover:shadow-line dark:disabled:hover:shadow-darkline': {},
          '&:hover': {
            'text-decoration': 'none !important',
          },
        },

        /* ---- Forms ---- */
        '.form-container': {
          '@apply dark:border-gray-700 dark:bg-gray-800 border-gray-200 bg-white p-4 lg:p-8 rounded-lg shadow-md': {},
        },
        '.form-heading': {
          '@apply mb-4 text-xl font-bold text-gray-900 dark:text-white': {},
        },
        '.form-label': {
          '@apply block mb-2 text-sm font-medium text-gray-900 dark:text-white': {},
        },
        '.form-input': {
          '@apply shadow-none bg-gray-50 border border-solid border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500': {},
        },
        '.form-input-disabled': {
          '@apply bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500': {},
        },
        '.form-input-error': {
          '@apply shadow-none border-red-500 text-red-900 placeholder-red-700 focus:ring-red-500 focus:border-red-500 dark:text-red-500 dark:placeholder-red-500 dark:border-red-500': {},
        },
        '.form-dropdown-input': {
          '@apply shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500': {},
        },
        '.form-helper-text': {
          '@apply mt-2 text-sm text-gray-500 dark:text-gray-400': {},
          '&::first-letter': {
            'text-transform': 'uppercase',
          },
        },
        '.form-helper-text-error': {
          '@apply mt-2 text-sm text-red-600 dark:text-red-500': {},
        },

        /* ---- Radio Buttons ---- */
        '.radio-button-input': {
          '@apply w-4 h-4 pl-2 text-blue-600 bg-gray-100 border border-gray-300 rounded-full appearance-none': {},
          '@apply checked:bg-blue-600 checked:border-transparent': {},
          '@apply focus:ring-blue-500 focus:ring-2 focus:outline-none dark:focus:ring-blue-600': {},
          '@apply dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700': {},
          '@apply dark:bg-gray-600 dark:border-gray-500': {},
          '@apply mr-2': {},
          'background-size': '1em',
        },
        '.radio-button-helper': {
          '@apply text-xs font-normal text-gray-500 dark:text-gray-300': {},
        },

        /* ---- Badges ---- */
        '.badge': {
          '@apply text-xs font-medium px-2.5 py-0.5 rounded-sm': {},
        },
        '.badge-blue': {
          '@apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300': {},
        },
        '.badge-gray': {
          '@apply bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300': {},
        },
        '.badge-red': {
          '@apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': {},
        },
        '.badge-green': {
          '@apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': {},
        },
        '.badge-yellow': {
          '@apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': {},
        },
        '.badge-indigo': {
          '@apply bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300': {},
        },
        '.badge-purple': {
          '@apply bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300': {},
        },
        '.badge-pink': {
          '@apply bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300': {},
        },
        '.badge-pill': {
          '@apply text-xs font-medium me-2 px-2.5 py-0.5 rounded-full font-sans': {},
        },
        '.badge-pill-green': {
          '@apply badge-pill bg-green-100 text-green-800 border border-green-400 dark:bg-green-900 dark:text-green-300': {},
        },
        '.badge-pill-blue': {
          '@apply badge-pill bg-blue-100 text-blue-800 border border-blue-400 dark:bg-blue-900 dark:text-blue-300 capitalize': {},
        },
        '.badge-pill-red': {
          '@apply badge-pill bg-red-100 text-red-800 border border-red-400 dark:bg-red-900 dark:text-red-300 capitalize': {},
        },

        /* ---- Grid Layout ---- */
        '.grid-layout-12': {
          '@apply grid grid-cols-12 gap-4': {},
        },
        '.grid-content-container': {
          '@apply col-span-12 p-4 mx-4 mb-4 bg-white rounded-lg shadow sm:p-6 xl:p-8 dark:bg-gray-800 xl:col-start-2 xl:col-span-10 2xl:col-start-3 2xl:col-span-8 md:mx-6 lg:my-6': {},
        },
        '.grid-content-position': {
          '@apply col-span-12 xl:col-start-2 xl:col-span-10 2xl:col-start-3 2xl:col-span-8': {},
        },

        /* ---- Defaults ---- */
        '.default': {
          '@apply text-base font-sans text-gray-900 dark:text-white': {},
          '@apply bg-white dark:bg-gray-900': {},
        },
      });
    },
  ],
};
