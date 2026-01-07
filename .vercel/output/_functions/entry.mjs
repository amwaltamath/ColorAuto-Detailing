import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_BzT8YtPw.mjs';
import { manifest } from './manifest_DmASFNKH.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/ads/auto-detailing.astro.mjs');
const _page2 = () => import('./pages/ads/auto-paint-correction.astro.mjs');
const _page3 = () => import('./pages/ads/ceramic-coating.astro.mjs');
const _page4 = () => import('./pages/ads/color-ppf.astro.mjs');
const _page5 = () => import('./pages/ads/home-window-tint.astro.mjs');
const _page6 = () => import('./pages/ads/office-window-tint.astro.mjs');
const _page7 = () => import('./pages/ads/paint-protection-film.astro.mjs');
const _page8 = () => import('./pages/ads/window-tinting.astro.mjs');
const _page9 = () => import('./pages/api/contact.astro.mjs');
const _page10 = () => import('./pages/contact.astro.mjs');
const _page11 = () => import('./pages/customer/dashboard.astro.mjs');
const _page12 = () => import('./pages/customer/login.astro.mjs');
const _page13 = () => import('./pages/employee/dashboard.astro.mjs');
const _page14 = () => import('./pages/employee/login.astro.mjs');
const _page15 = () => import('./pages/our-team.astro.mjs');
const _page16 = () => import('./pages/our-work.astro.mjs');
const _page17 = () => import('./pages/services/auto-detailing.astro.mjs');
const _page18 = () => import('./pages/services/auto-paint-correction.astro.mjs');
const _page19 = () => import('./pages/services/ceramic-coating.astro.mjs');
const _page20 = () => import('./pages/services/color-ppf.astro.mjs');
const _page21 = () => import('./pages/services/home-window-tint.astro.mjs');
const _page22 = () => import('./pages/services/office-window-tint.astro.mjs');
const _page23 = () => import('./pages/services/paint-protection-film.astro.mjs');
const _page24 = () => import('./pages/services/window-tinting.astro.mjs');
const _page25 = () => import('./pages/services.astro.mjs');
const _page26 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/ads/auto-detailing.astro", _page1],
    ["src/pages/ads/auto-paint-correction.astro", _page2],
    ["src/pages/ads/ceramic-coating.astro", _page3],
    ["src/pages/ads/color-ppf.astro", _page4],
    ["src/pages/ads/home-window-tint.astro", _page5],
    ["src/pages/ads/office-window-tint.astro", _page6],
    ["src/pages/ads/paint-protection-film.astro", _page7],
    ["src/pages/ads/window-tinting.astro", _page8],
    ["src/pages/api/contact.ts", _page9],
    ["src/pages/contact.astro", _page10],
    ["src/pages/customer/dashboard.astro", _page11],
    ["src/pages/customer/login.astro", _page12],
    ["src/pages/employee/dashboard.astro", _page13],
    ["src/pages/employee/login.astro", _page14],
    ["src/pages/our-team.astro", _page15],
    ["src/pages/our-work.astro", _page16],
    ["src/pages/services/auto-detailing.astro", _page17],
    ["src/pages/services/auto-paint-correction.astro", _page18],
    ["src/pages/services/ceramic-coating.astro", _page19],
    ["src/pages/services/color-ppf.astro", _page20],
    ["src/pages/services/home-window-tint.astro", _page21],
    ["src/pages/services/office-window-tint.astro", _page22],
    ["src/pages/services/paint-protection-film.astro", _page23],
    ["src/pages/services/window-tinting.astro", _page24],
    ["src/pages/services.astro", _page25],
    ["src/pages/index.astro", _page26]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "c5ca8a0d-7109-4f35-ad7b-b3a8a88a9181",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
