export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;

    const url = tab.url ?? '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('https://chrome.google.com/webstore')) {
      return;
    }

    try {
      await browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
    } catch {
      try {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-scripts/content.js'],
        });
        await browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
      } catch (err) {
        console.error('Font Lab: Failed to inject content script', err);
      }
    }
  });
});
