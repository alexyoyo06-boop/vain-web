"use client";

import ProductCard from "./ProductCard";
import RevealText from "./RevealText";
import type { Product } from "@/lib/products";
import { useT } from "@/lib/i18n/client";

type Props = { products: Product[] };

/**
 * Sección de la home con toda la ropa en rejilla limpia (mismo card que
 * /todo). Va debajo del Hero del drop destacado. Si no hay productos, no
 * renderiza nada para no dejar una sección vacía.
 */
export default function ShopGrid({ products }: Props) {
  const t = useT();
  if (products.length === 0) return null;

  return (
    <section id="shop" className="bg-bone py-10 md:py-16 border-t border-ink/5">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <RevealText delay={0.1}>
          <h2
            className="font-display uppercase tracking-tighter leading-none mb-6 md:mb-10"
            style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}
          >
            {t.home.allTitle}
          </h2>
        </RevealText>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {products.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
