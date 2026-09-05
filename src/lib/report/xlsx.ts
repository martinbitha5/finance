import ExcelJS from "exceljs";
import type { Currency } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────
// Boîte à outils de génération Excel pour les rapports MONY.
//
// Rendu de qualité professionnelle et cohérent avec l'application : bandeau de
// marque (encre + aurora), cartes d'indicateurs, sections, tableaux avec en-tête
// figé, filtres automatiques, vraies dates, vrais montants et pourcentages
// exploitables par Excel, pastilles de statut colorées, mise en page prête à
// imprimer, pied de page paginé.
// ─────────────────────────────────────────────────────────────

// Palette MONY en ARGB (reprend src/app/globals.css).
const C = {
  ink: "FF0B1220",
  ink2: "FF182234",
  accent: "FF2DD4BF",
  accentSoft: "FFDDF7F2",
  lime: "FFA3E635",
  text: "FF12141A",
  muted: "FF676C78",
  paper: "FFFFFFFF",
  surface: "FFF1F2EE",
  line: "FFD9DBD6",
  zebra: "FFF7F8F5",
  positive: "FF15803D",
  positiveBg: "FFDCFCE7",
  negative: "FFDC2626",
  negativeBg: "FFFEE2E2",
  warning: "FFB45309",
  warningBg: "FFFEF3C7",
  info: "FF1D4ED8",
  infoBg: "FFDBEAFE",
};

export type Tone = "neutral" | "positive" | "negative" | "warning" | "info" | "brand";

const TONE: Record<Tone, { soft: string; strong: string }> = {
  neutral: { soft: C.surface, strong: C.text },
  positive: { soft: C.positiveBg, strong: C.positive },
  negative: { soft: C.negativeBg, strong: C.negative },
  warning: { soft: C.warningBg, strong: C.warning },
  info: { soft: C.infoBg, strong: C.info },
  brand: { soft: C.accentSoft, strong: C.ink },
};

const FONT = "Calibri";
export const FMT_INT = "#,##0";
export const FMT_PCT = "0 %";
export const FMT_DATE = "dd/mm/yyyy";
export const FMT_DATETIME = "dd/mm/yyyy hh:mm";

/** Format monétaire Excel pour une devise : le symbole reste dans la cellule, la valeur reste un nombre. */
export function moneyFmt(currency: Currency): string {
  switch (currency) {
    case "CDF":
      return '#,##0 "FC"';
    case "EUR":
      return '#,##0.00 "€"';
    case "GBP":
      return '#,##0.00 "£"';
    default:
      return '#,##0.00 "$"';
  }
}

// ── Types de cellule ─────────────────────────────────────────
export type CellValue = string | number | Date | null | undefined;
export interface CellSpec {
  value: CellValue;
  pill?: Tone;
  align?: "left" | "center" | "right";
  numFmt?: string;
  bold?: boolean;
  tone?: Tone;
}
export type Cell = CellValue | CellSpec;

export interface Column {
  header: string;
  width: number;
  align?: "left" | "center" | "right";
  numFmt?: string;
}

function spec(c: Cell): CellSpec {
  return c !== null && typeof c === "object" && !(c instanceof Date) ? c : { value: c };
}

function thin(argb = C.line): Partial<ExcelJS.Border> {
  return { style: "thin", color: { argb } };
}

// ─────────────────────────────────────────────────────────────
// Classeur et feuilles
// ─────────────────────────────────────────────────────────────

export function newWorkbook(owner: string): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MONY";
  wb.lastModifiedBy = owner;
  wb.company = "MONY";
  wb.created = new Date();
  return wb;
}

export function addSheet(wb: ExcelJS.Workbook, name: string, tab: Tone = "brand", orientation: "landscape" | "portrait" = "landscape"): ExcelJS.Worksheet {
  return wb.addWorksheet(name, {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 16, tabColor: { argb: tab === "brand" ? C.accent : TONE[tab].strong } },
    pageSetup: {
      orientation,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
    headerFooter: {
      oddFooter: "&LMONY · Ton argent, en clair.&CPage &P / &N&R&D &T",
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Bandeau de titre + métadonnées
// ─────────────────────────────────────────────────────────────

/** Bandeau de marque : titre, sous-titre, puis lignes clé/valeur. Renvoie la ligne suivante. */
export function titleBand(ws: ExcelJS.Worksheet, opts: { title: string; subtitle: string; meta: [string, string][] }, cols: number): number {
  let r = 1;

  ws.mergeCells(r, 1, r, cols);
  const t = ws.getCell(r, 1);
  t.value = opts.title;
  t.font = { name: FONT, bold: true, size: 18, color: { argb: C.paper } };
  t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.ink } };
  t.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(r).height = 30;
  r += 1;

  ws.mergeCells(r, 1, r, cols);
  const s = ws.getCell(r, 1);
  s.value = opts.subtitle;
  s.font = { name: FONT, size: 10.5, color: { argb: C.accent } };
  s.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.ink2 } };
  s.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(r).height = 18;
  r += 2;

  for (const [label, value] of opts.meta) {
    const lc = ws.getCell(r, 1);
    lc.value = label.toUpperCase();
    lc.font = { name: FONT, bold: true, size: 9, color: { argb: C.muted } };
    lc.alignment = { vertical: "middle", indent: 1 };
    // Valeur limitée aux colonnes B..D : le reste reste libre pour le logo.
    ws.mergeCells(r, 2, r, Math.min(4, cols));
    const vc = ws.getCell(r, 2);
    vc.value = value;
    vc.font = { name: FONT, size: 10.5, color: { argb: C.text } };
    vc.alignment = { vertical: "middle" };
    ws.getRow(r).height = 15;
    r += 1;
  }
  return r + 1;
}

export interface EmbeddedLogo {
  b64: string;
  width: number;
  height: number;
}

/** Pose le logo en haut à droite de la feuille, dans la zone laissée libre par les métadonnées. */
export function placeLogo(wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet, logo: EmbeddedLogo, opts?: { height?: number; col?: number; row?: number }): void {
  if (!logo.b64) return;
  const H = opts?.height ?? 56;
  const width = Math.round(H * (logo.width / logo.height));
  const id = wb.addImage({ base64: `data:image/png;base64,${logo.b64}`, extension: "png" });
  ws.addImage(id, { tl: { col: opts?.col ?? 5.2, row: opts?.row ?? 2.3 }, ext: { width, height: H }, editAs: "oneCell" });
}

// ─────────────────────────────────────────────────────────────
// Cartes d'indicateurs (KPI)
// ─────────────────────────────────────────────────────────────

export interface Kpi {
  label: string;
  value: string | number;
  numFmt?: string;
  sub?: string;
  tone?: Tone;
}

/** Grille de cartes KPI : 3 colonnes × 3 lignes par carte, liseré d'accent à gauche. Renvoie la ligne suivante. */
export function kpiGrid(ws: ExcelJS.Worksheet, startRow: number, kpis: Kpi[], perRow = 4): number {
  const W = 3;
  const H = 3;
  let r = startRow;
  for (let i = 0; i < kpis.length; i += 1) {
    const col = 1 + (i % perRow) * W;
    if (i % perRow === 0 && i > 0) r += H + 1;
    drawCard(ws, r, col, kpis[i]!, W, H);
  }
  return r + H + 2;
}

function drawCard(ws: ExcelJS.Worksheet, r0: number, c0: number, kpi: Kpi, W: number, H: number): void {
  const t = TONE[kpi.tone ?? "neutral"];
  for (let dr = 0; dr < H; dr += 1) {
    for (let dc = 0; dc < W; dc += 1) {
      ws.getCell(r0 + dr, c0 + dc).fill = { type: "pattern", pattern: "solid", fgColor: { argb: t.soft } };
    }
  }
  ws.mergeCells(r0, c0, r0, c0 + W - 1);
  const lc = ws.getCell(r0, c0);
  lc.value = kpi.label.toUpperCase();
  lc.font = { name: FONT, bold: true, size: 8.5, color: { argb: C.muted } };
  lc.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(r0).height = 15;

  ws.mergeCells(r0 + 1, c0, r0 + 1, c0 + W - 1);
  const vc = ws.getCell(r0 + 1, c0);
  vc.value = kpi.value;
  if (typeof kpi.value === "number") vc.numFmt = kpi.numFmt ?? FMT_INT;
  vc.font = { name: FONT, bold: true, size: 18, color: { argb: t.strong } };
  vc.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(r0 + 1).height = 28;

  ws.mergeCells(r0 + 2, c0, r0 + 2, c0 + W - 1);
  const sc = ws.getCell(r0 + 2, c0);
  sc.value = kpi.sub ?? "";
  sc.font = { name: FONT, size: 9, color: { argb: C.muted } };
  sc.alignment = { vertical: "top", indent: 1 };
  ws.getRow(r0 + 2).height = 15;

  for (let dr = 0; dr < H; dr += 1) {
    const left = ws.getCell(r0 + dr, c0);
    left.border = { ...left.border, left: { style: "medium", color: { argb: t.strong } } };
    const right = ws.getCell(r0 + dr, c0 + W - 1);
    right.border = { ...right.border, right: thin() };
  }
  for (let dc = 0; dc < W; dc += 1) {
    const top = ws.getCell(r0, c0 + dc);
    top.border = { ...top.border, top: thin() };
    const bottom = ws.getCell(r0 + H - 1, c0 + dc);
    bottom.border = { ...bottom.border, bottom: thin() };
  }
}

// ─────────────────────────────────────────────────────────────
// Barre de section et lignes clé/valeur
// ─────────────────────────────────────────────────────────────

export function sectionBar(ws: ExcelJS.Worksheet, r: number, text: string, cols: number): number {
  ws.mergeCells(r, 1, r, cols);
  const c = ws.getCell(r, 1);
  c.value = text;
  c.font = { name: FONT, bold: true, size: 11, color: { argb: C.ink } };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.surface } };
  c.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(r).height = 20;
  c.border = { bottom: { style: "medium", color: { argb: C.accent } } };
  return r + 1;
}

export interface Kv {
  label: string;
  value: CellValue;
  tone?: Tone;
  numFmt?: string;
  /** Texte secondaire affiché à droite du libellé (ex. « 87 / 120 »). */
  hint?: string;
}

/** Lignes clé/valeur : libellé à gauche, valeur alignée à droite avec format. */
export function kvRows(ws: ExcelJS.Worksheet, startRow: number, rows: Kv[], valueCol: number): number {
  let r = startRow;
  for (const row of rows) {
    const lc = ws.getCell(r, 1);
    lc.value = row.label;
    lc.font = { name: FONT, size: 10.5, color: { argb: C.text } };
    lc.alignment = { vertical: "middle", indent: 1 };

    if (row.hint) {
      const hc = ws.getCell(r, Math.max(2, valueCol - 3));
      hc.value = row.hint;
      hc.font = { name: FONT, size: 9.5, color: { argb: C.muted } };
      hc.alignment = { vertical: "middle", horizontal: "right" };
    }

    const vc = ws.getCell(r, valueCol);
    vc.value = row.value ?? "";
    vc.numFmt = row.numFmt ?? (typeof row.value === "number" ? FMT_INT : row.value instanceof Date ? FMT_DATE : "");
    const strong = row.tone ? TONE[row.tone].strong : C.text;
    vc.font = { name: FONT, size: 10.5, bold: !!row.tone, color: { argb: strong } };
    vc.alignment = { vertical: "middle", horizontal: "right", indent: 1 };

    for (let c = 1; c <= valueCol; c += 1) ws.getCell(r, c).border = { bottom: thin() };
    ws.getRow(r).height = 16;
    r += 1;
  }
  return r + 1;
}

// ─────────────────────────────────────────────────────────────
// Tableau de données (en-tête figé, filtres, pastilles, totaux)
// ─────────────────────────────────────────────────────────────

export function table(
  ws: ExcelJS.Worksheet,
  headerRow: number,
  columns: Column[],
  rows: Cell[][],
  opts?: { totals?: Cell[]; emptyLabel?: string; freeze?: boolean },
): number {
  columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
  });

  const hr = ws.getRow(headerRow);
  hr.height = 20;
  columns.forEach((col, i) => {
    const c = hr.getCell(i + 1);
    c.value = col.header;
    c.font = { name: FONT, bold: true, size: 10, color: { argb: C.paper } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.ink } };
    c.alignment = { vertical: "middle", horizontal: col.align ?? "left", indent: 1 };
    c.border = { bottom: { style: "medium", color: { argb: C.accent } } };
  });

  let r = headerRow + 1;

  if (rows.length === 0) {
    ws.mergeCells(r, 1, r, columns.length);
    const c = ws.getCell(r, 1);
    c.value = opts?.emptyLabel ?? "Aucune donnée";
    c.font = { name: FONT, italic: true, color: { argb: C.muted } };
    c.alignment = { vertical: "middle", horizontal: "center" };
    ws.getRow(r).height = 18;
    r += 1;
  } else {
    rows.forEach((cells, i) => {
      const row = ws.getRow(r);
      row.height = 15;
      const zebra = i % 2 === 1;
      columns.forEach((col, ci) => {
        const s = spec(cells[ci]);
        const cell = row.getCell(ci + 1);
        cell.value = s.value ?? "";
        const isNum = typeof s.value === "number";
        const isDate = s.value instanceof Date;
        cell.numFmt = s.numFmt ?? col.numFmt ?? (isDate ? FMT_DATE : isNum ? FMT_INT : "");
        const align = s.align ?? col.align ?? (isNum || isDate ? "right" : "left");
        cell.alignment = { vertical: "middle", horizontal: align, indent: 1 };
        cell.border = { bottom: thin() };

        if (s.pill) {
          const p = TONE[s.pill];
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: p.soft } };
          cell.font = { name: FONT, bold: true, size: 9.5, color: { argb: p.strong } };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else {
          const color = s.tone ? TONE[s.tone].strong : C.text;
          cell.font = { name: FONT, size: 10, bold: !!s.bold || !!s.tone, color: { argb: color } };
          if (zebra) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.zebra } };
        }
      });
      r += 1;
    });
  }

  if (opts?.totals) {
    const row = ws.getRow(r);
    row.height = 18;
    columns.forEach((col, ci) => {
      const s = spec(opts.totals![ci]);
      const cell = row.getCell(ci + 1);
      cell.value = s.value ?? "";
      const isNum = typeof s.value === "number";
      cell.numFmt = s.numFmt ?? col.numFmt ?? (isNum ? FMT_INT : "");
      cell.font = { name: FONT, bold: true, size: 10, color: { argb: s.tone ? TONE[s.tone].strong : C.ink } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.surface } };
      cell.alignment = { vertical: "middle", horizontal: s.align ?? col.align ?? (isNum ? "right" : "left"), indent: 1 };
      cell.border = { top: { style: "medium", color: { argb: C.ink } } };
    });
    r += 1;
  }

  const lastRow = Math.max(headerRow, r - 1);
  ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: lastRow, column: columns.length } };
  if (opts?.freeze !== false) ws.views = [{ state: "frozen", ySplit: headerRow, showGridLines: false }];
  ws.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;

  return r + 1;
}

// ─────────────────────────────────────────────────────────────
// Panneau d'analyse latéral (barres dessinées dans les cellules)
// ─────────────────────────────────────────────────────────────

const BAR_LEN = 22;

export function sideSection(ws: ExcelJS.Worksheet, r: number, c0: number, c1: number, text: string): number {
  ws.mergeCells(r, c0, r, c1);
  const c = ws.getCell(r, c0);
  c.value = text;
  c.font = { name: FONT, bold: true, size: 11, color: { argb: C.ink } };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.surface } };
  c.alignment = { vertical: "middle", indent: 1 };
  if (!ws.getRow(r).height || ws.getRow(r).height < 20) ws.getRow(r).height = 20;
  c.border = { bottom: { style: "medium", color: { argb: C.accent } } };
  return r + 1;
}

export interface SideBar {
  label: string;
  value: number;
  /** Dénominateur : échelle de la barre et base du pourcentage. */
  max: number;
  tone?: Tone;
  numFmt?: string;
}

/** Lignes « libellé · valeur · % · barre » sur 4 colonnes à partir de c0. */
export function sideBars(ws: ExcelJS.Worksheet, startRow: number, c0: number, rows: SideBar[]): number {
  let r = startRow;
  for (const row of rows) {
    const t = TONE[row.tone ?? "brand"];
    const lc = ws.getCell(r, c0);
    lc.value = row.label;
    lc.font = { name: FONT, size: 10, color: { argb: C.text } };
    lc.alignment = { vertical: "middle", indent: 1 };

    const vc = ws.getCell(r, c0 + 1);
    vc.value = row.value;
    vc.numFmt = row.numFmt ?? FMT_INT;
    vc.font = { name: FONT, bold: true, size: 10, color: { argb: t.strong } };
    vc.alignment = { vertical: "middle", horizontal: "right" };

    const pc = ws.getCell(r, c0 + 2);
    pc.value = row.max > 0 ? row.value / row.max : "N/A";
    pc.numFmt = FMT_PCT;
    pc.font = { name: FONT, size: 9.5, color: { argb: C.muted } };
    pc.alignment = { vertical: "middle", horizontal: "right" };

    const filled = row.max > 0 ? Math.min(BAR_LEN, Math.max(row.value > 0 ? 1 : 0, Math.round((row.value / row.max) * BAR_LEN))) : 0;
    const bc = ws.getCell(r, c0 + 3);
    // Jamais de segment richText vide : Excel « réparerait » le classeur.
    const runs = [
      { font: { name: FONT, size: 9, color: { argb: t.strong } }, text: "█".repeat(filled) },
      { font: { name: FONT, size: 9, color: { argb: C.line } }, text: "█".repeat(BAR_LEN - filled) },
    ].filter((run) => run.text.length > 0);
    bc.value = { richText: runs };
    bc.alignment = { vertical: "middle" };

    for (let c = c0; c <= c0 + 3; c += 1) ws.getCell(r, c).border = { bottom: thin() };
    if (!ws.getRow(r).height || ws.getRow(r).height < 16) ws.getRow(r).height = 16;
    r += 1;
  }
  return r + 1;
}

export function sideEmpty(ws: ExcelJS.Worksheet, r: number, c0: number, c1: number, text: string): number {
  ws.mergeCells(r, c0, r, c1);
  const c = ws.getCell(r, c0);
  c.value = text;
  c.font = { name: FONT, italic: true, size: 10, color: { argb: C.muted } };
  c.alignment = { vertical: "middle", indent: 1 };
  c.border = { bottom: thin() };
  return r + 2;
}

/** Paragraphe d'analyse (insight) : icône + texte sur toute la largeur. */
export function noteRow(ws: ExcelJS.Worksheet, r: number, c0: number, c1: number, text: string, tone: Tone = "neutral"): number {
  ws.mergeCells(r, c0, r, c1);
  const c = ws.getCell(r, c0);
  c.value = text;
  c.font = { name: FONT, size: 10, color: { argb: TONE[tone].strong } };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TONE[tone].soft } };
  c.alignment = { vertical: "middle", indent: 1, wrapText: true };
  ws.getRow(r).height = 30;
  return r + 1;
}

// ─────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────

export function ratio(num: number, den: number): number | string {
  return den > 0 ? num / den : "N/A";
}

export async function workbookBuffer(wb: ExcelJS.Workbook): Promise<ArrayBuffer> {
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export function xlsxHeaders(filename: string): Record<string, string> {
  return {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "Cache-Control": "no-store",
  };
}
