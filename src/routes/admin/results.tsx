import { createFileRoute } from "@tanstack/react-router";

import { AdminResults } from "@/features/admin/AdminResults";

export const Route = createFileRoute("/admin/results")({
  component: AdminResults,
});
