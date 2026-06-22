
CREATE TABLE public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual',
  duration_seconds integer NOT NULL DEFAULT 0,
  note text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_sessions TO anon, authenticated;
GRANT ALL ON public.focus_sessions TO service_role;

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon rw focus_sessions" ON public.focus_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX focus_sessions_client_started_idx ON public.focus_sessions (client_id, started_at DESC);
