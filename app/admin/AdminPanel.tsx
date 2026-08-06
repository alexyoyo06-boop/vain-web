"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { Check, LogOut, Lock, AlertTriangle, Eye } from "lucide-react";
import {
  adminLogoutAction,
  previewSiteAction,
  setEarlyAccessPasswordAction,
  type AdminActionState,
} from "@/app/actions/admin";

type Props = {
  comingSoonMode: boolean;
  earlyAccessPassword: string;
  source: "edge-config" | "env";
  writesReady: boolean;
};

export default function AdminPanel({
  comingSoonMode,
  earlyAccessPassword,
  source,
  writesReady,
}: Props) {
  const [passwordState, passwordAction, passwordPending] = useActionState<
    AdminActionState,
    FormData
  >(setEarlyAccessPasswordAction, null);

  return (
    <div className="space-y-6">
      {/* Estado actual */}
      <section className="rounded-3xl bg-bone-dim/60 p-6 md:p-8">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-4">
          Estado
        </p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="font-display uppercase tracking-tighter leading-none"
              style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)" }}
            >
              {comingSoonMode ? "Cerrada" : "Abierta"}
            </p>
            <p className="text-xs text-ink-soft mt-2">
              Fuente: <span className="font-mono">{source}</span>
              {!writesReady && (
                <span className="ml-2 text-blood">· Escritura no lista</span>
              )}
            </p>
          </div>
          <span
            className={`size-3 rounded-full ${comingSoonMode ? "bg-blood" : "bg-emerald-500"}`}
            aria-hidden
          />
        </div>
      </section>

      {!writesReady && (
        <section className="rounded-3xl border border-blood/30 bg-blood/5 p-5 text-sm flex gap-3">
          <AlertTriangle
            className="size-5 shrink-0 mt-0.5 text-blood"
            strokeWidth={2.25}
          />
          <div>
            <p className="font-semibold mb-1">Faltan credenciales de Edge Config.</p>
            <p className="text-ink-soft">
              Asegúrate de tener <code className="font-mono">VERCEL_API_TOKEN</code>,{" "}
              <code className="font-mono">VERCEL_TEAM_ID</code> y{" "}
              <code className="font-mono">VERCEL_EDGE_CONFIG_ID</code> en el
              entorno.
            </p>
          </div>
        </section>
      )}

      {/* Antes había aquí un botón de abrir/cerrar la web. Se quitó el 6 ago
          2026: para saber si estaba cerrada había que preguntárselo a Edge
          Config en cada visita, y eso agotó la cuota gratis (al pasarse,
          Vercel pausa el proyecto entero y la tienda se cae). */}
      <section className="rounded-3xl bg-bone-dim/60 p-6 md:p-8">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          Modo coming soon
        </p>
        <h2
          className="font-display uppercase tracking-tighter leading-none mb-3"
          style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)" }}
        >
          {comingSoonMode ? "Cerrar la web" : "Abrir y cerrar la web"}
        </h2>
        <p className="text-sm text-ink-soft">
          El botón ya no está aquí: preguntar en cada visita si la web estaba
          cerrada se comía la cuota gratis de Vercel, y al agotarse la tienda se
          apaga. Ahora se cambia la variable{" "}
          <code className="font-mono">EARLY_ACCESS_MODE</code> (
          <span className="font-mono">on</span> = cerrada,{" "}
          <span className="font-mono">off</span> = abierta) en Vercel y se
          redespliega. Son 2 minutos — díselo a Alex y lo hace.
        </p>
      </section>

      {/* Previsualizar la web */}
      <section className="rounded-3xl bg-bone-dim/60 p-6 md:p-8">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          Vista previa
        </p>
        <h2
          className="font-display uppercase tracking-tighter leading-none mb-2"
          style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)" }}
        >
          Ver la web
        </h2>
        <p className="text-sm text-ink-soft mb-5">
          {comingSoonMode
            ? "Entra como si fueras un suscriptor con la contraseña. Para volver al panel: pill «Admin» del nav."
            : "Abre la home en esta misma pestaña. Para volver al panel: pill «Admin» del nav."}
        </p>
        <form action={previewSiteAction}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-ink/5 hover:bg-ink/10 text-base text-ink transition-colors"
          >
            <Eye className="size-4" strokeWidth={2.25} />
            Ver la web
          </motion.button>
        </form>
      </section>

      {/* Cambiar password */}
      <section className="rounded-3xl bg-bone-dim/60 p-6 md:p-8">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          Acceso anticipado
        </p>
        <h2
          className="font-display uppercase tracking-tighter leading-none mb-2"
          style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)" }}
        >
          Contraseña
        </h2>
        <p className="text-sm text-ink-soft mb-5">
          La que reparten los suscriptores cuando la web está cerrada. Actual:{" "}
          <span className="font-mono">
            {earlyAccessPassword
              ? "•".repeat(Math.min(earlyAccessPassword.length, 10))
              : "(sin definir)"}
          </span>
        </p>
        <form action={passwordAction} className="flex flex-col gap-3">
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-ink-soft/60"
              strokeWidth={2.25}
            />
            <input
              type="text"
              name="password"
              required
              autoComplete="off"
              placeholder="Nueva contraseña"
              className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-bone border border-ink/10 focus:border-ink focus:outline-none text-base font-mono"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            type="submit"
            disabled={passwordPending}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-ink text-bone disabled:opacity-60"
          >
            {passwordPending ? "Guardando…" : "Guardar contraseña"}
          </motion.button>
        </form>
        {passwordState && (
          <p
            className={`mt-3 text-sm text-center ${passwordState.ok ? "text-ink-soft" : "text-blood"}`}
          >
            {passwordState.ok ? (
              <span className="inline-flex items-center gap-1.5 justify-center">
                <Check className="size-4" strokeWidth={2.25} />
                {passwordState.message}
              </span>
            ) : (
              passwordState.message
            )}
          </p>
        )}
      </section>

      {/* Logout */}
      <form action={adminLogoutAction} className="pt-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink/5 hover:bg-ink/10 text-sm text-ink-soft transition-colors"
        >
          <LogOut className="size-3.5" strokeWidth={2.25} />
          Cerrar sesión admin
        </motion.button>
      </form>
    </div>
  );
}
