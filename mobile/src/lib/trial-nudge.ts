import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { startUpgrade } from "./upgrade";

const PROMPT_DATE_KEY = "goplate_trial_prompt_date";

/** Days-left threshold at which we start warning ahead of expiry. */
const WARN_FROM_DAYS = 5;

type BillingState = {
  subscribed: boolean;
  accessActive: boolean;
  trialDaysLeft: number;
};

function localDay(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Actively notify the owner about their trial — once per day, on app open.
 *  - Trial ended: prompt to choose a plan.
 *  - Trial ending within a few days: heads-up with the countdown.
 * Subscribed users are never prompted.
 */
export async function maybeShowTrialNudge(billing: BillingState): Promise<void> {
  if (billing.subscribed) return;

  const ended = !billing.accessActive;
  const endingSoon = billing.accessActive && billing.trialDaysLeft <= WARN_FROM_DAYS;
  if (!ended && !endingSoon) return;

  // At most one prompt per day so it nudges without nagging.
  const today = localDay();
  const last = await SecureStore.getItemAsync(PROMPT_DATE_KEY).catch(() => null);
  if (last === today) return;
  await SecureStore.setItemAsync(PROMPT_DATE_KEY, today).catch(() => {});

  if (ended) {
    Alert.alert(
      "Your free month has ended",
      "Choose a plan from $2/mo to keep editing your menu. Your published menu is still live for customers.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Choose a plan", onPress: () => startUpgrade() },
      ]
    );
  } else {
    const days = billing.trialDaysLeft;
    Alert.alert(
      days === 1 ? "Last day of your free month" : `${days} days left in your free month`,
      "Pick a plan from $2/mo now and there'll be no interruption when the trial ends.",
      [
        { text: "Later", style: "cancel" },
        { text: "See plans", onPress: () => startUpgrade() },
      ]
    );
  }
}
