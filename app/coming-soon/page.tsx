import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "VAIN — Coming Soon",
  description:
    "La web se abrirá pronto. Déjanos tu email y entra de los primeros, con descuento exclusivo el día del lanzamiento.",
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return <ComingSoon />;
}
