import { useState, useEffect, useRef, useCallback } from 'react';
import { useTypographyStore } from '../../../src/stores/typographyStore';
import { ElementList } from './ElementList';
import { PresetManager } from './PresetManager';
import { ExportPanel } from './ExportPanel';
import { ElementPicker } from './ElementPicker';

interface Props {
  shadowRoot: ShadowRoot;
  onClose: () => void;
}

type Section = 'elements' | 'presets' | 'export';

const PANEL_CSS = `
*, *::before, *::after { box-sizing: border-box; }
.fl-panel {
  position: fixed;
  width: 460px;
  max-width: calc(100vw - 16px);
  max-height: 85vh;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
  color: #1a202c;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  --fl-bg: #ffffff;
  --fl-border: #e2e8f0;
  --fl-text: #1a202c;
  --fl-text-muted: #718096;
  --fl-surface: #f7fafc;
  --fl-surface-2: #edf2f7;
  --fl-accent: #3b6ef0;
  --fl-accent-hover: #2d5cd4;
  --fl-hover: rgba(0,0,0,0.04);
  --fl-separator: #e2e8f0;
  --fl-input-bg: #f7fafc;
  --fl-danger: #e53e3e;
}
@media (prefers-color-scheme: dark) {
  .fl-panel {
    background: #1a1a2e;
    border-color: #2d3748;
    color: #e2e8f0;
    --fl-bg: #1a1a2e;
    --fl-border: #2d3748;
    --fl-text: #e2e8f0;
    --fl-text-muted: #718096;
    --fl-surface: #16213e;
    --fl-surface-2: #0f3460;
    --fl-accent: #4f86f7;
    --fl-accent-hover: #6b9ff8;
    --fl-hover: rgba(255,255,255,0.06);
    --fl-separator: #2d3748;
    --fl-input-bg: #2d3748;
    --fl-danger: #fc8181;
  }
}
.fl-panel--minimized { max-height: fit-content; }
.fl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: grab;
  border-bottom: 1px solid var(--fl-separator);
  background: var(--fl-surface);
  border-radius: 12px 12px 0 0;
  flex-shrink: 0;
}
.fl-header:active { cursor: grabbing; }
.fl-header-left { display: flex; align-items: center; gap: 8px; }
.fl-logo {
  width: 24px; height: 24px; background: var(--fl-accent); color: white;
  border-radius: 6px; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0;
}
.fl-title { font-weight: 600; font-size: 14px; }
.fl-status { width: 7px; height: 7px; border-radius: 50%; background: var(--fl-text-muted); }
.fl-status--active { background: #48bb78; }
.fl-header-actions { display: flex; align-items: center; gap: 2px; }
.fl-btn-icon {
  width: 28px; height: 28px; border: none; background: transparent;
  color: var(--fl-text-muted); border-radius: 6px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.fl-btn-icon:hover { background: var(--fl-hover); color: var(--fl-text); }
.fl-btn-icon--active { color: #48bb78; }
.fl-btn-icon--close:hover { background: rgba(229,62,62,0.1); color: var(--fl-danger); }
.fl-nav { display: flex; border-bottom: 1px solid var(--fl-separator); background: var(--fl-surface); flex-shrink: 0; }
.fl-nav-tab {
  flex: 1; padding: 8px; border: none; background: transparent;
  color: var(--fl-text-muted); font-size: 12px; font-weight: 500; cursor: pointer;
  border-bottom: 2px solid transparent; letter-spacing: 0.02em; text-transform: uppercase;
}
.fl-nav-tab:hover { color: var(--fl-text); }
.fl-nav-tab--active { color: var(--fl-accent); border-bottom-color: var(--fl-accent); }
.fl-content { overflow-y: auto; flex: 1; scrollbar-width: thin; }
.fl-content::-webkit-scrollbar { width: 4px; }
.fl-content::-webkit-scrollbar-thumb { background: var(--fl-border); border-radius: 2px; }
.fl-category { border-bottom: 1px solid var(--fl-separator); }
.fl-category-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; background: var(--fl-surface);
}
.fl-category-title {
  font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--fl-text-muted);
}
.fl-category-actions { display: flex; gap: 4px; }
.fl-category-btn {
  padding: 2px 6px; border: 1px solid var(--fl-border); background: transparent;
  color: var(--fl-text-muted); border-radius: 4px; font-size: 10px; cursor: pointer;
}
.fl-category-btn:hover, .fl-category-btn--active { background: var(--fl-accent); color: white; border-color: var(--fl-accent); }
.fl-element-row { border-bottom: 1px solid var(--fl-separator); }
.fl-element-header {
  display: flex; align-items: center; padding: 8px 12px; gap: 8px; cursor: pointer;
}
.fl-element-header:hover { background: var(--fl-hover); }
.fl-toggle {
  width: 32px; height: 18px; border-radius: 9px; border: none; cursor: pointer;
  position: relative; background: var(--fl-border); flex-shrink: 0;
}
.fl-toggle--on { background: var(--fl-accent); }
.fl-toggle::after {
  content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%;
  background: white; top: 2px; left: 2px; transition: transform 0.2s;
}
.fl-toggle--on::after { transform: translateX(14px); }
.fl-element-tag { font-family: monospace; font-size: 12px; font-weight: 600; color: var(--fl-accent); min-width: 36px; }
.fl-element-label { flex: 1; font-size: 12px; color: var(--fl-text); }
.fl-element-font { font-size: 11px; color: var(--fl-text-muted); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fl-expand-btn {
  width: 20px; height: 20px; border: none; background: transparent;
  color: var(--fl-text-muted); cursor: pointer; font-size: 10px;
  display: flex; align-items: center; justify-content: center; border-radius: 4px;
}
.fl-expand-btn:hover { background: var(--fl-hover); }
.fl-element-controls { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 10px; background: var(--fl-surface); }
.fl-control-row { display: flex; align-items: center; gap: 6px; overflow: hidden; min-width: 0; }
.fl-control-label { font-size: 11px; color: var(--fl-text-muted); min-width: 68px; flex-shrink: 0; }
.fl-control-input {
  flex: 1; padding: 4px 7px; border: 1px solid var(--fl-border); border-radius: 5px;
  background: var(--fl-input-bg); color: var(--fl-text); font-size: 12px; outline: none;
}
.fl-control-input:focus { border-color: var(--fl-accent); }
.fl-control-input:disabled { opacity: 0.4; }
.fl-control-select {
  padding: 4px 6px; border: 1px solid var(--fl-border); border-radius: 5px;
  background: var(--fl-input-bg); color: var(--fl-text); font-size: 12px; cursor: pointer; outline: none;
}
.fl-reset-btn {
  width: 20px; height: 20px; border: none; background: transparent;
  color: var(--fl-text-muted); cursor: pointer; border-radius: 4px; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
}
.fl-reset-btn:hover { background: var(--fl-hover); color: var(--fl-danger); }
.fl-font-picker { position: relative; min-width: 0; overflow: hidden; }
.fl-font-picker-trigger {
  width: 100%; min-width: 0; padding: 6px 10px; border: 1px solid var(--fl-border); border-radius: 6px;
  background: var(--fl-input-bg); color: var(--fl-text); font-size: 12px; cursor: pointer;
  text-align: left; display: flex; align-items: center; justify-content: space-between; overflow: hidden;
}
.fl-font-picker-trigger span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fl-font-picker-trigger:hover { border-color: var(--fl-accent); }
.fl-font-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: var(--fl-bg); border: 1px solid var(--fl-border); border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15); z-index: 100; overflow: hidden;
  max-height: 360px; display: flex; flex-direction: column;
}
.fl-font-search { padding: 8px; border-bottom: 1px solid var(--fl-separator); flex-shrink: 0; }
.fl-font-search-input {
  width: 100%; padding: 6px 8px; border: 1px solid var(--fl-border); border-radius: 5px;
  background: var(--fl-input-bg); color: var(--fl-text); font-size: 12px; outline: none;
}
.fl-font-search-input:focus { border-color: var(--fl-accent); }
.fl-font-list { overflow-y: auto; flex: 1; }
.fl-font-list-item {
  display: flex; align-items: center; padding: 7px 10px; cursor: pointer; gap: 8px;
  border-bottom: 1px solid var(--fl-separator);
}
.fl-font-list-item:hover { background: var(--fl-hover); }
.fl-font-list-item--selected { background: rgba(59,110,240,0.08); }
.fl-font-preview-name { font-size: 14px; font-weight: 400; color: var(--fl-text); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.fl-font-preview-sample { font-size: 11px; color: var(--fl-text-muted); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; opacity: 0.7; }
.fl-font-preview-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.fl-font-cat-badge { font-size: 10px; color: var(--fl-text-muted); padding: 1px 5px; border-radius: 3px; background: var(--fl-surface-2); flex-shrink: 0; align-self: flex-start; }
.fl-presets { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.fl-preset-item {
  display: flex; align-items: center; padding: 8px 10px;
  border: 1px solid var(--fl-border); border-radius: 8px; gap: 8px; background: var(--fl-surface);
}
.fl-preset-name { flex: 1; font-size: 13px; font-weight: 500; }
.fl-btn {
  padding: 6px 12px; border: 1px solid var(--fl-border); border-radius: 6px;
  background: transparent; color: var(--fl-text); font-size: 12px; cursor: pointer;
}
.fl-btn:hover { border-color: var(--fl-accent); color: var(--fl-accent); }
.fl-btn--primary { background: var(--fl-accent); border-color: var(--fl-accent); color: white; }
.fl-btn--primary:hover { background: var(--fl-accent-hover); color: white; }
.fl-btn--danger:hover { border-color: var(--fl-danger); color: var(--fl-danger); }
.fl-export { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.fl-export-code {
  background: var(--fl-surface); border: 1px solid var(--fl-border); border-radius: 8px;
  padding: 10px; font-family: monospace; font-size: 11px; line-height: 1.5;
  overflow: auto; max-height: 200px; white-space: pre; color: var(--fl-text);
}
.fl-export-actions { display: flex; gap: 8px; }
.fl-empty { padding: 24px; text-align: center; color: var(--fl-text-muted); font-size: 12px; }
.fl-loading { padding: 20px; text-align: center; color: var(--fl-text-muted); font-size: 12px; }
.fl-section-title { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--fl-text-muted); padding: 10px 12px 4px; }
.fl-copy-to { border: 1px solid var(--fl-border); border-radius: 8px; padding: 10px; background: var(--fl-surface); }
.fl-copy-to-title { font-size: 11px; font-weight: 600; color: var(--fl-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
.fl-copy-to-list { display: flex; flex-direction: column; gap: 2px; max-height: 160px; overflow-y: auto; }
.fl-copy-to-item { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 4px; cursor: pointer; font-size: 12px; }
.fl-copy-to-item:hover { background: var(--fl-hover); }
.fl-copy-to-item input[type=checkbox] { flex-shrink: 0; cursor: pointer; }
.fl-copy-to-tag { font-family: monospace; font-size: 11px; color: var(--fl-accent); min-width: 32px; flex-shrink: 0; }
.fl-copy-to-label { color: var(--fl-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fl-add-custom { padding: 8px 12px; border-top: 1px solid var(--fl-separator); }
.fl-input-row { display: flex; gap: 6px; padding: 8px 12px; flex-wrap: wrap; }
.fl-input-full { flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--fl-border); border-radius: 5px; background: var(--fl-input-bg); color: var(--fl-text); font-size: 12px; outline: none; }
.fl-input-full:focus { border-color: var(--fl-accent); }
`;

export function FloatingPanel({ shadowRoot, onClose }: Props) {
  const { globalEnabled, setGlobalEnabled, resetAll, initialize, isLoading } = useTypographyStore();
  const [position, setPosition] = useState({ x: window.innerWidth - 440, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('elements');
  const [isPickerActive, setIsPickerActive] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const o = window.location.origin;
    initialize(o);
  }, [initialize]);

  useEffect(() => {
    const existingStyle = shadowRoot.querySelector('#font-lab-panel-styles');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'font-lab-panel-styles';
      style.textContent = PANEL_CSS;
      shadowRoot.insertBefore(style, shadowRoot.firstChild);
    }
  }, [shadowRoot]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panelX: position.x, panelY: position.y };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const panelW = panelRef.current?.offsetWidth ?? 420;
      const panelH = panelRef.current?.offsetHeight ?? 600;
      const x = Math.max(0, Math.min(window.innerWidth - panelW, dragStart.current.panelX + dx));
      const y = Math.max(0, Math.min(window.innerHeight - panelH, dragStart.current.panelY + dy));
      setPosition({ x, y });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === 'F') {
        setGlobalEnabled(!globalEnabled);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [globalEnabled, setGlobalEnabled]);

  return (
    <div
      ref={panelRef}
      className={`fl-panel${minimized ? ' fl-panel--minimized' : ''}`}
      style={{ left: position.x, top: position.y, pointerEvents: 'all' }}
      role="dialog"
      aria-label="Font Lab Typography Editor"
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="fl-header" onMouseDown={onMouseDown}>
        <div className="fl-header-left">
          <div className="fl-logo">F</div>
          <span className="fl-title">Font Lab</span>
          <span className={`fl-status${globalEnabled ? ' fl-status--active' : ''}`} />
        </div>
        <div className="fl-header-actions">
          <button
            className={`fl-btn-icon${globalEnabled ? ' fl-btn-icon--active' : ''}`}
            onClick={() => setGlobalEnabled(!globalEnabled)}
            title={globalEnabled ? 'Disable' : 'Enable'}
          >
            {globalEnabled ? '●' : '○'}
          </button>
          <button
            className="fl-btn-icon"
            onClick={() => { if (window.confirm('Reset all typography changes for this site?')) resetAll(); }}
            title="Reset all"
          >
            ↺
          </button>
          <button className="fl-btn-icon" onClick={() => setMinimized(m => !m)} title={minimized ? 'Expand' : 'Minimize'}>
            {minimized ? '▲' : '▼'}
          </button>
          <button className="fl-btn-icon fl-btn-icon--close" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="fl-nav" role="tablist">
            {(['elements', 'presets', 'export'] as Section[]).map(s => (
              <button
                key={s}
                className={`fl-nav-tab${activeSection === s ? ' fl-nav-tab--active' : ''}`}
                onClick={() => setActiveSection(s)}
                role="tab"
                aria-selected={activeSection === s}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="fl-content" role="tabpanel">
            {isLoading ? (
              <div className="fl-loading">Loading...</div>
            ) : (
              <>
                {activeSection === 'elements' && (
                  <ElementList onPickerActivate={() => setIsPickerActive(true)} />
                )}
                {activeSection === 'presets' && <PresetManager />}
                {activeSection === 'export' && <ExportPanel />}
              </>
            )}
          </div>
        </>
      )}

      {isPickerActive && (
        <ElementPicker
          onSelect={() => setIsPickerActive(false)}
          onCancel={() => setIsPickerActive(false)}
        />
      )}
    </div>
  );
}
