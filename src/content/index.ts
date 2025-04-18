(function () {
  // Prevent double-injection of content script
  if ((window as any).__creative_toolbox_content_script_loaded__) {
    return;
  }
  // @ts-ignore
  (window as any).__creative_toolbox_content_script_loaded__ = true;

  // Content script for Creative Toolbox
  // Placeholder for text selection and injection logic

  // Track the last focused editable element
  let lastFocused: HTMLElement | null = null;
  let lastFocusedSelector: string | null = null;

  document.addEventListener('focusin', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
      lastFocused = t;
      // Try to build a selector for fallback
      try {
        if (t.id) {
          lastFocusedSelector = `#${t.id}`;
        } else if (t.name) {
          lastFocusedSelector = `${t.tagName.toLowerCase()}[name='${t.getAttribute('name')}']`;
        } else {
          // fallback to tag
          lastFocusedSelector = t.tagName.toLowerCase();
        }
      } catch {}
    }
  });

  function robustFocusAndPaste(content: string) {
    let active: HTMLElement | null = document.activeElement as HTMLElement | null;
    // If not a valid input, try lastFocused
    if (!active || !(active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
      active = lastFocused;
    }
    // If still not found, try selector
    if (!active && lastFocusedSelector) {
      active = document.querySelector(lastFocusedSelector) as HTMLElement | null;
    }
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
      active.focus();
      const input = active as HTMLInputElement | HTMLTextAreaElement;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.setRangeText(content, start, end, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    } else if (active && active.isContentEditable) {
      active.focus();
      document.execCommand('insertText', false, content);
      return true;
    }
    return false;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_SELECTED_TEXT") {
      sendResponse({ text: window.getSelection()?.toString() || "" });
    }
    if (msg.type === "PASTE_SNIPPET_CONTENT" && typeof msg.content === 'string') {
      const success = robustFocusAndPaste(msg.content);
      if (!success) {
        // Fallback: copy to clipboard and notify
        const ta = document.createElement('textarea');
        ta.value = msg.content;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        // Optionally, send a response or notification
      }
      sendResponse({ ok: true }); // Always respond
      return true; // Required for async
    }
  });
})();