const items = [
  { icon: "↗", k: "Envío 24-48h", v: "Gratis a partir de €40" },
  { icon: "↺", k: "Devoluciones gratis", v: "30 días sin preguntas" },
  { icon: "✦", k: "Made in Spain", v: "Producción ética y local" },
];

export default function TrustStrip() {
  return (
    <section className="bg-bone py-12 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 sm:px-6 max-w-6xl mx-auto">
        {items.map(({ icon, k, v }) => (
          <div
            key={k}
            className="flex items-start gap-4 p-6 rounded-3xl bg-bone-dim/60"
          >
            <span className="size-10 rounded-full bg-ink text-bone flex items-center justify-center text-lg shrink-0">
              {icon}
            </span>
            <div className="flex flex-col">
              <span className="font-medium">{k}</span>
              <span className="text-sm text-ink-soft">{v}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
