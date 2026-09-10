// Auto-generated from src/ by scripts/build-js.js — do not edit manually

/**
 * @module header
 * The marketdata.app site header, rendered to an HTML string.
 *
 * Server-safe: nothing here touches `document` or `window`, so it runs in an
 * Astro frontmatter block, on a Cloudflare Worker, in Node, or in a browser.
 * The behaviour — overflow measurement, the drawer, the mega menus, the theme
 * toggles and the account control — lives in `header-client.js`, which a
 * consumer loads once on the client and points at the rendered markup.
 *
 * Every string a caller passes as text or as an attribute value is escaped.
 * Two things are trusted application markup and are emitted verbatim:
 * `slots.*` and a `NavLink.icon` that starts with `<svg`. Never feed either
 * from user input.
 *
 * Extracted from MarketDataApp/website `src/components/Header.astro`. The
 * markup is that header's, one class per role, so both sites render one
 * header from one file. Styles: `css/components.src.css`, "Site Header".
 */

const icons = {"blog":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M172.2 226.8c-14.6-2.9-28.2 8.9-28.2 23.8V301c0 10.2 7.1 18.4 16.7 22 18.2 6.8 31.3 24.4 31.3 45 0 26.5-21.5 48-48 48s-48-21.5-48-48V120c0-13.3-10.7-24-24-24H24c-13.3 0-24 10.7-24 24v248c0 89.5 82.1 160.2 175 140.7 54.4-11.4 98.3-55.4 109.7-109.7 17.4-82.9-37-157.2-112.5-172.2zM209 0c-9.2-.5-17 6.8-17 16v31.6c0 8.5 6.6 15.5 15 15.9 129.4 7 233.4 112 240.9 241.5.5 8.4 7.5 15 15.9 15h32.1c9.2 0 16.5-7.8 16-17C503.4 139.8 372.2 8.6 209 0zm.3 96c-9.3-.7-17.3 6.7-17.3 16.1v32.1c0 8.4 6.5 15.3 14.8 15.9 76.8 6.3 138 68.2 144.9 145.2.8 8.3 7.6 14.7 15.9 14.7h32.2c9.3 0 16.8-8 16.1-17.3-8.4-110.1-96.5-198.2-206.6-206.7z\"></path></svg>","bonds":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M458.622 255.92l45.985-45.005c13.708-12.977 7.316-36.039-10.664-40.339l-62.65-15.99 17.661-62.015c4.991-17.838-11.829-34.663-29.661-29.671l-61.994 17.667-15.984-62.671C337.085.197 313.765-6.276 300.99 7.228L256 53.57 211.011 7.229c-12.63-13.351-36.047-7.234-40.325 10.668l-15.984 62.671-61.995-17.667C74.87 57.907 58.056 74.738 63.046 92.572l17.661 62.015-62.65 15.99C.069 174.878-6.31 197.944 7.392 210.915l45.985 45.005-45.985 45.004c-13.708 12.977-7.316 36.039 10.664 40.339l62.65 15.99-17.661 62.015c-4.991 17.838 11.829 34.663 29.661 29.671l61.994-17.667 15.984 62.671c4.439 18.575 27.696 24.018 40.325 10.668L256 458.61l44.989 46.001c12.5 13.488 35.987 7.486 40.325-10.668l15.984-62.671 61.994 17.667c17.836 4.994 34.651-11.837 29.661-29.671l-17.661-62.015 62.65-15.99c17.987-4.302 24.366-27.367 10.664-40.339l-45.984-45.004z\"></path></svg>","book-open":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 576 512\"><path d=\"M542.22 32.05c-54.8 3.11-163.72 14.43-230.96 55.59-4.64 2.84-7.27 7.89-7.27 13.17v363.87c0 11.55 12.63 18.85 23.28 13.49 69.18-34.82 169.23-44.32 218.7-46.92 16.89-.89 30.02-14.43 30.02-30.66V62.75c.01-17.71-15.35-31.74-33.77-30.7zM264.73 87.64C197.5 46.48 88.58 35.17 33.78 32.05 15.36 31.01 0 45.04 0 62.75V400.6c0 16.24 13.13 29.78 30.02 30.66 49.49 2.6 149.59 12.11 218.77 46.95 10.62 5.35 23.21-1.94 23.21-13.46V100.63c0-5.29-2.62-10.14-7.27-12.99z\"></path></svg>","braces":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2a2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1m8 0h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1\"/></svg>","changelog":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 420.58 420.83\"><g transform=\"translate(-0.12 0)\"><g><g><path d=\"M210.29,0C156,0,104.43,20.693,65.077,58.269C25.859,95.715,2.794,146.022,0.134,199.921    c-0.135,2.734,0.857,5.404,2.744,7.388c1.889,1.983,4.507,3.105,7.244,3.105h45.211c5.275,0,9.644-4.098,9.979-9.362    c4.871-76.214,68.553-135.914,144.979-135.914c80.105,0,145.275,65.171,145.275,145.276c0,80.105-65.17,145.276-145.275,145.276    c-18.109,0-35.772-3.287-52.501-9.771l17.366-15.425c2.686-2.354,3.912-5.964,3.217-9.468c-0.696-3.506-3.209-6.371-6.592-7.521    l-113-32.552c-3.387-1.149-7.122-0.407-9.81,1.948c-2.686,2.354-3.913,5.963-3.218,9.467L69.71,403.157    c0.696,3.505,3.209,6.372,6.591,7.521c3.383,1.147,7.122,0.408,9.81-1.946l18.599-16.298    c31.946,18.574,68.456,28.394,105.581,28.394c116.021,0,210.414-94.392,210.414-210.414C420.705,94.391,326.312,0,210.29,0z\"></path><path d=\"M195.112,237.9h118.5c2.757,0,5-2.242,5-5v-30c0-2.757-2.243-5-5-5h-83.5v-91c0-2.757-2.243-5-5-5h-30    c-2.757,0-5,2.243-5,5v126C190.112,235.658,192.355,237.9,195.112,237.9z\"></path></g></g></g></svg>","chevron-right":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><path d=\"M696 533C708 521 713 504 713 487 713 471 708 454 696 446L400 146C388 133 375 125 354 125 338 125 325 129 313 142 300 154 292 171 292 187 292 204 296 221 308 233L563 492 304 771C292 783 288 800 288 817 288 833 296 850 308 863 321 871 338 875 354 875 371 875 388 867 400 854L696 533Z\"></path></svg>","closed-end-funds":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 576 512\"><path d=\"M64 0C28.7 0 0 28.7 0 64v352c0 35.3 28.7 64 64 64h16l16 32h64l16-32h224l16 32h64l16-32h16c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64zm160 320a80 80 0 1 0 0-160a80 80 0 1 0 0 160m0-240a160 160 0 1 1 0 320a160 160 0 1 1 0-320m256 141.3V336c0 8.8-7.2 16-16 16s-16-7.2-16-16V221.3c-18.6-6.6-32-24.4-32-45.3c0-26.5 21.5-48 48-48s48 21.5 48 48c0 20.9-13.4 38.7-32 45.3\"/></svg>","code":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 640 512\"><path d=\"M278.9 511.5l-61-17.7c-6.4-1.8-10-8.5-8.2-14.9L346.2 8.7c1.8-6.4 8.5-10 14.9-8.2l61 17.7c6.4 1.8 10 8.5 8.2 14.9L293.8 503.3c-1.9 6.4-8.5 10.1-14.9 8.2zm-114-112.2l43.5-46.4c4.6-4.9 4.3-12.7-.8-17.2L117 256l90.6-79.7c5.1-4.5 5.5-12.3.8-17.2l-43.5-46.4c-4.5-4.8-12.1-5.1-17-.5L3.8 247.2c-5.1 4.7-5.1 12.8 0 17.5l144.1 135.1c4.9 4.6 12.5 4.4 17-.5zm327.2.6l144.1-135.1c5.1-4.7 5.1-12.8 0-17.5L492.1 112.1c-4.8-4.5-12.4-4.3-17 .5L431.6 159c-4.6 4.9-4.3 12.7.8 17.2L523 256l-90.6 79.7c-5.1 4.5-5.5 12.3-.8 17.2l43.5 46.4c4.5 4.9 12.1 5.1 17 .6z\"></path></svg>","crypto":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zm-141.651-35.33c4.937-32.999-20.191-50.739-54.55-62.573l11.146-44.702-27.213-6.781-10.851 43.524c-7.154-1.783-14.502-3.464-21.803-5.13l10.929-43.81-27.198-6.781-11.153 44.686c-5.922-1.349-11.735-2.682-17.377-4.084l.031-.14-37.53-9.37-7.239 29.062s20.191 4.627 19.765 4.913c11.022 2.751 13.014 10.044 12.68 15.825l-12.696 50.925c.76.194 1.744.473 2.829.907-.907-.225-1.876-.473-2.876-.713l-17.796 71.338c-1.349 3.348-4.767 8.37-12.471 6.464.271.395-19.78-4.937-19.78-4.937l-13.51 31.147 35.414 8.827c6.588 1.651 13.045 3.379 19.4 5.006l-11.262 45.213 27.182 6.781 11.153-44.733a1038.209 1038.209 0 0 0 21.687 5.627l-11.115 44.523 27.213 6.781 11.262-45.128c46.404 8.781 81.299 5.239 95.986-36.727 11.836-33.79-.589-53.281-25.004-65.991 17.78-4.098 31.174-15.792 34.747-39.949zm-62.177 87.179c-8.41 33.79-65.308 15.523-83.755 10.943l14.944-59.899c18.446 4.603 77.6 13.717 68.811 48.956zm8.417-87.667c-7.673 30.736-55.031 15.12-70.393 11.292l13.548-54.327c15.363 3.828 64.836 10.973 56.845 43.035z\"></path></svg>","currencies":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 512\"><path d=\"M310.706 413.765c-1.314-6.63-7.835-10.872-14.424-9.369-10.692 2.439-27.422 5.413-45.426 5.413-56.763 0-101.929-34.79-121.461-85.449h113.689a12 12 0 0 0 11.708-9.369l6.373-28.36c1.686-7.502-4.019-14.631-11.708-14.631H115.22c-1.21-14.328-1.414-28.287.137-42.245H261.95a12 12 0 0 0 11.723-9.434l6.512-29.755c1.638-7.484-4.061-14.566-11.723-14.566H130.184c20.633-44.991 62.69-75.03 117.619-75.03 14.486 0 28.564 2.25 37.851 4.145 6.216 1.268 12.347-2.498 14.002-8.623l11.991-44.368c1.822-6.741-2.465-13.616-9.326-14.917C290.217 34.912 270.71 32 249.635 32 152.451 32 74.03 92.252 45.075 176H12c-6.627 0-12 5.373-12 12v29.755c0 6.627 5.373 12 12 12h21.569c-1.009 13.607-1.181 29.287-.181 42.245H12c-6.627 0-12 5.373-12 12v28.36c0 6.627 5.373 12 12 12h30.114C67.139 414.692 145.264 480 249.635 480c26.301 0 48.562-4.544 61.101-7.788 6.167-1.595 10.027-7.708 8.788-13.957l-8.818-44.49z\"></path></svg>","database":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 448 512\"><path d=\"M448 73.143v45.714C448 159.143 347.667 192 224 192S0 159.143 0 118.857V73.143C0 32.857 100.333 0 224 0s224 32.857 224 73.143zM448 176v102.857C448 319.143 347.667 352 224 352S0 319.143 0 278.857V176c48.125 33.143 136.208 48.572 224 48.572S399.874 209.143 448 176zm0 160v102.857C448 479.143 347.667 512 224 512S0 479.143 0 438.857V336c48.125 33.143 136.208 48.572 224 48.572S399.874 369.143 448 336z\"></path></svg>","dollar":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 288 512\"><path d=\"M209.2 233.4l-108-31.6C88.7 198.2 80 186.5 80 173.5c0-16.3 13.2-29.5 29.5-29.5h66.3c12.2 0 24.2 3.7 34.2 10.5 6.1 4.1 14.3 3.1 19.5-2l34.8-34c7.1-6.9 6.1-18.4-1.8-24.5C238 74.8 207.4 64.1 176 64V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48h-2.5C45.8 64-5.4 118.7.5 183.6c4.2 46.1 39.4 83.6 83.8 96.6l102.5 30c12.5 3.7 21.2 15.3 21.2 28.3 0 16.3-13.2 29.5-29.5 29.5h-66.3C100 368 88 364.3 78 357.5c-6.1-4.1-14.3-3.1-19.5 2l-34.8 34c-7.1 6.9-6.1 18.4 1.8 24.5 24.5 19.2 55.1 29.9 86.5 30v48c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-48.2c46.6-.9 90.3-28.6 105.7-72.7 21.5-61.6-14.6-124.8-72.5-141.7z\"></path></svg>","economic-indicators":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M352 256c0 22.2-1.2 43.6-3.3 64H163.4c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64h185.3c2.2 20.4 3.3 41.8 3.3 64m28.8-64h123.1c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64m112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7m-209 0H18.6c30-74.1 93.6-130.9 172-151.6c-25.5 34.2-45.3 87.7-55.3 151.6M8.1 192h123.1c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64m186.6 254.6c-11.6-26-20.9-58.2-27-94.6h176.6c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5c-11.2 10.7-20.5 13.9-27.8 13.9s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6c-78.4-20.7-142-77.5-172-151.6zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6h116.7z\"/></svg>","etfs":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 640 512\"><path d=\"M608 64H32C14.33 64 0 78.33 0 96v320c0 17.67 14.33 32 32 32h576c17.67 0 32-14.33 32-32V96c0-17.67-14.33-32-32-32zM48 400v-64c35.35 0 64 28.65 64 64H48zm0-224v-64h64c0 35.35-28.65 64-64 64zm272 176c-44.19 0-80-42.99-80-96 0-53.02 35.82-96 80-96s80 42.98 80 96c0 53.03-35.83 96-80 96zm272 48h-64c0-35.35 28.65-64 64-64v64zm0-224c-35.35 0-64-28.65-64-64h64v64z\"></path></svg>","excel":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 384 512\"><path d=\"M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 405.5 192 373 192 373c-6.4 14.8-10 20-36.6 68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 10.6-6.3H274c9.5-.1 15.2 10.4 10.1 18.4zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z\"></path></svg>","feature-requests":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M501.1 395.7L384 278.6c-23.1-23.1-57.6-27.6-85.4-13.9L192 158.1V96L64 0 0 64l96 128h62.1l106.6 106.6c-13.6 27.8-9.2 62.3 13.9 85.4l117.1 117.1c14.6 14.6 38.2 14.6 52.7 0l52.7-52.7c14.5-14.6 14.5-38.2 0-52.7zM331.7 225c28.3 0 54.9 11 74.9 31l19.4 19.4c15.8-6.9 30.8-16.5 43.8-29.5 37.1-37.1 49.7-89.3 37.9-136.7-2.2-9-13.5-12.1-20.1-5.5l-74.4 74.4-67.9-11.3L334 98.9l74.4-74.4c6.6-6.6 3.4-17.9-5.7-20.2-47.4-11.7-99.6.9-136.6 37.9-28.5 28.5-41.9 66.1-41.2 103.6l82.1 82.1c8.1-1.9 16.5-2.9 24.7-2.9zm-103.9 82l-56.7-56.7L18.7 402.8c-25 25-25 65.5 0 90.5s65.5 25 90.5 0l123.6-123.6c-7.6-19.9-9.9-41.6-5-62.7zM64 472c-13.2 0-24-10.8-24-24 0-13.3 10.7-24 24-24s24 10.7 24 24c0 13.2-10.7 24-24 24z\"></path></svg>","futures":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><g><g><g><path d=\"M210.1,54.4c-4.3-3.3-7.6-7-9.8-11.2c-2.2-4.2-3.3-8.5-3.3-13c0-4.5,1.1-8.8,3.3-13c2.2-4.2,5.5-7.9,9.8-11.2c1.7,1.3,3.3,2.7,4.7,4.2c1.4,1.5,2.7,3.1,3.7,4.7c1.1,1.6,1.9,3.3,2.6,4.9c0.7,1.7,1.2,3.4,1.5,5.1c0.3,1.7,0.5,3.5,0.5,5.3c0,4.5-1.1,8.8-3.3,13C217.6,47.4,214.4,51.1,210.1,54.4z M15.1,147.4c-1.4,0-2.6-0.5-3.6-1.5c-1-1-1.5-2.2-1.5-3.6c0-1.4,0.5-2.6,1.5-3.6c1-1,2.2-1.5,3.6-1.5h5.1v-30.8h-5.1c-1.4,0-2.6-0.5-3.6-1.5c-1-1-1.5-2.2-1.5-3.6c0-1.4,0.5-2.6,1.5-3.6c1-1,2.2-1.5,3.6-1.5h5.1V65.3h-5.1c-1.4,0-2.6-0.5-3.6-1.5c-1-1-1.5-2.2-1.5-3.6c0-1.4,0.5-2.6,1.5-3.6c1-1,2.2-1.5,3.6-1.5h5.1V24.3h-5.1c-1.4,0-2.6-0.5-3.6-1.5c-1-1-1.5-2.2-1.5-3.6c0-1.4,0.5-2.6,1.5-3.6c1-1,2.2-1.5,3.6-1.5h102.6c1.4,0,2.6,0.5,3.6,1.5c1,1,1.5,2.2,1.5,3.6c0,1.4-0.5,2.6-1.5,3.6c-1,1-2.2,1.5-3.6,1.5h-5.1V55h5.1c1.4,0,2.6,0.5,3.6,1.5c1,1,1.5,2.2,1.5,3.6c0,1.4-0.5,2.6-1.5,3.6c-1,1-2.2,1.5-3.6,1.5h-5.1v30.8h5.1c1.4,0,2.6,0.5,3.6,1.5c1,1,1.5,2.2,1.5,3.6c0,1.4-0.5,2.6-1.5,3.6c-1,1-2.2,1.5-3.6,1.5h-5.1v30.8h5.1c1.4,0,2.6,0.5,3.6,1.5c1,1,1.5,2.2,1.5,3.6c0,1.4-0.5,2.6-1.5,3.6c-1,1-2.2,1.5-3.6,1.5L15.1,147.4L15.1,147.4z M204.9,75.6c-8.5,0-15.7-3-21.8-9c-6-6-9-13.3-9-21.8c8.5,0,15.7,3,21.8,9C201.9,59.8,204.9,67.1,204.9,75.6z M215.2,75.6c0-8.5,3-15.7,9-21.8c6-6,13.3-9,21.8-9c0,8.5-3,15.7-9,21.8S223.7,75.6,215.2,75.6z M204.9,106.3c-8.5,0-15.7-3-21.8-9c-6-6-9-13.3-9-21.8c8.5,0,15.7,3,21.8,9C201.9,90.6,204.9,97.9,204.9,106.3z M215.2,106.3c0-8.5,3-15.7,9-21.8c6-6,13.3-9,21.8-9c0,8.5-3,15.7-9,21.8S223.7,106.3,215.2,106.3z M204.9,137.1c-8.5,0-15.7-3-21.8-9c-6-6-9-13.3-9-21.8c8.5,0,15.7,3,21.8,9C201.9,121.4,204.9,128.6,204.9,137.1z M215.2,137.1c0-8.5,3-15.7,9-21.8c6-6,13.3-9,21.8-9c0,8.5-3,15.7-9,21.8C230.9,134.1,223.7,137.1,215.2,137.1z M210.1,177.7c-1.4,0-2.6-0.5-3.6-1.5c-1-1-1.5-2.2-1.5-3.6v-35.1c2.7,0.3,4.2,0.4,4.4,0.4c1.1,0,3-0.2,5.9-0.6v35.3c0,1.4-0.5,2.6-1.5,3.6C212.7,177.2,211.5,177.7,210.1,177.7z M107.5,198.7c-1.1,0-2-0.3-2.6-0.9c-0.6-0.6-1-1.4-1-2.3c0-0.5,0.1-1.1,0.3-1.6l11.7-31.4c0.5-1.3,1.5-2.4,2.8-3.4c1.3-0.9,2.7-1.4,4.2-1.4h41c1.4,0,2.8,0.5,4.2,1.4c1.3,1,2.3,2.1,2.8,3.4l11.7,31.4c0.2,0.5,0.3,1.1,0.3,1.6c0,0.9-0.3,1.6-1,2.3c-0.6,0.6-1.5,0.9-2.6,0.9H107.5z M66.4,250c-1.1,0-2-0.3-2.6-0.9c-0.6-0.6-1-1.4-1-2.3c0-0.5,0.1-1.1,0.3-1.6l11.7-31.4c0.5-1.3,1.5-2.4,2.8-3.4c1.3-0.9,2.7-1.4,4.2-1.4h41c1.4,0,2.8,0.5,4.2,1.4c1.3,0.9,2.3,2.1,2.8,3.4l11.7,31.4c0.2,0.5,0.3,1.1,0.3,1.6c0,0.9-0.3,1.6-1,2.3c-0.6,0.6-1.5,0.9-2.6,0.9H66.4z M158.8,250c-1.1,0-2-0.3-2.6-0.9c-0.6-0.6-1-1.4-1-2.3c0-0.5,0.1-1.1,0.3-1.6l11.7-31.4c0.5-1.3,1.5-2.4,2.8-3.4c1.3-0.9,2.7-1.4,4.2-1.4h41c0.9,0,1.9,0.2,2.8,0.7c0.9,0.4,1.8,1,2.5,1.7c0.7,0.7,1.3,1.5,1.6,2.4l11.7,31.4c0.2,0.5,0.3,1.1,0.3,1.6c0,0.9-0.3,1.6-1,2.3c-0.6,0.6-1.5,0.9-2.6,0.9H158.8L158.8,250z\"></path></g></g></g></svg>","indices":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 232.335 232.334\"><g><g><path d=\"M116.167,0C52.006,0,0,52.011,0,116.167c0,64.157,52.011,116.168,116.167,116.168   c64.155,0,116.167-52.011,116.167-116.168C232.334,52.011,180.322,0,116.167,0z M116.167,222.344   c-58.555,0-106.185-47.628-106.185-106.178c0-58.554,47.63-106.184,106.185-106.184c58.549,0,106.177,47.63,106.177,106.184   C222.344,174.716,174.716,222.344,116.167,222.344L116.167,222.344z\"></path><path d=\"M116.167,15.363c-55.587,0-100.81,45.223-100.81,100.809c0,55.589,45.223,100.807,100.81,100.807   c55.583,0,100.801-45.218,100.801-100.807C216.968,60.586,171.75,15.363,116.167,15.363z M83.406,140.983   c-3.61,4.426-9.006,6.636-16.197,6.636c-5.791,0-10.541-1.554-14.261-4.662c-2.485-2.072-4.23-4.724-5.242-7.952   c-0.887-2.835,1.441-5.276,4.408-5.276h1.178c2.966,0,5.577,1.514,6.305,3.22c0.472,1.111,1.07,2.047,1.794,2.808   c1.339,1.412,3.294,2.126,5.864,2.126c2.963,0,5.221-1.046,6.769-3.129c1.549-2.09,2.328-4.713,2.328-7.879   c0-3.103-0.727-5.727-2.179-7.874c-1.457-2.14-3.714-3.213-6.787-3.213c-1.459,0-2.711,0.182-3.77,0.546   c-0.947,0.341-1.769,0.824-2.478,1.451c-1.194,1.063-4.155,2.177-7.118,2.034c-2.96-0.141-5.058-2.641-4.688-5.586l2.919-22.976   c0.378-2.945,3.086-5.331,6.052-5.331h22.75c2.967,0,5.375,2.272,5.375,5.079c0,2.806-2.409,5.081-5.375,5.081H66.94   c-2.968,0-5.764,2.376-6.247,5.305l-0.44,2.703c-0.478,2.93,0.047,4.688,1.231,4.011c0.876-0.507,1.617-0.873,2.22-1.098   c1.735-0.646,3.842-0.968,6.331-0.968c5.032,0,9.417,1.696,13.17,5.081c3.745,3.386,5.617,8.314,5.617,14.782   C88.817,131.541,87.012,136.558,83.406,140.983z M132.306,139.388c-3.129,5.433-8.567,8.152-16.314,8.152   c-7.759,0-13.197-2.72-16.315-8.152c-3.123-5.433-4.683-13.172-4.683-23.222c0-10.052,1.56-17.803,4.683-23.265   c3.124-5.462,8.557-8.187,16.315-8.187c7.747,0,13.186,2.729,16.314,8.187c3.119,5.462,4.683,13.212,4.683,23.265   C136.988,126.216,135.425,133.96,132.306,139.388z M180.134,139.388c-3.124,5.433-8.562,8.152-16.31,8.152   c-7.759,0-13.197-2.72-16.316-8.152c-3.129-5.433-4.682-13.172-4.682-23.222c0-10.052,1.553-17.803,4.682-23.265   c3.119-5.462,8.558-8.187,16.316-8.187c7.747,0,13.186,2.729,16.31,8.187c3.123,5.462,4.682,13.212,4.682,23.265   C184.815,126.216,183.257,133.96,180.134,139.388z\"></path><path d=\"M163.824,94.584c-3.56,0-5.912,1.764-7.056,5.292c-1.155,3.524-1.722,8.96-1.722,16.291   c0,6.996,0.566,12.351,1.722,16.062c1.144,3.711,3.496,5.563,7.056,5.563c3.548,0,5.88-1.853,6.991-5.563   c1.104-3.711,1.659-9.065,1.659-16.062c0-7.331-0.556-12.766-1.659-16.294C169.704,96.348,167.372,94.584,163.824,94.584z\"></path><path d=\"M115.991,94.584c-3.56,0-5.909,1.764-7.053,5.292c-1.153,3.524-1.722,8.96-1.722,16.291   c0,6.996,0.569,12.351,1.722,16.062c1.144,3.711,3.499,5.563,7.053,5.563c3.548,0,5.885-1.853,6.992-5.563   c1.108-3.711,1.659-9.065,1.659-16.062c0-7.331-0.551-12.766-1.659-16.294C121.871,96.348,119.539,94.584,115.991,94.584z\"></path></g></g></svg>","menu":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 5h16M4 12h16M4 19h16\"/></svg>","mutual-funds":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 544 512\"><path d=\"M527.79 288H290.5l158.03 158.03c6.04 6.04 15.98 6.53 22.19.68 38.7-36.46 65.32-85.61 73.13-140.86 1.34-9.46-6.51-17.85-16.06-17.85zm-15.83-64.8C503.72 103.74 408.26 8.28 288.8.04 279.68-.59 272 7.1 272 16.24V240h223.77c9.14 0 16.82-7.68 16.19-16.8zM224 288V50.71c0-9.55-8.39-17.4-17.84-16.06C86.99 51.49-4.1 155.6.14 280.37 4.5 408.51 114.83 513.59 243.03 511.98c50.4-.63 96.97-16.87 135.26-44.03 7.9-5.6 8.42-17.23 1.57-24.08L224 288z\"></path></svg>","newspaper":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 576 512\"><path d=\"M552 64H88c-13.255 0-24 10.745-24 24v8H24c-13.255 0-24 10.745-24 24v272c0 30.928 25.072 56 56 56h472c26.51 0 48-21.49 48-48V88c0-13.255-10.745-24-24-24zM56 400a8 8 0 0 1-8-8V144h16v248a8 8 0 0 1-8 8zm236-16H140c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h152c6.627 0 12 5.373 12 12v8c0 6.627-5.373 12-12 12zm208 0H348c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h152c6.627 0 12 5.373 12 12v8c0 6.627-5.373 12-12 12zm-208-96H140c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h152c6.627 0 12 5.373 12 12v8c0 6.627-5.373 12-12 12zm208 0H348c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h152c6.627 0 12 5.373 12 12v8c0 6.627-5.373 12-12 12zm0-96H140c-6.627 0-12-5.373-12-12v-40c0-6.627 5.373-12 12-12h360c6.627 0 12 5.373 12 12v40c0 6.627-5.373 12-12 12z\"/></svg>","options":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 246.06 262.73\"><g transform=\"translate(-76.97 -33.61)\"><path d=\"m202.41 33.608q46.136 0 83.378 35.76 37.242 35.575 37.242 94.31 0 58.365-36.686 95.607-36.686 37.057-86.899 37.057-55.771 0-89.122-39.095-33.351-39.095-33.351-93.198 0-58.55 37.427-94.495 37.613-35.945 88.011-35.945zm-3.5208 13.526q-35.945 0-57.809 29.831-21.678 29.646-21.678 86.343 0 52.992 20.381 86.528 20.381 33.351 59.291 33.351 37.798 0 59.662-29.275 21.864-29.46 21.864-85.416 0-56.697-20.567-88.937-20.381-32.425-61.144-32.425zm-43.542 73.002h7.0409q0 15.935 6.485 22.79 6.4849 6.8556 23.902 6.8556h15.008q16.49 0 23.16-6.6702 6.6704-6.8556 6.6704-22.975h7.0408v89.493h-7.0408q0-15.749-6.4851-22.605-6.4846-6.8554-23.716-6.8554h-15.379q-16.49 0-23.161 6.8554-6.485 6.8556-6.485 22.605h-7.0408z\"></path></g></svg>","roadmap":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 576 512\"><path d=\"M0 117.66v346.32c0 11.32 11.43 19.06 21.94 14.86L160 416V32L20.12 87.95A32.006 32.006 0 0 0 0 117.66zM192 416l192 64V96L192 32v384zM554.06 33.16L416 96v384l139.88-55.95A31.996 31.996 0 0 0 576 394.34V48.02c0-11.32-11.43-19.06-21.94-14.86z\"></path></svg>","sdk":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 640 512\"><path d=\"M255.03 261.65c6.25 6.25 16.38 6.25 22.63 0l11.31-11.31c6.25-6.25 6.25-16.38 0-22.63L253.25 192l35.71-35.72c6.25-6.25 6.25-16.38 0-22.63l-11.31-11.31c-6.25-6.25-16.38-6.25-22.63 0l-58.34 58.34c-6.25 6.25-6.25 16.38 0 22.63l58.35 58.34zm96.01-11.3l11.31 11.31c6.25 6.25 16.38 6.25 22.63 0l58.34-58.34c6.25-6.25 6.25-16.38 0-22.63l-58.34-58.34c-6.25-6.25-16.38-6.25-22.63 0l-11.31 11.31c-6.25 6.25-6.25 16.38 0 22.63L386.75 192l-35.71 35.72c-6.25 6.25-6.25 16.38 0 22.63zM624 416H381.54c-.74 19.81-14.71 32-32.74 32H288c-18.69 0-33.02-17.47-32.77-32H16c-8.8 0-16 7.2-16 16v16c0 35.2 28.8 64 64 64h512c35.2 0 64-28.8 64-64v-16c0-8.8-7.2-16-16-16zM576 48c0-26.4-21.6-48-48-48H112C85.6 0 64 21.6 64 48v336h512V48zm-64 272H128V64h384v256z\"></path></svg>","settings":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 45.97 45.97\"><g><g><path d=\"M43.454,18.443h-2.437c-0.453-1.766-1.16-3.42-2.082-4.933l1.752-1.756c0.473-0.473,0.733-1.104,0.733-1.774    c0-0.669-0.262-1.301-0.733-1.773l-2.92-2.917c-0.947-0.948-2.602-0.947-3.545-0.001l-1.826,1.815    C30.9,6.232,29.296,5.56,27.529,5.128V2.52c0-1.383-1.105-2.52-2.488-2.52h-4.128c-1.383,0-2.471,1.137-2.471,2.52v2.607    c-1.766,0.431-3.38,1.104-4.878,1.977l-1.825-1.815c-0.946-0.948-2.602-0.947-3.551-0.001L5.27,8.205    C4.802,8.672,4.535,9.318,4.535,9.978c0,0.669,0.259,1.299,0.733,1.772l1.752,1.76c-0.921,1.513-1.629,3.167-2.081,4.933H2.501    C1.117,18.443,0,19.555,0,20.935v4.125c0,1.384,1.117,2.471,2.501,2.471h2.438c0.452,1.766,1.159,3.43,2.079,4.943l-1.752,1.763    c-0.474,0.473-0.734,1.106-0.734,1.776s0.261,1.303,0.734,1.776l2.92,2.919c0.474,0.473,1.103,0.733,1.772,0.733    s1.299-0.261,1.773-0.733l1.833-1.816c1.498,0.873,3.112,1.545,4.878,1.978v2.604c0,1.383,1.088,2.498,2.471,2.498h4.128    c1.383,0,2.488-1.115,2.488-2.498v-2.605c1.767-0.432,3.371-1.104,4.869-1.977l1.817,1.812c0.474,0.475,1.104,0.735,1.775,0.735    c0.67,0,1.301-0.261,1.774-0.733l2.92-2.917c0.473-0.472,0.732-1.103,0.734-1.772c0-0.67-0.262-1.299-0.734-1.773l-1.75-1.77    c0.92-1.514,1.627-3.179,2.08-4.943h2.438c1.383,0,2.52-1.087,2.52-2.471v-4.125C45.973,19.555,44.837,18.443,43.454,18.443z     M22.976,30.85c-4.378,0-7.928-3.517-7.928-7.852c0-4.338,3.55-7.85,7.928-7.85c4.379,0,7.931,3.512,7.931,7.85    C30.906,27.334,27.355,30.85,22.976,30.85z\"></path></g></g></svg>","sheet":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 147.12 204.38\"><g transform=\"translate(-28.63 0)\"><path d=\"M171.247,204.376c2.485,0,4.5-2.015,4.5-4.5V61.35h-51.744c-7.502,0-13.605-6.107-13.605-13.614V0H33.13  c-2.485,0-4.5,2.015-4.5,4.5v195.376c0,2.485,2.015,4.5,4.5,4.5H171.247z M52.891,87.627h99.717v80H52.891V87.627z M106.749,143.96  h37.858v15.667h-37.858V143.96z M60.891,119.294h37.858v16.666H60.891V119.294z M60.891,143.96h37.858v15.667H60.891V143.96z   M106.749,95.627h37.858v15.667h-37.858V95.627z M106.749,119.294h37.858v16.666h-37.858V119.294z M60.891,95.627h37.858v15.667  H60.891V95.627z M120.397,47.736v-37.34L164.2,51.35h-40.197C122.014,51.35,120.397,49.729,120.397,47.736z\"></path></g></svg>","star":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 576 512\"><path d=\"M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z\"/></svg>","status":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M320.2 243.8l-49.7 99.4c-6 12.1-23.4 11.7-28.9-.6l-56.9-126.3-30 71.7H60.6l182.5 186.5c7.1 7.3 18.6 7.3 25.7 0L451.4 288H342.3l-22.1-44.2zM473.7 73.9l-2.4-2.5c-51.5-52.6-135.8-52.6-187.4 0L256 100l-27.9-28.5c-51.5-52.7-135.9-52.7-187.4 0l-2.4 2.4C-10.4 123.7-12.5 203 31 256h102.4l35.9-86.2c5.4-12.9 23.6-13.2 29.4-.4l58.2 129.3 49-97.9c5.9-11.8 22.7-11.8 28.6 0l27.6 55.2H481c43.5-53 41.4-132.3-7.3-182.1z\"></path></svg>","stocks":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><g><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M8 5h3v9H8v3H6v-3H3V5h3V2h2v3zm10 5h3v9h-3v3h-2v-3h-3v-9h3V7h2v3z\"></path></g></svg>","swagger":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"m127.7110825 34.4531364c-170.2814789 98.1692047-170.2814026 344.9245911 0 443.0937195s384.2889175-25.208477 384.2889175-221.5468254-214.0075073-319.7160339-384.2889175-221.5468941zm48.6630477 374.1001168c-122.139801 0-19.929306-137.3335266-104.7761612-134.9657288v-36.7011261c80.0386734 9.9306183-15.3906517-146.2125549 104.1839828-132.5976257v28.4137802c-66.6934204 1.5785828-.3946075 86.8199158-60.3792725 122.5344086 60.3792725 39.6608887-3.1571045 130.0325317 60.9714508 120.1665955v33.1496963zm-4.2858123-133.4223328c-13.7811279-7.9449768-13.7811279-27.9151764 0-35.8600769 13.7810516-7.9449921 31.1009064 2.0401154 31.1009064 17.9299927s-17.3198548 25.875-31.1009064 17.9300842zm73.5291443 0c-13.7810669-7.9449768-13.7810669-27.9151764 0-35.8600769 13.7810669-7.9449921 31.1008911 2.0401154 31.1008911 17.9299927s-17.3198242 25.875-31.1008911 17.9300842zm73.5291442 0c-13.7810669-7.9449768-13.7810669-27.9151764 0-35.8600769 13.7810669-7.9449921 31.1009827 2.0401154 31.1009827 17.9299927s-17.3199158 25.875-31.1009827 17.9300842zm16.4793091 133.4223328v-33.1496887c64.1285706 9.8659363.5921631-80.5057068 60.9714355-120.1665955-59.9846497-35.7144928 6.3141479-120.9558258-60.3792725-122.5344086v-28.4137802c119.574646-13.6149292 24.1453247 142.5282288 104.1839905 132.5976257v36.7011261c-84.8468627-2.3678054 17.3636476 134.9657212-104.7761535 134.9657212z\"></path></svg>","triangle":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 512\"><path d=\"M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z\"></path></svg>","x":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M18 6L6 18M6 6l12 12\"/></svg>"};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * One row in a menu.
 *
 * @typedef {Object} NavLink
 * @property {string} label
 * @property {string} href
 * @property {string} [icon] - A built-in icon name (see `headerIconNames`) or a raw `<svg …>` string. Raw SVG is trusted markup.
 * @property {boolean} [external] - Opens in a new tab with `rel="noopener noreferrer"`.
 * @property {boolean} [disabled] - An announcement, not a link. Shown in the mega menu, dropped from the drawer.
 * @property {string} [disabledLabel] - Suffix after a disabled label, e.g. "(coming soon)".
 * @property {string} [description] - Second line under the label. Only the `cards` layout draws it.
 */

/**
 * A titled group of rows inside a dropdown.
 *
 * @typedef {Object} NavSection
 * @property {string} [title]
 * @property {string} [titleHref] - Makes the title a link.
 * @property {string} [titleIcon] - Drawer only: a linked title is a row like the ones under it and needs their icon to line up.
 * @property {NavLink[]} links
 */

/**
 * A top-level item that opens a mega menu on desktop and an accordion in the drawer.
 *
 * @typedef {Object} NavDropdown
 * @property {'dropdown'} type
 * @property {string} id - Stable slug; element ids derive from it (`mega-menu-${id}`).
 * @property {string} label
 * @property {NavSection[]} columns
 * @property {NavSection} [aside] - The darker right-hand column.
 * @property {'list'|'cards'} [layout] - `cards` is the two-column Products grid with descriptions. Default `list`.
 */

/**
 * A top-level item that is a plain link.
 *
 * @typedef {Object} NavDirectLink
 * @property {'link'} type
 * @property {string} label
 * @property {string} href
 */

/** @typedef {NavDropdown | NavDirectLink} NavItem */

/**
 * One entry of the shared data catalogue.
 *
 * @typedef {Object} DataCatalogEntry
 * @property {string} key - Stable identifier, e.g. `mutual-funds`.
 * @property {string} title - Display name, e.g. "Mutual Funds".
 * @property {string} icon - Built-in icon name.
 * @property {string} [href] - Canonical page. Absent while `comingSoon`.
 * @property {boolean} comingSoon
 */

/**
 * An image source for the logo.
 *
 * @typedef {string | { src: string, srcset?: string, sizes?: string }} LogoSource
 */

/**
 * @typedef {Object} HeaderLogo
 * @property {LogoSource} light
 * @property {LogoSource} dark
 * @property {string} [alt] - Default "MarketData".
 * @property {number} [width] - Intrinsic width attribute. Default 160.
 * @property {number} [height] - Intrinsic height attribute. Default 32.
 */

/**
 * @typedef {Object} HeaderSlots
 * @property {string} [logo] - Replaces both logo markups. Trusted HTML.
 * @property {string} [auth] - Replaces the account-control container. Keep `id="user-profile"` on its outer element so the overflow pass and `initHeader` can find it. Trusted HTML.
 * @property {string} [drawerStart] - HTML placed at the top of the drawer body, above the navigation. Trusted HTML.
 * @property {string} [drawerEnd] - HTML placed at the bottom of the drawer body. Trusted HTML.
 */

/**
 * @typedef {Object} RenderHeaderOptions
 * @property {HeaderLogo} [logo] - Required unless `slots.logo` is given.
 * @property {string} [currentPath] - The page's pathname. Marks the matching drawer row with `aria-current="page"`.
 * @property {NavItem[]} [navigation] - Default `defaultNavigation`.
 * @property {string} [homeHref] - Default "/".
 * @property {string} [skipLinkHref] - Default "#main-content".
 * @property {string} [loginUrl] - Drawer fallback link. Default dashboard login.
 * @property {string} [loginText] - Default "Log In".
 * @property {string} [signupUrl] - Drawer fallback link. Default "/signup/".
 * @property {string} [signupText] - Default "Try For Free".
 * @property {boolean} [fixed] - `true` (default): a fixed 60px bar plus a 60px spacer. `false`: an in-flow bar and no spacer.
 * @property {HeaderSlots} [slots]
 */

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------

/**
 * The data types marketdata.app offers, in display order.
 *
 * This is the one list behind the Data menu. The website derives the cards on
 * its home, /api and /data pages from the same shape, so it should build them
 * from this catalogue and keep only its own copy (descriptions) beside it —
 * see README "Site Header › Data catalogue".
 *
 * @type {ReadonlyArray<DataCatalogEntry>}
 */
export const dataCatalog = Object.freeze([
  { key: 'stocks', title: 'Stocks', icon: 'stocks', href: '/data/stocks/', comingSoon: false },
  { key: 'options', title: 'Options', icon: 'options', href: '/data/options/', comingSoon: false },
  { key: 'etfs', title: 'ETFs', icon: 'etfs', href: '/data/stocks/', comingSoon: false },
  {
    key: 'mutual-funds',
    title: 'Mutual Funds',
    icon: 'mutual-funds',
    href: '/data/funds/',
    comingSoon: false,
  },
  {
    key: 'closed-end-funds',
    title: 'Closed-End Funds',
    icon: 'closed-end-funds',
    href: '/data/stocks/',
    comingSoon: false,
  },
  { key: 'indices', title: 'Indices', icon: 'indices', comingSoon: true },
  { key: 'futures', title: 'Futures', icon: 'futures', comingSoon: true },
  { key: 'currencies', title: 'Currencies', icon: 'currencies', comingSoon: true },
  { key: 'crypto', title: 'Crypto', icon: 'crypto', comingSoon: true },
  { key: 'bonds', title: 'Bonds', icon: 'bonds', comingSoon: true },
  {
    key: 'economic-indicators',
    title: 'Economic Indicators',
    icon: 'economic-indicators',
    comingSoon: true,
  },
]);

/** @type {NavLink[]} */
const liveDataLinks = dataCatalog
  .filter((d) => !d.comingSoon)
  .map((d) => ({ label: d.title, href: d.href ?? '#', icon: d.icon }));

/** @type {NavLink[]} */
const comingSoonDataLinks = dataCatalog
  .filter((d) => d.comingSoon)
  .map((d) => ({ label: d.title, href: '#', icon: d.icon, disabled: true }));

/**
 * The navigation every property shows: the website's live nav as of the
 * extraction. It links marketdata.app pages only. Nothing here points at an
 * application that is not meant to be discovered.
 *
 * @type {ReadonlyArray<NavItem>}
 */
export const defaultNavigation = Object.freeze([
  {
    type: 'dropdown',
    label: 'Data',
    id: 'data',
    columns: [
      {
        title: 'Explore Our Data',
        titleHref: '/data/',
        titleIcon: 'database',
        links: liveDataLinks,
      },
    ],
    aside: { title: 'Coming Soon', links: comingSoonDataLinks },
  },
  {
    type: 'dropdown',
    label: 'Products',
    id: 'products',
    layout: 'cards',
    columns: [
      {
        links: [
          {
            label: 'Market Data API',
            href: '/api/',
            icon: 'code',
            description: 'Unparalleled Ease-of-Use. Get Data Anywhere You Need It.',
          },
          {
            label: 'Custom API Development',
            href: '/custom-development/',
            icon: 'settings',
            description: 'Affordable, Scalable, and Tailored to Your Needs.',
          },
          {
            label: 'Google Sheets Add-on',
            href: '/sheets/',
            icon: 'sheet',
            description: 'Easily Download Data Into Your Spreadsheets Using Simple Formulas.',
          },
          {
            label: 'Excel Add-in',
            href: '#',
            icon: 'excel',
            disabled: true,
            disabledLabel: '(coming soon)',
            description: 'Support for Microsoft Excel is Planned For Late 2026.',
          },
        ],
      },
    ],
    aside: {
      title: 'Updates',
      links: [
        { label: 'Changelog', href: '/changelog/', icon: 'changelog' },
        {
          label: 'Product Roadmap',
          href: 'https://roadmap.marketdata.app/',
          icon: 'roadmap',
          external: true,
        },
        {
          label: 'Feature Requests',
          href: 'https://roadmap.marketdata.app/features',
          icon: 'feature-requests',
          external: true,
        },
      ],
    },
  },
  {
    type: 'dropdown',
    label: 'Learn',
    id: 'learn',
    columns: [
      {
        title: 'Documentation',
        links: [
          { label: 'Tutorials', href: '/tutorials/', icon: 'book-open' },
          { label: 'Market Data API', href: '/docs/api', icon: 'code' },
          { label: 'SDKs', href: '/docs/sdk', icon: 'sdk' },
          { label: 'Google Sheets', href: '/docs/sheets', icon: 'sheet' },
          { label: 'Account & Billing', href: '/docs/account', icon: 'dollar' },
        ],
      },
    ],
    aside: {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/tutorials/', icon: 'blog' },
        { label: 'Swagger', href: 'https://api.marketdata.app/', icon: 'swagger', external: true },
        { label: 'Service Status', href: '/status/', icon: 'status' },
      ],
    },
  },
  { type: 'link', label: 'Pricing', href: '/pricing/' },
  {
    type: 'dropdown',
    label: 'Company',
    id: 'company',
    columns: [
      {
        links: [
          { label: 'About Market Data', href: '/about/', icon: 'braces' },
          { label: 'Custom API Development', href: '/custom-development/', icon: 'settings' },
          {
            label: 'Customer Reviews',
            href: 'https://www.trustpilot.com/review/www.marketdata.app',
            icon: 'star',
            external: true,
          },
          { label: 'News', href: '/news/', icon: 'newspaper' },
        ],
      },
    ],
  },
]);

/** Names accepted by `NavLink.icon`, `NavSection.titleIcon` and `DataCatalogEntry.icon`. */
export const headerIconNames = Object.freeze(Object.keys(icons));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape a string for text content or a double-quoted attribute value. */
function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Serialise attributes. `null`, `undefined` and `false` drop the attribute;
 * `true` emits it bare. Every value is escaped.
 */
function attrs(map) {
  let out = '';
  for (const [name, value] of Object.entries(map)) {
    if (value === null || value === undefined || value === false) continue;
    out += value === true ? ` ${name}` : ` ${name}="${esc(value)}"`;
  }
  return out;
}

/**
 * An inline SVG for `name`, sized by `className`.
 *
 * A name is looked up in the bundled set. A string that starts with `<svg` is
 * a consumer's own icon and is emitted verbatim, with the class, `aria-hidden`
 * and `fill` added to its root so it behaves like the bundled ones. Unknown
 * names throw: an icon that silently renders as nothing is a defect found in
 * production, and this runs at build time where a throw is cheap.
 */
function icon(name, className) {
  const svg = /^\s*<svg\b/i.test(name) ? name.trim() : icons[name];
  if (!svg) {
    throw new Error(
      `@marketdataapp/ui/header: unknown icon "${name}". Use one of ${headerIconNames.join(', ')} or pass an inline <svg> string.`,
    );
  }
  return svg.replace(
    /^<svg\b/i,
    `<svg class="${esc(className)}" aria-hidden="true" focusable="false" fill="currentColor"`,
  );
}

/** `target`/`rel` for a link that opens off-site. */
function externalAttrs(link) {
  return link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}

/** A trailing-slash-insensitive pathname, so `/pricing` and `/pricing/` are one page. */
function normalizePath(path) {
  return path.replace(/\/+$/, '') || '/';
}

/**
 * Whether `href` is the page being rendered.
 *
 * Placeholders and off-site links are never current. Compared without trailing
 * slashes: Astro's `trailingSlash: "always"` renders `/pricing/` while an entry
 * may be written either way.
 */
function makeIsCurrent(currentPath) {
  if (!currentPath) return () => false;
  const here = normalizePath(currentPath);
  return (href) => {
    if (!href || href === '#' || /^[a-z]+:/i.test(href)) return false;
    return normalizePath(href) === here;
  };
}

/**
 * The sections of a dropdown with every disabled row removed, and every
 * section that emptied out removed with it.
 *
 * The drawer lists only what a visitor can tap. A "coming soon" row is an
 * announcement, and an announcement you cannot follow is pure height on a
 * phone. The mega menu keeps them: there is room across its columns.
 *
 * @param {NavDropdown} item
 * @returns {NavSection[]}
 */
export function tappableSections(item) {
  return [...item.columns, ...(item.aside ? [item.aside] : [])]
    .map((section) => ({ ...section, links: section.links.filter((link) => !link.disabled) }))
    .filter((section) => section.links.length > 0);
}

// ---------------------------------------------------------------------------
// Fragments
// ---------------------------------------------------------------------------

/** One `<img>` for the logo. */
function logoImage(source, variant, { alt, width, height }) {
  const src = typeof source === 'string' ? { src: source } : source;
  if (!src || !src.src) {
    throw new Error(
      `@marketdataapp/ui/header: logo.${variant} needs a URL string or { src, srcset?, sizes? }.`,
    );
  }
  return `<img${attrs({
    class: `site-header-logo-${variant}`,
    src: src.src,
    srcset: src.srcset,
    sizes: src.sizes,
    width,
    height,
    alt,
    loading: 'eager',
    decoding: 'async',
  })}>`;
}

/**
 * The light/dark logo pair. Both ship in the HTML; CSS shows the one that
 * matches the theme, so a theme switch costs no request and no layout.
 */
function logoMarkup(logo, slots) {
  if (slots.logo) return slots.logo;
  if (!logo || !logo.light || !logo.dark) {
    throw new Error(
      '@marketdataapp/ui/header: renderHeader needs `logo: { light, dark }` (URLs or { src, srcset, sizes }) or `slots.logo`. ' +
        'The originals ship as @marketdataapp/ui/assets/brand/logo-on-light.png and logo-on-dark.png; ' +
        '320px webp derivatives sit beside them.',
    );
  }
  const meta = {
    alt: logo.alt ?? 'MarketData',
    width: logo.width ?? 160,
    height: logo.height ?? 32,
  };
  return `<span class="site-header-logo">${logoImage(logo.light, 'light', meta)}${logoImage(logo.dark, 'dark', meta)}</span>`;
}

/** Title of a mega-menu column or aside: a link when it has somewhere to go. */
function panelTitle(section) {
  if (!section.title) return '';
  return section.titleHref
    ? `<a${attrs({ href: section.titleHref, class: 'site-header-panel-title' })}>${esc(section.title)}</a>`
    : `<span class="site-header-panel-title">${esc(section.title)}</span>`;
}

/** One row of a mega-menu column. */
function panelRow(link, cards) {
  const iconHtml = link.icon ? icon(link.icon, 'site-header-panel-icon') : '';
  const description = link.description
    ? `<span class="site-header-panel-description">${esc(link.description)}</span>`
    : '';
  const linkClass = [
    'site-header-panel-link',
    link.description && 'site-header-panel-link--described',
  ]
    .filter(Boolean)
    .join(' ');

  if (link.disabled) {
    const soon = link.disabledLabel
      ? `<span class="site-header-panel-soon">${esc(link.disabledLabel)}</span>`
      : '';
    return (
      `<li class="site-header-panel-item${cards ? ' site-header-panel-item--card' : ''} site-header-panel-item--disabled">` +
      `<span class="${linkClass} site-header-panel-link--disabled">` +
      `<span class="site-header-panel-label">${iconHtml}${esc(link.label)}${soon}</span>${description}</span></li>`
    );
  }

  return (
    `<li class="site-header-panel-item${cards ? ' site-header-panel-item--card' : ''}">` +
    `<a${attrs({ href: link.href, class: linkClass, ...externalAttrs(link) })}>` +
    `<span class="site-header-panel-label">${iconHtml}${esc(link.label)}</span>${description}</a></li>`
  );
}

/** One row of the darker aside column. */
function asideRow(link) {
  const iconHtml = link.icon ? icon(link.icon, 'site-header-panel-icon') : '';
  if (link.disabled) {
    return `<li><span class="site-header-panel-aside-link site-header-panel-aside-link--disabled">${iconHtml}${esc(link.label)}</span></li>`;
  }
  return `<li><a${attrs({ href: link.href, class: 'site-header-panel-aside-link', ...externalAttrs(link) })}>${iconHtml}${esc(link.label)}</a></li>`;
}

/** The desktop mega menu for a dropdown item. */
function megaMenu(item) {
  const cards = item.layout === 'cards';
  const panelId = `mega-menu-${item.id}`;
  const buttonId = `${panelId}-button`;

  const columns = item.columns
    .map(
      (section) =>
        `<div class="site-header-panel-column${cards ? ' site-header-panel-column--cards' : ''}">` +
        panelTitle(section) +
        `<ul class="${cards ? 'site-header-panel-grid' : 'site-header-panel-list'}" aria-labelledby="${buttonId}">` +
        section.links.map((link) => panelRow(link, cards)).join('') +
        `</ul></div>`,
    )
    .join('');

  const aside = item.aside
    ? `<div class="site-header-panel-aside">${panelTitle(item.aside)}<ul class="site-header-panel-aside-list">${item.aside.links.map(asideRow).join('')}</ul></div>`
    : '';

  return (
    `<li class="site-header-item site-header-menu">` +
    `<button${attrs({
      id: buttonId,
      type: 'button',
      class: 'site-header-menu-button',
      'aria-expanded': 'false',
      'aria-controls': panelId,
      'data-site-header-menu': panelId,
    })}>${esc(item.label)}${icon('triangle', 'site-header-caret')}</button>` +
    `<div id="${panelId}" class="site-header-panel${cards ? ' site-header-panel--cards' : ''}" hidden>` +
    `<div class="site-header-panel-inner">${columns}${aside}</div></div></li>`
  );
}

/** The desktop row of top-level items. */
function desktopLinks(navigation) {
  return navigation
    .map((item) =>
      item.type === 'link'
        ? `<li class="site-header-item"><a${attrs({ href: item.href, class: 'site-header-link' })}>${esc(item.label)}</a></li>`
        : megaMenu(item),
    )
    .join('');
}

/** A drawer row: a link with the current-page marker when it is the page. */
function drawerRow(className, link, isCurrent, iconName) {
  const current = isCurrent(link.href);
  const iconHtml = iconName ? icon(iconName, 'site-header-drawer-icon') : '';
  return `<a${attrs({
    href: link.href,
    class: className,
    'aria-current': current ? 'page' : null,
    ...externalAttrs(link),
  })}>${iconHtml}${esc(link.label)}</a>`;
}

/** The accordion a dropdown becomes inside the drawer. */
function accordion(item, isCurrent) {
  const panelId = `mega-menu-${item.id}-mobile`;
  const buttonId = `${panelId}-button`;

  const sections = tappableSections(item)
    .map((section) => {
      let heading = '';
      if (section.title) {
        heading = section.titleHref
          ? drawerRow(
              'site-header-drawer-section-link',
              { label: section.title, href: section.titleHref },
              isCurrent,
              section.titleIcon,
            )
          : `<span class="site-header-drawer-section-title">${esc(section.title)}</span>`;
      }
      const rows = section.links
        .map(
          (link) =>
            `<li>${drawerRow('site-header-drawer-sublink', link, isCurrent, link.icon)}</li>`,
        )
        .join('');
      return `<div class="site-header-drawer-section">${heading}<ul class="site-header-drawer-sublist">${rows}</ul></div>`;
    })
    .join('');

  return (
    `<li>` +
    `<button${attrs({
      id: buttonId,
      type: 'button',
      class: 'site-header-accordion-button',
      'aria-expanded': 'false',
      'aria-controls': panelId,
      'data-site-header-accordion': panelId,
    })}>${esc(item.label)}<span class="site-header-chevron-chip">${icon('chevron-right', 'site-header-chevron')}</span></button>` +
    `<div id="${panelId}" class="site-header-accordion" hidden>` +
    `<div class="site-header-accordion-inner"><div class="site-header-accordion-sections">${sections}</div></div></div></li>`
  );
}

/** The drawer's list of top-level items, plus the account fallback links. */
function drawerList(navigation, isCurrent, opts) {
  const items = navigation
    .map((item) =>
      item.type === 'link'
        ? `<li>${drawerRow('site-header-drawer-link', item, isCurrent)}</li>`
        : accordion(item, isCurrent),
    )
    .join('');

  // initNavbarOverflow hides #user-profile when the row cannot hold it, which
  // is every phone width while the visitor is logged out. These two links keep
  // both actions reachable; they mirror the control's own dropdown.
  const auth =
    `<li class="site-header-drawer-auth"><div class="site-header-drawer-auth-links">` +
    `<a${attrs({ href: opts.loginUrl, class: 'site-header-drawer-auth-link' })}>${esc(opts.loginText)}</a>` +
    `<a${attrs({ href: opts.signupUrl, class: 'site-header-drawer-auth-link' })}>${esc(opts.signupText)}</a>` +
    `</div></li>`;

  return `<ul class="site-header-drawer-list">${items}${auth}</ul>`;
}

// ---------------------------------------------------------------------------
// renderHeader
// ---------------------------------------------------------------------------

/**
 * Render the site header to an HTML string.
 *
 * Emit it as-is in the initial HTML — Astro: `<Fragment set:html={html} />` —
 * then call `initHeader()` from `@marketdataapp/ui/header-client` once on the
 * client. The output is one `<header class="site-header">` (skip link, fixed
 * bar, backdrop, drawer) followed by a spacer the height of the bar.
 *
 * @param {RenderHeaderOptions} [options]
 * @returns {string}
 */
export function renderHeader(options = {}) {
  const {
    logo,
    currentPath,
    navigation = defaultNavigation,
    homeHref = '/',
    skipLinkHref = '#main-content',
    loginUrl = 'https://dashboard.marketdata.app/marketdata/login',
    loginText = 'Log In',
    signupUrl = '/signup/',
    signupText = 'Try For Free',
    fixed = true,
    slots = {},
  } = options;

  const isCurrent = makeIsCurrent(currentPath);
  const logoHtml = logoMarkup(logo, slots);
  const authHtml = slots.auth ?? '<div id="user-profile" class="user-profile-container"></div>';

  return (
    `<header class="site-header">` +
    // The <header> is the banner landmark and the skip link's home: without
    // it the link sat outside every landmark and a screen reader navigating
    // by landmark could not reach it.
    `<a${attrs({ href: skipLinkHref, class: 'site-header-skip' })}>Skip to main content</a>` +
    // Fixed height, not content height. The bar is fixed and the spacer below
    // stands in for it, and the two agree only if the bar's height is pinned:
    // its tallest child changes while the account control loads.
    `<nav aria-label="Primary" class="site-header-bar${fixed ? '' : ' site-header-bar--static'}">` +
    `<div class="site-header-inner">` +
    // data-navbar-unmeasured seeds the first paint (see the CSS); initHeader
    // removes it and hands the row to initNavbarOverflow.
    `<div id="navbar-row" class="site-header-row" data-navbar-unmeasured>` +
    `<div class="site-header-start">` +
    `<button id="navbar-toggle" type="button" class="site-header-toggle" aria-controls="navbar-main" aria-expanded="false" aria-label="Open main menu">${icon('menu', 'site-header-toggle-icon')}</button>` +
    `<a${attrs({ href: homeHref, class: 'site-header-brand' })}>${logoHtml}</a>` +
    `<ul id="navbar-links" class="site-header-links">${desktopLinks(navigation)}</ul>` +
    `</div>` +
    `<div class="site-header-end">${authHtml}<div id="theme-toggle" class="theme-toggle-container site-header-theme-toggle"></div></div>` +
    `</div></div></nav>` +
    // The drawer lives outside the bar so it can overlay the page without
    // inheriting the bar's stacking. Closed = translated off-screen + inert,
    // so it is neither tabbable nor announced yet can still animate.
    `<div id="navbar-backdrop" class="site-header-backdrop"></div>` +
    `<nav id="navbar-main" aria-label="Main menu" class="site-header-drawer" inert>` +
    `<div class="site-header-drawer-bar">` +
    `<a${attrs({ href: homeHref, class: 'site-header-drawer-brand' })}>${logoHtml}</a>` +
    `<div class="site-header-drawer-actions">` +
    `<div id="theme-toggle-drawer" class="theme-toggle-container site-header-theme-toggle"></div>` +
    `<button id="navbar-close" type="button" class="site-header-close" aria-label="Close main menu">${icon('x', 'site-header-close-icon')}</button>` +
    `</div></div>` +
    `<div class="site-header-drawer-body">${slots.drawerStart ?? ''}${drawerList(navigation, isCurrent, { loginUrl, loginText, signupUrl, signupText })}${slots.drawerEnd ?? ''}</div>` +
    `</nav></header>` +
    (fixed ? `<div class="site-header-spacer"></div>` : '')
  );
}
