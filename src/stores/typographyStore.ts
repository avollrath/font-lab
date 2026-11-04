import { create } from 'zustand';
import type { TypographyRule, SiteConfiguration, Preset } from '../types';
import { DEFAULT_RULES } from '../types';
import { updateStylesheet } from '../services/typographyEngine';
import { saveSiteConfig, loadSiteConfig, savePresets, loadPresets } from '../services/storage';
import { loadFont } from '../services/fontLoader';
import { FONT_CATALOG } from '../services/fontCatalog';
import { exportCSS } from '../services/cssExport';

interface TypographyState {
  origin: string;
  rules: TypographyRule[];
  globalEnabled: boolean;
  presets: Preset[];
  recentFonts: string[];
  favoriteFonts: string[];
  isLoading: boolean;

  initialize: (origin: string) => Promise<void>;
  updateRule: (id: string, updates: Partial<TypographyRule>) => void;
  toggleRule: (id: string) => void;
  resetRule: (id: string) => void;
  resetAll: () => void;
  setGlobalEnabled: (enabled: boolean) => void;
  addCustomRule: (rule: TypographyRule) => void;
  removeCustomRule: (id: string) => void;
  savePreset: (name: string) => void;
  applyPreset: (preset: Preset) => void;
  deletePreset: (id: string) => void;
  enableCategory: (category: string) => void;
  disableCategory: (category: string) => void;
  exportCurrentCSS: (includeImportant?: boolean) => string;
  syncStylesheet: () => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSave(fn: () => void, delay = 300) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(fn, delay);
}

export const useTypographyStore = create<TypographyState>((set, get) => ({
  origin: '',
  rules: [],
  globalEnabled: true,
  presets: [],
  recentFonts: [],
  favoriteFonts: [],
  isLoading: true,

  initialize: async (origin: string) => {
    set({ isLoading: true, origin });
    const [config, presets] = await Promise.all([
      loadSiteConfig(origin),
      loadPresets(),
    ]);
    set({
      rules: config.rules,
      globalEnabled: config.enabled,
      presets,
      isLoading: false,
    });
    updateStylesheet(config.rules, config.enabled);

    // Pre-load fonts for enabled rules with font families set
    if (config.enabled) {
      for (const rule of config.rules) {
        if (rule.enabled && rule.fontFamily?.enabled && rule.fontFamily.value) {
          const fontEntry = FONT_CATALOG.find(f => f.family === rule.fontFamily!.value);
          loadFont(rule.fontFamily.value, fontEntry?.variants ?? ['regular', '400', '700']).catch(() => {});
        }
      }
    }
  },

  syncStylesheet: () => {
    const { rules, globalEnabled } = get();
    updateStylesheet(rules, globalEnabled);
  },

  updateRule: (id: string, updates: Partial<TypographyRule>) => {
    set(state => {
      const rules = state.rules.map(r => r.id === id ? { ...r, ...updates } : r);

      const updatedRule = rules.find(r => r.id === id);
      if (updatedRule?.fontFamily?.value && updates.fontFamily) {
        const fontEntry = FONT_CATALOG.find(f => f.family === updatedRule.fontFamily!.value);
        loadFont(updatedRule.fontFamily.value, fontEntry?.variants ?? ['regular', '400', '700'])
          .then(() => updateStylesheet(get().rules, get().globalEnabled));
        // Track recently used fonts (in-memory only for MVP)
      }

      updateStylesheet(rules, state.globalEnabled);

      const { origin, globalEnabled } = state;
      debouncedSave(() => {
        const currentState = get();
        saveSiteConfig({
          version: 1,
          origin,
          enabled: globalEnabled,
          rules: currentState.rules,
        }).catch(console.error);
      });

      return { rules };
    });
  },

  toggleRule: (id: string) => {
    const { updateRule, rules } = get();
    const rule = rules.find(r => r.id === id);
    if (rule) {
      updateRule(id, { enabled: !rule.enabled });
    }
  },

  resetRule: (id: string) => {
    const defaultRule = DEFAULT_RULES.find(r => r.id === id);
    if (defaultRule) {
      get().updateRule(id, {
        ...defaultRule,
        enabled: false,
        fontFamily: undefined,
        fontSize: undefined,
        fontWeight: undefined,
        lineHeight: undefined,
        letterSpacing: undefined,
        fontStyle: undefined,
        textTransform: undefined,
      });
    } else {
      get().updateRule(id, {
        enabled: false,
        fontFamily: undefined,
        fontSize: undefined,
        fontWeight: undefined,
        lineHeight: undefined,
        letterSpacing: undefined,
        fontStyle: undefined,
        textTransform: undefined,
      });
    }
  },

  resetAll: () => {
    const { origin } = get();
    const rules = DEFAULT_RULES.map(r => ({ ...r }));
    updateStylesheet(rules, true);
    set({ rules, globalEnabled: true });
    saveSiteConfig({ version: 1, origin, enabled: true, rules }).catch(console.error);
  },

  setGlobalEnabled: (enabled: boolean) => {
    set(state => {
      updateStylesheet(state.rules, enabled);
      const config: SiteConfiguration = {
        version: 1,
        origin: state.origin,
        enabled,
        rules: state.rules,
      };
      saveSiteConfig(config).catch(console.error);
      return { globalEnabled: enabled };
    });
  },

  addCustomRule: (rule: TypographyRule) => {
    set(state => {
      const rules = [...state.rules, rule];
      updateStylesheet(rules, state.globalEnabled);
      debouncedSave(() => {
        saveSiteConfig({ version: 1, origin: state.origin, enabled: state.globalEnabled, rules }).catch(console.error);
      });
      return { rules };
    });
  },

  removeCustomRule: (id: string) => {
    set(state => {
      const rules = state.rules.filter(r => r.id !== id);
      updateStylesheet(rules, state.globalEnabled);
      debouncedSave(() => {
        saveSiteConfig({ version: 1, origin: state.origin, enabled: state.globalEnabled, rules }).catch(console.error);
      });
      return { rules };
    });
  },

  savePreset: (name: string) => {
    const { rules, presets } = get();
    const preset: Preset = {
      id: `preset-${Date.now()}`,
      name,
      isBuiltIn: false,
      rules: rules.map(r => ({ ...r })),
      createdAt: Date.now(),
    };
    const updated = [...presets, preset];
    set({ presets: updated });
    savePresets(updated).catch(console.error);
  },

  applyPreset: (preset: Preset) => {
    const { origin, globalEnabled } = get();
    const rules = preset.rules.map(r => ({ ...r }));
    updateStylesheet(rules, globalEnabled);
    set({ rules });
    saveSiteConfig({ version: 1, origin, enabled: globalEnabled, rules }).catch(console.error);
  },

  deletePreset: (id: string) => {
    set(state => {
      const presets = state.presets.filter(p => p.id !== id);
      savePresets(presets).catch(console.error);
      return { presets };
    });
  },

  enableCategory: (category: string) => {
    set(state => {
      const rules = state.rules.map(r =>
        r.category === category ? { ...r, enabled: true } : r
      );
      updateStylesheet(rules, state.globalEnabled);
      debouncedSave(() => {
        saveSiteConfig({ version: 1, origin: state.origin, enabled: state.globalEnabled, rules }).catch(console.error);
      });
      return { rules };
    });
  },

  disableCategory: (category: string) => {
    set(state => {
      const rules = state.rules.map(r =>
        r.category === category ? { ...r, enabled: false } : r
      );
      updateStylesheet(rules, state.globalEnabled);
      debouncedSave(() => {
        saveSiteConfig({ version: 1, origin: state.origin, enabled: state.globalEnabled, rules }).catch(console.error);
      });
      return { rules };
    });
  },

  exportCurrentCSS: (includeImportant = false) => {
    const { rules } = get();
    return exportCSS(rules, includeImportant);
  },
}));
