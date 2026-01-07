import { e as createComponent, f as createAstro, r as renderTemplate, n as renderSlot, h as addAttribute, o as renderHead, l as renderScript } from './astro/server_DoXgqcN7.mjs';
import 'piccolore';
import 'clsx';
/* empty css                         */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const GTM_ID = "GTM-PMBBJ2B6";
  const { title, description, keywords = [], canonical, image, noindex = false } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="description"', ">", "", '<meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"', ">", '<!-- Open Graph --><meta property="og:title"', '><meta property="og:description"', ">", '<meta property="og:type" content="website">', '<!-- Twitter Card --><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', ">", "", "<title>", '</title><script type="application/ld+json">\n      {JSON.stringify({\n        "@context": "https://schema.org",\n        "@type": "LocalBusiness",\n        name: "ColorAuto Detailing",\n        telephone: "970-628-1505",\n        address: {\n          "@type": "PostalAddress",\n          streetAddress: "562 S Westgate Drive",\n          addressLocality: "Grand Junction",\n          addressRegion: "CO",\n          postalCode: "81505",\n          addressCountry: "US"\n        }\n      })}\n    </script>', "</head> <body> ", " ", " </body></html>"])), addAttribute(description || "ColorAuto Detailing — Auto detailing, paint protection film, ceramic coating, and window tinting in Grand Junction, CO.", "content"), keywords.length ? renderTemplate`<meta name="keywords"${addAttribute(keywords.join(", "), "content")}>` : null, noindex ? renderTemplate`<meta name="robots" content="noindex,nofollow">` : renderTemplate`<meta name="robots" content="index,follow">`, addAttribute(Astro2.generator, "content"), canonical && renderTemplate`<link rel="canonical"${addAttribute(canonical, "href")}>`, addAttribute(title, "content"), addAttribute(description || "ColorAuto Detailing — Auto detailing, paint protection film, ceramic coating, and window tinting in Grand Junction, CO.", "content"), canonical && renderTemplate`<meta property="og:url"${addAttribute(canonical, "content")}>`, image && renderTemplate`<meta property="og:image"${addAttribute(image, "content")}>`, addAttribute(title, "content"), addAttribute(description || "ColorAuto Detailing — Auto detailing, paint protection film, ceramic coating, and window tinting in Grand Junction, CO.", "content"), image && renderTemplate`<meta name="twitter:image"${addAttribute(image, "content")}>`, renderTemplate`${renderScript($$result, "C:/colorautodetailing/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts")}`, title, renderHead(), renderTemplate`<noscript> <iframe${addAttribute(`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`, "src")} height="0" width="0" style="display:none;visibility:hidden"></iframe> </noscript>`, renderSlot($$result, $$slots["default"]));
}, "C:/colorautodetailing/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
