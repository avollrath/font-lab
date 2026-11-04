import { useTypographyStore } from '../../../src/stores/typographyStore';
import type { TypographyRule } from '../../../src/types';

interface Props {
  rule: TypographyRule;
}

const WEIGHTS = [
  { value: 100, label: 'Thin 100' },
  { value: 200, label: 'Extra Light 200' },
  { value: 300, label: 'Light 300' },
  { value: 400, label: 'Regular 400' },
  { value: 500, label: 'Medium 500' },
  { value: 600, label: 'Semi Bold 600' },
  { value: 700, label: 'Bold 700' },
  { value: 800, label: 'Extra Bold 800' },
  { value: 900, label: 'Black 900' },
];

interface ControlRowProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

function ControlRow({ label, active, onToggle, onClear, children }: ControlRowProps) {
  return (
    <div className="fl-control-row">
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '72px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={active}
          onChange={onToggle}
          style={{ flexShrink: 0, cursor: 'pointer' }}
        />
        <span className="fl-control-label" style={{ minWidth: 'unset' }}>{label}</span>
      </label>
      <div style={{ flex: 1, display: 'flex', gap: '4px', alignItems: 'center', opacity: active ? 1 : 0.45 }}>
        {children}
      </div>
      {active && (
        <button className="fl-reset-btn" onClick={onClear} title="Remove override">✕</button>
      )}
    </div>
  );
}

export function TypographyControls({ rule }: Props) {
  const { updateRule } = useTypographyStore();

  const setSize = (value: number | string, unit?: 'px' | 'rem' | 'em') => {
    const currentUnit = rule.fontSize?.value?.unit ?? 'px';
    const currentValue = rule.fontSize?.value?.value ?? 16;
    if (typeof value === 'number') {
      updateRule(rule.id, { fontSize: { enabled: true, value: { value, unit: unit ?? currentUnit } } });
    } else {
      const u = value as 'px' | 'rem' | 'em';
      updateRule(rule.id, { fontSize: { enabled: true, value: { value: currentValue, unit: u } } });
    }
  };

  const setWeight = (weight: number) => {
    updateRule(rule.id, { fontWeight: { enabled: true, value: weight } });
  };

  return (
    <>
      {/* Font Size */}
      <ControlRow
        label="Size"
        active={!!rule.fontSize?.enabled}
        onToggle={() => {
          if (rule.fontSize?.enabled) {
            updateRule(rule.id, { fontSize: { ...rule.fontSize, enabled: false } });
          } else if (rule.fontSize) {
            updateRule(rule.id, { fontSize: { ...rule.fontSize, enabled: true } });
          } else {
            updateRule(rule.id, { fontSize: { enabled: true, value: { value: 16, unit: 'px' } } });
          }
        }}
        onClear={() => updateRule(rule.id, { fontSize: undefined })}
      >
        <input
          type="number"
          className="fl-control-input"
          style={{ width: '60px', flex: 'none' }}
          placeholder="16"
          min={0}
          step={1}
          value={rule.fontSize?.value?.value ?? ''}
          disabled={!rule.fontSize?.enabled}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= 0) setSize(v);
          }}
        />
        <select
          className="fl-control-select"
          value={rule.fontSize?.value?.unit ?? 'px'}
          disabled={!rule.fontSize?.enabled}
          onChange={e => setSize(e.target.value)}
        >
          <option value="px">px</option>
          <option value="rem">rem</option>
          <option value="em">em</option>
        </select>
      </ControlRow>

      {/* Font Weight */}
      <ControlRow
        label="Weight"
        active={!!rule.fontWeight?.enabled}
        onToggle={() => {
          if (rule.fontWeight?.enabled) {
            updateRule(rule.id, { fontWeight: { ...rule.fontWeight, enabled: false } });
          } else if (rule.fontWeight) {
            updateRule(rule.id, { fontWeight: { ...rule.fontWeight, enabled: true } });
          } else {
            updateRule(rule.id, { fontWeight: { enabled: true, value: 400 } });
          }
        }}
        onClear={() => updateRule(rule.id, { fontWeight: undefined })}
      >
        <select
          className="fl-control-select"
          style={{ flex: 1 }}
          value={rule.fontWeight?.value ?? 400}
          disabled={!rule.fontWeight?.enabled}
          onChange={e => setWeight(parseInt(e.target.value))}
        >
          {WEIGHTS.map(w => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
      </ControlRow>

      {/* Line Height */}
      <ControlRow
        label="Line height"
        active={!!rule.lineHeight?.enabled}
        onToggle={() => {
          if (rule.lineHeight?.enabled) {
            updateRule(rule.id, { lineHeight: { ...rule.lineHeight, enabled: false } });
          } else if (rule.lineHeight) {
            updateRule(rule.id, { lineHeight: { ...rule.lineHeight, enabled: true } });
          } else {
            updateRule(rule.id, { lineHeight: { enabled: true, value: '1.5' } });
          }
        }}
        onClear={() => updateRule(rule.id, { lineHeight: undefined })}
      >
        <input
          type="text"
          className="fl-control-input"
          placeholder="1.5"
          value={rule.lineHeight?.value ?? ''}
          disabled={!rule.lineHeight?.enabled}
          onChange={e => updateRule(rule.id, { lineHeight: { enabled: true, value: e.target.value } })}
        />
      </ControlRow>

      {/* Letter Spacing */}
      <ControlRow
        label="Tracking"
        active={!!rule.letterSpacing?.enabled}
        onToggle={() => {
          if (rule.letterSpacing?.enabled) {
            updateRule(rule.id, { letterSpacing: { ...rule.letterSpacing, enabled: false } });
          } else if (rule.letterSpacing) {
            updateRule(rule.id, { letterSpacing: { ...rule.letterSpacing, enabled: true } });
          } else {
            updateRule(rule.id, { letterSpacing: { enabled: true, value: '0px' } });
          }
        }}
        onClear={() => updateRule(rule.id, { letterSpacing: undefined })}
      >
        <input
          type="text"
          className="fl-control-input"
          placeholder="0px"
          value={rule.letterSpacing?.value ?? ''}
          disabled={!rule.letterSpacing?.enabled}
          onChange={e => updateRule(rule.id, { letterSpacing: { enabled: true, value: e.target.value } })}
        />
      </ControlRow>

      {/* Font Style */}
      <ControlRow
        label="Style"
        active={!!rule.fontStyle?.enabled}
        onToggle={() => {
          if (rule.fontStyle?.enabled) {
            updateRule(rule.id, { fontStyle: { ...rule.fontStyle, enabled: false } });
          } else if (rule.fontStyle) {
            updateRule(rule.id, { fontStyle: { ...rule.fontStyle, enabled: true } });
          } else {
            updateRule(rule.id, { fontStyle: { enabled: true, value: 'italic' } });
          }
        }}
        onClear={() => updateRule(rule.id, { fontStyle: undefined })}
      >
        <select
          className="fl-control-select"
          style={{ flex: 1 }}
          value={rule.fontStyle?.value ?? 'normal'}
          disabled={!rule.fontStyle?.enabled}
          onChange={e => updateRule(rule.id, { fontStyle: { enabled: true, value: e.target.value as 'normal' | 'italic' } })}
        >
          <option value="normal">Normal</option>
          <option value="italic">Italic</option>
        </select>
      </ControlRow>

      {/* Text Transform */}
      <ControlRow
        label="Transform"
        active={!!rule.textTransform?.enabled}
        onToggle={() => {
          if (rule.textTransform?.enabled) {
            updateRule(rule.id, { textTransform: { ...rule.textTransform, enabled: false } });
          } else if (rule.textTransform) {
            updateRule(rule.id, { textTransform: { ...rule.textTransform, enabled: true } });
          } else {
            updateRule(rule.id, { textTransform: { enabled: true, value: 'uppercase' } });
          }
        }}
        onClear={() => updateRule(rule.id, { textTransform: undefined })}
      >
        <select
          className="fl-control-select"
          style={{ flex: 1 }}
          value={rule.textTransform?.value ?? 'none'}
          disabled={!rule.textTransform?.enabled}
          onChange={e => updateRule(rule.id, {
            textTransform: { enabled: true, value: e.target.value as 'none' | 'uppercase' | 'lowercase' | 'capitalize' }
          })}
        >
          <option value="none">None</option>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="capitalize">Capitalize</option>
        </select>
      </ControlRow>
    </>
  );
}
