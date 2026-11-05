import { useState, useRef, useCallback } from 'react';
import { useTypographyStore } from '../../../src/stores/typographyStore';
import { FontPickerPopover } from './FontPickerPopover';
import type { TypographyRule } from '../../../src/types';

interface Props {
  rule: TypographyRule | null;
}

const WEIGHTS = [
  { value: 100, label: 'Thin 100' },
  { value: 200, label: 'ExtraLight 200' },
  { value: 300, label: 'Light 300' },
  { value: 400, label: 'Regular 400' },
  { value: 500, label: 'Medium 500' },
  { value: 600, label: 'SemiBold 600' },
  { value: 700, label: 'Bold 700' },
  { value: 800, label: 'ExtraBold 800' },
  { value: 900, label: 'Black 900' },
];

const MAX_RECENT = 8;

export function TypographyInspector({ rule }: Props) {
  const { updateRule, resetRule, copyRuleTo, rules } = useTypographyStore();
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCopyTo, setShowCopyTo] = useState(false);
  const [copyTargets, setCopyTargets] = useState<Set<string>>(new Set());
  const [recentFonts, setRecentFonts] = useState<string[]>([]);
  const fontBtnRef = useRef<HTMLButtonElement>(null);

  const openFontPicker = useCallback(() => {
    if (fontBtnRef.current) {
      setAnchorRect(fontBtnRef.current.getBoundingClientRect());
      setFontPickerOpen(true);
    }
  }, []);

  const handleFontSelect = useCallback((family: string) => {
    if (!rule) return;
    updateRule(rule.id, { fontFamily: { enabled: true, value: family } });
    setRecentFonts(prev => {
      const next = [family, ...prev.filter(f => f !== family)].slice(0, MAX_RECENT);
      return next;
    });
    setFontPickerOpen(false);
  }, [rule, updateRule]);

  const clearFont = useCallback(() => {
    if (!rule) return;
    updateRule(rule.id, { fontFamily: undefined });
  }, [rule, updateRule]);

  if (!rule) {
    return (
      <div className="fp-inspector">
        <div className="fp-inspector-empty">
          Select an element above to edit its typography.
        </div>
      </div>
    );
  }

  const fontFamily = rule.fontFamily?.enabled ? rule.fontFamily.value : '';

  const setSize = (val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) {
      const unit = rule.fontSize?.value?.unit ?? 'px';
      updateRule(rule.id, { fontSize: { enabled: true, value: { value: n, unit } } });
    }
  };

  const setSizeUnit = (unit: 'px' | 'rem' | 'em') => {
    const v = rule.fontSize?.value?.value ?? 16;
    updateRule(rule.id, { fontSize: { enabled: true, value: { value: v, unit } } });
  };

  const setWeight = (w: number) => {
    updateRule(rule.id, { fontWeight: { enabled: true, value: w } });
  };

  const setLineHeight = (v: string) => {
    updateRule(rule.id, { lineHeight: { enabled: true, value: v } });
  };

  const setTracking = (v: string) => {
    updateRule(rule.id, { letterSpacing: { enabled: true, value: v } });
  };

  const setFontStyle = (v: 'normal' | 'italic') => {
    updateRule(rule.id, { fontStyle: { enabled: true, value: v } });
  };

  const setTextTransform = (v: 'none' | 'uppercase' | 'lowercase' | 'capitalize') => {
    updateRule(rule.id, { textTransform: { enabled: true, value: v } });
  };

  const handleCopyTo = () => {
    if (copyTargets.size === 0) return;
    copyRuleTo(rule.id, Array.from(copyTargets));
    setShowCopyTo(false);
    setCopyTargets(new Set());
  };

  const otherRules = rules.filter(r => r.id !== rule.id);

  return (
    <div className="fp-inspector">
      <div className="fp-inspector-inner">
        {/* Header */}
        <div className="fp-inspector-header">
          <div className="fp-inspector-heading">
            <div className="fp-inspector-title">Typography</div>
            <div className="fp-inspector-subtitle">{rule.label}</div>
          </div>
          <div className="fp-inspector-actions">
            <button
              className="fp-btn fp-btn--sm"
              onClick={() => resetRule(rule.id)}
              title="Reset all overrides for this element"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Font family */}
        <div className="fp-prop-section">
          <div className="fp-prop">
            <div className="fp-prop-label">Font family</div>
            <div className="fp-font-btn-row">
              <button
                ref={fontBtnRef}
                className="fp-font-btn"
                onClick={openFontPicker}
                style={fontFamily ? { fontFamily: `"${fontFamily}", sans-serif` } : undefined}
              >
                <span className={`fp-font-btn-text${!fontFamily ? ' fp-font-btn-text--muted' : ''}`}>
                  {fontFamily || 'No font override'}
                </span>
                <span className="fp-font-btn-chevron">▾</span>
              </button>
              {fontFamily && (
                <button className="fp-prop-clear" onClick={clearFont} title="Clear font override">✕</button>
              )}
            </div>
          </div>
        </div>

        {/* Weight + Size */}
        <div className="fp-prop-section">
          <div className="fp-grid-2">
            {/* Weight */}
            <div className="fp-prop">
              <div className="fp-prop-label">Weight</div>
              <div className="fp-prop-control">
                <select
                  className={`fp-select${!rule.fontWeight?.enabled ? ' fp-select--muted' : ''}`}
                  value={rule.fontWeight?.enabled ? rule.fontWeight.value : ''}
                  onChange={e => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) setWeight(v);
                  }}
                  onFocus={() => {
                    if (!rule.fontWeight?.enabled) {
                      updateRule(rule.id, { fontWeight: { enabled: true, value: 400 } });
                    }
                  }}
                >
                  {!rule.fontWeight?.enabled && <option value="">Auto</option>}
                  {WEIGHTS.map(w => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
                {rule.fontWeight?.enabled && (
                  <button
                    className="fp-prop-clear"
                    onClick={() => updateRule(rule.id, { fontWeight: undefined })}
                    title="Clear weight override"
                  >✕</button>
                )}
              </div>
            </div>

            {/* Size */}
            <div className="fp-prop">
              <div className="fp-prop-label">Size</div>
              <div className="fp-prop-control">
                <input
                  type="number"
                  className={`fp-input${!rule.fontSize?.enabled ? ' fp-input--muted' : ''}`}
                  style={{ minWidth: 0 }}
                  placeholder="—"
                  min={0}
                  step={1}
                  value={rule.fontSize?.enabled ? (rule.fontSize.value?.value ?? '') : ''}
                  onChange={e => setSize(e.target.value)}
                  onFocus={() => {
                    if (!rule.fontSize?.enabled) {
                      updateRule(rule.id, { fontSize: { enabled: true, value: { value: 16, unit: 'px' } } });
                    }
                  }}
                />
                <select
                  className="fp-select"
                  style={{ flex: 'none', width: '50px', padding: '5px 3px' }}
                  value={rule.fontSize?.value?.unit ?? 'px'}
                  onChange={e => setSizeUnit(e.target.value as 'px' | 'rem' | 'em')}
                >
                  <option value="px">px</option>
                  <option value="rem">rem</option>
                  <option value="em">em</option>
                </select>
                {rule.fontSize?.enabled && (
                  <button
                    className="fp-prop-clear"
                    onClick={() => updateRule(rule.id, { fontSize: undefined })}
                    title="Clear size override"
                  >✕</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Line height + Tracking */}
        <div className="fp-prop-section">
          <div className="fp-grid-2">
            {/* Line height */}
            <div className="fp-prop">
              <div className="fp-prop-label">Line height</div>
              <div className="fp-prop-control">
                <input
                  type="text"
                  className={`fp-input${!rule.lineHeight?.enabled ? ' fp-input--muted' : ''}`}
                  placeholder="—"
                  value={rule.lineHeight?.enabled ? (rule.lineHeight.value ?? '') : ''}
                  onChange={e => setLineHeight(e.target.value)}
                  onFocus={() => {
                    if (!rule.lineHeight?.enabled) {
                      updateRule(rule.id, { lineHeight: { enabled: true, value: '1.5' } });
                    }
                  }}
                />
                {rule.lineHeight?.enabled && (
                  <button
                    className="fp-prop-clear"
                    onClick={() => updateRule(rule.id, { lineHeight: undefined })}
                    title="Clear line height"
                  >✕</button>
                )}
              </div>
            </div>

            {/* Tracking */}
            <div className="fp-prop">
              <div className="fp-prop-label">Tracking</div>
              <div className="fp-prop-control">
                <input
                  type="text"
                  className={`fp-input${!rule.letterSpacing?.enabled ? ' fp-input--muted' : ''}`}
                  placeholder="—"
                  value={rule.letterSpacing?.enabled ? (rule.letterSpacing.value ?? '') : ''}
                  onChange={e => setTracking(e.target.value)}
                  onFocus={() => {
                    if (!rule.letterSpacing?.enabled) {
                      updateRule(rule.id, { letterSpacing: { enabled: true, value: '0px' } });
                    }
                  }}
                />
                {rule.letterSpacing?.enabled && (
                  <button
                    className="fp-prop-clear"
                    onClick={() => updateRule(rule.id, { letterSpacing: undefined })}
                    title="Clear tracking"
                  >✕</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced */}
        <button
          className="fp-advanced-toggle"
          onClick={() => setShowAdvanced(v => !v)}
        >
          <span className={`fp-advanced-chevron${showAdvanced ? ' fp-advanced-chevron--open' : ''}`}>▼</span>
          <span>Advanced</span>
        </button>

        {showAdvanced && (
          <div className="fp-prop-section" style={{ marginTop: '8px' }}>
            <div className="fp-grid-2">
              {/* Style */}
              <div className="fp-prop">
                <div className="fp-prop-label">Style</div>
                <div className="fp-prop-control">
                  <select
                    className={`fp-select${!rule.fontStyle?.enabled ? ' fp-select--muted' : ''}`}
                    value={rule.fontStyle?.enabled ? rule.fontStyle.value : ''}
                    onChange={e => setFontStyle(e.target.value as 'normal' | 'italic')}
                    onFocus={() => {
                      if (!rule.fontStyle?.enabled) {
                        updateRule(rule.id, { fontStyle: { enabled: true, value: 'normal' } });
                      }
                    }}
                  >
                    {!rule.fontStyle?.enabled && <option value="">Auto</option>}
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                  </select>
                  {rule.fontStyle?.enabled && (
                    <button
                      className="fp-prop-clear"
                      onClick={() => updateRule(rule.id, { fontStyle: undefined })}
                    >✕</button>
                  )}
                </div>
              </div>

              {/* Transform */}
              <div className="fp-prop">
                <div className="fp-prop-label">Transform</div>
                <div className="fp-prop-control">
                  <select
                    className={`fp-select${!rule.textTransform?.enabled ? ' fp-select--muted' : ''}`}
                    value={rule.textTransform?.enabled ? rule.textTransform.value : ''}
                    onChange={e => setTextTransform(e.target.value as 'none' | 'uppercase' | 'lowercase' | 'capitalize')}
                    onFocus={() => {
                      if (!rule.textTransform?.enabled) {
                        updateRule(rule.id, { textTransform: { enabled: true, value: 'none' } });
                      }
                    }}
                  >
                    {!rule.textTransform?.enabled && <option value="">Auto</option>}
                    <option value="none">None</option>
                    <option value="uppercase">Uppercase</option>
                    <option value="lowercase">Lowercase</option>
                    <option value="capitalize">Capitalize</option>
                  </select>
                  {rule.textTransform?.enabled && (
                    <button
                      className="fp-prop-clear"
                      onClick={() => updateRule(rule.id, { textTransform: undefined })}
                    >✕</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Copy to */}
        <div className="fp-copy-to-section">
          {!showCopyTo ? (
            <button
              className="fp-btn fp-btn--sm"
              onClick={() => setShowCopyTo(true)}
              style={{ marginTop: '4px' }}
            >
              Copy style to…
            </button>
          ) : (
            <>
              <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--fp-text-xs)', marginBottom: '4px' }}>
                Copy style to:
              </div>
              <div className="fp-copy-to-list">
                {otherRules.map(r => (
                  <label key={r.id} className="fp-copy-to-item">
                    <input
                      type="checkbox"
                      checked={copyTargets.has(r.id)}
                      onChange={() => {
                        setCopyTargets(prev => {
                          const next = new Set(prev);
                          if (next.has(r.id)) next.delete(r.id); else next.add(r.id);
                          return next;
                        });
                      }}
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span className="fp-copy-to-tag">{r.selector}</span>
                    <span className="fp-copy-to-label">{r.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button
                  className="fp-btn fp-btn--primary fp-btn--sm"
                  disabled={copyTargets.size === 0}
                  onClick={handleCopyTo}
                >
                  Apply to {copyTargets.size || ''} element{copyTargets.size !== 1 ? 's' : ''}
                </button>
                <button
                  className="fp-btn fp-btn--sm"
                  onClick={() => { setShowCopyTo(false); setCopyTargets(new Set()); }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {fontPickerOpen && anchorRect && (
        <FontPickerPopover
          value={fontFamily}
          onSelect={handleFontSelect}
          onClose={() => setFontPickerOpen(false)}
          anchorRect={anchorRect}
          recentFonts={recentFonts}
        />
      )}
    </div>
  );
}
