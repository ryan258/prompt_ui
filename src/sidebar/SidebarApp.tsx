import React, { useEffect, useState, useRef } from 'react';
import { Snippet } from '../shared/types';
import { getSnippets, addSnippet, updateSnippet, deleteSnippet, saveSnippets } from '../shared/storage';

// Robust CSV parser that handles multi-line quoted fields, commas, and newlines
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(value);
        value = '';
      } else if (char === '\n' || char === '\r') {
        // Handle CRLF and LF
        if (char === '\r' && text[i + 1] === '\n') i++;
        row.push(value);
        value = '';
        if (row.some(cell => cell.trim() !== '')) rows.push(row); // Only push non-empty rows
        row = [];
      } else {
        value += char;
      }
    }
    i++;
  }
  // Push last value
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    if (row.some(cell => cell.trim() !== '')) rows.push(row);
  }
  return rows;
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
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setNotification('Copied!');
      setTimeout(() => setNotification(null), 1500);
    } catch {
      setNotification('Copy failed');
      setTimeout(() => setNotification(null), 1500);
    }
  };

  const handlePasteContent = (content: string) => {
    if (
      typeof chrome !== 'undefined' &&
      chrome.tabs && chrome.tabs.query &&
      chrome.tabs.sendMessage &&
      chrome.scripting && chrome.runtime && chrome.runtime.getManifest
    ) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.scripting.executeScript(
            {
              target: { tabId },
              files: ['content.js'], // Use the correct path, relative to extension root
            },
            () => {
              chrome.tabs.sendMessage(
                tabId,
                { type: 'PASTE_SNIPPET_CONTENT', content },
                (response) => {
                  if (chrome.runtime.lastError || !response || !response.ok) {
                    setNotification('Paste failed: Not supported on this page.');
                    setTimeout(() => setNotification(null), 2500);
                  } else {
                    setNotification('Pasted!');
                    setTimeout(() => setNotification(null), 1500);
                  }
                }
              );
            }
          );
        }
      });
    } else {
      setNotification('Paste not supported');
      setTimeout(() => setNotification(null), 1500);
    }
  };

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
    if (expandedIds.includes(id)) setExpandedIds(prev => prev.filter(i => i !== id));
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
    const escape = (str: string) => '"' + (str ?? '').replace(/"/g, '""') + '"';
    const rows = snippets.map(s =>
      [
        escape(s.id),
        escape(s.title),
        escape(s.content),
        escape((s.tags || []).join(';')),
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
    const rows = parseCSV(text);
    if (!rows.length) return;
    const rawHeader = rows[0];
    const columns = rawHeader.map(h => h.trim().toLowerCase());
    const dataRows = rows.slice(1);

    const importedSnippets: Snippet[] = dataRows.map(fields => {
      const get = (name: string) => {
        const idx = columns.indexOf(name);
        return idx !== -1 && fields[idx] !== undefined ? fields[idx] : '';
      };
      const clean = (str: string | undefined | null = '') => (str ?? '').replace(/^"|"$/g, '').replace(/""/g, '"');
      const parseNum = (n: string) => Number((n ?? '').replace(/"/g, '')) || Date.now();
      const parseBool = (b: string) => /^true$/i.test((b ?? '').replace(/"/g, ''));
      const title = clean(get('title'));
      const content = clean(get('content'));
      if (!title && !content) return null; // Skip rows missing both
      return {
        id: clean(get('id')) || uuid(),
        title,
        content,
        tags: clean(get('tags')).split(';').map(t => t.trim()).filter(Boolean),
        createdAt: parseNum(get('createdat')),
        updatedAt: parseNum(get('updatedat')),
        isFavorite: parseBool(get('isfavorite')),
      };
    }).filter(Boolean) as Snippet[];

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

  const handleTagClick = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearTags = () => setActiveTags([]);

  return (
    <div className="w-full max-w-lg mx-auto min-h-screen bg-brand-light px-2 sm:px-4 flex flex-col">
      {/* Header */}
      <header className="py-4 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-yellow-900">Creative Toolbox</h1>
        <input
          type="text"
          placeholder="Search prompts..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          aria-label="Search prompts"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="mt-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded font-semibold shadow hover:bg-yellow-500 transition self-end"
          onClick={() => setShowAdd(true)}
          aria-label="Add new snippet"
        >
          + Add Snippet
        </button>
      </header>

      {/* Error/Warning Banner */}
      {error && (
        <div className="bg-yellow-200 text-yellow-900 text-xs px-3 py-2 border-b border-yellow-400 text-center">
          {error}
        </div>
      )}

      {/* Export/Import Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button
          className="px-3 py-2 bg-yellow-700 text-white rounded shadow hover:bg-yellow-800 transition font-semibold"
          onClick={() => importInputRef.current?.click()}
        >
          Import CSV
        </button>
        <input
          id="import-csv"
          ref={importInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleImportCSV}
        />
        <button
          className="px-3 py-2 bg-yellow-500 text-white rounded shadow hover:bg-yellow-600 transition font-semibold"
          onClick={handleExportCSV}
        >
          Export CSV
        </button>
      </div>

      {/* Active Tags */}
      {activeTags.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-blue-700 font-semibold">Filtering by:</span>
          {activeTags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-medium border border-blue-800">{tag}</span>
          ))}
          <button
            className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300"
            onClick={handleClearTags}
            type="button"
          >
            Clear
          </button>
        </div>
      )}

      {/* Snippet List */}
      <main className="flex-1 overflow-y-auto py-3">
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : snippets.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No snippets yet.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {snippets
                .filter(snippet => {
                  const matchesSearch =
                    snippet.title.toLowerCase().includes(search.toLowerCase()) ||
                    snippet.content.toLowerCase().includes(search.toLowerCase()) ||
                    snippet.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
                  const matchesTags = activeTags.length === 0 || activeTags.every(tag => snippet.tags.includes(tag));
                  return matchesSearch && matchesTags;
                })
                .map(snippet => {
                  const expanded = expandedIds.includes(snippet.id);
                  return (
                    <div
                      key={snippet.id}
                      className="bg-white rounded-xl shadow-md p-4 border border-gray-200 hover:shadow-lg transition relative w-full max-w-full"
                      tabIndex={0}
                      aria-expanded={expanded}
                      aria-label={`Snippet: ${snippet.title}`}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setExpandedIds(prev => expanded ? prev.filter(id => id !== snippet.id) : [...prev, snippet.id]);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-yellow-900 truncate max-w-[60%]">{snippet.title}</h3>
                        <div className="flex gap-2 text-sm">
                          {/* Copy */}
                          <button
                            className="text-green-600 hover:text-green-800 transition"
                            onClick={() => handleCopyContent(snippet.content)}
                            aria-label="Copy"
                            title="Copy"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
                              <path d="M10 1.5v1a.5.5 0 0 1 .5.5h2A1.5 1.5 0 0 1 14 4.5v9A1.5 1.5 0 0 1 12.5 15h-9A1.5 1.5 0 0 1 2 13.5v-9A1.5 1.5 0 0 1 3.5 3h2A.5.5 0 0 0 6 2.5v-1A.5.5 0 0 1 6.5 1h3a.5.5 0 0 1 .5.5zM6 1.5v1A1.5 1.5 0 0 1 4.5 4h-1A.5.5 0 0 0 3 4.5v9A.5.5 0 0 0 3.5 14h9a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-1A1.5 1.5 0 0 1 10 2.5v-1a.5.5 0 0 0-1 0zm1 1V2a.5.5 0 0 0-1 0v.5a.5.5 0 0 0 1 0z"/>
                            </svg>
                          </button>
                          {/* Expand/Collapse */}
                          <button
                            className="text-blue-600 hover:text-blue-800 transition"
                            onClick={() => setExpandedIds(prev => expanded ? prev.filter(id => id !== snippet.id) : [...prev, snippet.id])}
                            aria-label={expanded ? "Hide content" : "Show content"}
                            title={expanded ? "Hide content" : "Show content"}
                            type="button"
                          >
                            {expanded ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-chevron-up" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M1.646 10.854a.5.5 0 0 1 .708 0L8 4.207l5.646 6.647a.5.5 0 0 1-.708.708l-5.292-6.208-5.292 6.208a.5.5 0 0 1-.708-.708z"/>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                              </svg>
                            )}
                          </button>
                          {/* Edit */}
                          <button
                            className="text-yellow-600 hover:text-yellow-800 transition"
                            onClick={() => openEditModal(snippet)}
                            aria-label="Edit"
                            title="Edit"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
                              <path d="M12.146.854a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-4 1.5a.5.5 0 0 1-.65-.65l1.5-4a.5.5 0 0 1 .11-.168l10-10zM11.207 2L2 11.207V13h1.793L14 4.793 11.207 2zm1.586-1.586a1.5 1.5 0 0 0-2.121 0l-10 10a1.5 1.5 0 0 0-.354.561l-1.5 4a1.5 1.5 0 0 0 1.95 1.95l4-1.5a1.5 1.5 0 0 0 .561-.354l10-10a1.5 1.5 0 0 0 0-2.121l-2.292-2.292z"/>
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            className="text-red-600 hover:text-red-800 transition"
                            onClick={() => handleDeleteSnippet(snippet.id)}
                            aria-label="Delete"
                            title="Delete"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                              <path d="M5.5 5.5A.5.5 0 0 1 6 5h4a.5.5 0 0 1 .5.5V6h-5v-.5zM3.5 6V5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5V6h-9a.5.5 0 0 1-.5.5z"/>
                              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                          </button>
                          {/* Paste */}
                          <button
                            className="text-cyan-600 hover:text-cyan-800 transition"
                            onClick={() => handlePasteContent(snippet.content)}
                            aria-label="Paste"
                            title="Paste"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-clipboard-check" viewBox="0 0 16 16">
                              <path fillRule="evenodd" d="M10 1.5a.5.5 0 0 1 .5.5h2A1.5 1.5 0 0 1 14 4.5v9A1.5 1.5 0 0 1 12.5 15h-9A1.5 1.5 0 0 1 2 13.5v-9A1.5 1.5 0 0 1 3.5 3h2A.5.5 0 0 0 6 2.5v-1A.5.5 0 0 1 6.5 1h3a.5.5 0 0 1 .5.5zM6 1.5v1A1.5 1.5 0 0 1 4.5 4h-1A.5.5 0 0 0 3 4.5v9A.5.5 0 0 0 3.5 14h9a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-1A1.5 1.5 0 0 1 10 2.5v-1a.5.5 0 0 0-1 0zm1 1V2a.5.5 0 0 0-1 0v.5a.5.5 0 0 0 1 0z"/>
                              <path fillRule="evenodd" d="M10.97 7.97a.75.75 0 0 1 1.07 1.05l-3 3.5a.75.75 0 0 1-1.08.02l-1.5-1.5a.75.75 0 1 1 1.06-1.06l.97.97 2.47-2.98a.75.75 0 0 1 1.06-.02z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      {/* Snippet Content: Reveal/Hide */}
                      {expanded ? (
                        <div className="text-gray-700 mb-2 whitespace-pre-line break-words">
                          {snippet.content}
                        </div>
                      ) : (
                        <div className="text-gray-700 mb-2 overflow-hidden max-h-[4.5em]" style={{display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', whiteSpace: 'pre-line'}} title={snippet.content}>
                          {snippet.content}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {snippet.tags.map((tag) => (
                          <button
                            key={tag}
                            className={`px-2 py-0.5 rounded text-xs font-medium border transition ${activeTags.includes(tag) ? 'bg-blue-600 text-white border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'}`}
                            onClick={() => handleTagClick(tag)}
                            aria-pressed={activeTags.includes(tag)}
                            type="button"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      {snippet.isFavorite && (
                        <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow">★ Favorite</span>
                      )}
                    </div>
                  );
                })}
            </div>
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
