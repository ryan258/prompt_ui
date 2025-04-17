import React, { useEffect, useState, useRef } from 'react';
import { Snippet } from '../shared/types';
import { getSnippets, addSnippet, updateSnippet, deleteSnippet, saveSnippets } from '../shared/storage';

// Robust CSV line parser that handles quotes, commas, and newlines
function parseCSVLine(line: string): string[] {
  const result = [];
  let inQuotes = false;
  let value = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      value += '"';
      i++; // skip next quote
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  result.push(value);
  return result;
}

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
  {
    id: '3',
    title: 'Summarize Article',
    content: 'Summarize the following article in 3 bullet points.',
    tags: ['summarize', 'ai'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
  },
  {
    id: '4',
    title: 'Translate to Spanish',
    content: 'Translate this text into Spanish, keeping the tone informal.',
    tags: ['translate', 'spanish'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
  },
  {
    id: '5',
    title: 'Polite Decline',
    content: 'Thank you for your offer, but I will have to decline at this time.',
    tags: ['response', 'polite'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
  },
  {
    id: '6',
    title: 'Code Review Checklist',
    content: '- Are all functions documented?\n- Are edge cases handled?\n- Is the code DRY?\n- Are there sufficient tests?',
    tags: ['checklist', 'code'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
  },
  {
    id: '7',
    title: 'Ask for Feedback',
    content: 'Could you please provide feedback on the following draft?',
    tags: ['feedback', 'request'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
  },
  {
    id: '8',
    title: 'Meeting Agenda',
    content: '1. Project updates\n2. Open issues\n3. Next steps',
    tags: ['meeting', 'agenda'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
  },
  {
    id: '9',
    title: 'Bug Report Template',
    content: 'Describe the bug:\nSteps to reproduce:\nExpected behavior:\nScreenshots:',
    tags: ['template', 'bug'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
  },
  {
    id: '10',
    title: 'Thank You Note',
    content: 'Thank you for your help! I really appreciate it.',
    tags: ['gratitude', 'thanks'],
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

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

  const handleDeleteSnippet = async (id: string) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await deleteSnippet(id);
    } else {
      setSnippets(snippets.filter(s => s.id !== id));
    }
    if (expandedId === id) setExpandedId(null);
  };

  const openEditModal = (snippet: Snippet) => {
    setEditId(snippet.id);
    setEditTitle(snippet.title);
    setEditContent(snippet.content);
    setEditTags(snippet.tags.join(', '));
  };

  const handleEditSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim() || !editId) return;
    const updated: Snippet = {
      id: editId,
      title: editTitle.trim(),
      content: editContent.trim(),
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: Date.now(), // Optionally preserve original createdAt
      updatedAt: Date.now(),
      isFavorite: snippets.find(s => s.id === editId)?.isFavorite || false,
    };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await updateSnippet(updated);
    } else {
      setSnippets(snippets.map(s => (s.id === editId ? updated : s)));
    }
    setEditId(null);
    setEditTitle('');
    setEditContent('');
    setEditTags('');
  };

  const handleExportCSV = async () => {
    const snippets = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
      ? await getSnippets()
      : snippets;
    const header = 'id,title,content,tags,createdAt,updatedAt,isFavorite';
    const rows = snippets.map(s =>
      [
        s.id,
        `"${s.title.replace(/"/g, '""')}"`,
        `"${s.content.replace(/"/g, '""')}"`,
        `"${s.tags.join(';')}"`,
        s.createdAt,
        s.updatedAt,
        s.isFavorite
      ].join(',')
    );
    const csv = [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creative-toolbox-snippets.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNotification('Snippets exported as CSV!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);

    // Parse header and get column indices robustly
    const rawHeader = lines[0];
    const columns = parseCSVLine(rawHeader).map(h => h.trim().toLowerCase());
    const dataRows = lines.slice(1);

    const importedSnippets: Snippet[] = dataRows.map(row => {
      const fields = parseCSVLine(row);
      const get = (name: string) => {
        const idx = columns.indexOf(name);
        return idx !== -1 && fields[idx] !== undefined ? fields[idx] : '';
      };
      const clean = (str: string | undefined | null = '') => (str ?? '').replace(/^"|"$/g, '').replace(/""/g, '"');
      const id = clean(get('id')) || uuid();
      const title = clean(get('title'));
      const content = clean(get('content'));
      const tags = clean(get('tags'));
      const tagArr = tags.split(/[#;]+/).map(t => t.trim()).filter(Boolean);
      const parseNum = (n: string) => Number((n ?? '').replace(/"/g, '')) || Date.now();
      const parseBool = (b: string) => /^true$/i.test((b ?? '').replace(/"/g, ''));

      return {
        id,
        title,
        content,
        tags: tagArr,
        createdAt: parseNum(get('createdat')),
        updatedAt: parseNum(get('updatedat')),
        isFavorite: parseBool(get('isfavorite'))
      };
    });

    // Merge: skip imported snippets with duplicate IDs
    const existing: Snippet[] = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
      ? await getSnippets()
      : [];
    const merged = [
      ...existing,
      ...importedSnippets.filter(
        (s: Snippet) => !existing.some((e: Snippet) => e.id === s.id)
      )
    ];
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await saveSnippets(merged);
    }
    setSnippets(merged);
    setNotification('Snippets imported from CSV!');
    setTimeout(() => setNotification(null), 3000);
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-screen w-80 bg-brand-light border-r border-brand-dark font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-brand-dark bg-brand text-brand-dark shadow-sm">
        <h1 className="text-xl font-bold tracking-wide">Creative Toolbox</h1>
        <button
          className="rounded-full p-2 hover:bg-brand-dark hover:text-brand-light focus:outline-brand-dark transition-colors"
          aria-label="Open settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.51-1 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09c.2.63.77 1.1 1.51 1.1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      {/* Search and Add */}
      <div className="p-3 border-b border-brand-dark bg-brand-light flex flex-col gap-2">
        <input
          type="text"
          placeholder="Search prompts..."
          className="w-full px-3 py-2 rounded border border-brand-dark bg-white text-gray-900 focus:outline-brand-dark focus:ring-2 focus:ring-brand-dark transition-all"
          aria-label="Search prompts"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="px-2 py-1 rounded bg-brand-dark text-brand-light text-xs font-semibold ml-auto shadow hover:bg-brand focus:outline-brand-dark transition-colors"
            onClick={() => setShowAdd(true)}
            aria-label="Add new snippet"
          >
            + Add Snippet
          </button>
        </div>
      </div>

      {/* Error/Warning Banner */}
      {error && (
        <div className="bg-yellow-200 text-yellow-900 text-xs px-3 py-2 border-b border-yellow-400 text-center">
          {error}
        </div>
      )}

      {/* Export/Import Buttons */}
      <div className="flex gap-2 justify-end px-3 py-2 border-b border-brand-dark bg-brand-light">
        <button
          className="px-2 py-1 rounded bg-brand-dark text-brand-light text-xs font-semibold shadow hover:bg-brand focus:outline-brand-dark transition-colors"
          onClick={handleExportCSV}
        >
          Export CSV
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept=".csv"
          onChange={handleImportCSV}
        />
        <button
          className="px-2 py-1 rounded bg-brand-dark text-brand-light text-xs font-semibold shadow hover:bg-brand focus:outline-brand-dark transition-colors"
          onClick={() => importInputRef.current?.click()}
        >
          Import CSV
        </button>
      </div>

      {/* Snippet List */}
      <main className="flex-1 overflow-y-auto p-3 bg-brand-light">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : snippets.length === 0 ? (
            <div className="text-center text-gray-500">No snippets yet.</div>
          ) : (
            snippets
              .filter(snippet => {
                const matchesSearch =
                  snippet.title.toLowerCase().includes(search.toLowerCase()) ||
                  snippet.content.toLowerCase().includes(search.toLowerCase()) ||
                  snippet.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
                const matchesTags = activeTags.length === 0 || activeTags.every(tag => snippet.tags.includes(tag));
                return matchesSearch && matchesTags;
              })
              .map(snippet => {
                const expanded = expandedId === snippet.id;
                return (
                  <div key={snippet.id} className={`bg-white rounded-lg shadow flex flex-col gap-2 border border-brand-dark hover:shadow-lg transition-shadow relative ${snippet.isFavorite ? 'ring-2 ring-yellow-400' : ''}`}>
                    <div className="flex items-center justify-between gap-2 pt-2 px-2">
                      <span className="font-medium text-brand-dark truncate flex-1" title={snippet.title}>{snippet.title}</span>
                      {snippet.isFavorite && <span title="Favorite" className="ml-1 text-yellow-500">★</span>}
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-brand-dark underline hover:text-brand-dark/80 focus:outline-brand-dark"
                          aria-expanded={expanded}
                          aria-controls={`snippet-content-${snippet.id}`}
                          onClick={() => setExpandedId(expanded ? null : snippet.id)}
                        >
                          {expanded ? 'Collapse' : 'Expand'}
                        </button>
                        <button
                          className="text-xs text-brand-dark underline hover:text-brand-dark/80 focus:outline-brand-dark"
                          onClick={() => openEditModal(snippet)}
                          aria-label="Edit snippet"
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-red-600 underline hover:text-red-700 focus:outline-brand-dark"
                          onClick={() => handleDeleteSnippet(snippet.id)}
                          aria-label="Delete snippet"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div
                      id={`snippet-content-${snippet.id}`}
                      className={expanded ? 'text-gray-700 text-sm whitespace-pre-wrap px-2 pb-2' : 'truncate text-gray-700 text-sm px-2 pb-2'}
                    >
                      {snippet.content}
                    </div>
                    <div className="flex gap-2 flex-wrap px-2 pb-2">
                      {snippet.tags.map(tag => (
                        <button
                          key={tag}
                          className={`bg-brand px-2 py-0.5 rounded text-xs font-semibold border ${activeTags.includes(tag) ? 'bg-brand-dark text-brand-light border-brand-dark' : 'text-brand-dark border-brand'} transition-colors`}
                          onClick={() => setActiveTags(activeTags.includes(tag)
                            ? activeTags.filter(t => t !== tag)
                            : [...activeTags, tag])}
                          aria-pressed={activeTags.includes(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </main>

      {/* Add Snippet Modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form
            className="bg-white rounded-lg shadow-2xl p-6 w-80 flex flex-col gap-3 border border-brand-dark"
            onSubmit={handleAddSnippet}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-bold text-brand-dark mb-1">Add New Snippet</h2>
            <label className="text-xs text-brand-dark">
              Title
              <input
                className="w-full mt-1 px-2 py-1 border border-brand-dark rounded focus:outline-brand-dark"
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
                className="w-full mt-1 px-2 py-1 border border-brand-dark rounded focus:outline-brand-dark"
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
                className="w-full mt-1 px-2 py-1 border border-brand-dark rounded focus:outline-brand-dark"
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

      {/* Edit Snippet Modal */}
      {editId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form
            className="bg-white rounded-lg shadow-2xl p-6 w-80 flex flex-col gap-3 border border-brand-dark"
            onSubmit={handleEditSnippet}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-bold text-brand-dark mb-1">Edit Snippet</h2>
            <label className="text-xs text-brand-dark">
              Title
              <input
                className="w-full mt-1 px-2 py-1 border border-brand-dark rounded focus:outline-brand-dark"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                required
                maxLength={60}
                autoFocus
              />
            </label>
            <label className="text-xs text-brand-dark">
              Content
              <textarea
                className="w-full mt-1 px-2 py-1 border border-brand-dark rounded focus:outline-brand-dark"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                required
                rows={4}
                maxLength={1000}
              />
            </label>
            <label className="text-xs text-brand-dark">
              Tags (comma separated)
              <input
                className="w-full mt-1 px-2 py-1 border border-brand-dark rounded focus:outline-brand-dark"
                value={editTags}
                onChange={e => setEditTags(e.target.value)}
                placeholder="e.g. ai, productivity"
              />
            </label>
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                className="px-3 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={() => setEditId(null)}
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

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-brand-dark text-brand-light px-4 py-2 rounded shadow-lg z-50 text-sm">
          {notification}
        </div>
      )}

      {/* Footer / Settings */}
      <footer className="p-2 border-t border-brand-dark bg-brand-light text-xs text-brand-dark text-center">
        <button className="hover:underline" aria-label="Open settings">Settings</button>
      </footer>
    </div>
  );
};

export default SidebarApp;
