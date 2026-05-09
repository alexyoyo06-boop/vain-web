import Marquee from "./Marquee";

export default function TopMarquee() {
  return (
    <div className="bg-ink text-bone py-2.5 text-[12px] tracking-wide">
      <Marquee
        items={[
          "Envío gratis · primeras 24h",
          "Drop/01 — Plaid Hoodie €39,99",
          "Made in Spain",
          "Devoluciones gratis 30 días",
        ]}
        separator="·"
      />
    </div>
  );
}
