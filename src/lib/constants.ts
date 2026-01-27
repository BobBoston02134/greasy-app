export const AMOUNTS = [
  { value: 100, label: "$1", display: "$1.00" },
  { value: 500, label: "$5", display: "$5.00" },
  { value: 1000, label: "$10", display: "$10.00" },
  { value: 2000, label: "$20", display: "$20.00" },
  { value: 5000, label: "$50", display: "$50.00" },
  { value: 10000, label: "$100", display: "$100.00" },
] as const;

export const TIMEFRAMES = [
  { value: "immediate", label: "Immediate" },
  { value: "5pm", label: "5:00 PM Today" },
  { value: "10pm", label: "10:00 PM Today" },
  { value: "midnight", label: "Midnight Tonight" },
  { value: "end_of_week", label: "End of Week (Friday)" },
  { value: "end_of_month", label: "End of Calendar Month" },
  { value: "end_of_quarter", label: "End of Quarter" },
  { value: "end_of_year", label: "End of Year" },
] as const;

export const RECIPIENTS = [
  { value: "sundai_club", label: "Sundai Club" },
  { value: "mit_alumni", label: "MIT Alumni Association" },
  { value: "harvard_alumni", label: "Harvard Alumni Association" },
  { value: "stanford_alumni", label: "Stanford Alumni Association" },
  { value: "mit_sloan", label: "MIT Sloan Annual Fund" },
  { value: "usna_alumni", label: "US Naval Academy Alumni Fund" },
  { value: "west_point", label: "West Point Association of Graduates" },
] as const;

export const FINANCIAL_ROUTES = ["/donate/payment", "/account"] as const;

export const DONATION_STORAGE_KEY = "greasy_donation";

export const ALLOWED_AMOUNTS = AMOUNTS.map((a) => a.value);
export const ALLOWED_TIMEFRAMES = TIMEFRAMES.map((t) => t.value);
export const ALLOWED_RECIPIENTS = RECIPIENTS.map((r) => r.value);
