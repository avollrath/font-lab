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
  const { toggleRule, resetRule, removeCustomRule } = useTypographyStore();

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
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
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
        </div>
      )}
    </div>
  );
}
