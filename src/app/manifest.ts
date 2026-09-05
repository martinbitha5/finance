import type { MetadataRoute } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — ${APP_TAGLINE}`,
    short_name: APP_NAME,
    description: "Comprends où part ton argent et contrôle ton salaire jusqu'à la prochaine paie.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    lang: "fr",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Ajouter une dépense", short_name: "Ajouter", url: "/ajouter", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Analyse", short_name: "Analyse", url: "/analyse", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
