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