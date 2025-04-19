import React, { useEffect, useRef, useState } from 'react';
import { Snippet } from '../shared/types';

interface CommandPaletteProps {
  snippets: Snippet[];
  onSelect: (snippet: Snippet) => void;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ snippets, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<Snippet[]>(snippets);
  const [selected, setSelected] = useState(0);
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
  }, [query, snippets]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        setSelected(s => Math.min(filtered.length - 1, s + 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setSelected(s => Math.max(0, s - 1));
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (filtered[selected]) {
          onSelect(filtered[selected]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, selected, onSelect, onClose]);

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
        <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
          {filtered.length === 0 && <li className="p-2 text-gray-400">No results</li>}
          {filtered.map((s, i) => (
            <li
              key={s.id}
              className={`p-2 cursor-pointer rounded ${i === selected ? 'bg-brand-dark text-brand-light' : ''}`}
              onClick={() => onSelect(s)}
              onMouseEnter={() => setSelected(i)}
            >
              <div className="font-semibold text-sm">{s.title}</div>
              <div className="text-xs text-gray-600 truncate">{s.content.slice(0, 80)}</div>
              <div className="text-[10px] text-brand-dark mt-1">{s.tags.join(', ')}</div>
            </li>
          ))}
        </ul>
        <div className="text-xs text-gray-400 mt-2">Enter: Insert · Esc: Close · ↑↓: Navigate</div>
      </div>
    </div>
  );
};

export default CommandPalette;
