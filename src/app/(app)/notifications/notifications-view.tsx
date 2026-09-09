import Link from "next/link";
import { MessageSquare, PenLine, Info } from "lucide-react";
import {
  Card,
  Empty,
  EventCard,
  EventMark,
  PageHeader,
  StatusPill,
} from "@/design-system";
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
    <div>
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
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((n) => {
            const kind = KIND[n.kind];
            const Icon = kind.icon;
            const card = (
              <EventCard
                kind={n.title}
                when={WHEN.format(new Date(n.createdAt))}
                tone={kind.tone}
                className="h-full"
                mark={
                  <EventMark disc>
                    <Icon strokeWidth={2} />
                  </EventMark>
                }
                footer={
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="live">{kind.label}</StatusPill>
                    {!n.read ? <StatusPill tone="ok">New</StatusPill> : null}
                  </div>
                }
              >
                {n.body}
              </EventCard>
            );

            return (
              <li key={n.id} className="h-full">
                {n.href ? (
                  <Link href={n.href} className="block h-full">
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
