import { useState, useRef, useEffect } from 'react';
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

  const results = searchFonts(query, category || undefined).slice(0, 50);
  const currentFont = rule.fontFamily?.value ?? '';
  const isEnabled = rule.fontFamily?.enabled ?? false;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectFont = (family: string) => {
    updateRule(rule.id, {
      fontFamily: { enabled: true, value: family },
    });
    setOpen(false);
    setQuery('');
  };

  const clearFont = () => {
    updateRule(rule.id, { fontFamily: undefined });
  };

  const toggleEnabled = () => {
    updateRule(rule.id, {
      fontFamily: { enabled: !isEnabled, value: currentFont },
    });
  };

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
              title="Enable font family"
              style={{ flexShrink: 0 }}
            />
          )}
          <button
            className="fl-font-picker-trigger"
            onClick={() => setOpen(o => !o)}
          >
            <span>{currentFont || 'Select font...'}</span>
            <span>▾</span>
          </button>
          {currentFont && (
            <button className="fl-reset-btn" onClick={clearFont} title="Clear font">✕</button>
          )}
        </div>

        {open && (
          <div className="fl-font-dropdown">
            <div className="fl-font-search">
              <input
                className="fl-font-search-input"
                placeholder="Search fonts..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '4px', padding: '6px 8px', borderBottom: '1px solid var(--fl-separator)', overflowX: 'auto', flexShrink: 0 }}>
              {['', 'sans-serif', 'serif', 'monospace', 'display', 'handwriting'].map(cat => (
                <button
                  key={cat}
                  className={`fl-category-btn${category === cat ? ' fl-category-btn--active' : ''}`}
                  onClick={() => setCategory(cat)}
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
                  onClick={() => selectFont(font.family)}
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
