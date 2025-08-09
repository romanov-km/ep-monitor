import { useEffect, useState, useCallback } from "react";

type Msg = {
  id: string;
  content: string;
  time: string;
  author: string;
  avatarUrl: string | null;
  attachment: string | null;
};

interface Props {
  channelId: string;
  limit?: number;     // по умолчанию 3
  refreshMs?: number; // по умолчанию 30s
  apiBase?: string;   // по умолчанию /api
}

/**
 * Простой список последних сообщений Discord (без слайдера).
 * — Показывает N последних сообщений.
 * — Длинные тексты режет до 300 символов с кнопкой "Показать всё".
 * — Автообновление раз в refreshMs.
 */
export default function DiscordLastMessages({
  channelId,
  limit = 3,
  refreshMs = 30_000,
  apiBase = "/api",
}: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      setErr(null);
      const r = await fetch(
        `${apiBase}/discord/messages?channelId=${channelId}&limit=${limit}`
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as Msg[];
      setMessages(data);
    } catch (e: any) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }, [apiBase, channelId, limit]);

  useEffect(() => {
    load();
    const t = setInterval(load, refreshMs);
    return () => clearInterval(t);
  }, [load, refreshMs]);

  const toggle = (id: string) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  if (loading) return <div>Loading messages…</div>;
  if (err) return <div>Error: {err}</div>;
  if (!messages.length) return <div>It's empty for now.</div>;

  return (
    <div className="w-full mx-auto mt-4 mb-4 p-6 bg-black/55 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-md">
      <h3 className="text-sm text-gray-300 mb-3">Latest posts</h3>
      <ul className="space-y-4">
        {messages.map((m) => {
          const isLong = (m.content || "").length > 300;
          const visibleText = expanded[m.id]
            ? m.content
            : (m.content || "").slice(0, 300);

          return (
            <li key={m.id} className="flex gap-3 items-start">
              {m.avatarUrl ? (
                <img
                  src={m.avatarUrl}
                  alt={m.author}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <header className="text-sm text-gray-300">
                  <strong className="text-white mr-1">{m.author}</strong>
                  <time
                    className="opacity-70"
                    title={`Local time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}
                  >
                    {new Intl.DateTimeFormat(undefined, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    }).format(new Date(m.time))}
                  </time>
                </header>

                <div className="text-white whitespace-pre-wrap break-words">
                  {visibleText || <span className="opacity-70">[без текста]</span>}
                  {!expanded[m.id] && isLong && <span>…</span>}
                </div>

                {isLong && (
                  <button
                    onClick={() => toggle(m.id)}
                    className="mt-1 text-xs underline text-gray-300 hover:text-white"
                  >
                    {expanded[m.id] ? "Collapse" : "Show all"}
                  </button>
                )}

                {m.attachment && (
                  <div className="mt-1">
                    <a
                      href={m.attachment}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline opacity-80"
                    >
                      Вложение
                    </a>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}