import { NextResponse, type NextRequest } from "next/server";
import { loadFinanceRaw } from "@/services/finance-data";
import { getToday } from "@/services/today";
import { buildFinanceWorkbook } from "@/lib/report/build";
import { EXPORT_SCOPES, type ExportScope } from "@/lib/report/scopes";
import { xlsxHeaders } from "@/lib/report/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/export?scope=month|cycle|quarter|year|all
 * Classeur Excel professionnel du titulaire connecté (RLS : uniquement ses lignes).
 */
export async function GET(request: NextRequest) {
  const scopeParam = request.nextUrl.searchParams.get("scope") ?? "month";
  const scope = EXPORT_SCOPES.some((s) => s.value === scopeParam) ? (scopeParam as ExportScope) : "month";

  const [raw, today] = await Promise.all([loadFinanceRaw(), getToday()]);
  if (!raw) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const { file, filename } = await buildFinanceWorkbook(raw, today, scope);
    return new NextResponse(new Uint8Array(file), { headers: xlsxHeaders(filename) });
  } catch (e) {
    console.error("[export] échec de génération", e);
    return NextResponse.json({ error: "Impossible de générer le rapport." }, { status: 500 });
  }
}
