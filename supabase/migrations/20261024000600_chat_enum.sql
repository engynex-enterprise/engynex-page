-- Fase 5 — Un chat en vivo también queda en el historial del lead.
alter type public.activity_type add value if not exists 'chat';
