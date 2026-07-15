import type { Metadata } from "next";
import { AccountClient } from "@/components/account/AccountClient";

export const metadata: Metadata = {
  title: "Your account & plan — Plate3D",
  description: "Sign in to manage your Plate3D subscription and billing.",
};

export default function AccountPage() {
  return <AccountClient />;
}
