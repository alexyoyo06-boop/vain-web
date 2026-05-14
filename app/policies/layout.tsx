import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <article className="bg-bone py-10 md:py-16 flex-1">
        <div className="px-6 sm:px-8 max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors mb-8"
          >
            <ArrowLeft className="size-4" strokeWidth={2.25} />
            Volver al inicio
          </Link>
          <div className="policy-prose text-ink-soft leading-relaxed text-base space-y-5">
            {children}
          </div>
        </div>
      </article>
      <Footer />
    </main>
  );
}
