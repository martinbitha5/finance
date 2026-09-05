import {
  Home,
  PieChart,
  Plus,
  Target,
  LayoutGrid,
  ReceiptText,
  Wallet,
  Repeat,
  FileBarChart2,
  CalendarDays,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  question?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Accueil", icon: Home, question: "Où en sont mes finances ?" },
  { href: "/analyse", label: "Analyse", icon: PieChart, question: "Où part mon argent ?" },
  { href: "/ajouter", label: "Ajouter", icon: Plus },
  { href: "/objectifs", label: "Objectifs", icon: Target, question: "Est-ce que je progresse ?" },
  { href: "/plus", label: "Plus", icon: LayoutGrid },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/transactions", label: "Transactions", icon: ReceiptText, question: "Qu'est-ce que j'ai dépensé ?" },
  { href: "/budgets", label: "Budgets", icon: Wallet, question: "Est-ce que je dépense trop ?" },
  { href: "/revenus", label: "Revenus & salaire", icon: Wallet, question: "Combien je gagne ?" },
  { href: "/recurrents", label: "Dépenses récurrentes", icon: Repeat, question: "Quelles sont mes charges ?" },
  { href: "/rapport", label: "Rapport du mois", icon: FileBarChart2, question: "Comment s'est passé le mois ?" },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays, question: "Qu'est-ce qui arrive ?" },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];
