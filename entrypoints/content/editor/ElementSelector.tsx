import { useState } from 'react';
import { useTypographyStore } from '../../../src/stores/typographyStore';
import { ElementRow } from './ElementRow';
import type { TypographyRule } from '../../../src/types';

interface Props {
  selectedRuleId: string | null;
  onSelect: (id: string) => void;
  onPickerActivate: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  headings: 'Headings',
  body: 'Body',
  interactive: 'Interactive',
  global: 'Global',
  custom: 'Custom',
};

const CATEGORY_ORDER = ['headings', 'body', 'interactive', 'global', 'custom'];

export function ElementSelector({ selectedRuleId, onSelect, onPickerActivate }: Props) {
  const { rules, toggleRule, enableCategory, disableCategory, addCustomRule, removeCustomRule } = useTypographyStore();
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newSelector, setNewSelector] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleAddCustom = () => {
    const selector = newSelector.trim();
    if (!selector) return;
    const label = newLabel.trim() || selector;
    const rule: TypographyRule = {
      id: `custom-${Date.now()}`,
      selector,
      label,
      category: 'custom',
      enabled: true,
    };
    addCustomRule(rule);
    onSelect(rule.id);
    setNewSelector('');
    setNewLabel('');
    setShowAddCustom(false);
  };

  const grouped: Record<string, TypographyRule[]> = {};
  for (const cat of CATEGORY_ORDER) {
    const catRules = rules.filter(r => r.category === cat);
    if (catRules.length > 0) {
      grouped[cat] = catRules;
    }
  }

  return (
    <div className="fp-elements-layout">
      <div className="fp-element-list">
        {CATEGORY_ORDER.map(cat => {
          const catRules = grouped[cat];
          if (!catRules || catRules.length === 0) return null;
          return (
            <div key={cat}>
              <div className="fp-category-divider">
                <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                {cat !== 'custom' && (
                  <div className="fp-category-actions">
                    <button
                      className="fp-cat-action-btn"
                      onClick={() => enableCategory(cat)}
                      title={`Enable all ${CATEGORY_LABELS[cat]}`}
                    >
                      All on
                    </button>
                    <button
                      className="fp-cat-action-btn"
                      onClick={() => disableCategory(cat)}
                      title={`Disable all ${CATEGORY_LABELS[cat]}`}
                    >
                      All off
                    </button>
                  </div>
                )}
              </div>
              {catRules.map(rule => (
                <ElementRow
                  key={rule.id}
                  rule={rule}
                  selected={rule.id === selectedRuleId}
                  onSelect={() => onSelect(rule.id)}
                  onToggle={() => toggleRule(rule.id)}
                  onRemove={rule.category === 'custom' ? () => removeCustomRule(rule.id) : undefined}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div className="fp-add-custom">
        <button
          className="fp-add-custom-trigger"
          onClick={() => setShowAddCustom(v => !v)}
        >
          <span style={{ fontSize: '14px', lineHeight: 1 }}>{showAddCustom ? '−' : '+'}</span>
          <span>Add custom element</span>
        </button>

        {showAddCustom && (
          <div className="fp-add-custom-form">
            <input
              className="fp-text-input"
              placeholder="CSS selector (e.g. .hero h2)"
              value={newSelector}
              onChange={e => setNewSelector(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
              autoFocus
            />
            <div className="fp-add-custom-row">
              <input
                className="fp-text-input"
                style={{ flex: 1 }}
                placeholder="Label (optional)"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
              />
              <button
                className="fp-btn fp-btn--primary fp-btn--sm"
                onClick={handleAddCustom}
                disabled={!newSelector.trim()}
              >
                Add
              </button>
            </div>
            <button
              className="fp-btn fp-btn--sm"
              onClick={() => { onPickerActivate(); setShowAddCustom(false); }}
              style={{ alignSelf: 'flex-start' }}
            >
              Pick from page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
