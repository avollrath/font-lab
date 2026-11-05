import type { TypographyRule } from '../../../src/types';

interface Props {
  rule: TypographyRule;
  selected: boolean;
  onSelect: () => void;
  onToggle: (e: React.MouseEvent) => void;
  onRemove?: () => void;
}

export function ElementRow({ rule, selected, onSelect, onToggle, onRemove }: Props) {
  const fontName = rule.fontFamily?.enabled && rule.fontFamily.value ? rule.fontFamily.value : null;

  return (
    <div
      className={`fp-element-row${selected ? ' fp-element-row--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="fp-element-row-inner">
        <button
          className={`fp-toggle${rule.enabled ? ' fp-toggle--on' : ''}`}
          onClick={e => { e.stopPropagation(); onToggle(e); }}
          aria-pressed={rule.enabled}
          aria-label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.label}`}
          title={rule.enabled ? 'Disable override' : 'Enable override'}
        />
        <span className="fp-tag">{rule.selector}</span>
        <span className="fp-row-label">{rule.label}</span>
        {fontName && <span className="fp-row-font">{fontName}</span>}
        {onRemove && (
          <button
            className="fp-row-remove"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            title="Remove custom rule"
            aria-label={`Remove ${rule.label}`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
