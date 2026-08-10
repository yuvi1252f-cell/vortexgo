import { createFileRoute } from "@tanstack/react-router";

import { AdminDashboard } from "@/features/admin/AdminOverview";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});
