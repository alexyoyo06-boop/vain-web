type Variant = "default" | "rev" | "slow";

const speedClass: Record<Variant, string> = {
  default: "animate-marquee",
  rev: "animate-marquee-rev",
  slow: "animate-marquee-slow",
};

export default function Marquee({
  items,
  variant = "default",
  className = "",
  separator = "★",
}: {
  items: string[];
  variant?: Variant;
  className?: string;
  separator?: string;
}) {
  const loop = [...items, ...items, ...items, ...items];
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div className={`inline-flex gap-8 ${speedClass[variant]}`}>
        {loop.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-8 shrink-0">
            <span>{it}</span>
            <span aria-hidden className="opacity-60">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
