import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);

  if (context.request.method !== 'GET') {
    return next();
  }

  const searchParam = url.searchParams.get('s');
  const wcAjaxParam = url.searchParams.get('wc-ajax');
  const isPlaceholderSearch = searchParam === '{search_term_string}';
  const isPlaceholderAjax = wcAjaxParam === '%%endpoint%%';

  if (isPlaceholderSearch || isPlaceholderAjax) {
    const cleanUrl = `${url.origin}${url.pathname}`;
    return context.redirect(cleanUrl, 301);
  }

  return next();
};
