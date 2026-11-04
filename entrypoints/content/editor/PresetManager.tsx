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
    <div className="fl-presets">
      <div className="fl-section-title">Save current as preset</div>
      <div className="fl-input-row">
        <input
          className="fl-input-full"
          placeholder="Preset name..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <button className="fl-btn fl-btn--primary" onClick={handleSave}>Save</button>
      </div>

      {presets.length === 0 ? (
        <div className="fl-empty">No saved presets yet. Customize typography and save as a preset.</div>
      ) : (
        <>
          <div className="fl-section-title">Saved presets</div>
          {presets.map(preset => (
            <div key={preset.id} className="fl-preset-item">
              <span className="fl-preset-name">{preset.name}</span>
              <button className="fl-btn" style={{ fontSize: '11px' }} onClick={() => applyPreset(preset)}>Apply</button>
              {!preset.isBuiltIn && (
                <button
                  className="fl-btn fl-btn--danger"
                  style={{ fontSize: '11px' }}
                  onClick={() => {
                    if (window.confirm(`Delete preset "${preset.name}"?`)) deletePreset(preset.id);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
