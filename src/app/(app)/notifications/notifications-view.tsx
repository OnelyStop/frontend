import Link from "next/link";
import { MessageSquare, PenLine, Info } from "lucide-react";
import { Card, Empty, PageHeader, StatusPill } from "@/design-system";
import type { Notification } from "@/features/notifications/types";

const WHEN = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const KIND = {
  doubt_reply: { icon: MessageSquare, label: "Community", tone: "brand" },
  marking_ready: { icon: PenLine, label: "Marking", tone: "warn" },
  system: { icon: Info, label: "Onelystop", tone: "info" },
} as const;

export function NotificationsView({ items }: { items: Notification[] }) {
  return (
    <div className="max-w-[72ch]">
      <PageHeader
        title="Notifications"
        sub="Replies to your doubts, markings that came back, and anything we need to tell you."
      />

      {items.length === 0 ? (
        <Card pad={false}>
          <Empty
            mark="🔔"
            tone="info"
            title="Nothing yet"
            sub="When somebody answers a doubt you asked, or a descriptive answer comes back marked, it lands here."
          />
        </Card>
      ) : (
        <ul className="grid gap-3">
          {items.map((n) => {
            const kind = KIND[n.kind];
            const Icon = kind.icon;
            const body = (
              <>
                <div className="flex items-center gap-2.5">
                  <Icon size={16} strokeWidth={1.9} className="text-ink-3" />
                  <StatusPill tone={kind.tone}>{kind.label}</StatusPill>
                  {!n.read ? <StatusPill tone="ok">New</StatusPill> : null}
                  <span className="text-ink-3 ml-auto text-[12.5px]">
                    {WHEN.format(new Date(n.createdAt))}
                  </span>
                </div>
                <p className="mt-2.5 text-[15px] font-semibold">{n.title}</p>
                {n.body ? (
                  <p className="text-ink-2 mt-1 text-[13.5px] leading-relaxed">
                    {n.body}
                  </p>
                ) : null}
              </>
            );

            return (
              <li key={n.id}>
                {n.href ? (
                  <Link href={n.href} className="card card-lift block p-5">
                    {body}
                  </Link>
                ) : (
                  <div className="card p-5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
