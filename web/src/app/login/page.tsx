import type { Metadata } from "next";
import { LoginClient } from "@/components/portal/LoginClient";

export const metadata: Metadata = {
  title: "Sign in — Plate3D",
  description: "Sign in to manage your restaurant's 3D menu.",
};

export default function LoginPage() {
  return <LoginClient />;
}
