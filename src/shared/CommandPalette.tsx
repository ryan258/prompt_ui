import React, { useEffect, useRef, useState } from 'react';
import { Snippet } from './types';

interface CommandPaletteProps {
  snippets: Snippet[];
  onSelect: (snippet: Snippet) => void;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ snippets, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<Snippet[]>(snippets);
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setFiltered(
      query.trim()
        ? snippets.filter(
            s =>
              s.title.toLowerCase().includes(query.toLowerCase()) ||
              s.content.toLowerCase().includes(query.toLowerCase()) ||
              s.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
          )
        : snippets
    );
    setSelected(0);
    setExpanded(null);
  }, [query, snippets]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expanded) {
          setExpanded(null);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowDown') {
        setSelected(s => Math.min(filtered.length - 1, s + 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setSelected(s => Math.max(0, s - 1));
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (expanded) {
          handleInsert(filtered.find(s => s.id === expanded)!);
        } else if (filtered[selected]) {
          setExpanded(filtered[selected].id);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, selected, expanded, onClose]);

  function handleInsert(snippet: Snippet) {
    const ok = onSelect(snippet);
    if (ok === false) {
      setError('Injection failed. Try another field or check focus.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-30">
      <div className="mt-32 w-full max-w-lg bg-white rounded-lg shadow-2xl border border-brand-dark p-4">
        <input
          ref={inputRef}
          className="w-full px-3 py-2 border border-brand-dark rounded focus:outline-brand-dark text-base mb-2"
          placeholder="Search snippets..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.stopPropagation()}
        />
        {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
        <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 mb-4">
          {filtered.length === 0 && <li className="p-2 text-gray-400">No results</li>}
          {filtered.map((s, i) => (
            <li
              key={s.id}
              className={`p-2 cursor-pointer rounded ${i === selected ? 'bg-brand-dark text-brand-light' : ''}`}
              onClick={() => expanded === s.id ? undefined : setExpanded(s.id)}
              onMouseEnter={() => setSelected(i)}
            >
              <div className="font-semibold text-base flex items-center justify-between">
                <span>{s.title}</span>
                {expanded === s.id && <span className="ml-2 text-xs bg-brand-light text-brand-dark px-2 py-0.5 rounded-full border border-brand-dark">Preview</span>}
              </div>
              <div className="text-xs text-gray-600 truncate max-w-xs">{s.content.slice(0, 120)}</div>
              {s.tags.length > 0 && <div className="text-[11px] text-brand-light mt-1">{s.tags.join(', ')}</div>}
              {expanded === s.id && (
                <div className="mt-2 p-2 border rounded bg-gray-50 text-gray-900 whitespace-pre-wrap">
                  {s.content}
                  <div className="flex gap-2 mt-3 justify-end">
                    <button
                      className="px-4 py-2 rounded bg-brand-dark text-brand-light font-semibold hover:bg-brand-light hover:text-brand-dark border border-brand-dark text-sm transition-colors duration-100"
                      onClick={e => { e.stopPropagation(); handleInsert(s); }}
                    >
                      Insert
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-400 font-semibold transition-colors duration-100"
                      onClick={e => { e.stopPropagation(); setExpanded(null); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2 justify-end mb-2">
          <button
            className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-300 border border-gray-400 font-semibold transition-colors duration-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2 text-right">
          Enter: {expanded ? 'Insert' : 'Expand'} · Esc: {expanded ? 'Cancel' : 'Close'} · ↑↓: Navigate
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
