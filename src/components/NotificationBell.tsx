import { createClient } from "@/lib/supabase/server";
import { markAllRead } from "@/lib/actions/notifications";

/** Campana con las últimas notificaciones. Usa <details>, así funciona sin JavaScript y con teclado. */
export async function NotificationBell() {
  const supabase = await createClient();
  const [{ data: items }, { count }] = await Promise.all([
    supabase.from("notifications").select("id, title, body, read_at, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);
  const unread = count ?? 0;

  return (
    <details className="relative">
      <summary
        aria-label={unread ? `Notificaciones: ${unread} sin leer` : "Notificaciones"}
        className="relative flex size-10 cursor-pointer list-none items-center justify-center rounded-lg hover:bg-background [&::-webkit-details-marker]:hidden"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-6 fill-none stroke-current stroke-2">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </summary>
      <div className="fixed inset-x-4 top-16 z-20 rounded-xl border border-border bg-background p-2 shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
        {items?.length ? (
          <ul className="max-h-96 divide-y divide-border overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <a href={`/notificaciones/${n.id}`} className="block rounded-lg px-3 py-2 hover:bg-surface">
                  <p className={`text-sm ${n.read_at ? "" : "font-bold"}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-muted">{n.body}</p>}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-3 text-sm text-muted">No tienes notificaciones.</p>
        )}
        {unread > 0 && (
          <form action={markAllRead} className="border-t border-border p-2">
            <button className="text-sm font-semibold text-primary underline">Marcar todas como leídas</button>
          </form>
        )}
      </div>
    </details>
  );
}
