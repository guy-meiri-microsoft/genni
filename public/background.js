// Background service worker for the LocalStorage JSON Manager extension
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Create a new tab with the extension's main page
    await chrome.tabs.create({
      url: chrome.runtime.getURL('index.html'),
      active: true
    });
  } catch (error) {
    console.error('Error opening extension tab:', error);
  }
});
