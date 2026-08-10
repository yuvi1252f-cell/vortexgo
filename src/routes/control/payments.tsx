import { createFileRoute } from "@tanstack/react-router";

import { AdminPayments } from "@/features/admin/AdminPayments";

export const Route = createFileRoute("/control/payments")({
  component: AdminPayments,
});
