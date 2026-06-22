import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/client-id";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      const cid = getClientId();
      const { data: existing } = await supabase
        .from("threads")
        .select("id")
        .eq("client_id", cid)
        .order("updated_at", { ascending: false })
        .limit(1);
      let id = existing?.[0]?.id;
      if (!id) {
        const { data } = await supabase
          .from("threads")
          .insert({ client_id: cid, title: "New Chat" })
          .select("id")
          .single();
        id = data?.id;
      }
      if (id) navigate({ to: "/chat/$threadId", params: { threadId: id }, replace: true });
    })();
  }, [navigate]);

  return (
    <div className="flex-1 grid place-items-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}
