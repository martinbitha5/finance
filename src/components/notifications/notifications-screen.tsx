"use client";

import { CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { AppNotification } from "@/lib/finance/types";
import { clearNotifications, markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const tone: Record<AppNotification["severity"], string> = {
  danger: "bg-negative",
  warning: "bg-warning",
  success: "bg-positive",
  info: "bg-info",
};

export function NotificationsScreen({ items }: { items: AppNotification[] }) {
  const readOne = useAction(markNotificationRead, {});
  const readAll = useAction(markAllNotificationsRead, { success: "Tout est lu" });
  const clear = useAction(clearNotifications, { success: "Notifications effacées" });
  const unread = items.filter((n) => !n.is_read).length;

  if (items.length === 0) {
    return <EmptyState icon="🔔" title="Aucune notification" description="MONY te préviendra seulement quand c'est utile : budget presque atteint, salaire qui arrive, rythme trop élevé…" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-sm text-fg-muted">{unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est lu"}</span>
        <div className="flex gap-1">
          {unread > 0 ? <Button size="sm" variant="ghost" onClick={() => readAll.execute(null)} loading={readAll.pending}><CheckCheck className="h-4 w-4" /> Tout lire</Button> : null}
          <Button size="sm" variant="ghost" onClick={() => clear.execute(null)} loading={clear.pending}><Trash2 className="h-4 w-4" /> Effacer</Button>
        </div>
      </div>
      <ul className="card p-0 overflow-hidden divide-y divide-border">
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => !n.is_read && readOne.execute(n.id)}
              className={cn("w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors", !n.is_read ? "bg-accent/6 hover:bg-accent/10" : "hover:bg-surface-2/60")}
            >
              <span className={cn("mt-2 h-2 w-2 rounded-full shrink-0", tone[n.severity], n.is_read && "opacity-30")} />
              <span className="flex-1 min-w-0">
                <span className={cn("block text-[14px] leading-snug", !n.is_read ? "font-bold" : "font-medium text-fg-muted")}>{n.title}</span>
                {n.body ? <span className="block text-xs text-fg-muted mt-0.5">{n.body}</span> : null}
                <span className="block text-[11px] text-fg-subtle mt-1">{formatDistanceToNow(parseISO(n.created_at), { addSuffix: true, locale: fr })}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
