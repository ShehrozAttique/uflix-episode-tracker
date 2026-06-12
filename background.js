// Listen for URL changes via the History API (common on streaming sites)
chrome.webNavigation.onHistoryStateUpdated.addListener(
  (details) => {
    if (details.url.includes("uflix.to/episode/")) {
      // Tell the content script that the URL has changed
      chrome.tabs
        .sendMessage(details.tabId, { action: "urlChanged", url: details.url })
        .catch(() => {});
    }
  },
  { url: [{ hostContains: "uflix.to" }] },
);
