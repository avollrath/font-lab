import type { SiteConfiguration, Preset } from '../../types';
import { DEFAULT_RULES } from '../../types';

const SCHEMA_VERSION = 1;
const PRESETS_KEY = 'font-lab-presets';
const RECENT_FONTS_KEY = 'font-lab-recent-fonts';
const FAVORITE_FONTS_KEY = 'font-lab-favorite-fonts';

function siteKey(origin: string): string {
  return `font-lab-site:${origin}`;
}

export function createDefaultConfig(origin: string): SiteConfiguration {
  return {
    version: SCHEMA_VERSION,
    origin,
    enabled: true,
    rules: DEFAULT_RULES.map(r => ({ ...r })),
  };
}

function validateAndMigrateConfig(data: unknown): SiteConfiguration | null {
  try {
    if (!data || typeof data !== 'object') return null;
    const d = data as Record<string, unknown>;
    if (!d.origin || !Array.isArray(d.rules)) return null;
    if (!d.version) d.version = SCHEMA_VERSION;
    return d as SiteConfiguration;
  } catch {
    return null;
  }
}

export async function loadSiteConfig(origin: string): Promise<SiteConfiguration> {
  try {
    const key = siteKey(origin);
    const result = await chrome.storage.local.get(key);
    const raw = result[key];
    if (!raw) return createDefaultConfig(origin);
    const config = validateAndMigrateConfig(raw);
    if (!config) return createDefaultConfig(origin);

    const existingIds = new Set(config.rules.map(r => r.id));
    const missingRules = DEFAULT_RULES.filter(r => !existingIds.has(r.id));
    if (missingRules.length > 0) {
      config.rules = [...config.rules, ...missingRules];
    }
    return config;
  } catch {
    return createDefaultConfig(origin);
  }
}

export async function saveSiteConfig(config: SiteConfiguration): Promise<void> {
  const key = siteKey(config.origin);
  await chrome.storage.local.set({ [key]: config });
}

export async function clearSiteConfig(origin: string): Promise<void> {
  const key = siteKey(origin);
  await chrome.storage.local.remove(key);
}

export async function loadPresets(): Promise<Preset[]> {
  const result = await chrome.storage.local.get(PRESETS_KEY);
  return result[PRESETS_KEY] ?? [];
}

export async function savePresets(presets: Preset[]): Promise<void> {
  await chrome.storage.local.set({ [PRESETS_KEY]: presets });
}

export async function loadRecentFonts(): Promise<string[]> {
  const result = await chrome.storage.local.get(RECENT_FONTS_KEY);
  return result[RECENT_FONTS_KEY] ?? [];
}

export async function addRecentFont(family: string): Promise<void> {
  const recent = await loadRecentFonts();
  const updated = [family, ...recent.filter(f => f !== family)].slice(0, 10);
  await chrome.storage.local.set({ [RECENT_FONTS_KEY]: updated });
}

export async function loadFavoriteFonts(): Promise<string[]> {
  const result = await chrome.storage.local.get(FAVORITE_FONTS_KEY);
  return result[FAVORITE_FONTS_KEY] ?? [];
}

export async function toggleFavoriteFont(family: string): Promise<boolean> {
  const favorites = await loadFavoriteFonts();
  const isFav = favorites.includes(family);
  const updated = isFav ? favorites.filter(f => f !== family) : [...favorites, family];
  await chrome.storage.local.set({ [FAVORITE_FONTS_KEY]: updated });
  return !isFav;
}
