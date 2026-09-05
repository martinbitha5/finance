import { FinanceProvider } from "@/components/finance/finance-provider";
import { AppShell } from "@/components/layout/app-shell";

/**
 * No request-time data here on purpose: the whole app shell is static and prefetched,
 * so moving between screens never waits for the server. Data lives in <FinanceProvider>,
 * loaded once per session and kept on the device. Auth is enforced by the proxy.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FinanceProvider>
      <AppShell>{children}</AppShell>
    </FinanceProvider>
  );
}
