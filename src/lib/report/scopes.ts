// Périmètres d'export, partagés entre le client (panneau) et le serveur (route API).
export type ExportScope = "month" | "cycle" | "quarter" | "year" | "all";

export const EXPORT_SCOPES: { value: ExportScope; label: string; hint: string }[] = [
  { value: "month", label: "Ce mois", hint: "Mois calendaire en cours" },
  { value: "cycle", label: "Cycle de paie", hint: "Depuis ta dernière paie" },
  { value: "quarter", label: "3 derniers mois", hint: "Mois en cours inclus" },
  { value: "year", label: "Cette année", hint: "Depuis le 1er janvier" },
  { value: "all", label: "Tout", hint: "Toutes tes transactions" },
];
