export type NotificationKind = "doubt_reply" | "marking_ready" | "system";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
};
