import { describe, it, expect } from 'vitest';
import { exportCSS } from '../../src/services/cssExport';
import type { TypographyRule } from '../../src/types';

describe('exportCSS', () => {
  it('returns placeholder when no active rules', () => {
    const result = exportCSS([]);
    expect(result).toContain('No active typography rules');
  });

  it('returns placeholder when all rules disabled', () => {
    const rules: TypographyRule[] = [
      { id: 'h1', selector: 'h1', label: 'H1', category: 'headings', enabled: false },
    ];
    expect(exportCSS(rules)).toContain('No active typography rules');
  });

  it('generates CSS for active rules', () => {
    const rules: TypographyRule[] = [
      {
        id: 'h1', selector: 'h1', label: 'H1', category: 'headings', enabled: true,
        fontFamily: { enabled: true, value: 'Inter' },
        fontWeight: { enabled: true, value: 700 },
      },
    ];
    const css = exportCSS(rules);
    expect(css).toContain('h1 {');
    expect(css).toContain('Inter');
    expect(css).toContain('font-weight: 700');
  });

  it('includes !important when flag set', () => {
    const rules: TypographyRule[] = [
      {
        id: 'h1', selector: 'h1', label: 'H1', category: 'headings', enabled: true,
        fontFamily: { enabled: true, value: 'Inter' },
      },
    ];
    const css = exportCSS(rules, true);
    expect(css).toContain('!important');
  });

  it('does not include !important by default', () => {
    const rules: TypographyRule[] = [
      {
        id: 'h1', selector: 'h1', label: 'H1', category: 'headings', enabled: true,
        fontFamily: { enabled: true, value: 'Inter' },
      },
    ];
    const css = exportCSS(rules, false);
    expect(css).not.toContain('!important');
  });

  it('includes Google Fonts import', () => {
    const rules: TypographyRule[] = [
      {
        id: 'h1', selector: 'h1', label: 'H1', category: 'headings', enabled: true,
        fontFamily: { enabled: true, value: 'Inter' },
      },
    ];
    const css = exportCSS(rules);
    expect(css).toContain('@import');
    expect(css).toContain('fonts.googleapis.com');
  });

  it('includes Font Lab comment', () => {
    const rules: TypographyRule[] = [
      {
        id: 'h1', selector: 'h1', label: 'H1', category: 'headings', enabled: true,
        fontFamily: { enabled: true, value: 'Inter' },
      },
    ];
    expect(exportCSS(rules)).toContain('Font Lab');
  });
});
