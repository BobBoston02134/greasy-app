export const SUBDOMAIN_TO_ORG: Record<string, string> = {
  sundai: "sundai_club",
  westpoint: "west_point",
};

export function getOrgFromSubdomain(subdomain: string): string | null {
  return SUBDOMAIN_TO_ORG[subdomain] ?? null;
}
