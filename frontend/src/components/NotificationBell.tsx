import { useCallback, useEffect, useState } from 'react';
import type { NotificationRow } from '../lib/types';
import { get, patch } from '../lib/api';
import { Icon } from './Icon';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await get<{ notifications: NotificationRow[]; unread: number }>(
        '/api/notifications',
      );
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      /* ignore polling errors */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [load]);

  async function markAll() {
    try {
      await patch('/api/notifications', {});
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-amber-900/70 transition-colors hover:bg-amber-50 hover:text-amber-900"
        aria-label="Notifications"
      >
        <Icon name="bell" className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_24px_60px_-24px_rgba(180,120,0,0.45)]">
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/60 px-4 py-2.5">
              <span className="font-display text-sm font-semibold text-stone-900">Notifications</span>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs font-medium text-amber-800 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                    <Icon name="bell" className="h-5 w-5" />
                  </span>
                  <p className="text-sm text-stone-500">No notifications</p>
                </div>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={`border-b border-amber-50 px-4 py-3 text-sm ${
                      n.read ? 'bg-white' : 'bg-amber-50/40'
                    }`}
                  >
                    <p className="font-semibold text-stone-800">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-stone-500">{n.body}</p>}
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-stone-400">
                      <Icon name="clock" className="h-3 w-3" />
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
