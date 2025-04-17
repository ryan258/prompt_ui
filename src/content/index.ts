// Content script for Creative Toolbox
// Placeholder for text selection and injection logic
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_SELECTED_TEXT") {
    sendResponse({ text: window.getSelection()?.toString() || "" });
  }
});