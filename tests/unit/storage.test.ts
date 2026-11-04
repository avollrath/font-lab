import { describe, it, expect } from 'vitest';
import { createDefaultConfig } from '../../src/services/storage';
import { DEFAULT_RULES } from '../../src/types';

describe('createDefaultConfig', () => {
  it('creates config with correct origin', () => {
    const config = createDefaultConfig('https://example.com');
    expect(config.origin).toBe('https://example.com');
    expect(config.version).toBe(1);
    expect(config.enabled).toBe(true);
  });

  it('includes all default rules', () => {
    const config = createDefaultConfig('https://example.com');
    expect(config.rules).toHaveLength(DEFAULT_RULES.length);
  });

  it('all default rules are disabled', () => {
    const config = createDefaultConfig('https://example.com');
    config.rules.forEach(rule => {
      expect(rule.enabled).toBe(false);
    });
  });

  it('rules are independent copies (not references)', () => {
    const config1 = createDefaultConfig('https://a.com');
    const config2 = createDefaultConfig('https://b.com');
    config1.rules[0]!.enabled = true;
    expect(config2.rules[0]!.enabled).toBe(false);
  });
});
