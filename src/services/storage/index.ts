import type { SiteConfiguration, Preset } from '../../types';
import { DEFAULT_RULES } from '../../types';

const SCHEMA_VERSION = 1;
const PRESETS_KEY = 'font-lab-presets';

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
    if (!d['origin'] || !Array.isArray(d['rules'])) return null;
    if (!d['version']) d['version'] = SCHEMA_VERSION;
    return d as unknown as SiteConfiguration;
  } catch {
    return null;
  }
}

// Use browser API (WXT cross-browser compatible)
// WXT provides `browser` as a global in content scripts and background
// In tests, globalThis.browser is mocked in setup.ts
function getStorage() {
  try {
    return browser.storage.local;
  } catch {
    return null;
  }
}

export async function loadSiteConfig(origin: string): Promise<SiteConfiguration> {
  try {
    const storage = getStorage();
    if (!storage) return createDefaultConfig(origin);
    const key = siteKey(origin);
    const result = await storage.get(key);
    const raw = result[key];
    if (!raw) return createDefaultConfig(origin);
    const config = validateAndMigrateConfig(raw);
    if (!config) return createDefaultConfig(origin);

    // Merge any missing default rules
    const existingIds = new Set(config.rules.map(r => r.id));
    const missingRules = DEFAULT_RULES.filter(r => !existingIds.has(r.id));
    if (missingRules.length > 0) {
      config.rules = [...config.rules, ...missingRules.map(r => ({ ...r }))];
    }
    return config;
  } catch {
    return createDefaultConfig(origin);
  }
}

export async function saveSiteConfig(config: SiteConfiguration): Promise<void> {
  try {
    const storage = getStorage();
    if (!storage) return;
    const key = siteKey(config.origin);
    await storage.set({ [key]: config });
  } catch {
    // Storage unavailable in some contexts
  }
}

export async function clearSiteConfig(origin: string): Promise<void> {
  try {
    const storage = getStorage();
    if (!storage) return;
    const key = siteKey(origin);
    await storage.remove(key);
  } catch {
    // ignore
  }
}

export async function loadPresets(): Promise<Preset[]> {
  try {
    const storage = getStorage();
    if (!storage) return [];
    const result = await storage.get(PRESETS_KEY);
    return (result[PRESETS_KEY] as Preset[] | undefined) ?? [];
  } catch {
    return [];
  }
}

export async function savePresets(presets: Preset[]): Promise<void> {
  try {
    const storage = getStorage();
    if (!storage) return;
    await storage.set({ [PRESETS_KEY]: presets });
  } catch {
    // ignore
  }
}
