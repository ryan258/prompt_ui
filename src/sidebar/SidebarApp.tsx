import React, { useEffect, useState } from 'react';
import { Snippet } from '../shared/types';
import { getSnippets, addSnippet } from '../shared/storage';

const MOCK_SNIPPETS: Snippet[] = [
  {
    id: '1',
    title: 'Sample Prompt',
    content: 'This is a sample AI prompt you can use anywhere.',
    tags: ['example', 'test'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
  },
  {
    id: '2',
    title: 'Greeting',
    content: 'Hello, how can I help you today?',
    tags: ['greeting'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: true,
  },
];

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
}

const SidebarApp: React.FC = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      getSnippets().then(data => {
        setSnippets(data);
        setLoading(false);
      }).catch(e => {
        setError('Failed to load snippets from storage.');
        setLoading(false);
      });
      const handleChange = (changes: any, area: string) => {
        if (area === 'local' && changes.snippets) {
          setSnippets(changes.snippets.newValue || []);
        }
      };
      chrome.storage.onChanged.addListener(handleChange);
      return () => chrome.storage.onChanged.removeListener(handleChange);
    } else {
      setSnippets(MOCK_SNIPPETS);
      setLoading(false);
      setError('chrome.storage is not available. Showing mock data.');
    }
  }, []);

  const handleAddSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const snippet: Snippet = {
      id: uuid(),
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false,
    };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await addSnippet(snippet);
    } else {
      setSnippets([snippet, ...snippets]);
    }
    setShowAdd(false);
    setNewTitle('');
    setNewContent('');
    setNewTags('');
  };

  return (
    <div className="flex flex-col h-screen w-80 bg-brand-light border-r border-brand-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-brand-dark bg-brand text-brand-dark">
        <h1 className="text-xl font-bold">Creative Toolbox</h1>
        <button
          className="rounded-full p-2 hover:bg-brand-dark hover:text-brand-light focus:outline-brand-dark"
          aria-label="Open settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09c.2.63.77 1.1 1.51 1.1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      {/* Search and Tag Filter */}
      <div className="p-3 border-b border-brand-dark bg-brand-light flex flex-col gap-2">
        <input
          type="text"
          placeholder="Search prompts..."
          className="w-full px-3 py-2 rounded border border-brand-dark bg-white text-gray-900 focus:outline-brand-dark"
          aria-label="Search prompts"
        />
        <div className="flex flex-wrap gap-2">
          {/* Tag filter chips will go here */}
          <button className="px-2 py-1 rounded bg-brand-dark text-brand-light text-xs font-semibold">+ Add Tag</button>
          <button
            className="px-2 py-1 rounded bg-brand-dark text-brand-light text-xs font-semibold ml-auto"
            onClick={() => setShowAdd(true)}
            aria-label="Add new snippet"
          >
            + Add Snippet
          </button>
        </div>
      </div>

      {/* Add Snippet Modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <form
            className="bg-white rounded shadow-lg p-6 w-80 flex flex-col gap-3 border border-brand-dark"
            onSubmit={handleAddSnippet}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-bold text-brand-dark mb-1">Add New Snippet</h2>
            <label className="text-xs text-brand-dark">
              Title
              <input
                className="w-full mt-1 px-2 py-1 border border-brand-dark rounded"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                maxLength={60}
                autoFocus
              />
            </label>
            <label className="text-xs text-brand-dark">
              Content
              <textarea
                className="w-full mt-1 px-2 py-1 border border-brand-dark rounded"
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                required
                rows={4}
                maxLength={1000}
              />
            </label>
            <label className="text-xs text-brand-dark">
              Tags (comma separated)
              <input
                className="w-full mt-1 px-2 py-1 border border-brand-dark rounded"
                value={newTags}
                onChange={e => setNewTags(e.target.value)}
                placeholder="e.g. ai, productivity"
              />
            </label>
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                className="px-3 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-brand-dark text-brand-light hover:bg-brand focus:outline-brand-dark"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error/Warning Banner */}
      {error && (
        <div className="bg-yellow-200 text-yellow-900 text-xs px-3 py-2 border-b border-yellow-400 text-center">
          {error}
        </div>
      )}

      {/* Snippet List */}
      <main className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : snippets.length === 0 ? (
            <div className="text-center text-gray-500">No snippets yet.</div>
          ) : (
            snippets.map(snippet => (
              <div key={snippet.id} className="bg-white rounded shadow p-3 flex flex-col gap-1 border border-brand-dark">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-brand-dark">{snippet.title}</span>
                  <button className="text-xs text-brand-dark underline">Expand</button>
                </div>
                <div className="truncate text-gray-700 text-sm">{snippet.content}</div>
                <div className="flex gap-2 mt-1">
                  {snippet.tags.map(tag => (
                    <span key={tag} className="bg-brand px-2 py-0.5 rounded text-xs text-brand-dark">{tag}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer / Settings */}
      <footer className="p-2 border-t border-brand-dark bg-brand-light text-xs text-brand-dark text-center">
        <button className="hover:underline" aria-label="Open settings">Settings</button>
      </footer>
    </div>
  );
};

export default SidebarApp;
