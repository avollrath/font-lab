import { useState } from 'react';
import { useTypographyStore } from '../../../src/stores/typographyStore';
import { ElementRule } from './ElementRule';
import type { TypographyRule } from '../../../src/types';

interface Props {
  onPickerActivate: () => void;
}

const CATEGORIES = [
  { id: 'headings', label: 'Headings' },
  { id: 'body', label: 'Body' },
  { id: 'interactive', label: 'Interactive' },
  { id: 'global', label: 'Global' },
  { id: 'custom', label: 'Custom' },
] as const;

export function ElementList({ onPickerActivate }: Props) {
  const { rules, enableCategory, disableCategory, addCustomRule } = useTypographyStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newSelector, setNewSelector] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCustom = () => {
    const selector = newSelector.trim();
    const label = newLabel.trim() || selector;
    if (!selector) return;
    const rule: TypographyRule = {
      id: `custom-${Date.now()}`,
      selector,
      label,
      category: 'custom',
      enabled: true,
    };
    addCustomRule(rule);
    setNewSelector('');
    setNewLabel('');
  };

  return (
    <div>
      {CATEGORIES.map(cat => {
        const catRules = rules.filter(r => r.category === cat.id);
        if (catRules.length === 0 && cat.id !== 'custom') return null;
        return (
          <div key={cat.id} className="fl-category">
            <div className="fl-category-header">
              <span className="fl-category-title">{cat.label}</span>
              {cat.id !== 'custom' && (
                <div className="fl-category-actions">
                  <button className="fl-category-btn" onClick={() => enableCategory(cat.id)}>All on</button>
                  <button className="fl-category-btn" onClick={() => disableCategory(cat.id)}>All off</button>
                </div>
              )}
            </div>
            {catRules.map(rule => (
              <ElementRule
                key={rule.id}
                rule={rule}
                expanded={expandedIds.has(rule.id)}
                onToggleExpand={() => toggleExpand(rule.id)}
              />
            ))}
            {cat.id === 'custom' && (
              <div className="fl-add-custom">
                <div className="fl-input-row">
                  <input
                    className="fl-input-full"
                    placeholder="CSS selector (e.g. .hero h2)"
                    value={newSelector}
                    onChange={e => setNewSelector(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                  />
                  <input
                    className="fl-input-full"
                    placeholder="Label (optional)"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                  />
                  <button className="fl-btn fl-btn--primary" onClick={handleAddCustom}>Add</button>
                </div>
                <div style={{ padding: '0 0 8px 0' }}>
                  <button className="fl-btn" onClick={onPickerActivate} style={{ fontSize: '11px' }}>
                    Pick element from page
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
