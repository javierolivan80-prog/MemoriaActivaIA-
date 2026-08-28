import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingWizard from "@/components/profile/OnboardingWizard";

export default async function NewProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("plan_type, status")
    .eq("user_id", user.id);

  const hasCompletoPlan = (subscriptions ?? []).some(
    (subscription) =>
      subscription.plan_type === "completo" &&
      (subscription.status === "active" || subscription.status === "trialing")
  );

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <OnboardingWizard hasCompletoPlan={hasCompletoPlan} />
    </div>
  );
}
