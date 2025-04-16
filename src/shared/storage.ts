import { Snippet } from './types';

const SNIPPETS_KEY = 'snippets';

export async function getSnippets(): Promise<Snippet[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([SNIPPETS_KEY], (result) => {
      resolve(result[SNIPPETS_KEY] || []);
    });
  });
}

export async function saveSnippets(snippets: Snippet[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SNIPPETS_KEY]: snippets }, () => resolve());
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
