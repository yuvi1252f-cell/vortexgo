import { createFileRoute } from "@tanstack/react-router";

import { AdminPlayers } from "@/features/admin/AdminPlayers";

export const Route = createFileRoute("/admin/players")({
  component: AdminPlayers,
});
