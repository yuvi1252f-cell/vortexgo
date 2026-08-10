import { createFileRoute } from "@tanstack/react-router";

import { AdminSettings } from "@/features/admin/AdminSettings";

export const Route = createFileRoute("/control/settings")({
  component: AdminSettings,
});
