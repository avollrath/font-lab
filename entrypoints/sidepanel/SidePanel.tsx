import { useState, useEffect } from 'react';
import { useTypographyStore } from '../../src/stores/typographyStore';
import { ElementList } from '../content/editor/ElementList';
import { PresetManager } from '../content/editor/PresetManager';
import { ExportPanel } from '../content/editor/ExportPanel';

type Section = 'elements' | 'presets' | 'export';

export function SidePanel() {
  const { globalEnabled, setGlobalEnabled, resetAll, initialize, isLoading } = useTypographyStore();
  const [activeSection, setActiveSection] = useState<Section>('elements');
  const [currentOrigin, setCurrentOrigin] = useState('');

  // Get the active tab's origin and initialize
  useEffect(() => {
    async function getOrigin() {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        // Filter out the side panel tab itself and other extension pages
        const tab = tabs.find(t => t.url && !t.url.startsWith('chrome') && !t.url.startsWith('about'));
        if (tab?.url) {
          try {
            const origin = new URL(tab.url).origin;
            setCurrentOrigin(origin);
            await initialize(origin);
            return;
          } catch {
            // invalid URL
          }
        }
      } catch (e) {
        console.error('Font Lab: failed to get active tab', e);
      }
      // Fallback for testing: accept ?origin= param
      const params = new URLSearchParams(window.location.search);
      const testOrigin = params.get('origin');
      if (testOrigin) {
        setCurrentOrigin(testOrigin);
        await initialize(testOrigin);
      }
    }
    getOrigin();
  }, [initialize]);

  // Re-initialize when the user navigates to a new page
  useEffect(() => {
    const handleMessage = (message: { type: string; origin?: string }) => {
      if (message.type === 'PAGE_NAVIGATED' && message.origin && message.origin !== currentOrigin) {
        setCurrentOrigin(message.origin);
        initialize(message.origin);
      }
    };
    browser.runtime.onMessage.addListener(handleMessage);
    return () => browser.runtime.onMessage.removeListener(handleMessage);
  }, [currentOrigin, initialize]);

  const handleReset = () => {
    if (window.confirm('Reset all typography changes for this site?')) resetAll();
  };

  const isRestrictedPage = !currentOrigin ||
    currentOrigin.startsWith('chrome://') ||
    currentOrigin.startsWith('chrome-extension://');

  return (
    <div className="fl-app">
      <header className="fl-header">
        <div className="fl-header-left">
          <div className="fl-logo">F</div>
          <span className="fl-title">Font Lab</span>
          <span className={`fl-status${globalEnabled && !isRestrictedPage ? ' fl-status--active' : ''}`} />
        </div>
        <div className="fl-header-actions">
          <button
            className={`fl-btn-icon${globalEnabled ? ' fl-btn-icon--active' : ''}`}
            onClick={() => setGlobalEnabled(!globalEnabled)}
            title={globalEnabled ? 'Disable styles' : 'Enable styles'}
            disabled={isRestrictedPage}
          >
            {globalEnabled ? '●' : '○'}
          </button>
          <button
            className="fl-btn-icon"
            onClick={handleReset}
            title="Reset all"
            disabled={isRestrictedPage}
          >
            ↺
          </button>
        </div>
      </header>

      {isRestrictedPage ? (
        <div className="fl-empty">
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚫</div>
          <div>Font Lab can't run on this page.</div>
          <div style={{ marginTop: '6px', fontSize: '11px' }}>Navigate to a regular website to get started.</div>
        </div>
      ) : (
        <>
          <nav className="fl-nav" role="tablist">
            {(['elements', 'presets', 'export'] as Section[]).map(s => (
              <button
                key={s}
                className={`fl-nav-tab${activeSection === s ? ' fl-nav-tab--active' : ''}`}
                onClick={() => setActiveSection(s)}
                role="tab"
                aria-selected={activeSection === s}
              >
                {s === 'elements' ? 'Elements' : s === 'presets' ? 'Presets' : 'Export'}
              </button>
            ))}
          </nav>

          <main className="fl-content" role="tabpanel">
            {isLoading ? (
              <div className="fl-loading">Loading…</div>
            ) : (
              <>
                {activeSection === 'elements' && <ElementList onPickerActivate={() => {}} />}
                {activeSection === 'presets' && <PresetManager />}
                {activeSection === 'export' && <ExportPanel />}
              </>
            )}
          </main>
        </>
      )}
    </div>
  );
}
