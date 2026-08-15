"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Lock, LogOut, ShoppingCart, User, X } from "lucide-react";
import { useCartUI } from "@/lib/cart-ui";
import { useMenuUI } from "@/lib/menu-ui";
import { adminLogoutAction } from "@/app/actions/admin";
import { ADMIN_HINT_COOKIE } from "@/lib/admin-auth-shared";
import { tpl, useT } from "@/lib/i18n/client";
import { collectionLabel } from "@/lib/collection-label";
import LangSwitcher from "./LangSwitcher";

type NavCollection = { handle: string; title: string };

type NavProps = { collections?: NavCollection[] };

/**
 * ¿Pinto el botón de Admin? Lo decide el NAVEGADOR, no el servidor.
 *
 * Antes venía como prop desde NavServer, que lo resolvía con `isAdmin()`. Pero
 * `isAdmin()` lee cookies, y leer cookies en un componente que va en todas las
 * páginas volvía dinámica la web entera: cada visita montaba la página de cero
 * en el servidor. Ver el comentario largo en lib/admin-auth-shared.ts.
 */
function useEsAdmin(): boolean {
  return useSyncExternalStore(
    // La cookie no cambia mientras la página está abierta (se pone al hacer
    // login, que navega a /admin), así que no hay a qué suscribirse.
    () => () => {},
    () => leerMarcaAdmin(),
    // Lo que vale al pre-generar el HTML: NUNCA admin. Así la copia cacheada es
    // la misma para todo el mundo y el botón aparece solo en el navegador de
    // quien tenga la marca, ya hidratado y sin desajuste.
    () => false,
  );
}

function leerMarcaAdmin(): boolean {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${ADMIN_HINT_COOKIE}=1`));
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export default function Nav({ collections = [] }: NavProps) {
  const isAdmin = useEsAdmin();
  const [scrolled, setScrolled] = useState(false);
  const { isOpen: open, open: openMenu, close: closeMenu } = useMenuUI();
  const { count } = useCartUI();
  const t = useT();
  const pathname = usePathname();

  // En la home, click en el logo NO navega — hace scroll suave al top.
  // Útil cuando el usuario ha bajado por la página y quiere volver a hero
  // sin recargar la ruta (mantiene el state del cart, animaciones, etc).
  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const fixedSections = [
    { name: t.nav.newDrop, subtitle: t.nav.newDropSubtitle, href: "/nuevo-drop" },
    { name: t.nav.all, subtitle: t.nav.allSubtitle, href: "/todo" },
  ];
  const archiveSection = {
    name: t.nav.archive,
    subtitle: t.nav.archiveSubtitle,
    href: "/archivo",
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // La home empieza con la foto a sangre: la barra se funde con ella (sin fondo,
  // todo en blanco) y al bajar vuelve a la barra crema normal. En el resto de
  // rutas no hay foto detrás, así que la barra es siempre la normal.
  const light = pathname === "/" && !scrolled;
  const pill = light
    ? "bg-bone/20 text-bone hover:bg-bone/30 backdrop-blur-sm"
    : "bg-ink/5 hover:bg-ink/10";

  return (
    <>
      {/* Barra opaca siempre. Translúcida con blur sobre la foto del banner, el
          logo negro y el titular blanco se mezclaban y se leía fatal al bajar.
          Al hacer scroll solo aparece una sombra: sigue notándose que flota. */}
      <header
        data-sticky-header
        className={`sticky top-0 z-50 transition-[background-color,box-shadow] duration-500 ${
          light
            ? "bg-transparent"
            : `bg-bone ${scrolled ? "shadow-[0_4px_16px_-10px_rgba(15,15,15,0.45)]" : ""}`
        }`}
      >
        {/* Degradado bajo la barra: en vez de cortar en seco contra lo que
            venga debajo, el crema se desvanece. Fundida con la foto no aplica:
            ahí no hay barra que desvanecer. */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-full h-3 md:h-4 bg-gradient-to-b from-bone to-transparent transition-opacity duration-500 ${
            light ? "opacity-0" : "opacity-100"
          }`}
        />
        {/* Alto fijo en vez de padding: el logo va centrado y así tiene aire
            por arriba y por abajo. Si cambias estos valores, cambia también el
            margen negativo de PhotoHero, que mete la foto bajo la barra. */}
        <div className="relative flex items-center justify-between gap-2 px-3 sm:px-6 h-[84px] md:h-[100px]">
          <div className="flex items-center gap-1 sm:gap-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={openMenu}
              aria-label={t.nav.openMenu}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full hover:scale-105 transition-all text-sm ${pill}`}
            >
              <span className="flex flex-col gap-1">
                <span className="block w-4 h-px bg-current" />
                <span className="block w-4 h-px bg-current" />
              </span>
              <span className="hidden sm:inline">{t.nav.menu}</span>
            </motion.button>

            <motion.a
              whileTap={{ scale: 0.94 }}
              href="https://account.v4in.com"
              target="_blank"
              rel="noreferrer"
              aria-label={t.nav.myAccount}
              title={t.nav.myAccount}
              className={`inline-flex items-center justify-center size-9 sm:size-10 rounded-full hover:scale-105 transition-all text-sm ${pill}`}
            >
              <User className="size-4 sm:size-[18px]" strokeWidth={2.25} />
            </motion.a>
          </div>

          <Link
            href="/"
            onClick={handleLogoClick}
            aria-label={`VAIN — ${t.nav.home}`}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
            style={{ perspective: 600 }}
          >
            {/* Mismo tamaño que el logo del menú abierto. Sobre la foto se
                invierte: el PNG es la silueta negra, invertida sale blanca. */}
            <motion.div className="relative size-16 md:size-20 animate-coin-spin">
              {/* `unoptimized` a propósito, aquí y en las otras 3 apariciones
                  del logo (menú, carrito, muro): el PNG pesa 5,6 KB. Pasarlo
                  por el optimizador de Vercel gasta una lectura de su cuota
                  (300.000/mes, y ya llegó un aviso al 75%) para ahorrar un par
                  de kilobytes — y este logo sale en TODAS las páginas, así que
                  era la petición al optimizador más repetida de la web. */}
              <Image
                src="/logo_mono.png"
                unoptimized
                alt="VAIN"
                fill
                priority
                sizes="80px"
                className={`object-contain transition-[filter] duration-500 ${
                  light ? "invert drop-shadow-[0_2px_10px_rgba(15,15,15,0.45)]" : ""
                }`}
              />
            </motion.div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <LangSwitcher variant="menu" light={light} />

            {isAdmin && (
              <>
                <motion.div whileTap={{ scale: 0.94 }} className="hidden sm:inline-flex">
                  <Link
                    href="/admin"
                    aria-label={t.nav.adminPanel}
                    title={t.nav.adminPanel}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-ink text-bone text-xs uppercase tracking-wider hover:scale-105 transition-transform"
                  >
                    <Lock className="size-3" strokeWidth={2.25} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </motion.div>
                <Link
                  href="/admin"
                  aria-label={t.nav.adminPanel}
                  title={t.nav.adminPanel}
                  className="sm:hidden inline-flex items-center justify-center size-9 rounded-full bg-ink text-bone hover:scale-105 transition-transform"
                >
                  <Lock className="size-3.5" strokeWidth={2.25} />
                </Link>
                <form action={adminLogoutAction}>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="submit"
                    aria-label={t.nav.logoutAdmin}
                    title={t.nav.logoutAdmin}
                    className="inline-flex items-center justify-center size-9 sm:size-10 rounded-full bg-ink/5 hover:bg-ink/10 hover:scale-105 transition-all text-ink-soft"
                  >
                    <LogOut className="size-3.5" strokeWidth={2.25} />
                  </motion.button>
                </form>
              </>
            )}

            <motion.div whileTap={{ scale: 0.94 }}>
              <Link
                href="/cart"
                // Sin prefetch: este enlace va en la cabecera de TODAS las
                // páginas, así que entra en pantalla en cada visita y Next lo
                // precargaba siempre — una invocación de servidor por página
                // vista, para una ruta que además nunca se puede cachear
                // (depende del carrito de cada uno). Al carrito se va a
                // propósito, con un clic; no hace falta adelantarlo.
                prefetch={false}
                aria-label={tpl(t.nav.viewCartAria, {
                  count,
                  label: count === 1 ? t.nav.item : t.nav.items,
                })}
                title={t.nav.cart}
                className={`relative inline-flex items-center gap-1.5 px-3 sm:px-3.5 h-9 sm:h-10 rounded-full hover:scale-105 transition-all text-sm ${
                  light ? pill : "bg-ink text-bone"
                }`}
              >
                <ShoppingCart className="size-4 sm:size-[18px]" strokeWidth={2.25} />
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={count}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs tabular-nums ${
                      light ? "bg-bone/25" : "bg-bone/20"
                    }`}
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-bone overflow-y-auto overscroll-contain"
          >
            <div className="sticky top-0 z-10 bg-bone flex items-center justify-between px-4 sm:px-6 py-4">
              <Link
                href="/"
                onClick={closeMenu}
                aria-label={`VAIN — ${t.nav.home}`}
                className="select-none"
                style={{ perspective: 600 }}
              >
                <motion.div className="relative size-16 md:size-20 animate-coin-spin">
                  <Image
                    src="/logo_mono.png"
                    unoptimized
                    alt="VAIN"
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </motion.div>
              </Link>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={closeMenu}
                className="size-10 rounded-full bg-ink text-bone flex items-center justify-center hover:scale-110 transition-transform"
                aria-label={t.nav.closeMenu}
              >
                <X className="size-5" strokeWidth={2.25} />
              </motion.button>
            </div>

            <div className="px-4 sm:px-6 pt-6 md:pt-12 pb-28 max-w-3xl mx-auto">
              <p className="text-sm text-ink-soft/70 mb-6">{t.nav.store}</p>
              <ul className="flex flex-col">
                {[
                  ...fixedSections,
                  ...collections.map((c) => ({
                    name: collectionLabel(t, c.handle, c.title),
                    subtitle: t.nav.collectionSubtitle,
                    href: `/c/${c.handle}`,
                  })),
                  archiveSection,
                ].map((c, i) => (
                  <motion.li
                    key={c.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i }}
                  >
                    <Link
                      href={c.href}
                      onClick={closeMenu}
                      className="group flex items-end justify-between gap-3 md:gap-6 border-b border-ink/15 py-5 md:py-7 hover:border-ink transition-colors active:scale-[0.98] transition-transform"
                    >
                      <span
                        className="font-display uppercase tracking-tight leading-[0.95] group-hover:translate-x-2 transition-transform min-w-0 flex-1 break-words"
                        style={{ fontSize: "clamp(2rem, 7.5vw, 5rem)" }}
                      >
                        {c.name}
                      </span>
                      <span className="text-[11px] md:text-sm text-ink-soft/60 shrink-0 whitespace-nowrap text-right pb-1 md:pb-2">
                        {c.subtitle}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              {/* Botones estilo footer: IG + TikTok arriba (con iconos) y
                  Mi cuenta a lo ancho debajo. Centrados. */}
              <div className="mt-10 mb-4 flex flex-col gap-3 max-w-sm mx-auto">
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="https://www.instagram.com/vainspn/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink/5 hover:bg-ink/10 hover:scale-[1.02] transition-all text-sm"
                  >
                    <InstagramIcon />
                    Instagram
                  </a>
                  <a
                    href="https://www.tiktok.com/@vainspn"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink/5 hover:bg-ink/10 hover:scale-[1.02] transition-all text-sm"
                  >
                    <TikTokIcon />
                    TikTok
                  </a>
                </div>

                <a
                  href="https://account.v4in.com"
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeMenu}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-ink text-bone hover:scale-[1.02] transition-transform text-sm"
                >
                  {t.nav.myAccount}
                  <ArrowUpRight className="size-3.5" strokeWidth={2.25} />
                </a>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
