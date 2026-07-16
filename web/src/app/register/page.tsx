import type { Metadata } from "next";
import { RegisterClient } from "@/components/portal/RegisterClient";

export const metadata: Metadata = {
  title: "Create your account — Plate3D",
  description: "Start your free month and put your menu in 3D.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
