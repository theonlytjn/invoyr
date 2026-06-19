export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/clients", label: "Clients" },
  { href: "/payments", label: "Payments" },
  { href: "/settings", label: "Settings" },
] as const;

export type NavHref = (typeof NAV_ITEMS)[number]["href"];
