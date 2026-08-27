import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
          Bienvenido a MEMORIA ACTIVA
        </h1>
        <p className="mt-4 text-lg text-gray-600">{user.email}</p>
        <div className="mt-10">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
