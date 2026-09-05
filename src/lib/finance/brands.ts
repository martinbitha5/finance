/**
 * Détection de marques : quand le nom d'une charge récurrente (ou d'une transaction)
 * correspond à une entreprise connue, on affiche son vrai logo à la place de l'emoji
 * de catégorie. Le logo est le favicon officiel du domaine, servi par Google
 * (https://www.google.com/s2/favicons) — aucune clé d'API, et repli sur l'emoji
 * si l'image ne charge pas (hors ligne, marque inconnue…). Les charges génériques
 * (salaire, transport, loyer…) reçoivent une icône vectorielle colorée.
 */

import type { LucideIcon } from "lucide-react";
import { Banknote, Bus, Car, Droplets, Dumbbell, Fuel, GraduationCap, Home, Landmark, Shield, ShoppingCart, Smartphone, Stethoscope, Wifi, Zap } from "lucide-react";

export interface Brand {
  /** Domaine dont on récupère le favicon officiel (marques uniquement). */
  domain?: string;
  /** Icône vectorielle pour les charges génériques sans marque (salaire, transport…). */
  icon?: LucideIcon;
  /** Couleur de la marque ou du thème, utilisée pour teinter la bulle. */
  color: string;
}

/**
 * Charges génériques sans marque : icône vectorielle + couleur de thème.
 * Testées après les marques, pour que « Uber » gagne sur « transport ».
 */
const GENERICS: Array<Brand & { keys: string[] }> = [
  { keys: ["salaire", "salary", "paie", "paye"], icon: Banknote, color: "#22C55E" },
  { keys: ["transport", "taxi", "bus", "moto", "metro", "tram", "navette"], icon: Bus, color: "#F59E0B" },
  { keys: ["loyer", "rent", "logement", "maison"], icon: Home, color: "#8B5CF6" },
  { keys: ["internet", "wifi", "connexion", "fibre", "box"], icon: Wifi, color: "#3B82F6" },
  { keys: ["telephone", "phone", "forfait", "mobile", "credit telephonique"], icon: Smartphone, color: "#0EA5E9" },
  { keys: ["electricite", "courant", "snel", "energie"], icon: Zap, color: "#EAB308" },
  { keys: ["eau", "regideso"], icon: Droplets, color: "#38BDF8" },
  { keys: ["essence", "carburant", "fuel", "gasoil"], icon: Fuel, color: "#F97316" },
  { keys: ["voiture", "auto", "parking"], icon: Car, color: "#64748B" },
  { keys: ["courses", "marche", "supermarche", "epicerie", "nourriture"], icon: ShoppingCart, color: "#10B981" },
  { keys: ["assurance", "mutuelle"], icon: Shield, color: "#0D9488" },
  { keys: ["sante", "medecin", "pharmacie", "hopital"], icon: Stethoscope, color: "#EC4899" },
  { keys: ["gym", "sport", "fitness", "salle de sport", "muscu"], icon: Dumbbell, color: "#EF4444" },
  { keys: ["ecole", "scolaire", "universite", "etudes", "formation", "cours"], icon: GraduationCap, color: "#6366F1" },
  { keys: ["banque", "frais bancaires", "compte"], icon: Landmark, color: "#0F766E" },
];

/** Les clés sont en forme normalisée : minuscules, sans accents, mots séparés par des espaces. */
const BRANDS: Array<Brand & { keys: string[] }> = [
  // Streaming & musique
  { keys: ["netflix"], domain: "netflix.com", color: "#E50914" },
  { keys: ["spotify"], domain: "spotify.com", color: "#1DB954" },
  { keys: ["apple music"], domain: "music.apple.com", color: "#FA243C" },
  { keys: ["apple tv"], domain: "tv.apple.com", color: "#6E6E73" },
  { keys: ["apple one"], domain: "apple.com", color: "#6E6E73" },
  { keys: ["youtube"], domain: "youtube.com", color: "#FF0000" },
  { keys: ["disney"], domain: "disneyplus.com", color: "#113CCF" },
  { keys: ["prime video", "amazon prime"], domain: "primevideo.com", color: "#00A8E1" },
  { keys: ["amazon", "audible", "kindle"], domain: "amazon.com", color: "#FF9900" },
  { keys: ["deezer"], domain: "deezer.com", color: "#A238FF" },
  { keys: ["tidal"], domain: "tidal.com", color: "#111111" },
  { keys: ["soundcloud"], domain: "soundcloud.com", color: "#FF5500" },
  { keys: ["crunchyroll"], domain: "crunchyroll.com", color: "#F47521" },
  { keys: ["canal+", "canal plus", "canalplus"], domain: "canalplus.com", color: "#111111" },
  { keys: ["dstv"], domain: "dstv.com", color: "#0091D4" },
  { keys: ["hbo"], domain: "max.com", color: "#002BE7" },
  { keys: ["paramount"], domain: "paramountplus.com", color: "#0064FF" },
  { keys: ["twitch"], domain: "twitch.tv", color: "#9146FF" },

  // Réseaux sociaux & messageries
  { keys: ["snapchat", "snap+", "snapchat+"], domain: "snapchat.com", color: "#F7C600" },
  { keys: ["tiktok"], domain: "tiktok.com", color: "#FE2C55" },
  { keys: ["instagram"], domain: "instagram.com", color: "#E4405F" },
  { keys: ["facebook", "meta verified"], domain: "facebook.com", color: "#1877F2" },
  { keys: ["twitter", "x premium"], domain: "x.com", color: "#111111" },
  { keys: ["linkedin"], domain: "linkedin.com", color: "#0A66C2" },
  { keys: ["discord", "nitro"], domain: "discord.com", color: "#5865F2" },
  { keys: ["telegram"], domain: "telegram.org", color: "#26A5E4" },
  { keys: ["reddit"], domain: "reddit.com", color: "#FF4500" },

  // Cloud, IA & outils
  { keys: ["icloud", "icloud+", "cloud+", "cloud +"], domain: "icloud.com", color: "#3693F3" },
  { keys: ["google one", "google drive", "google storage"], domain: "one.google.com", color: "#4285F4" },
  { keys: ["dropbox"], domain: "dropbox.com", color: "#0061FF" },
  { keys: ["microsoft", "office 365", "microsoft 365", "office365"], domain: "microsoft.com", color: "#737373" },
  { keys: ["chatgpt", "openai"], domain: "openai.com", color: "#74AA9C" },
  { keys: ["claude", "anthropic"], domain: "claude.ai", color: "#D97757" },
  { keys: ["notion"], domain: "notion.so", color: "#111111" },
  { keys: ["canva"], domain: "canva.com", color: "#00C4CC" },
  { keys: ["adobe", "photoshop", "creative cloud"], domain: "adobe.com", color: "#FF0000" },
  { keys: ["github", "copilot"], domain: "github.com", color: "#333333" },
  { keys: ["figma"], domain: "figma.com", color: "#F24E1E" },

  // Télécoms & internet
  { keys: ["orange"], domain: "orange.com", color: "#FF7900" },
  { keys: ["vodacom"], domain: "vodacom.com", color: "#E60000" },
  { keys: ["vodafone"], domain: "vodafone.com", color: "#E60000" },
  { keys: ["airtel"], domain: "airtel.africa", color: "#ED1C24" },
  { keys: ["mtn"], domain: "mtn.com", color: "#FFCC00" },
  { keys: ["free mobile", "freebox"], domain: "free.fr", color: "#CD1E25" },
  { keys: ["sfr"], domain: "sfr.fr", color: "#E40012" },
  { keys: ["bouygues"], domain: "bouyguestelecom.fr", color: "#009BCE" },
  { keys: ["starlink"], domain: "starlink.com", color: "#111111" },

  // Jeux vidéo
  { keys: ["playstation", "ps plus", "ps+"], domain: "playstation.com", color: "#003791" },
  { keys: ["xbox", "game pass"], domain: "xbox.com", color: "#107C10" },
  { keys: ["nintendo"], domain: "nintendo.com", color: "#E60012" },
  { keys: ["steam"], domain: "steampowered.com", color: "#171A21" },
  { keys: ["epic games"], domain: "epicgames.com", color: "#444444" },

  // Transport & divers
  { keys: ["uber"], domain: "uber.com", color: "#111111" },
  { keys: ["bolt"], domain: "bolt.eu", color: "#34D186" },
  { keys: ["yango"], domain: "yango.com", color: "#FF0000" },
  { keys: ["duolingo"], domain: "duolingo.com", color: "#58CC02" },
  { keys: ["strava"], domain: "strava.com", color: "#FC4C02" },
];

/** Minuscules, sans accents ; tout sauf lettres/chiffres/+ devient un espace. */
function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

/** Retrouve la marque ou le visuel générique d'après un nom libre ("Netflix", "Transport Quotidien"…). */
export function brandFor(name: string | null | undefined): Brand | null {
  if (!name) return null;
  const n = ` ${normalize(name)} `;
  for (const b of [...BRANDS, ...GENERICS]) {
    if (b.keys.some((k) => n.includes(` ${k} `))) return { domain: b.domain, icon: b.icon, color: b.color };
  }
  return null;
}

export function brandLogoUrl(domain: string, size = 64) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}
