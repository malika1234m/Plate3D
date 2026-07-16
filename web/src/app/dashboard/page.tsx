import type { Metadata } from "next";
import { DashboardClient } from "@/components/portal/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard — Plate3D",
  description: "Manage your restaurants and menus.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
