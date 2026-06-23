
-- Replace permissive ALL policies with split read/write policies.
-- Reads remain public; writes require a non-empty client_id on the row.

-- threads
DROP POLICY IF EXISTS "anon rw threads" ON public.threads;
CREATE POLICY "threads read" ON public.threads FOR SELECT USING (true);
CREATE POLICY "threads insert" ON public.threads FOR INSERT WITH CHECK (client_id IS NOT NULL AND length(client_id) >= 8);
CREATE POLICY "threads update" ON public.threads FOR UPDATE USING (client_id IS NOT NULL AND length(client_id) >= 8) WITH CHECK (client_id IS NOT NULL AND length(client_id) >= 8);
CREATE POLICY "threads delete" ON public.threads FOR DELETE USING (client_id IS NOT NULL AND length(client_id) >= 8);

-- messages (no client_id column; constrain to existing thread)
DROP POLICY IF EXISTS "anon rw messages" ON public.messages;
CREATE POLICY "messages read" ON public.messages FOR SELECT USING (true);
CREATE POLICY "messages insert" ON public.messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.threads t WHERE t.id = thread_id));
CREATE POLICY "messages update" ON public.messages FOR UPDATE USING (EXISTS (SELECT 1 FROM public.threads t WHERE t.id = thread_id)) WITH CHECK (EXISTS (SELECT 1 FROM public.threads t WHERE t.id = thread_id));
CREATE POLICY "messages delete" ON public.messages FOR DELETE USING (EXISTS (SELECT 1 FROM public.threads t WHERE t.id = thread_id));

-- projects
DROP POLICY IF EXISTS "anon rw projects" ON public.projects;
CREATE POLICY "projects read" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects insert" ON public.projects FOR INSERT WITH CHECK (client_id IS NOT NULL AND length(client_id) >= 8);
CREATE POLICY "projects update" ON public.projects FOR UPDATE USING (client_id IS NOT NULL AND length(client_id) >= 8) WITH CHECK (client_id IS NOT NULL AND length(client_id) >= 8);
CREATE POLICY "projects delete" ON public.projects FOR DELETE USING (client_id IS NOT NULL AND length(client_id) >= 8);

-- research_sessions
DROP POLICY IF EXISTS "anon rw research" ON public.research_sessions;
CREATE POLICY "research read" ON public.research_sessions FOR SELECT USING (true);
CREATE POLICY "research insert" ON public.research_sessions FOR INSERT WITH CHECK (client_id IS NOT NULL AND length(client_id) >= 8);
CREATE POLICY "research update" ON public.research_sessions FOR UPDATE USING (client_id IS NOT NULL AND length(client_id) >= 8) WITH CHECK (client_id IS NOT NULL AND length(client_id) >= 8);
CREATE POLICY "research delete" ON public.research_sessions FOR DELETE USING (client_id IS NOT NULL AND length(client_id) >= 8);

-- tasks
DROP POLICY IF EXISTS "anon rw tasks" ON public.tasks;
CREATE POLICY "tasks read" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "tasks insert" ON public.tasks FOR INSERT WITH CHECK (client_id IS NOT NULL AND length(client_id) >= 8);
CREATE POLICY "tasks update" ON public.tasks FOR UPDATE USING (client_id IS NOT NULL AND length(client_id) >= 8) WITH CHECK (client_id IS NOT NULL AND length(client_id) >= 8);
CREATE POLICY "tasks delete" ON public.tasks FOR DELETE USING (client_id IS NOT NULL AND length(client_id) >= 8);

-- focus_sessions
DROP POLICY IF EXISTS "anon rw focus_sessions" ON public.focus_sessions;
CREATE POLICY "focus read" ON public.focus_sessions FOR SELECT USING (true);
CREATE POLICY "focus insert" ON public.focus_sessions FOR INSERT WITH CHECK (client_id IS NOT NULL AND length(client_id) >= 8);
CREATE POLICY "focus update" ON public.focus_sessions FOR UPDATE USING (client_id IS NOT NULL AND length(client_id) >= 8) WITH CHECK (client_id IS NOT NULL AND length(client_id) >= 8);
CREATE POLICY "focus delete" ON public.focus_sessions FOR DELETE USING (client_id IS NOT NULL AND length(client_id) >= 8);
