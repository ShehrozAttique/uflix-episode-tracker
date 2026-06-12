document.addEventListener("DOMContentLoaded", () => {
  const listContainer = document.getElementById("tracker-list");
  const clearAllBtn = document.getElementById("clear-all");

  function loadShows() {
    chrome.storage.local.get(null, (items) => {
      listContainer.innerHTML = "";
      const keys = Object.keys(items);

      if (keys.length === 0) {
        listContainer.innerHTML =
          '<p class="empty-state">No tracked seasons. Stream an episode to begin.</p>';
        return;
      }

      keys.forEach((key) => {
        const data = items[key];
        if (!data.showName) return;

        const card = document.createElement("div");
        card.className = "show-card";

        let episodesHtml = "";
        const epNumbers = Object.keys(data.episodes).sort(
          (a, b) => parseInt(a) - parseInt(b),
        );

        epNumbers.forEach((ep) => {
          episodesHtml += `<li><a href="${data.episodes[ep]}" target="_blank">Episode ${ep}</a></li>`;
        });

        const latestEpStr = epNumbers[epNumbers.length - 1]; // Highest episode logged
        const latestUrl = data.episodes[latestEpStr];

        // Construct the Base Show URL and swap '/episode/' for '/serie/'
        const urlParts = latestUrl.split("/");
        const showBaseUrl = urlParts
          .slice(0, 5)
          .join("/")
          .replace("/episode/", "/serie/");

        // Generate Next Episode URL based on the latest logged episode
        const nextEpNum = parseInt(latestEpStr, 10) + 1;
        const nextEpPadded = nextEpNum.toString().padStart(2, "0");
        const nextEpisodeUrl = latestUrl.replace(
          /S(\d+)E(\d+)/i,
          (match, seasonMatch) => {
            return `S${seasonMatch}E${nextEpPadded}`;
          },
        );

        const playNextIconSvg = `
          <svg viewBox="0 0 24 24">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        `;

        const trashIconSvg = `
          <svg viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        `;

        const chevronIconSvg = `
          <svg viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        `;

        card.innerHTML = `
          <div class="show-clickable-header">
            <a href="${showBaseUrl}" target="_blank" class="show-link-img" title="Open Show Page">
              <img src="${data.imageUrl || ""}" alt="Poster">
            </a>
            <div class="show-title-wrapper">
              <h3 class="show-title" title="${data.showName}">${data.showName} • S${data.seasonNumber}</h3>
              <span class="chevron-icon">${chevronIconSvg}</span>
            </div>
            <a href="${nextEpisodeUrl}" target="_blank" class="play-next-btn" title="Watch Next">
              ${playNextIconSvg} Next
            </a>
            <button class="delete-show" data-key="${key}" title="Delete instantly">
              ${trashIconSvg}
            </button>
          </div>
          <div class="show-drawer">
            <div class="drawer-content">
              <ul class="episode-list">
                ${episodesHtml}
              </ul>
            </div>
          </div>
        `;

        listContainer.appendChild(card);
      });

      // Handle custom Accordion Expansion and Instant Deletion
      listContainer.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest(".delete-show");
        const playNextBtn = e.target.closest(".play-next-btn");
        const showLinkImg = e.target.closest(".show-link-img");

        // Instant delete handling
        if (deleteBtn) {
          e.stopPropagation();
          const keyToRemove = deleteBtn.getAttribute("data-key");
          chrome.storage.local.remove(keyToRemove, () => {
            loadShows();
          });
          return;
        }

        // Exclude the link buttons/images from toggling the accordion when clicked
        if (playNextBtn || showLinkImg) {
          return; // Allow default <a> tag link behavior, exit function
        }

        // Accordion Toggle block
        const clickableHeader = e.target.closest(".show-clickable-header");
        if (clickableHeader) {
          const targetCard = clickableHeader.closest(".show-card");

          // Collapse other cards for a clean accordion flow
          document.querySelectorAll(".show-card").forEach((card) => {
            if (card !== targetCard) card.classList.remove("expanded");
          });

          targetCard.classList.toggle("expanded");
        }
      });
    });
  }

  loadShows();

  // "Clear All" retains its system confirmation safeguard
  clearAllBtn.addEventListener("click", () => {
    if (confirm("Clear all tracked history? This cannot be undone.")) {
      chrome.storage.local.clear(() => {
        loadShows();
      });
    }
  });
});
