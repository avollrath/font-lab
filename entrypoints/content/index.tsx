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
    host.style.cssText = 'position: fixed; z-index: 2147483647; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; overflow: visible;';
    document.documentElement.appendChild(host);

    const shadowRoot = host.attachShadow({ mode: 'open' });

    // Stop ALL native events that originate inside the shadow root from reaching
    // the host page's document/window listeners. We do this at the shadow root
    // (not the panel React div) so it works regardless of which child element
    // the event target is — including the font dropdown and its items.
    // We use capture=true so we intercept before any bubbling handler sees it.
    // Block all events originating inside the shadow root from reaching
    // host-page document/window listeners (capture phase, before bubbling).
    function stopIfInsideShadow(e: Event) {
      const path = e.composedPath();
      if (path.includes(host) && path[0] !== host) {
        e.stopPropagation();
      }
    }
    ['mousedown','mouseup','click','pointerdown','pointerup',
     'keydown','keyup','touchstart','touchend','focusin','focusout'
    ].forEach(type => document.addEventListener(type, stopIfInsideShadow, true));

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
