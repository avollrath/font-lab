import ReactDOM from 'react-dom/client';
import { FloatingPanel } from './editor/FloatingPanel';
import { updateStylesheet } from '../../src/services/typographyEngine';
import { loadSiteConfig } from '../../src/services/storage';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_end',
  main() {
    if (document.getElementById('font-lab-root')) return;

    const origin = window.location.origin;

    loadSiteConfig(origin).then(config => {
      updateStylesheet(config.rules, config.enabled);
    }).catch(() => {});

    const host = document.createElement('div');
    host.id = 'font-lab-root';
    host.style.cssText = 'position: fixed; z-index: 2147483647; top: 0; left: 0; width: 0; height: 0; pointer-events: none;';
    document.documentElement.appendChild(host);

    const shadowRoot = host.attachShadow({ mode: 'open' });

    const container = document.createElement('div');
    container.id = 'font-lab-container';
    shadowRoot.appendChild(container);

    let isOpen = false;
    let reactRoot: ReactDOM.Root | null = null;

    function openPanel() {
      if (!reactRoot) {
        reactRoot = ReactDOM.createRoot(container);
      }
      isOpen = true;
      reactRoot.render(
        <FloatingPanel
          shadowRoot={shadowRoot}
          onClose={() => closePanel()}
        />
      );
    }

    function closePanel() {
      isOpen = false;
      if (reactRoot) {
        reactRoot.render(null);
      }
    }

    browser.runtime.onMessage.addListener((message: { type: string }) => {
      if (message.type === 'TOGGLE_PANEL') {
        if (isOpen) {
          closePanel();
        } else {
          openPanel();
        }
        return true;
      }
    });
  },
});
