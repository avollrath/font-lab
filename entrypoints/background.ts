import type { TypographyRule } from '../src/types';

export default defineBackground(() => {
  // Open side panel when toolbar icon is clicked
  (browser as any).sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;
    const url = tab.url ?? '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;
    try {
      await (browser as any).sidePanel.open({ tabId: tab.id });
    } catch (e) {
      console.error('Font Lab: failed to open side panel', e);
    }
  });

  // Forward PAGE_NAVIGATED from content scripts to the side panel
  browser.runtime.onMessage.addListener((message: { type: string; origin?: string }) => {
    if (message.type === 'PAGE_NAVIGATED') {
      browser.runtime.sendMessage(message).catch(() => {});
    }
    return false;
  });

  // Track which tab the side panel is associated with
  let associatedTabId: number | null = null;

  browser.runtime.onMessage.addListener((
    message: { type: string; tabId?: number; rules?: TypographyRule[]; globalEnabled?: boolean },
    _sender
  ) => {
    // Side panel registers the tab it's working on
    if (message.type === 'REGISTER_TAB' && message.tabId) {
      associatedTabId = message.tabId;
    }

    // Side panel pushes rules — send directly to the associated tab
    if (message.type === 'PUSH_STYLES' && message.rules !== undefined) {
      const sendToTab = async (tabId: number) => {
        browser.tabs.sendMessage(tabId, {
          type: 'APPLY_STYLES',
          rules: message.rules,
          globalEnabled: message.globalEnabled ?? true,
        }).catch(() => {});
      };

      if (associatedTabId) {
        sendToTab(associatedTabId);
      } else {
        // Fallback: find any non-extension active tab
        browser.tabs.query({ active: true }).then(tabs => {
          const tab = tabs.find(t => t.url && !t.url.startsWith('chrome') && !t.url.startsWith('about'));
          if (tab?.id) sendToTab(tab.id);
        });
      }
    }
    return false;
  });
});
