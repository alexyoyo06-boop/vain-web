"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";

type Props = {
  title: string;
  text?: string;
  /** Path o URL absoluta. Se resuelve a absoluta antes de compartir. */
  url: string;
  variant?: "icon" | "pill";
  className?: string;
};

export default function ShareButton({
  title,
  text,
  url,
  variant = "pill",
  className = "",
}: Props) {
  const [feedback, setFeedback] = useState<null | "shared" | "copied" | "error">(
    null
  );
  const t = useT();

  const handleShare = async () => {
    // Resolver URL absoluta (Web Share / clipboard requieren string completa)
    const absolute =
      typeof window !== "undefined" && !url.startsWith("http")
        ? new URL(url, window.location.origin).toString()
        : url;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: absolute });
        setFeedback("shared");
      } else if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(absolute);
        setFeedback("copied");
      } else {
        setFeedback("error");
      }
    } catch (err) {
      // El usuario cerró el share sheet → no es error real
      if ((err as Error).name === "AbortError") return;
      // Fallback a clipboard si el share falló
      try {
        await navigator.clipboard?.writeText(absolute);
        setFeedback("copied");
      } catch {
        setFeedback("error");
      }
    }

    if (feedback !== "shared") {
      setTimeout(() => setFeedback(null), 2200);
    }
  };

  const isIcon = variant === "icon";

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={handleShare}
      aria-label={t.product.share}
      className={`relative inline-flex items-center gap-2 ${
        isIcon
          ? "size-10 rounded-full bg-ink/5 hover:bg-ink/10 justify-center"
          : "px-4 py-2 rounded-full bg-ink/5 hover:bg-ink/10 text-sm"
      } transition-colors ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {feedback === "copied" || feedback === "shared" ? (
          <motion.span
            key="ok"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2"
          >
            <Check className="size-4" strokeWidth={2.5} />
            {!isIcon && (
              <span>{feedback === "shared" ? t.product.shared : t.product.copied}</span>
            )}
          </motion.span>
        ) : (
          <motion.span
            key="share"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2"
          >
            <Share2 className="size-4" strokeWidth={2.25} />
            {!isIcon && <span>{t.product.share}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
