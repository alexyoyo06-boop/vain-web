import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin, isAdminConfigured } from "@/lib/admin-auth";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "VAIN — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const configured = isAdminConfigured();

  return (
    <main className="min-h-screen bg-bone text-ink flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1
          className="font-display uppercase tracking-tighter leading-none text-center mb-2"
          style={{ fontSize: "clamp(2rem, 7vw, 3rem)" }}
        >
          Admin
        </h1>
        <p className="text-center text-sm text-ink-soft mb-8">
          Panel de control de VAIN
        </p>

        {configured ? (
          <AdminLoginForm />
        ) : (
          <div className="rounded-3xl bg-bone-dim p-6 text-sm text-ink-soft text-center space-y-2">
            <p className="font-semibold text-ink">Aún no configurado.</p>
            <p>
              Añade <code className="font-mono">ADMIN_PASSWORD</code> al{" "}
              <code className="font-mono">.env.local</code> y reinicia el dev
              server.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
