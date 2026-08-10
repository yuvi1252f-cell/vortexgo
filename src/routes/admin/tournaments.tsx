import { createFileRoute } from "@tanstack/react-router";

import { AdminTournaments } from "@/features/admin/AdminTournaments";

export const Route = createFileRoute("/admin/tournaments")({
  component: AdminTournaments,
});
