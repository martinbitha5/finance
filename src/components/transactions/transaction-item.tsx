import type { Category, Transaction } from "@/lib/finance/types";
import type { Currency } from "@/lib/constants";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { convert, describeRate } from "@/lib/finance/currency";
import { IconBubble } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function TransactionItem({
  tx,
  category,
  currency,
  rates,
  onClick,
  showDate,
}: {
  tx: Transaction;
  category?: Category | null;
  currency: Currency;
  rates: Record<Currency, number>;
  onClick?: () => void;
  showDate?: string;
}) {
  const isIncome = tx.type === "income";
  const isSaving = tx.type === "saving";
  const icon = isSaving ? "🎯" : category?.icon ?? (isIncome ? "💰" : "💳");
  const color = isSaving ? "#EAB308" : category?.color ?? (isIncome ? "#22C55E" : "#94A3B8");
  const foreign = tx.currency !== currency;
  const method = PAYMENT_METHODS.find((m) => m.value === tx.payment_method);
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("w-full flex items-center gap-3 px-4 py-3 text-left", onClick && "hover:bg-surface-2/60 active:bg-surface-2 transition-colors press")}
    >
      <IconBubble icon={icon} color={color} />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold truncate">{tx.description || category?.name || (isIncome ? "Revenu" : "Dépense")}</div>
        <div className="text-xs text-fg-muted truncate">
          {[showDate, category?.name, method?.label, tx.recurring_expense_id ? "récurrent" : null, tx.debt_id ? "dette" : null].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={cn("tabular font-bold text-[15px]", isIncome ? "text-positive" : isSaving ? "text-fg" : "text-fg")}>
          {isIncome ? "+" : "-"}
          {formatMoney(foreign ? convert(tx.amount, tx.currency, currency, rates) : tx.amount, currency)}
        </div>
        {foreign ? (
          <div className="text-[10px] text-fg-subtle tabular">
            {formatMoney(tx.amount, tx.currency)} · {describeRate(tx.currency, currency, rates)}
          </div>
        ) : null}
      </div>
    </Comp>
  );
}
