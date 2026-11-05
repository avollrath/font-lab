import { useState, useEffect, useCallback } from 'react';
import { useTypographyStore } from '../../src/stores/typographyStore';
import { ElementSelector } from '../content/editor/ElementSelector';
import { TypographyInspector } from '../content/editor/TypographyInspector';
import { PresetManager } from '../content/editor/PresetManager';
import { ExportPanel } from '../content/editor/ExportPanel';
import { ElementPicker } from '../content/editor/ElementPicker';

type Section = 'elements' | 'presets' | 'export';

export function SidePanel() {
  const { globalEnabled, setGlobalEnabled, resetAll, initialize, isLoading, rules } = useTypographyStore();
  const [activeSection, setActiveSection] = useState<Section>('elements');
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [pickerActive, setPickerActive] = useState(false);

  // Get the active tab's origin and register with background
  useEffect(() => {
    async function getOrigin() {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const tab = tabs.find(t => t.url && !t.url.startsWith('chrome') && !t.url.startsWith('about'));
        if (tab?.id && tab?.url) {
          browser.runtime.sendMessage({ type: 'REGISTER_TAB', tabId: tab.id }).catch(() => {});
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
        console.error('FontPickle: failed to get active tab', e);
      }
      // Fallback for testing: accept ?origin= param
      const params = new URLSearchParams(window.location.search);
      const testOrigin = params.get('origin');
      if (testOrigin) {
        setCurrentOrigin(testOrigin);
        await initialize(testOrigin);
        browser.tabs.query({}).then(tabs => {
          const tab = tabs.find(t => t.url?.includes(new URL(testOrigin).hostname));
          if (tab?.id) browser.runtime.sendMessage({ type: 'REGISTER_TAB', tabId: tab.id }).catch(() => {});
        }).catch(() => {});
      }
    }
    getOrigin();
  }, [initialize]);

  // Re-initialize when the user navigates to a new page
  useEffect(() => {
    const handleMessage = (message: { type: string; origin?: string }) => {
      if (message.type === 'PAGE_NAVIGATED' && message.origin && message.origin !== currentOrigin) {
        setCurrentOrigin(message.origin);
        setSelectedRuleId(null);
        initialize(message.origin);
      }
    };
    browser.runtime.onMessage.addListener(handleMessage);
    return () => browser.runtime.onMessage.removeListener(handleMessage);
  }, [currentOrigin, initialize]);

  // Auto-select first rule when loaded
  useEffect(() => {
    if (!isLoading && rules.length > 0 && !selectedRuleId) {
      const firstEnabled = rules.find(r => r.enabled);
      setSelectedRuleId(firstEnabled?.id ?? rules[0].id);
    }
  }, [isLoading, rules, selectedRuleId]);

  const handleReset = useCallback(() => {
    if (window.confirm('Reset all typography changes for this site?')) {
      resetAll();
      setSelectedRuleId(null);
    }
  }, [resetAll]);

  const isRestrictedPage = !currentOrigin ||
    currentOrigin.startsWith('chrome://') ||
    currentOrigin.startsWith('chrome-extension://');

  const selectedRule = rules.find(r => r.id === selectedRuleId) ?? null;

  const activeCount = rules.filter(r => r.enabled).length;

  return (
    <div className="fp-app">
      {/* Header */}
      <header className="fp-header">
        <div className="fp-header-left">
          <div className="fp-logo">F</div>
          <span className="fp-title">FontPickle</span>
          <span
            className={`fp-status${globalEnabled && !isRestrictedPage ? ' fp-status--active' : ''}`}
            title={globalEnabled ? 'Styles active' : 'Styles disabled'}
          />
        </div>
        <div className="fp-header-actions">
          <button
            className={`fp-icon-btn${globalEnabled ? ' fp-icon-btn--active' : ''}`}
            onClick={() => setGlobalEnabled(!globalEnabled)}
            title={globalEnabled ? 'Disable all styles' : 'Enable all styles'}
            disabled={isRestrictedPage}
          >
            {globalEnabled ? '●' : '○'}
          </button>
          <button
            className="fp-icon-btn"
            onClick={handleReset}
            title="Reset all styles for this site"
            disabled={isRestrictedPage}
          >
            ↺
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="fp-nav" role="tablist">
        {(['elements', 'presets', 'export'] as Section[]).map(s => (
          <button
            key={s}
            className={`fp-nav-tab${activeSection === s ? ' fp-nav-tab--active' : ''}`}
            onClick={() => setActiveSection(s)}
            role="tab"
            aria-selected={activeSection === s}
          >
            {s === 'elements' ? `Elements${activeCount > 0 ? ` · ${activeCount}` : ''}` : s === 'presets' ? 'Presets' : 'Export'}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="fp-content" role="tabpanel">
        {isRestrictedPage ? (
          <div className="fp-restricted">
            <div className="fp-restricted-icon">⊘</div>
            <div className="fp-restricted-title">Can't run here</div>
            <div className="fp-restricted-sub">Navigate to a regular website to use FontPickle.</div>
          </div>
        ) : isLoading ? (
          <div className="fp-loading">Loading…</div>
        ) : (
          <>
            {pickerActive && (
              <ElementPicker
                onSelect={() => setPickerActive(false)}
                onCancel={() => setPickerActive(false)}
              />
            )}

            {activeSection === 'elements' && (
              <ElementSelector
                selectedRuleId={selectedRuleId}
                onSelect={setSelectedRuleId}
                onPickerActivate={() => setPickerActive(true)}
              />
            )}

            {activeSection === 'elements' && (
              <TypographyInspector rule={selectedRule} />
            )}

            {activeSection === 'presets' && <PresetManager />}
            {activeSection === 'export' && <ExportPanel />}
          </>
        )}
      </main>
    </div>
  );
}
