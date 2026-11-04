const loadedFonts = new Set<string>();
const pendingLoads = new Map<string, Promise<void>>();

export function buildGoogleFontsUrl(family: string, variants: string[]): string {
  const encodedFamily = encodeURIComponent(family);
  const weights = variants
    .filter(v => v === 'regular' || /^\d+$/.test(v))
    .map(v => (v === 'regular' ? '400' : v));
  const hasItalic = variants.some(v => v === 'italic');

  if (weights.length === 0) weights.push('400');

  // Sort and deduplicate weights
  const uniqueWeights = Array.from(new Set(weights)).sort((a, b) => parseInt(a) - parseInt(b));

  let url = `https://fonts.googleapis.com/css2?family=${encodedFamily}`;

  if (hasItalic && uniqueWeights.length > 0) {
    // Include both normal and italic
    const axes = uniqueWeights.map(w => `0,${w}`).concat(uniqueWeights.map(w => `1,${w}`));
    url += `:ital,wght@${axes.join(';')}`;
  } else if (uniqueWeights.length > 0) {
    url += `:wght@${uniqueWeights.join(';')}`;
  }

  url += '&display=swap';
  return url;
}

async function injectViaLink(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already injected
    const existing = document.querySelector(`link[data-font-lab-href="${CSS.escape(url)}"]`);
    if (existing) { resolve(); return; }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute('data-font-lab-href', url);
    link.onload = () => resolve();
    link.onerror = () => reject(new Error('Link load failed'));
    document.head.appendChild(link);

    // Timeout fallback
    setTimeout(resolve, 5000);
  });
}

async function injectViaFetch(url: string, family: string): Promise<void> {
  // Check if already injected via fetch
  if (document.querySelector(`style[data-font-lab-font="${CSS.escape(family)}"]`)) return;

  const response = await fetch(url, {
    headers: {
      // Send a modern browser UA so Google Fonts returns woff2 format
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const css = await response.text();
  const style = document.createElement('style');
  style.setAttribute('data-font-lab-font', family);
  style.textContent = css;
  document.head.appendChild(style);
}

export async function loadFont(
  family: string,
  variants: string[] = ['regular', '400', '700']
): Promise<void> {
  if (loadedFonts.has(family)) return;
  const existing = pendingLoads.get(family);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const url = buildGoogleFontsUrl(family, variants);

      // Try <link> injection first (simpler, better CSP compatibility)
      try {
        await injectViaLink(url);
      } catch {
        // Fall back to fetch+inject (works even when link injection fails)
        await injectViaFetch(url, family);
      }

      // Brief wait for font parsing
      if (document.fonts) {
        await Promise.race([
          document.fonts.ready,
          new Promise<void>(r => setTimeout(r, 3000)),
        ]);
      }

      loadedFonts.add(family);
    } catch (err) {
      console.warn(`Font Lab: Failed to load font "${family}":`, err);
    } finally {
      pendingLoads.delete(family);
    }
  })();

  pendingLoads.set(family, promise);
  return promise;
}

export function isFontLoaded(family: string): boolean {
  return loadedFonts.has(family);
}

export function resetLoadedFonts(): void {
  loadedFonts.clear();
  pendingLoads.clear();
}
