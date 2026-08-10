"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Truck } from "lucide-react";
import FadeImage from "./FadeImage";
import MagneticButton from "./MagneticButton";
import ShareButton from "./ShareButton";
import { usePrevRoute } from "./RouteMemory";
import { useCartUI } from "@/lib/cart-ui";
import { formatPrice, productHref, type Product, type ProductSize } from "@/lib/products";
import { tripletColor, tripletTitleColor } from "@/lib/triplet-theme";
import { tpl, useLocale, useT } from "@/lib/i18n/client";

type Props = { product: Product };

type BackTarget = { href: string; label: string };
type BackLabels = {
  home: string;
  all: string;
  newDrop: string;
  archive: string;
};

/**
 * Traduce la ruta anterior al enlace "Volver a X". Rutas que no son un
 * listado (otra ficha, /cart, /admin…) caen al catálogo completo.
 */
function resolveBack(prevRoute: string | null, labels: BackLabels): BackTarget {
  const fallback: BackTarget = { href: "/todo", label: labels.all };
  if (!prevRoute) return fallback;

  const path = prevRoute.replace(/\/$/, "") || "/";
  const known: Record<string, string> = {
    "/": labels.home,
    "/todo": labels.all,
    "/nuevo-drop": labels.newDrop,
    "/archivo": labels.archive,
  };
  if (known[path]) return { href: path, label: known[path] };

  // Colecciones: /c/<handle> → título legible a partir del handle.
  const collection = path.match(/^\/c\/([^/]+)$/);
  if (collection) {
    const title = collection[1].replace(/-/g, " ");
    return { href: path, label: title.charAt(0).toUpperCase() + title.slice(1) };
  }

  return fallback;
}

export default function ProductDetail({ product }: Props) {
  const t = useT();
  const locale = useLocale();
  // Por defecto: la talla del modelo si está disponible, si no la primera
  // talla disponible, si no la primera del listado completo.
  const availableSet = new Set(product.sizesAvailable);
  const defaultSize: ProductSize =
    product.modelSize && availableSet.has(product.modelSize)
      ? product.modelSize
      : product.sizesAvailable[0] ??
        product.sizes[Math.floor(product.sizes.length / 2)] ??
        product.sizes[0];
  const [size, setSize] = useState<ProductSize>(defaultSize);
  const [active, setActive] = useState(0);
  const touchStart = useRef({ x: 0, y: 0 });
  const { addItem } = useCartUI();

  // "Volver a X" apunta a la página real desde la que se ha llegado (el
  // drop, una colección, el archivo…), no a un destino fijo. Si se entra
  // directo por URL no hay ruta previa y se cae al catálogo completo.
  const prevRoute = usePrevRoute();
  const back = resolveBack(prevRoute, {
    home: t.nav.home,
    all: t.pages.allTitle,
    newDrop: t.nav.newDrop,
    archive: t.nav.archive,
  });

  const href = productHref(product);
  // Acento de color SOLO para los pantalones de la cápsula triplet (rosa/gris/
  // azul). Para el resto de productos es null → ficha normal en negro.
  const accent = tripletColor(product.slug);
  const titleColor = tripletTitleColor(product.slug);

  const handleAdd = () => {
    addItem({
      productHandle: product.slug,
      size,
      name: product.name,
      price: product.price,
      image: product.primaryImage,
      href,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    // Solo cambia de foto si el gesto es claramente horizontal: así un
    // scroll vertical con el dedo sobre la foto no salta de imagen.
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) setActive((a) => (a + 1) % product.photos.length);
      else setActive((a) => (a - 1 + product.photos.length) % product.photos.length);
    }
  };

  return (
    <>
      <section className="bg-bone py-8 md:py-12">
        <div className="px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-6">
            <Link
              href={back.href}
              className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
            >
              <ArrowLeft className="size-4" strokeWidth={2.25} />
              {tpl(t.product.backToCategory, { category: back.label })}
            </Link>
            <ShareButton
              title={`${product.name} — VAIN`}
              text={tpl(t.product.shareCheck, {
                name: product.name,
                price: formatPrice(product.price, locale),
              })}
              url={href}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 relative"
            >
              {/* Backlight de color difuminado detrás de la foto (solo triplets). */}
              {accent && (
                <div
                  aria-hidden
                  // Sin desbordar en horizontal: 24px a cada lado creaban
                  // scroll lateral en móvil (el desenfoque ya lo difumina).
                  className="absolute -inset-y-6 inset-x-0 -z-10 opacity-50"
                  style={{
                    background: `radial-gradient(circle at 50% 45%, ${accent}, transparent 65%)`,
                    filter: "blur(42px)",
                  }}
                />
              )}
              <div
                className="relative aspect-square rounded-3xl bg-bone-dim overflow-hidden shadow-soft touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {product.photos.map((p, i) => (
                  <motion.div
                    key={p.src}
                    initial={false}
                    animate={{ opacity: i === active ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                  >
                    <FadeImage
                      src={p.src}
                      alt={p.alt}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-contain [mix-blend-mode:multiply] p-6 md:p-10"
                    />
                  </motion.div>
                ))}

                <button
                  onClick={() =>
                    setActive((a) => (a - 1 + product.photos.length) % product.photos.length)
                  }
                  aria-label={t.product.photoPrev}
                  className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 size-11 rounded-full bg-bone/90 backdrop-blur hidden md:flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <ArrowLeft className="size-4" strokeWidth={2.25} />
                </button>
                <button
                  onClick={() => setActive((a) => (a + 1) % product.photos.length)}
                  aria-label={t.product.photoNext}
                  className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 size-11 rounded-full bg-bone/90 backdrop-blur hidden md:flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {product.photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      aria-label={tpl(t.product.photoAria, { index: i + 1 })}
                      className={`h-1.5 rounded-full transition-all ${
                        i === active ? "w-8" : "w-1.5 bg-ink/30"
                      }`}
                      style={
                        i === active
                          ? { backgroundColor: accent ?? "#0f0f0f" }
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="hidden md:flex gap-3 mt-3">
                {product.photos.map((p, i) => (
                  <motion.button
                    key={p.src}
                    onClick={() => setActive(i)}
                    whileTap={{ scale: 0.94 }}
                    className={`relative size-20 rounded-2xl overflow-hidden transition-all ${
                      i === active ? "ring-2 ring-ink" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <FadeImage
                      src={p.src}
                      alt={p.alt}
                      fill
                      sizes="80px"
                      className="object-cover [mix-blend-mode:multiply]"
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <div className="lg:col-span-5 flex flex-col gap-4 lg:py-2">
              <span className="text-sm text-ink-soft">
                {product.drop} — {t.product.limitedEdition}
              </span>

              <h1
                className={`font-display uppercase ${titleColor ? "" : "text-ink"}`}
                style={{
                  fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  color: titleColor ?? undefined,
                }}
              >
                {product.name}
              </h1>
              {accent && (
                <span
                  aria-hidden
                  className="block h-1.5 w-14 rounded-full -mt-1"
                  style={{ backgroundColor: accent }}
                />
              )}

              <div className="flex items-baseline gap-3">
                <span className="text-2xl md:text-3xl">{formatPrice(product.price, locale)}</span>
                {product.oldPrice && (
                  <span className="line-through text-ink-soft/50 text-base">
                    {formatPrice(product.oldPrice, locale)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <span className="text-sm text-ink-soft">{t.product.size}</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const isAvail = availableSet.has(s);
                    const isSelected = size === s;
                    return (
                      <motion.button
                        key={s}
                        onClick={() => isAvail && setSize(s)}
                        whileTap={isAvail ? { scale: 0.92 } : undefined}
                        disabled={!isAvail}
                        aria-disabled={!isAvail}
                        title={isAvail ? undefined : t.product.outOfStock}
                        // OJO AL ORDEN: "agotada" manda sobre "seleccionada".
                        // Al revés (que es como estaba) una talla sin stock que
                        // resultara ser la seleccionada se pintaba como píldora
                        // negra y sin tachar, o sea con pinta de comprable. Pasa
                        // siempre que se agota el producto entero: sin ninguna
                        // talla disponible, la de por defecto cae en la del
                        // medio (ver `defaultSize`) y esa salía como elegida.
                        // El botón sí estaba desactivado, así que no se podía
                        // comprar — pero el cliente veía "M" en negro y creía
                        // que quedaban.
                        className={`min-w-[52px] px-4 py-3 rounded-full text-sm transition-all ${
                          !isAvail
                            ? "bg-ink/[0.03] text-ink-soft/40 line-through cursor-not-allowed"
                            : isSelected
                              ? "bg-ink text-bone"
                              : "bg-ink/5 hover:bg-ink/10"
                        }`}
                      >
                        {s}
                      </motion.button>
                    );
                  })}
                </div>
                {!availableSet.has(size) && (
                  <p className="text-xs text-blood">{t.product.outOfStock}</p>
                )}
              </div>

              <MagneticButton className="w-full mt-3">
                <motion.button
                  onClick={handleAdd}
                  disabled={!availableSet.has(size)}
                  whileHover={availableSet.has(size) ? { scale: 1.01 } : undefined}
                  whileTap={availableSet.has(size) ? { scale: 0.97 } : undefined}
                  className="group w-full inline-flex items-center justify-center gap-3 px-6 py-5 rounded-full text-lg shadow-soft bg-ink text-bone disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {availableSet.has(size)
                    ? tpl(t.product.addToCartWithSize, { size })
                    : t.product.outOfStock}
                  {availableSet.has(size) && (
                    <ArrowRight
                      aria-hidden
                      className="size-5 transition-transform group-hover:translate-x-1"
                      strokeWidth={2.25}
                    />
                  )}
                </motion.button>
              </MagneticButton>

              {/* Justo debajo del botón: es la duda que frena la compra. */}
              <p className="flex items-center justify-center gap-2 text-xs text-ink-soft/80">
                <Truck className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                {t.product.shipsIn}
              </p>

              {product.modelHeight && product.modelSize && (
                <p className="text-xs text-ink-soft/70 text-center">
                  {tpl(t.product.modelInfo, {
                    name: "Thagory",
                    height: product.modelHeight,
                    size: product.modelSize,
                  })}
                </p>
              )}

              {product.specs.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-ink/10">
                  {product.specs.map((s) => (
                    <div key={s.k} className="flex flex-col">
                      <span className="text-xs text-ink-soft">{s.k}</span>
                      <span className="text-base mt-0.5">{s.v}</span>
                    </div>
                  ))}
                </div>
              )}

              <details className="group mt-3 border-t border-ink/10 pt-4">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span>{t.product.details}</span>
                  <span className="size-8 rounded-full bg-ink/5 flex items-center justify-center transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                {/* La descripción de Shopify vive aquí, dentro del desplegable,
                    en vez de suelta bajo el precio: arriba solo queda lo esencial
                    (título, precio, talla, comprar). Aplica a toda la ropa. */}
                <div className="mt-3 space-y-3">
                  {product.descriptionHtml && (
                    <div
                      className="rich-text"
                      dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                    />
                  )}
                  {product.details.length > 0 && (
                    <ul className="text-sm text-ink-soft leading-relaxed space-y-1.5 list-disc pl-5">
                      {product.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>

              <details className="group border-t border-ink/10 pt-4">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span>{t.product.shipping}</span>
                  <span className="size-8 rounded-full bg-ink/5 flex items-center justify-center transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="mt-3 text-sm text-ink-soft leading-relaxed space-y-2">
                  <p>{t.product.shippingIntro}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t.product.shippingSpain}</li>
                    <li>{t.product.shippingEurope}</li>
                  </ul>
                  <p>{t.product.shippingCustoms}</p>
                  <p className="text-xs">
                    {t.product.shippingMore}{" "}
                    <Link
                      href="/policies/shipping-policy"
                      className="underline underline-offset-4 hover:text-ink"
                    >
                      {t.product.shippingPolicy}
                    </Link>
                    .
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
