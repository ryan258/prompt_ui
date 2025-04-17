// Content script for Creative Toolbox
// Placeholder for text selection and injection logic
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_SELECTED_TEXT") {
    sendResponse({ text: window.getSelection()?.toString() || "" });
  }
  if (msg.type === "PASTE_SNIPPET_CONTENT" && typeof msg.content === 'string') {
    // Try to paste into the active/focused element
    const active = document.activeElement as HTMLElement | null;
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
      const input = active as HTMLInputElement | HTMLTextAreaElement;
      // Insert at cursor position if possible
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.setRangeText(msg.content, start, end, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (active && active.isContentEditable) {
      // For contenteditable elements
      document.execCommand('insertText', false, msg.content);
    } else {
      // Fallback: try to paste at the end of the body
      const ta = document.createElement('textarea');
      ta.value = msg.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }
});