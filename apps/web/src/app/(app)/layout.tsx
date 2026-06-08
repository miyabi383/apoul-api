import { redirect } from "next/navigation";
import { getSession, clearSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const authOff = process.env.AUTH_DISABLED === "true";

  async function logout() {
    "use server";
    if (process.env.AUTH_DISABLED === "true") redirect("/jobs");
    await clearSession();
    redirect("/login");
  }

  return (
    <AppShell email={session.email} authOff={authOff} logoutAction={authOff ? undefined : logout}>
      {children}
    </AppShell>
  );
}
