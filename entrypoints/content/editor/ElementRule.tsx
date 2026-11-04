import { useState } from 'react';
import { useTypographyStore } from '../../../src/stores/typographyStore';
import { FontPicker } from './FontPicker';
import { TypographyControls } from './TypographyControls';
import type { TypographyRule } from '../../../src/types';

interface Props {
  rule: TypographyRule;
  expanded: boolean;
  onToggleExpand: () => void;
}

export function ElementRule({ rule, expanded, onToggleExpand }: Props) {
  const { toggleRule, resetRule, removeCustomRule, copyRuleTo, rules } = useTypographyStore();
  const [showCopyTo, setShowCopyTo] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());

  const otherRules = rules.filter(r => r.id !== rule.id);

  const toggleTarget = (id: string) => {
    setSelectedTargets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCopy = () => {
    if (selectedTargets.size === 0) return;
    copyRuleTo(rule.id, Array.from(selectedTargets));
    setShowCopyTo(false);
    setSelectedTargets(new Set());
  };

  const hasStyle = !!(
    rule.fontFamily?.enabled || rule.fontSize?.enabled ||
    rule.fontWeight?.enabled || rule.lineHeight?.enabled ||
    rule.letterSpacing?.enabled || rule.fontStyle?.enabled || rule.textTransform?.enabled
  );

  return (
    <div className="fl-element-row">
      <div className="fl-element-header" onClick={onToggleExpand}>
        <button
          className={`fl-toggle${rule.enabled ? ' fl-toggle--on' : ''}`}
          onClick={e => { e.stopPropagation(); toggleRule(rule.id); }}
          aria-pressed={rule.enabled}
          aria-label={`Toggle ${rule.label}`}
        />
        <span className="fl-element-tag">{rule.selector}</span>
        <span className="fl-element-label">{rule.label}</span>
        {rule.fontFamily?.enabled && rule.fontFamily.value && (
          <span className="fl-element-font">{rule.fontFamily.value}</span>
        )}
        <button className="fl-expand-btn" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="fl-element-controls">
          <FontPicker rule={rule} />
          <TypographyControls rule={rule} />

          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {hasStyle && (
              <button
                className="fl-btn"
                style={{ fontSize: '11px' }}
                onClick={e => { e.stopPropagation(); setShowCopyTo(v => !v); setSelectedTargets(new Set()); }}
              >
                Copy style to…
              </button>
            )}
            <button
              className="fl-btn"
              style={{ fontSize: '11px' }}
              onClick={() => resetRule(rule.id)}
            >
              Reset
            </button>
            {rule.category === 'custom' && (
              <button
                className="fl-btn fl-btn--danger"
                style={{ fontSize: '11px' }}
                onClick={() => removeCustomRule(rule.id)}
              >
                Remove
              </button>
            )}
          </div>

          {showCopyTo && (
            <div className="fl-copy-to">
              <div className="fl-copy-to-title">Copy style to:</div>
              <div className="fl-copy-to-list">
                {otherRules.map(r => (
                  <label key={r.id} className="fl-copy-to-item">
                    <input
                      type="checkbox"
                      checked={selectedTargets.has(r.id)}
                      onChange={() => toggleTarget(r.id)}
                    />
                    <span className="fl-copy-to-tag">{r.selector}</span>
                    <span className="fl-copy-to-label">{r.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button
                  className="fl-btn fl-btn--primary"
                  style={{ fontSize: '11px' }}
                  disabled={selectedTargets.size === 0}
                  onClick={handleCopy}
                >
                  Apply to {selectedTargets.size > 0 ? selectedTargets.size : ''} element{selectedTargets.size !== 1 ? 's' : ''}
                </button>
                <button
                  className="fl-btn"
                  style={{ fontSize: '11px' }}
                  onClick={() => { setShowCopyTo(false); setSelectedTargets(new Set()); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
