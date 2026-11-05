import { updateStylesheet, removeStylesheet } from '../../src/services/typographyEngine';
import { loadSiteConfig } from '../../src/services/storage';
import type { TypographyRule } from '../../src/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_end',
  main() {
    const origin = window.location.origin;

    // Restore saved styles immediately on page load
    loadSiteConfig(origin).then(config => {
      updateStylesheet(config.rules, config.enabled);
    }).catch(() => {});

    // Tell the side panel which origin this tab is showing
    browser.runtime.sendMessage({ type: 'PAGE_NAVIGATED', origin }).catch(() => {});

    // Listen for commands from background/side panel
    browser.runtime.onMessage.addListener((message: {
      type: string;
      rules?: TypographyRule[];
      globalEnabled?: boolean;
    }) => {
      if (message.type === 'APPLY_STYLES' && message.rules) {
        // Rules pushed directly — no storage round-trip needed
        updateStylesheet(message.rules, message.globalEnabled ?? true);
      }
      if (message.type === 'REMOVE_STYLES') {
        removeStylesheet();
      }
      return false;
    });
  },
});
