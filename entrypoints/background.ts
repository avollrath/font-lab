export default defineBackground(() => {
  // Open side panel when toolbar icon is clicked
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

  // Allow the side panel to open for all URLs
  try {
    (browser as any).sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (_) {}

  // Forward PAGE_NAVIGATED from content scripts to the side panel
  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'PAGE_NAVIGATED') {
      // Broadcast to all extension pages (side panel picks it up)
      browser.runtime.sendMessage(message).catch(() => {});
    }
    return false;
  });

  // After side panel saves styles, push SYNC_STYLES to the active content script
  browser.runtime.onMessage.addListener((message, _sender) => {
    if (message.type === 'STYLES_UPDATED') {
      browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        const tab = tabs[0];
        if (tab?.id) {
          browser.tabs.sendMessage(tab.id, { type: 'SYNC_STYLES' }).catch(() => {});
        }
      });
    }
    return false;
  });
});
