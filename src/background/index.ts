chrome.action.onClicked.addListener(() => {
  chrome.windows.getCurrent({}, win => {
    if (win && typeof win.id === 'number') {
      // @ts-ignore
      chrome.sidePanel.open({ windowId: win.id });
    } else {
      console.warn('No active window found.');
    }
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-selection-to-creative-toolbox",
    title: "Save selection to Creative Toolbox",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-selection-to-creative-toolbox" && tab?.id) {
    // Ask the content script for the selected text
    chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTED_TEXT" }, (response) => {
      if (response?.text) {
        // Save as snippet (call your addSnippet logic here)
        chrome.storage.local.get({ snippets: [] }, (result) => {
          const snippets = result.snippets;
          const newSnippet = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            title: response.text.slice(0, 40) + (response.text.length > 40 ? "..." : ""),
            content: response.text,
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isFavorite: false
          };
          snippets.push(newSnippet);
          chrome.storage.local.set({ snippets });
        });
      }
    });
  }
});