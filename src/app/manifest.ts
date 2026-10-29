import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Health Tracker",
    short_name: "Health",
    description: "Track weight, injections, blood pressure, medications and how you feel.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f3",
    theme_color: "#0f766e",
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
