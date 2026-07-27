import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import {
  getSiteState,
  EDGE_CONFIG_WRITES_READY,
} from "@/lib/site-state";
import AdminPanel from "./AdminPanel";
import AdminStats from "./AdminStats";
import { resolvePeriod } from "@/lib/vercel-analytics";

export const metadata: Metadata = {
  title: "VAIN — Admin",
  robots: { index: false, follow: false },
};

// Sin caché: el panel siempre lee el estado real.
export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const state = await getSiteState();

  // Periodo de las estadísticas: ?periodo=24h | 7d | 30d. Va por URL y no por
  // estado de cliente para que el panel siga siendo server-only (el token de
  // Vercel no puede bajar al navegador).
  const period = resolvePeriod((await searchParams).periodo);

  return (
    <main className="min-h-screen bg-bone text-ink px-4 sm:px-6 py-10 md:py-14">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-1">
              Panel
            </p>
            <h1
              className="font-display uppercase tracking-tighter leading-none"
              style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)" }}
            >
              Admin
            </h1>
          </div>
        </header>

        <div className="mb-6">
          <AdminStats period={period} />
        </div>

        <AdminPanel
          comingSoonMode={state.comingSoonMode}
          earlyAccessPassword={state.earlyAccessPassword}
          source={state.source}
          writesReady={EDGE_CONFIG_WRITES_READY}
        />
      </div>
    </main>
  );
}
