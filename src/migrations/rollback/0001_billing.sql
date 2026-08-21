-- Down migration for 0001_billing.sql. Drops in dependency order; the enums go
-- last because the tables reference them.
DROP TABLE IF EXISTS public.entitlements;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.payment_events;
DROP TABLE IF EXISTS public.subscriptions;
DROP TABLE IF EXISTS public.payment_plans;

DROP TYPE IF EXISTS public.subscription_status;
DROP TYPE IF EXISTS public.plan_key;
DROP TYPE IF EXISTS public.currency_code;
DROP TYPE IF EXISTS public.billing_interval;
