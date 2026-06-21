/**
 * Async image preloader / cache.
 * Keeps Image objects alive in a module-level Map so the browser
 * never evicts them from memory between renders.
 */

const cache = new Map<string, Promise<void>>();

/** Preload a single URL, returns a promise that resolves once loaded. */
export function preloadImage(url: string): Promise<void> {
  if (!url) return Promise.resolve();
  if (cache.has(url)) return cache.get(url)!;

  const promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload  = () => resolve();
    img.onerror = () => resolve(); // resolve anyway — errors are handled in the component
    img.src = url;
  });

  cache.set(url, promise);
  return promise;
}

/** Preload an ordered list of URLs in parallel. */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage));
}

/** True if the URL has already been loaded into cache. */
export function isCached(url: string): boolean {
  return cache.has(url);
}
