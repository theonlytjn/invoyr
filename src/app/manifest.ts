import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Invoyr — Professional Invoicing",
    short_name: "Invoyr",
    description: "Create invoices, track payments, and get paid faster.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    categories: ["business", "finance", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Maskable: needs safe-zone padding (logo centred in inner 80% of canvas).
        // Add /icon-maskable.png when ready; until then this falls back to the above.
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "New invoice",
        url: "/invoices/new",
        description: "Create a new invoice",
      },
      {
        name: "Dashboard",
        url: "/dashboard",
        description: "View your dashboard",
      },
    ],
  };
}
