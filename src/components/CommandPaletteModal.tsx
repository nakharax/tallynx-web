import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  X,
  CornerDownLeft,
  Sun,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Language } from '../utils/i18n';
import { renderNavIcon } from './CategorizedNavbar';
import {
  CommandActionId,
  CommandPaletteItem,
  buildCommandPaletteItems,
  filterCommandPaletteItems,
} from '../utils/commandPaletteLogic';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  isDark: boolean;
  onNavigate: (path: string) => void;
  onRunAction: (actionId: CommandActionId) => void;
}

function renderPaletteIcon(item: CommandPaletteItem) {
  const cls = 'h-4 w-4 text-focus shrink-0';
  switch (item.iconKey) {
    case 'sun':
      return <Sun className={cls} />;
    case 'globe':
      return <Globe className={cls} />;
    case 'sparkles':
      return <Sparkles className={cls} />;
    default:
      return renderNavIcon(item.iconKey, true);
  }
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  lang,
  isDark,
  onNavigate,
  onRunAction,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isTh = lang === 'th';

  const allItems = useMemo(
    () => buildCommandPaletteItems(lang, isDark),
    [lang, isDark]
  );

  const filteredItems = useMemo(
    () => filterCommandPaletteItems(allItems, query),
    [allItems, query]
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIdx(0);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  const activeIdx = Math.min(selectedIdx, Math.max(0, filteredItems.length - 1));

  const executeItem = (item: CommandPaletteItem) => {
    onClose();
    if (item.kind === 'route') {
      onNavigate(item.href);
    } else {
      onRunAction(item.actionId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) =>
        filteredItems.length ? (prev + 1) % filteredItems.length : 0
      );
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) =>
        filteredItems.length
          ? (prev - 1 + filteredItems.length) % filteredItems.length
          : 0
      );
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const liveQuery = inputRef.current ? inputRef.current.value : query;
      const liveItems =
        liveQuery === query
          ? filteredItems
          : filterCommandPaletteItems(allItems, liveQuery);
      const targetIdx =
        liveQuery === query
          ? activeIdx
          : 0;
      if (liveItems[targetIdx]) {
        executeItem(liveItems[targetIdx]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="tnx-modal-backdrop fixed inset-0 z-[90] flex items-start justify-center bg-[#050608]/65 backdrop-blur-sm px-4 pt-[12vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isTh ? 'ค้นหาและคำสั่งด่วน' : 'Quick search and command palette'}
      data-testid="command-palette-modal"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="tnx-modal-surface w-full max-w-xl overflow-hidden rounded-2xl border border-[#D6D1C7] bg-white shadow-2xl dark:border-neutral-800 dark:bg-[#141618]"
      >
            {/* Input Row */}
            <div className="flex items-center gap-3 border-b border-[#D6D1C7] px-4 py-3 dark:border-neutral-800 bg-[#F8F6F0] dark:bg-[#1B1E21]">
              <Search className="h-4 w-4 text-focus shrink-0" />
              <input
                ref={inputRef}
                type="text"
                data-testid="command-palette-input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIdx(0);
                }}
                placeholder={
                  isTh
                    ? 'พิมพ์ค้นหาหน้า เครื่องมือ หรือคำสั่งด่วน...'
                    : 'Search pages, trading tools, or quick actions...'
                }
                className="w-full bg-transparent text-sm text-[#141618] placeholder:text-[#5C5852] focus:outline-hidden dark:text-white dark:placeholder:text-neutral-500"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label={isTh ? 'ปิดหน้าต่างค้นหา' : 'Close search'}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#D6D1C7] bg-white text-[#2B2D2F] hover:text-[#141618] dark:border-neutral-800 dark:bg-[#141618] dark:text-neutral-400 dark:hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[380px] overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#2B2D2F] dark:text-neutral-400">
                  {isTh
                    ? 'ไม่พบเมนูหรือคำสั่งที่ตรงกับคำค้นหา'
                    : 'No matching routes or quick actions found.'}
                </div>
              ) : (
                <ul role="listbox" className="space-y-0.5">
                  {filteredItems.map((item, idx) => {
                    const active = idx === activeIdx;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          data-testid={`palette-item-${item.id}`}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          onClick={() => executeItem(item)}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition cursor-pointer ${
                            active
                              ? 'bg-focus/10 text-[#141618] dark:bg-focus/15 dark:text-white'
                              : 'text-[#141618] hover:bg-neutral-100/70 dark:text-neutral-200 dark:hover:bg-neutral-900'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-focus/10 dark:bg-focus/15">
                              {renderPaletteIcon(item)}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold">
                                {item.title}
                              </div>
                              <div className="truncate text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                                {item.description}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="hidden sm:inline font-mono text-[10px] text-[#5C5852] dark:text-neutral-500">
                              {item.badge}
                            </span>
                            {active && (
                              <CornerDownLeft className="h-3.5 w-3.5 text-focus" />
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer Key Hints */}
            <div className="flex items-center justify-between border-t border-[#D6D1C7] bg-[#F8F6F0] px-4 py-2 text-[11px] text-[#2B2D2F] dark:border-neutral-800 dark:bg-[#1B1E21] dark:text-neutral-400">
              <span>
                {isTh ? '↑↓ เลือก · Enter เปิด' : '↑↓ Navigate · Enter to run'}
              </span>
              <span className="font-mono text-[10px]">ESC</span>
            </div>
      </div>
    </div>
  );
};
