import { describe, it, expect } from 'vitest';
import { generateRuleCSS, generateFullCSS, escapeCSSSelectorValue } from '../../src/services/typographyEngine';
import type { TypographyRule } from '../../src/types';

describe('escapeCSSSelectorValue', () => {
  it('removes dangerous characters', () => {
    expect(escapeCSSSelectorValue('test<script>')).toBe('testscript');
    expect(escapeCSSSelectorValue('normal-font')).toBe('normal-font');
  });
});

describe('generateRuleCSS', () => {
  const baseRule: TypographyRule = {
    id: 'h1', selector: 'h1', label: 'H1', category: 'headings', enabled: true,
  };

  it('returns empty string when rule disabled', () => {
    expect(generateRuleCSS({ ...baseRule, enabled: false }, true)).toBe('');
  });

  it('returns empty string when globally disabled', () => {
    expect(generateRuleCSS(baseRule, false)).toBe('');
  });

  it('returns empty string when no properties set', () => {
    expect(generateRuleCSS(baseRule, true)).toBe('');
  });

  it('generates font-family declaration', () => {
    const rule = { ...baseRule, fontFamily: { enabled: true, value: 'Inter' } };
    const css = generateRuleCSS(rule, true);
    expect(css).toContain('font-family');
    expect(css).toContain('Inter');
    expect(css).toContain('!important');
  });

  it('generates font-size declaration', () => {
    const rule = { ...baseRule, fontSize: { enabled: true, value: { value: 24, unit: 'px' as const } } };
    const css = generateRuleCSS(rule, true);
    expect(css).toContain('font-size: 24px');
  });

  it('skips font-size with value 0', () => {
    const rule = { ...baseRule, fontSize: { enabled: true, value: { value: 0, unit: 'px' as const } } };
    const css = generateRuleCSS(rule, true);
    expect(css).toBe('');
  });

  it('generates font-weight declaration', () => {
    const rule = { ...baseRule, fontWeight: { enabled: true, value: 700 } };
    const css = generateRuleCSS(rule, true);
    expect(css).toContain('font-weight: 700');
  });

  it('skips disabled properties', () => {
    const rule = { ...baseRule, fontFamily: { enabled: false, value: 'Inter' } };
    const css = generateRuleCSS(rule, true);
    expect(css).toBe('');
  });
});

describe('generateFullCSS', () => {
  it('returns empty string when globally disabled', () => {
    const rules: TypographyRule[] = [
      { id: 'h1', selector: 'h1', label: 'H1', category: 'headings', enabled: true,
        fontFamily: { enabled: true, value: 'Inter' } },
    ];
    expect(generateFullCSS(rules, false)).toBe('');
  });

  it('generates CSS for enabled rules only', () => {
    const rules: TypographyRule[] = [
      { id: 'h1', selector: 'h1', label: 'H1', category: 'headings', enabled: true,
        fontFamily: { enabled: true, value: 'Inter' } },
      { id: 'p', selector: 'p', label: 'P', category: 'body', enabled: false,
        fontFamily: { enabled: true, value: 'Georgia' } },
    ];
    const css = generateFullCSS(rules, true);
    expect(css).toContain('h1');
    expect(css).not.toContain('p {');
  });
});
