import { describe, it, expect, beforeEach } from 'vitest';
import { buildGoogleFontsUrl, isFontLoaded, resetLoadedFonts } from '../../src/services/fontLoader';

describe('buildGoogleFontsUrl', () => {
  it('generates correct URL for simple font', () => {
    const url = buildGoogleFontsUrl('Inter', ['regular', '400', '700']);
    expect(url).toContain('fonts.googleapis.com/css2');
    expect(url).toContain('Inter');
    expect(url).toContain('display=swap');
  });

  it('encodes spaces in family name', () => {
    const url = buildGoogleFontsUrl('Playfair Display', ['regular', '700']);
    expect(url).toContain('Playfair%20Display');
  });

  it('includes multiple weights', () => {
    const url = buildGoogleFontsUrl('Roboto', ['regular', '400', '700']);
    expect(url).toContain('400');
    expect(url).toContain('700');
  });

  it('handles regular variant as 400', () => {
    const url = buildGoogleFontsUrl('Inter', ['regular']);
    expect(url).toContain('400');
  });

  it('defaults to 400 when no variants', () => {
    const url = buildGoogleFontsUrl('Inter', []);
    expect(url).toContain('400');
  });
});

describe('isFontLoaded / resetLoadedFonts', () => {
  beforeEach(() => {
    resetLoadedFonts();
  });

  it('returns false for unloaded font', () => {
    expect(isFontLoaded('Inter')).toBe(false);
  });

  it('returns false after reset', () => {
    resetLoadedFonts();
    expect(isFontLoaded('Inter')).toBe(false);
  });
});
