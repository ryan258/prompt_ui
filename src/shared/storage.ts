import { Snippet } from './types';

const SNIPPETS_KEY = 'snippets';

// Use chrome.storage.sync for cross-device sync
const STORAGE = chrome && chrome.storage && chrome.storage.sync ? chrome.storage.sync : chrome.storage.local;

export async function getSnippets(): Promise<Snippet[]> {
  return new Promise((resolve) => {
    STORAGE.get([SNIPPETS_KEY], (result) => {
      resolve(result[SNIPPETS_KEY] || []);
    });
  });
}

export async function saveSnippets(snippets: Snippet[]): Promise<void> {
  return new Promise((resolve, reject) => {
    STORAGE.set({ [SNIPPETS_KEY]: snippets }, function() {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

export async function addSnippet(snippet: Snippet): Promise<void> {
  const snippets = await getSnippets();
  snippets.push(snippet);
  await saveSnippets(snippets);
}

export async function deleteSnippet(id: string): Promise<void> {
  const snippets = await getSnippets();
  await saveSnippets(snippets.filter(s => s.id !== id));
}

export async function updateSnippet(updated: Snippet): Promise<void> {
  const snippets = await getSnippets();
  const idx = snippets.findIndex(s => s.id === updated.id);
  if (idx !== -1) {
    snippets[idx] = updated;
    await saveSnippets(snippets);
  }
}
