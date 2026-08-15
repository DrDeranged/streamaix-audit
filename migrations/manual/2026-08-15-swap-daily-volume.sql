-- Manual provisioning DDL: swap_daily_volume (WS1, 2026-08-15).
-- Run once in any environment that predates this table (idempotent).
CREATE TABLE IF NOT EXISTS public.swap_daily_volume (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    wallet text NOT NULL,
    day text NOT NULL,
    volume_usd double precision DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.swap_daily_volume OWNER TO postgres;
ALTER TABLE ONLY public.swap_daily_volume
    ADD CONSTRAINT swap_daily_volume_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS swap_daily_volume_wallet_day_idx ON public.swap_daily_volume USING btree (wallet, day);
