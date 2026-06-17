"use client";

import Link from "next/link";
import LangSwitcher from "./LangSwitcher";
import { useT } from "@/lib/i18n/client";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export default function Footer() {
  const t = useT();
  return (
    <footer className="bg-ink text-bone rounded-t-[40px] md:rounded-t-[64px] mt-8 overflow-hidden">
      <div className="flex flex-col items-center gap-6 px-6 py-10 md:py-12 max-w-3xl mx-auto text-center">
        {/* Tienda */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <Link href="/nuevo-drop" className="hover:text-bone text-bone/80 transition-colors">{t.nav.newDrop}</Link>
          <Link href="/todo" className="hover:text-bone text-bone/80 transition-colors">{t.nav.all}</Link>
          <Link href="/archivo" className="hover:text-bone text-bone/80 transition-colors">{t.nav.archive}</Link>
        </nav>

        {/* Social — logos centrados */}
        <div className="flex items-center justify-center gap-5">
          <a
            href="https://www.instagram.com/vainspn/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="text-bone/70 hover:text-bone transition-colors"
          >
            <InstagramIcon />
          </a>
          <a
            href="https://www.tiktok.com/@vainspn"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
            className="text-bone/70 hover:text-bone transition-colors"
          >
            <TikTokIcon />
          </a>
        </div>

        {/* Legal */}
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-bone/50">
          <Link href="/policies/privacy-policy" className="hover:text-bone transition-colors">{t.footer.policyPrivacy}</Link>
          <Link href="/policies/shipping-policy" className="hover:text-bone transition-colors">{t.footer.policyShipping}</Link>
          <Link href="/policies/refund-policy" className="hover:text-bone transition-colors">{t.footer.policyRefund}</Link>
          <Link href="/policies/terms-of-service" className="hover:text-bone transition-colors">{t.footer.policyTerms}</Link>
          <Link href="/policies/legal-notice" className="hover:text-bone transition-colors">{t.footer.policyLegalNotice}</Link>
          <Link href="/policies/contact-information" className="hover:text-bone transition-colors">{t.footer.policyContact}</Link>
          <Link href="/policies/withdrawal" className="hover:text-bone transition-colors">{t.footer.policyWithdrawal}</Link>
        </nav>
      </div>

      <div className="border-t border-bone/10 px-6 py-5 flex flex-wrap justify-center md:justify-between items-center gap-3 text-sm text-bone/50 max-w-3xl mx-auto">
        <span>{t.footer.copyright}</span>
        <div className="flex items-center gap-4">
          <div className="[&_button]:!text-bone/50 [&_button:hover]:!text-bone [&_[aria-pressed='true']]:!bg-bone/15 [&_[aria-pressed='true']]:!text-bone [&>div]:!bg-bone/5">
            <LangSwitcher variant="footer" />
          </div>
          <span>{t.footer.madeInSpain}</span>
        </div>
      </div>
    </footer>
  );
}
