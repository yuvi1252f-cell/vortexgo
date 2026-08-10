import { createFileRoute } from "@tanstack/react-router";

import { AdminResults } from "@/features/admin/AdminResults";

export const Route = createFileRoute("/control/results")({
  component: AdminResults,
});
