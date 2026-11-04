import { useState, useRef, useEffect, useCallback } from 'react';
import { useTypographyStore } from '../../../src/stores/typographyStore';
import { searchFonts } from '../../../src/services/fontCatalog';
import type { TypographyRule } from '../../../src/types';

interface Props {
  rule: TypographyRule;
}

// Cache of fonts loaded for preview (lightweight — 400 weight only)
const previewLoaded = new Set<string>();

function loadPreviewFont(family: string) {
  if (previewLoaded.has(family)) return;
  previewLoaded.add(family);
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400&display=swap`;
  // Check if already injected
  if (document.querySelector(`link[data-fl-preview="${CSS.escape(family)}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.setAttribute('data-fl-preview', family);
  document.head.appendChild(link);
}

// Observes font list items and loads preview font when they scroll into view
function useFontPreviewObserver(open: boolean) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!open) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const family = (entry.target as HTMLElement).dataset['fontFamily'];
            if (family) loadPreviewFont(family);
          }
        });
      },
      { threshold: 0.1 }
    );
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [open]);

  const observe = useCallback((el: HTMLElement | null) => {
    if (el && observerRef.current) observerRef.current.observe(el);
  }, []);

  return observe;
}

export function FontPicker({ rule }: Props) {
  const { updateRule } = useTypographyStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const observeItem = useFontPreviewObserver(open);

  const results = searchFonts(query, category || undefined).slice(0, 80);
  const currentFont = rule.fontFamily?.value ?? '';
  const isEnabled = rule.fontFamily?.enabled ?? false;

  // Outside-click detection inside the shadow root.
  // We can't use document (our host-level stopper blocks that), so we find
  // the shadow root from the containerRef and listen there instead.
  useEffect(() => {
    if (!open) return;
    const sr = containerRef.current?.getRootNode() as ShadowRoot | null;
    if (!sr || !(sr instanceof ShadowRoot)) return;
    const handlePointerDown = (e: Event) => {
      const path = e.composedPath();
      if (containerRef.current && path.includes(containerRef.current)) return;
      setOpen(false);
    };
    sr.addEventListener('pointerdown', handlePointerDown, true);
    return () => sr.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open]);

  // Load preview for currently selected font immediately
  useEffect(() => {
    if (currentFont) loadPreviewFont(currentFont);
  }, [currentFont]);

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

  const selectCategory = useCallback((cat: string) => {
    setCategory(cat);
  }, []);

  return (
    <div className="fl-control-row">
      <span className="fl-control-label">Font family</span>
      <div className="fl-font-picker" ref={containerRef} style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', minWidth: 0 }}>
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
            style={currentFont ? { fontFamily: `"${currentFont}", sans-serif` } : undefined}
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          >
            <span>{currentFont || 'Select font…'}</span>
            <span style={{ opacity: 0.5, fontSize: '10px', flexShrink: 0, marginLeft: '4px' }}>▾</span>
          </button>
          {currentFont && (
            <button className="fl-reset-btn" onClick={clearFont} title="Clear font">✕</button>
          )}
        </div>

        {open && (
          <div className="fl-font-dropdown" onPointerDown={e => e.stopPropagation()}>
            {/* Search */}
            <div className="fl-font-search">
              <input
                className="fl-font-search-input"
                placeholder="Search fonts…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Category filter */}
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
                  onClick={e => { e.stopPropagation(); selectCategory(cat); }}
                >
                  {cat || 'All'}
                </button>
              ))}
            </div>

            {/* Font list */}
            <div className="fl-font-list">
              {results.length === 0 && (
                <div className="fl-empty">No fonts found</div>
              )}
              {results.map(font => (
                <div
                  key={font.family}
                  ref={observeItem}
                  data-font-family={font.family}
                  className={`fl-font-list-item${currentFont === font.family ? ' fl-font-list-item--selected' : ''}`}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); selectFont(font.family); }}
                >
                  <div className="fl-font-preview-text">
                    <div className="fl-font-preview-name" style={{ fontFamily: `"${font.family}", sans-serif` }}>
                      {font.family}
                    </div>
                    <div className="fl-font-preview-sample" style={{ fontFamily: `"${font.family}", sans-serif` }}>
                      The quick brown fox
                    </div>
                  </div>
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
