-- Down for 0004_notifications.
-- DESTRUCTIVE: drops every notification, read and unread, for every user.
-- Nothing else references them, so no other table loses rows.
DROP TABLE IF EXISTS "notifications";
--> statement-breakpoint
DROP TYPE IF EXISTS "notification_kind";
