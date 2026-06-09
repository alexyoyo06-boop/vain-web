"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RevealText from "./RevealText";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/products";
import { useT } from "@/lib/i18n/client";

type Props = {
  title: string;
  eyebrow?: string;
  description?: string;
  products: Product[];
  emptyMessage?: string;
};

export default function ProductsGrid({
  title,
  eyebrow,
  description,
  products,
  emptyMessage,
}: Props) {
  const t = useT();
  const empty = emptyMessage ?? t.grid.comingSoon;

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
          {eyebrow && (
            <p className="text-sm text-ink-soft mt-4">{eyebrow}</p>
          )}
          <RevealText delay={0.1}>
            <h1
              className="font-display uppercase tracking-tighter leading-none mt-2"
              style={{ fontSize: "clamp(2.5rem, 9vw, 7rem)" }}
            >
              {title}
            </h1>
          </RevealText>
          {description && (
            <p className="text-ink-soft mt-3 text-base md:text-lg max-w-2xl">
              {description}
            </p>
          )}
          <p className="text-ink-soft mt-3 text-base md:text-lg">
            {products.length} {products.length === 1 ? t.grid.piece : t.grid.pieces}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="p-10 md:p-16 rounded-3xl bg-bone-dim/60 text-center">
            <p className="text-ink-soft">{empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {products.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
