// Helper function to evaluate XPath
function getElementByXPath(path) {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
}

function extractAndSaveData() {
  const url = window.location.href;
  const urlParts = url.split("/");

  if (!url.includes("/episode/")) return;

  // Expected URL structure: .../episode/[season-name]/[season-number+episode]
  // Example: https://uflix.to/episode/spider-noir-2026/S01E02?api=stream4
  const showSlug = urlParts[4];
  const episodeString = urlParts[5].split("?")[0];

  // Extract Season and Episode numbers using Regex
  const match = episodeString.match(/S(\d+)E(\d+)/i);
  if (!match) return;

  const seasonNumber = match[1];
  const episodeNumber = match[2];

  // We use a slight delay because streaming video players and DOM elements sometimes load a fraction of a second after the URL changes
  setTimeout(() => {
    const imgNode = getElementByXPath(
      "//img[contains(@src, '/images/posters')]",
    );
    const titleNode = getElementByXPath(
      "//img[contains(@src, '/images/posters')]/ancestor::div[contains(@class, 'col-md-auto')]/following-sibling::div//h1",
    );

    const imageUrl = imgNode ? imgNode.src : "";
    const showName = titleNode
      ? titleNode.innerText.trim()
      : showSlug.replace(/-/g, " ");

    // Create the unique key: season_name + season_number
    const storageKey = `${showName}_S${seasonNumber}`;

    // Fetch existing data to avoid overwriting previous episodes
    chrome.storage.local.get([storageKey], (result) => {
      let seasonData = result[storageKey] || {
        showName: showName,
        seasonNumber: seasonNumber,
        imageUrl: imageUrl,
        episodes: {},
      };

      // Add or update the current episode (prevents duplicates naturally)
      seasonData.episodes[episodeNumber] = url;

      // Save back to Chrome local storage
      chrome.storage.local.set({ [storageKey]: seasonData }, () => {
        console.log(
          `UFlix Tracker: Saved ${showName} S${seasonNumber} E${episodeNumber}`,
        );
      });
    });
  }, 2000);
}

// 1. Run on initial page load
extractAndSaveData();

// 2. Run when moving to a new episode without reloading (Triggered by background.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "urlChanged") {
    extractAndSaveData();
  }
});
