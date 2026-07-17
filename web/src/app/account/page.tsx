import type { Metadata } from "next";
import { AccountClient } from "@/components/account/AccountClient";

export const metadata: Metadata = {
  title: "Your account & plan — GoPlate",
  description: "Sign in to manage your GoPlate subscription and billing.",
};

export default function AccountPage() {
  return <AccountClient />;
}
