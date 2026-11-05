import { useState, useRef, useEffect, useCallback } from 'react';
import { searchFonts } from '../../../src/services/fontCatalog';

interface Props {
  value: string;
  onSelect: (family: string) => void;
  onClose: () => void;
  anchorRect: DOMRect;
  recentFonts?: string[];
}

const previewLoaded = new Set<string>();

function loadPreviewFont(family: string) {
  if (previewLoaded.has(family)) return;
  previewLoaded.add(family);
  if (document.querySelector(`link[data-fp-preview="${CSS.escape(family)}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400&display=swap`;
  link.setAttribute('data-fp-preview', family);
  document.head.appendChild(link);
}

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'sans-serif', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Hand.' },
  { value: 'monospace', label: 'Mono' },
] as const;

export function FontPickerPopover({ value, onSelect, onClose, anchorRect, recentFonts = [] }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const results = searchFonts(query, category || undefined).slice(0, 100);

  // Compute position
  const POPOVER_WIDTH = 320;
  const POPOVER_MAX_HEIGHT = 400;
  const MARGIN = 8;

  const spaceBelow = window.innerHeight - anchorRect.bottom - MARGIN;
  const spaceAbove = anchorRect.top - MARGIN;
  const openAbove = spaceBelow < 200 && spaceAbove > spaceBelow;

  let top: number;
  let maxHeight: number;
  if (openAbove) {
    maxHeight = Math.min(POPOVER_MAX_HEIGHT, spaceAbove);
    top = anchorRect.top - maxHeight - 4;
  } else {
    maxHeight = Math.min(POPOVER_MAX_HEIGHT, spaceBelow);
    top = anchorRect.bottom + 4;
  }

  let left = anchorRect.left;
  if (left + POPOVER_WIDTH > window.innerWidth - MARGIN) {
    left = window.innerWidth - POPOVER_WIDTH - MARGIN;
  }
  if (left < MARGIN) left = MARGIN;

  // IntersectionObserver for lazy preview loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const family = (entry.target as HTMLElement).dataset['fontFamily'];
            if (family) loadPreviewFont(family);
          }
        });
      },
      { threshold: 0.1, root: listRef.current }
    );
    return () => observerRef.current?.disconnect();
  }, []);

  const observeItem = useCallback((el: HTMLElement | null) => {
    if (el && observerRef.current) observerRef.current.observe(el);
  }, []);

  // Load preview for current value
  useEffect(() => {
    if (value) loadPreviewFont(value);
    recentFonts.forEach(loadPreviewFont);
  }, [value, recentFonts]);

  // Auto-focus search
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        onSelect(results[activeIndex].family);
      }
    };
    document.addEventListener('keydown', handleKey, true);

    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown, true);

    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [onClose, activeIndex, results, onSelect]);

  // Reset active index on results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [query, category]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('.fp-font-item');
    const item = items[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const recentToShow = recentFonts.filter(f => {
    if (!f) return false;
    if (query && !f.toLowerCase().includes(query.toLowerCase())) return false;
    if (category) {
      const entry = searchFonts('', category).find(e => e.family === f);
      if (!entry) return false;
    }
    return true;
  });

  return (
    <div
      ref={popoverRef}
      className="fp-popover"
      style={{ top, left, maxHeight }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="fp-popover-search">
        <input
          ref={searchRef}
          className="fp-popover-search-input"
          placeholder="Search fonts…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="fp-popover-cats">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            className={`fp-cat-btn${category === cat.value ? ' fp-cat-btn--active' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="fp-popover-list" ref={listRef}>
        {recentToShow.length > 0 && !query && (
          <>
            <div className="fp-popover-section-label">Recently used</div>
            {recentToShow.map(family => (
              <div
                key={`recent-${family}`}
                ref={el => observeItem(el)}
                data-font-family={family}
                className={`fp-font-item${value === family ? ' fp-font-item--selected' : ''}`}
                onClick={() => onSelect(family)}
              >
                <div className="fp-font-item-text">
                  <div className="fp-font-name" style={{ fontFamily: `"${family}", sans-serif` }}>{family}</div>
                  <div className="fp-font-sample" style={{ fontFamily: `"${family}", sans-serif` }}>The quick brown fox</div>
                </div>
                {value === family && <span className="fp-font-check">✓</span>}
              </div>
            ))}
            <div className="fp-popover-section-label">All fonts</div>
          </>
        )}

        {results.length === 0 ? (
          <div className="fp-font-empty">No fonts found for "{query}"</div>
        ) : (
          results.map((font, idx) => (
            <div
              key={font.family}
              ref={el => observeItem(el)}
              data-font-family={font.family}
              className={`fp-font-item${value === font.family ? ' fp-font-item--selected' : ''}${activeIndex === idx ? ' fp-font-item--active' : ''}`}
              onClick={() => onSelect(font.family)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <div className="fp-font-item-text">
                <div className="fp-font-name" style={{ fontFamily: `"${font.family}", sans-serif` }}>{font.family}</div>
                <div className="fp-font-sample" style={{ fontFamily: `"${font.family}", sans-serif` }}>The quick brown fox</div>
              </div>
              {value === font.family && <span className="fp-font-check">✓</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
