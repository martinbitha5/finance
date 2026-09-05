import { redirect } from "next/navigation";
import { getFinanceData } from "@/services/finance-data";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata = { title: "Bienvenue" };

export default async function OnboardingPage() {
  const data = await getFinanceData();
  if (!data) redirect("/login");
  if (data.profile.onboarding_completed) redirect("/");
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="mx-auto w-full max-w-lg px-5 pt-safe pb-10 flex-1 flex flex-col">
        <OnboardingFlow summary={data.summary} categories={data.snapshot.categories} name={data.profile.display_name ?? ""} />
      </div>
    </div>
  );
}
