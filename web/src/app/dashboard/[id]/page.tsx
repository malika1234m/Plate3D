import type { Metadata } from "next";
import { RestaurantClient } from "@/components/portal/RestaurantClient";

export const metadata: Metadata = {
  title: "Manage restaurant — Plate3D",
};

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RestaurantClient id={id} />;
}
