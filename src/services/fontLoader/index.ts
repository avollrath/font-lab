const loadedFonts = new Set<string>();
const pendingLoads = new Map<string, Promise<void>>();

function buildGoogleFontsUrl(family: string, variants: string[]): string {
  const encodedFamily = encodeURIComponent(family);
  const weights = variants
    .filter(v => v === 'regular' || /^\d+$/.test(v))
    .map(v => (v === 'regular' ? '400' : v));
  const hasItalic = variants.some(v => v === 'italic' || v.includes('italic'));

  if (weights.length === 0) weights.push('400');

  let url = `https://fonts.googleapis.com/css2?family=${encodedFamily}`;

  if (hasItalic) {
    const axes = weights.map(w => `0,${w}`).concat(weights.map(w => `1,${w}`));
    url += `:ital,wght@${axes.join(';')}`;
  } else {
    url += `:wght@${weights.join(';')}`;
  }

  url += '&display=swap';
  return url;
}

export async function loadFont(family: string, variants: string[] = ['regular', '400', '700']): Promise<void> {
  const key = family;
  if (loadedFonts.has(key)) return;
  if (pendingLoads.has(key)) return pendingLoads.get(key)!;

  const promise = (async () => {
    try {
      const url = buildGoogleFontsUrl(family, variants);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch font CSS: ${response.status}`);
      }

      const css = await response.text();
      const style = document.createElement('style');
      style.setAttribute('data-font-lab-font', family);
      style.textContent = css;
      document.head.appendChild(style);

      await document.fonts.ready;
      loadedFonts.add(key);
    } catch (err) {
      console.warn(`Font Lab: Failed to load font "${family}":`, err);
    } finally {
      pendingLoads.delete(key);
    }
  })();

  pendingLoads.set(key, promise);
  return promise;
}

export function isFontLoaded(family: string): boolean {
  return loadedFonts.has(family);
}

export function resetLoadedFonts(): void {
  loadedFonts.clear();
  pendingLoads.clear();
}
