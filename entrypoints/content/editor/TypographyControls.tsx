import { useTypographyStore } from '../../../src/stores/typographyStore';
import type { TypographyRule } from '../../../src/types';

interface Props {
  rule: TypographyRule;
}

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

export function TypographyControls({ rule }: Props) {
  const { updateRule } = useTypographyStore();

  const update = (field: keyof TypographyRule, enabled: boolean, value: unknown) => {
    updateRule(rule.id, { [field]: { enabled, value } } as Partial<TypographyRule>);
  };

  const clear = (field: keyof TypographyRule) => {
    updateRule(rule.id, { [field]: undefined } as Partial<TypographyRule>);
  };

  return (
    <>
      {/* Font Size */}
      <div className="fl-control-row">
        <span className="fl-control-label">Font size</span>
        {rule.fontSize && (
          <input
            type="checkbox"
            checked={rule.fontSize.enabled}
            onChange={e => update('fontSize', e.target.checked, rule.fontSize!.value)}
            title="Enable font size"
          />
        )}
        <input
          type="number"
          className="fl-control-input"
          style={{ width: '60px', flex: 'none' }}
          placeholder="16"
          value={rule.fontSize?.value?.value ?? ''}
          disabled={rule.fontSize ? !rule.fontSize.enabled : false}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) update('fontSize', true, { value: v, unit: rule.fontSize?.value?.unit ?? 'px' });
          }}
        />
        <select
          className="fl-control-select"
          value={rule.fontSize?.value?.unit ?? 'px'}
          disabled={rule.fontSize ? !rule.fontSize.enabled : false}
          onChange={e => update('fontSize', true, { value: rule.fontSize?.value?.value ?? 16, unit: e.target.value })}
        >
          <option value="px">px</option>
          <option value="rem">rem</option>
          <option value="em">em</option>
        </select>
        {rule.fontSize && (
          <button className="fl-reset-btn" onClick={() => clear('fontSize')} title="Clear">✕</button>
        )}
      </div>

      {/* Font Weight */}
      <div className="fl-control-row">
        <span className="fl-control-label">Weight</span>
        {rule.fontWeight && (
          <input
            type="checkbox"
            checked={rule.fontWeight.enabled}
            onChange={e => update('fontWeight', e.target.checked, rule.fontWeight!.value)}
            title="Enable font weight"
          />
        )}
        <select
          className="fl-control-select"
          style={{ flex: 1 }}
          value={rule.fontWeight?.value ?? ''}
          disabled={rule.fontWeight ? !rule.fontWeight.enabled : false}
          onChange={e => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) update('fontWeight', true, v);
          }}
        >
          <option value="">Select...</option>
          {WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        {rule.fontWeight && (
          <button className="fl-reset-btn" onClick={() => clear('fontWeight')} title="Clear">✕</button>
        )}
      </div>

      {/* Line Height */}
      <div className="fl-control-row">
        <span className="fl-control-label">Line height</span>
        {rule.lineHeight && (
          <input
            type="checkbox"
            checked={rule.lineHeight.enabled}
            onChange={e => update('lineHeight', e.target.checked, rule.lineHeight!.value)}
            title="Enable line height"
          />
        )}
        <input
          type="text"
          className="fl-control-input"
          placeholder="1.5"
          value={rule.lineHeight?.value ?? ''}
          disabled={rule.lineHeight ? !rule.lineHeight.enabled : false}
          onChange={e => update('lineHeight', true, e.target.value)}
        />
        {rule.lineHeight && (
          <button className="fl-reset-btn" onClick={() => clear('lineHeight')} title="Clear">✕</button>
        )}
      </div>

      {/* Letter Spacing */}
      <div className="fl-control-row">
        <span className="fl-control-label">Letter space</span>
        {rule.letterSpacing && (
          <input
            type="checkbox"
            checked={rule.letterSpacing.enabled}
            onChange={e => update('letterSpacing', e.target.checked, rule.letterSpacing!.value)}
            title="Enable letter spacing"
          />
        )}
        <input
          type="text"
          className="fl-control-input"
          placeholder="0px"
          value={rule.letterSpacing?.value ?? ''}
          disabled={rule.letterSpacing ? !rule.letterSpacing.enabled : false}
          onChange={e => update('letterSpacing', true, e.target.value)}
        />
        {rule.letterSpacing && (
          <button className="fl-reset-btn" onClick={() => clear('letterSpacing')} title="Clear">✕</button>
        )}
      </div>

      {/* Font Style */}
      <div className="fl-control-row">
        <span className="fl-control-label">Style</span>
        {rule.fontStyle && (
          <input
            type="checkbox"
            checked={rule.fontStyle.enabled}
            onChange={e => update('fontStyle', e.target.checked, rule.fontStyle!.value)}
            title="Enable font style"
          />
        )}
        <select
          className="fl-control-select"
          style={{ flex: 1 }}
          value={rule.fontStyle?.value ?? ''}
          disabled={rule.fontStyle ? !rule.fontStyle.enabled : false}
          onChange={e => update('fontStyle', true, e.target.value)}
        >
          <option value="">Select...</option>
          <option value="normal">Normal</option>
          <option value="italic">Italic</option>
        </select>
        {rule.fontStyle && (
          <button className="fl-reset-btn" onClick={() => clear('fontStyle')} title="Clear">✕</button>
        )}
      </div>

      {/* Text Transform */}
      <div className="fl-control-row">
        <span className="fl-control-label">Transform</span>
        {rule.textTransform && (
          <input
            type="checkbox"
            checked={rule.textTransform.enabled}
            onChange={e => update('textTransform', e.target.checked, rule.textTransform!.value)}
            title="Enable text transform"
          />
        )}
        <select
          className="fl-control-select"
          style={{ flex: 1 }}
          value={rule.textTransform?.value ?? ''}
          disabled={rule.textTransform ? !rule.textTransform.enabled : false}
          onChange={e => update('textTransform', true, e.target.value)}
        >
          <option value="">Select...</option>
          <option value="none">None</option>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="capitalize">Capitalize</option>
        </select>
        {rule.textTransform && (
          <button className="fl-reset-btn" onClick={() => clear('textTransform')} title="Clear">✕</button>
        )}
      </div>
    </>
  );
}
