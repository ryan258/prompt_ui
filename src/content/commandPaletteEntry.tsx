import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import CommandPalette from '../shared/CommandPalette';
import { getSnippets } from '../shared/storage';

// Helper to inject a container div for the palette
function injectPaletteContainer() {
  let container = document.getElementById('creative-toolbox-palette-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'creative-toolbox-palette-root';
    document.body.appendChild(container);
  }
  return container;
}

function robustFocusAndPaste(content: string) {
  let active: HTMLElement | null = document.activeElement as HTMLElement | null;
  // If not a valid input, try lastFocused
  // @ts-ignore
  let lastFocused = (window as any).lastFocused as HTMLElement | null;
  // @ts-ignore
  let lastFocusedSelector = (window as any).lastFocusedSelector as string | null;
  // @ts-ignore
  let lastSelection = (window as any).lastSelection as { start: number | null, end: number | null } | null;
  // @ts-ignore
  let lastContentEditableRange = (window as any).lastContentEditableRange as Range | null;
  let debugMsg = '';
  let debugDetail = '';
  if (!active || !(active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
    debugMsg += `[active not valid: ${active ? active.tagName : 'null'}] `;
    active = lastFocused;
  }
  if (!active && lastFocusedSelector) {
    debugMsg += `[lastFocusedSelector: ${lastFocusedSelector}] `;
    active = document.querySelector(lastFocusedSelector) as HTMLElement | null;
  }
  // Try to focus and insert
  if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
    debugMsg += `[target: ${active.tagName}#${active.id}.${active.className}]`;
    active.focus();
    const input = active as HTMLInputElement | HTMLTextAreaElement;
    let start = input.selectionStart ?? input.value.length;
    let end = input.selectionEnd ?? input.value.length;
    let beforeValue = input.value;
    if (lastSelection && typeof lastSelection.start === 'number' && typeof lastSelection.end === 'number') {
      start = lastSelection.start;
      end = lastSelection.end;
    }
    input.setSelectionRange(start, end);
    // Debug: check if selection was restored
    let afterStart = input.selectionStart, afterEnd = input.selectionEnd;
    debugDetail = `[saved selection: ${start},${end}] [after restore: ${afterStart},${afterEnd}] [value: ${beforeValue}]`;
    input.setRangeText(content, start, end, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    showPaletteNotification(`✅ Prompt inserted! ${debugDetail}`);
    return true;
  } else if (active && active.isContentEditable) {
    debugMsg += `[target: contenteditable#${active.id}.${active.className}]`;
    active.focus();
    let beforeValue = active.innerText;
    // Try to restore selection if possible
    let selectionRestored = false;
    if (lastContentEditableRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(lastContentEditableRange);
        selectionRestored = true;
      }
    }
    // Insert content at restored caret
    if (selectionRestored) {
      document.execCommand('insertText', false, content);
      let afterValue = active.innerText;
      debugDetail = `[restored contenteditable selection] [value: ${beforeValue} -> ${afterValue}]`;
    } else {
      document.execCommand('insertText', false, content);
      let afterValue = active.innerText;
      debugDetail = `[no contenteditable selection] [value: ${beforeValue} -> ${afterValue}]`;
    }
    showPaletteNotification(`✅ Prompt inserted! ${debugDetail}`);
    return true;
  }
  // Fallback: copy to clipboard and notify
  navigator.clipboard.writeText(content);
  showPaletteNotification(`⚠️ Could not insert. ${debugMsg} Prompt copied to clipboard instead.`);
  return false;
}

// Show a notification at the bottom of the palette and always log to console
function showPaletteNotification(msg: string) {
  console.log('[PaletteNotification]', msg);
  let notif = document.getElementById('creative-toolbox-palette-notif');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'creative-toolbox-palette-notif';
    notif.style.position = 'fixed';
    notif.style.left = '50%';
    notif.style.bottom = '32px';
    notif.style.transform = 'translateX(-50%)';
    notif.style.zIndex = '999999';
    notif.style.background = '#f44336'; // Red for visibility
    notif.style.color = '#fff';
    notif.style.padding = '16px 32px';
    notif.style.borderRadius = '12px';
    notif.style.fontSize = '1.15rem';
    notif.style.fontWeight = 'bold';
    notif.style.boxShadow = '0 2px 12px rgba(0,0,0,0.28)';
    notif.style.pointerEvents = 'none';
    notif.style.maxWidth = '90vw';
    notif.style.textAlign = 'center';
    document.body.appendChild(notif);
  }
  notif.textContent = msg;
  notif.style.opacity = '1';
  notif.style.display = 'block';
  setTimeout(() => {
    if (notif) {
      notif.style.opacity = '0';
      notif.style.display = 'none';
    }
  }, 4000);
}

// Main entry: mount palette when shortcut is pressed
function mountPalette() {
  const container = injectPaletteContainer();
  const root = createRoot(container);
  function unmount() {
    root.unmount();
    container.remove();
    // Remove notification if present
    const notif = document.getElementById('creative-toolbox-palette-notif');
    if (notif) notif.remove();
  }
  // Fetch snippets and render palette
  getSnippets().then((snippets) => {
    root.render(
      <CommandPalette
        snippets={snippets}
        onSelect={snippet => {
          const ok = robustFocusAndPaste(snippet.content);
          if (ok) {
            unmount();
          } // else keep open for retry
          return ok;
        }}
        onClose={unmount}
      />
    );
  });
}

// Listen for global shortcut
window.addEventListener('keydown', e => {
  // Only open if focus is in input, textarea, or contenteditable
  const active = document.activeElement as HTMLElement | null;
  const isEditable = active && (
    active.tagName === 'INPUT' ||
    active.tagName === 'TEXTAREA' ||
    active.isContentEditable
  );
  if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'z' && isEditable) {
    // Store last-focused editable element and selector
    (window as any).lastFocused = active;
    if (active && active.id) {
      (window as any).lastFocusedSelector = `#${active.id}`;
    } else if (active && active.className) {
      (window as any).lastFocusedSelector = `${active.tagName.toLowerCase()}.${active.className.toString().replace(/\s+/g, '.')}`;
    } else if (active) {
      (window as any).lastFocusedSelector = active.tagName.toLowerCase();
    } else {
      (window as any).lastFocusedSelector = null;
    }
    // Store selection/cursor position if possible
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
      (window as any).lastSelection = {
        start: (active as HTMLInputElement | HTMLTextAreaElement).selectionStart,
        end: (active as HTMLInputElement | HTMLTextAreaElement).selectionEnd
      };
      (window as any).lastContentEditableRange = null;
    } else if (active && active.isContentEditable) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        (window as any).lastContentEditableRange = sel.getRangeAt(0).cloneRange();
      } else {
        (window as any).lastContentEditableRange = null;
      }
      (window as any).lastSelection = null;
    } else {
      (window as any).lastSelection = null;
      (window as any).lastContentEditableRange = null;
    }
    // Only if no modal is already open
    if (!document.getElementById('creative-toolbox-palette-root')) {
      e.preventDefault();
      mountPalette();
    }
  }
});
