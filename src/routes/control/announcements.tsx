import { createFileRoute } from "@tanstack/react-router";

import { AdminAnnouncements } from "@/features/admin/AdminAnnouncements";

export const Route = createFileRoute("/control/announcements")({
  component: AdminAnnouncements,
});
