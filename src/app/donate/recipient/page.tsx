import { headers } from "next/headers";
import { RECIPIENTS } from "@/lib/constants";
import { ENABLE_SUBDOMAIN_ROUTING } from "@/lib/flags";
import RecipientClient from "./RecipientClient";

export default async function DonateRecipientPage() {
  const headersList = await headers();
  const orgSlug = headersList.get("x-org-slug") ?? "";

  const recipientOptions = (() => {
    if (ENABLE_SUBDOMAIN_ROUTING && orgSlug) {
      const filtered = RECIPIENTS.filter((r) => r.value === orgSlug);
      if (filtered.length > 0) {
        return filtered.map((r) => ({ value: r.value, label: r.label }));
      }
    }
    return RECIPIENTS.map((r) => ({ value: r.value, label: r.label }));
  })();

  return <RecipientClient recipientOptions={recipientOptions} />;
}
