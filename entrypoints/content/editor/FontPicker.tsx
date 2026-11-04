import { useState, useRef, useEffect, useCallback } from 'react';
import { useTypographyStore } from '../../../src/stores/typographyStore';
import { searchFonts } from '../../../src/services/fontCatalog';
import type { TypographyRule } from '../../../src/types';

interface Props {
  rule: TypographyRule;
}

export function FontPicker({ rule }: Props) {
  const { updateRule } = useTypographyStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const results = searchFonts(query, category || undefined).slice(0, 60);
  const currentFont = rule.fontFamily?.value ?? '';
  const isEnabled = rule.fontFamily?.enabled ?? false;

  // Close on outside click — must use composedPath() because we're inside Shadow DOM.
  // A normal contains() check fails: the event target as seen by document listeners
  // is the shadow host, not the element inside the shadow root.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      const path = e.composedPath();
      if (containerRef.current && path.includes(containerRef.current)) return;
      setOpen(false);
    };

    // Attach to the shadow root's owner document so we catch all clicks
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open]);

  const selectFont = useCallback((family: string) => {
    updateRule(rule.id, { fontFamily: { enabled: true, value: family } });
    setOpen(false);
    setQuery('');
  }, [rule.id, updateRule]);

  const clearFont = useCallback(() => {
    updateRule(rule.id, { fontFamily: undefined });
  }, [rule.id, updateRule]);

  const toggleEnabled = useCallback(() => {
    updateRule(rule.id, { fontFamily: { enabled: !isEnabled, value: currentFont } });
  }, [rule.id, updateRule, isEnabled, currentFont]);

  const selectCategory = useCallback((cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategory(cat);
  }, []);

  return (
    <div className="fl-control-row">
      <span className="fl-control-label">Font family</span>
      <div className="fl-font-picker" ref={containerRef} style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {currentFont && (
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={toggleEnabled}
              title="Enable font family override"
              style={{ flexShrink: 0, cursor: 'pointer' }}
            />
          )}
          <button
            className="fl-font-picker-trigger"
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          >
            <span>{currentFont || 'Select font...'}</span>
            <span style={{ opacity: 0.5, fontSize: '10px' }}>▾</span>
          </button>
          {currentFont && (
            <button className="fl-reset-btn" onClick={clearFont} title="Clear font">✕</button>
          )}
        </div>

        {open && (
          <div className="fl-font-dropdown" onPointerDown={e => e.stopPropagation()}>
            <div className="fl-font-search">
              <input
                className="fl-font-search-input"
                placeholder="Search fonts..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{
              display: 'flex', gap: '4px', padding: '6px 8px',
              borderBottom: '1px solid var(--fl-separator)',
              overflowX: 'auto', flexShrink: 0,
            }}>
              {(['', 'sans-serif', 'serif', 'monospace', 'display', 'handwriting'] as const).map(cat => (
                <button
                  key={cat}
                  className={`fl-category-btn${category === cat ? ' fl-category-btn--active' : ''}`}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => selectCategory(cat, e)}
                >
                  {cat || 'All'}
                </button>
              ))}
            </div>

            <div className="fl-font-list">
              {results.length === 0 && (
                <div className="fl-empty">No fonts found</div>
              )}
              {results.map(font => (
                <div
                  key={font.family}
                  className={`fl-font-list-item${currentFont === font.family ? ' fl-font-list-item--selected' : ''}`}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); selectFont(font.family); }}
                >
                  <span className="fl-font-name">{font.family}</span>
                  <span className="fl-font-cat-badge">{font.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
