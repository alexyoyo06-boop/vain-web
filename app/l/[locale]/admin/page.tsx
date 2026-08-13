import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import {
  getSiteState,
  EDGE_CONFIG_WRITES_READY,
} from "@/lib/site-state";
import AdminGlobe from "./AdminGlobe";
import AdminPanel from "./AdminPanel";
import AdminStats from "./AdminStats";
import OnlineNow from "./OnlineNow";
import { resolvePeriod } from "@/lib/vercel-analytics";
import { getOnlineCount } from "@/lib/online-presence";

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

  const [state, online] = await Promise.all([getSiteState(), getOnlineCount()]);

  // Periodo de las estadísticas: ?periodo=24h | 7d | 30d. Va por URL y no por
  // estado de cliente para que el panel siga siendo server-only (el token de
  // Vercel no puede bajar al navegador).
  const period = resolvePeriod((await searchParams).periodo);

  return (
    <main className="min-h-screen bg-bone text-ink px-4 sm:px-6 py-8 md:py-10">
      {/* Cabecera compacta: lo primero que se ve tiene que ser el globo, así
          que el título ocupa lo justo para saber dónde estás. */}
      <header className="max-w-3xl mx-auto flex items-center justify-between gap-3 mb-5">
        <h1
          className="font-display uppercase tracking-tighter leading-none"
          style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)" }}
        >
          Admin
        </h1>
        {/* Gente ahora mismo en la web. Va aquí arriba y no dentro de las
            estadísticas porque es dato propio: se ve aunque la API de
            Vercel falle. */}
        <OnlineNow initial={online} />
      </header>

      {/* El globo manda: va el primero, a lo ancho, y aparte de las
          estadísticas porque sus datos son propios (latidos y webhook de
          pedidos) y se ve aunque la API de Vercel Analytics esté caída. */}
      {/* max-w-3xl y no más: la esfera la limita la altura de la pantalla, y
          una tarjeta mucho más ancha que ella deja dos márgenes muertos. */}
      <div className="max-w-3xl mx-auto mb-6">
        <AdminGlobe initialOnline={online} />
      </div>

      <div className="max-w-2xl mx-auto">
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
