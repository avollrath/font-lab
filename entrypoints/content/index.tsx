import { updateStylesheet, removeStylesheet } from '../../src/services/typographyEngine';
import { loadSiteConfig } from '../../src/services/storage';

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

    // Listen for style commands from the side panel
    browser.runtime.onMessage.addListener((message: { type: string }) => {
      if (message.type === 'SYNC_STYLES') {
        loadSiteConfig(origin).then(config => {
          updateStylesheet(config.rules, config.enabled);
        }).catch(() => {});
      }
      if (message.type === 'REMOVE_STYLES') {
        removeStylesheet();
      }
      return false;
    });
  },
});
