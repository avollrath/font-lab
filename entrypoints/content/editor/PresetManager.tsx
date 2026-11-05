import { useState } from 'react';
import { useTypographyStore } from '../../../src/stores/typographyStore';

export function PresetManager() {
  const { presets, savePreset, applyPreset, deletePreset } = useTypographyStore();
  const [name, setName] = useState('');

  const handleSave = () => {
    const n = name.trim();
    if (!n) return;
    savePreset(n);
    setName('');
  };

  return (
    <div className="fp-presets">
      <div className="fp-save-preset-form">
        <input
          className="fp-text-input"
          style={{ flex: 1 }}
          placeholder="Preset name…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <button
          className="fp-btn fp-btn--primary fp-btn--sm"
          onClick={handleSave}
          disabled={!name.trim()}
        >
          Save current
        </button>
      </div>

      {presets.length === 0 ? (
        <div className="fp-empty-state">
          <div className="fp-empty-state-icon">◫</div>
          <div>No saved presets yet.</div>
          <div style={{ fontSize: '11px' }}>Customize typography and save as a preset above.</div>
        </div>
      ) : (
        <>
          <div className="fp-preset-list-label">Saved presets</div>
          {presets.map(preset => (
            <div key={preset.id} className="fp-preset-row">
              <span className="fp-preset-name">{preset.name}</span>
              <div className="fp-preset-actions">
                <button
                  className="fp-btn fp-btn--sm"
                  onClick={() => applyPreset(preset)}
                >
                  Apply
                </button>
                {!preset.isBuiltIn && (
                  <button
                    className="fp-btn fp-btn--sm fp-btn--danger"
                    onClick={() => {
                      if (window.confirm(`Delete preset "${preset.name}"?`)) deletePreset(preset.id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
