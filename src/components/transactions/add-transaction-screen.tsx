"use client";

import { useRouter } from "next/navigation";
import { TransactionForm, type TransactionFormProps } from "./transaction-form";

export function AddTransactionScreen(props: Omit<TransactionFormProps, "onDone">) {
  const router = useRouter();
  return <TransactionForm {...props} onDone={() => router.push("/")} />;
}
