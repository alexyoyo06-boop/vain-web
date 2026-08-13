"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import {
  adminLoginAction,
  type AdminLoginState,
} from "@/app/actions/admin";

export default function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminLoginState, FormData>(
    adminLoginAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="relative">
        <Lock
          className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-ink-soft/60"
          strokeWidth={2.25}
        />
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Contraseña admin"
          className="w-full pl-11 pr-5 py-4 rounded-2xl bg-bone-dim/60 border border-ink/10 focus:border-ink focus:outline-none text-base"
        />
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01 }}
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-ink text-bone disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </motion.button>
      {state?.error && (
        <p className="text-sm text-blood text-center">{state.error}</p>
      )}
    </form>
  );
}
