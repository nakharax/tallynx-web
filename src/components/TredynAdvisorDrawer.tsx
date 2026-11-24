import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  X,
  RotateCcw,
  Send,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import { Language } from '../utils/i18n';
import {
  getAdvisorCopy,
  parseAdvisorBlocks,
} from '../utils/advisorLogic';
import { TredynLogo } from './TredynLogo';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface TredynAdvisorDrawerProps {
  lang: Language;
  isDark?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const TredynAdvisorDrawer: React.FC<TredynAdvisorDrawerProps> = ({
  lang,
  isDark = false,
  isOpen: controlledOpen,
  onClose,
}) => {
  const copy = getAdvisorCopy(lang);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const handleClose = () => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalOpen(false);
    }
  };
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'advisor-welcome',
      role: 'assistant',
      content: getAdvisorCopy(lang).greeting,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync welcome greeting when user toggles language before sending any messages
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'advisor-welcome') {
        return [
          {
            id: 'advisor-welcome',
            role: 'assistant',
            content: getAdvisorCopy(lang).greeting,
          },
        ];
      }
      return prev;
    });
  }, [lang]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isControlled]);

  const handleReset = () => {
    setMessages([
      {
        id: 'advisor-welcome',
        role: 'assistant',
        content: copy.greeting,
      },
    ]);
    setErrorMsg(null);
    setInput('');
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setErrorMsg(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 28000);

    try {
      const historyForApi = nextMessages
        .filter((m) => m.id !== 'advisor-welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForApi, lang }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      const replyMsg: ChatMessage = {
        id: `advisor-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'TallyNX Advisor: Signal received.',
      };
      setMessages((prev) => [...prev, replyMsg]);
    } catch (err: unknown) {
      const msg =
        err instanceof DOMException && err.name === 'AbortError'
          ? 'TallyNX Advisor request timed out. Please try again.'
          : err instanceof Error
            ? err.message
            : 'Unable to communicate with TallyNX Advisor. Please try again.';
      setErrorMsg(msg);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <>
      {/* Floating Bottom-Right Launcher Button (when uncontrolled) */}
      {!isControlled && !isOpen && (
        <button
          type="button"
          data-testid="advisor-launcher"
          aria-label={copy.launcherAria}
          onClick={() => setInternalOpen(true)}
          className={`fixed bottom-5 right-6 z-40 inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-lg border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap ${
            isDark
              ? 'bg-neutral-950 text-white border-neutral-800 hover:border-blue-500/70 hover:bg-neutral-900'
              : 'bg-neutral-950 text-white border-neutral-800 hover:bg-neutral-900 hover:border-blue-500/70'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{copy.launcherLabel}</span>
        </button>
      )}

      {/* Slide-Over Tredyn Advisor Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={copy.headerTitle}
          data-testid="advisor-drawer"
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]"
          onClick={handleClose}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-full w-full max-w-[430px] flex-col bg-white text-neutral-900 shadow-2xl border-l border-neutral-200 dark:bg-[#0b0d12] dark:text-neutral-100 dark:border-neutral-800"
          >
            {/* Clean Single-Row Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 min-w-0">
                <TredynLogo variant="mark" size="md" />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold tracking-tight text-neutral-950 dark:text-white truncate">
                    {copy.headerTitle}
                  </h2>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {copy.headerSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label={copy.resetAria}
                  title={copy.resetAria}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label={copy.closeAria}
                  title={copy.closeAria}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Airy Message History */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#0752E8] px-3.5 py-2.5 text-xs leading-relaxed text-white dark:bg-[#2563EB] dark:text-white font-medium">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                const blocks = parseAdvisorBlocks(msg.content);
                return (
                  <div
                    key={msg.id}
                    className="rounded-2xl rounded-tl-sm border border-neutral-200/80 bg-neutral-50/70 px-4 py-3.5 text-[13px] leading-relaxed text-neutral-700 space-y-2 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
                  >
                    {blocks.map((block, bIdx) => {
                      if (block.type === 'bullet') {
                        return (
                          <div key={bIdx} className="flex items-start gap-2">
                            <span
                              className="mt-2 h-1 w-1 rounded-full bg-blue-500 shrink-0"
                              aria-hidden="true"
                            />
                            <p className="flex-1">
                              {block.segments.map((seg, sIdx) =>
                                seg.bold ? (
                                  <strong
                                    key={sIdx}
                                    className="font-semibold text-neutral-950 dark:text-white"
                                  >
                                    {seg.text}
                                  </strong>
                                ) : (
                                  <React.Fragment key={sIdx}>{seg.text}</React.Fragment>
                                )
                              )}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <p key={bIdx}>
                          {block.segments.map((seg, sIdx) =>
                            seg.bold ? (
                              <strong
                                key={sIdx}
                                className="font-semibold text-neutral-950 dark:text-white"
                              >
                                {seg.text}
                              </strong>
                            ) : (
                              <React.Fragment key={sIdx}>{seg.text}</React.Fragment>
                            )
                          )}
                        </p>
                      );
                    })}
                  </div>
                );
              })}

              {/* Lightweight Quick Prompts inside empty chat state */}
              {messages.length === 1 && !isLoading && (
                <div className="pt-1 flex flex-col gap-1.5">
                  {copy.suggestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      className="group flex items-center justify-between gap-2 w-full text-left rounded-xl border border-neutral-200/90 bg-white px-3.5 py-2.5 text-xs text-neutral-600 hover:border-neutral-400 hover:text-neutral-950 transition cursor-pointer dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white"
                    >
                      <span>{q}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-blue-500 shrink-0 transition" />
                    </button>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="inline-block rounded-xl border border-neutral-200/80 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
                  {copy.thinkingText}
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Minimal Input Composer */}
            <div className="border-t border-neutral-200 px-5 py-3.5 bg-white dark:border-neutral-800 dark:bg-[#0b0d12]">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={copy.inputPlaceholder}
                  aria-label={copy.inputPlaceholder}
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 transition"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  aria-label={copy.sendAria}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0752E8] text-white hover:bg-[#0642BD] disabled:opacity-35 transition cursor-pointer dark:bg-[#2563EB] dark:text-white dark:hover:bg-[#3B82F6]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <p className="mt-2 text-center text-[10px] text-neutral-400 dark:text-neutral-500">
                {copy.footerNote}
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
