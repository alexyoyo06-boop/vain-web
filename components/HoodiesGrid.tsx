"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RevealText from "./RevealText";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/products";
import { useT } from "@/lib/i18n/client";

type Props = { products: Product[] };

export default function HoodiesGrid({ products }: Props) {
  const t = useT();
  const hoodies = products.filter((p) => p.available);

  return (
    <section className="bg-bone py-10 md:py-16">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-8 md:mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="size-4" strokeWidth={2.25} />
            {t.common.back}
          </Link>
          <RevealText delay={0.1}>
            <h1
              className="font-display uppercase tracking-tighter leading-none mt-4"
              style={{ fontSize: "clamp(2.5rem, 9vw, 7rem)" }}
            >
              {t.pages.hoodiesTitle}
            </h1>
          </RevealText>
          <p className="text-ink-soft mt-3 text-base md:text-lg">
            {hoodies.length} {hoodies.length === 1 ? t.grid.piece : t.grid.pieces}{" "}
            {hoodies.length === 1 ? t.grid.available : t.grid.availables}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {hoodies.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>

        <div className="mt-16 md:mt-24 p-8 md:p-12 rounded-3xl bg-bone-dim/60 text-center">
          <p className="text-sm text-ink-soft mb-2">{t.pages.hoodiesNextDropKicker}</p>
          <p
            className="font-display uppercase tracking-tighter leading-none"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            {t.pages.hoodiesMoreComing}
          </p>
          <p className="text-ink-soft mt-3 max-w-md mx-auto">
            {t.pages.hoodiesMoreComingBody}
          </p>
        </div>
      </div>
    </section>
  );
}
