// Sección "Completa tu trío": en la ficha de un pantalón de la cápsula
// V TRIPLETS muestra los otros dos hermanos (mismo diseño, otro color) para
// invitar a completar el set. Server component: recibe ya resueltos los otros
// dos productos desde la página (ver app/[category]/[slug]/page.tsx). Si el
// producto no es un triplet, la página no lo renderiza.

import Link from "next/link";
import Image from "next/image";
import { getT } from "@/lib/i18n/server";
import { formatPrice, productHref, type Product } from "@/lib/products";
import { tripletTitleColor } from "@/lib/triplet-theme";

export default async function CompleteTrio({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  const { locale, t } = await getT();

  return (
    <section className="bg-bone pb-14 md:pb-20">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <h2
          className="font-display uppercase tracking-tighter leading-none mb-6 md:mb-8"
          style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
        >
          {t.product.completeTrio}
        </h2>

        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {products.map((p) => {
            const color = tripletTitleColor(p.slug);
            return (
              <Link key={p.slug} href={productHref(p)} className="group flex flex-col">
                <div className="relative aspect-square rounded-3xl bg-bone-dim overflow-hidden shadow-soft">
                  <Image
                    src={p.primaryImage}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 40vw"
                    className="object-contain [mix-blend-mode:multiply] p-6 md:p-10 transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <span
                    className="font-display uppercase tracking-tighter leading-none text-lg md:text-2xl"
                    style={{ color: color ?? undefined }}
                  >
                    {p.name}
                  </span>
                  <span className="text-base md:text-lg tabular-nums shrink-0">
                    {formatPrice(p.price, locale)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
