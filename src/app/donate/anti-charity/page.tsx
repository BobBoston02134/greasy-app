import { headers } from "next/headers";
import { RECIPIENTS } from "@/lib/constants";
import { ENABLE_SUBDOMAIN_ROUTING } from "@/lib/flags";
import AntiCharityClient from "./AntiCharityClient";

export default async function DonateAntiCharityPage() {
  const headersList = await headers();
  const orgSlug = headersList.get("x-org-slug") ?? "";

  // When on an org subdomain, the anti-charity pool is all orgs except the
  // pinned recipient (which the client component will also exclude).
  // On the main domain, the full list is passed and the client filters out
  // whichever recipient the user picked.
  const availableOptions = (() => {
    if (ENABLE_SUBDOMAIN_ROUTING && orgSlug) {
      const filtered = RECIPIENTS.filter((r) => r.value !== orgSlug);
      return filtered.map((r) => ({ value: r.value, label: r.label }));
    }
    return RECIPIENTS.map((r) => ({ value: r.value, label: r.label }));
  })();

  return <AntiCharityClient availableOptions={availableOptions} />;
}
