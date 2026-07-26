import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { PolicyBlock, PolicyPageCopy } from "@/lib/i18n/policies";

// Renderiza una página legal a partir de su diccionario. Las 7 páginas de
// /policies usan este mismo componente, así que traducir es traducir strings:
// la estructura (h1/h2/ul/p) vive aquí y no se puede romper desde el JSON.

const H1 = "font-display uppercase tracking-tighter leading-none text-ink";
const H2 =
  "font-display uppercase tracking-tight text-ink mt-10 mb-1 text-xl md:text-2xl";
const H3 = "text-ink font-medium mt-6 mb-1";
const LINK = "underline underline-offset-4 hover:text-ink";

/**
 * Markup inline permitido en los strings del diccionario:
 *   **negrita**            → <strong>
 *   [texto](destino)       → enlace (interno con <Link>, externo con <a>)
 *   salto de línea real    → <br>
 * Nada más. No hay HTML crudo, así que no hace falta sanitizar.
 */
const INLINE_RE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;

  for (const m of text.matchAll(INLINE_RE)) {
    const start = m.index;
    if (start > last) out.push(text.slice(last, start));

    const [, linkText, href, bold] = m;
    if (bold !== undefined) {
      out.push(
        <strong key={`${keyPrefix}-b${i}`} className="text-ink font-medium">
          {bold}
        </strong>,
      );
    } else if (href.startsWith("/")) {
      out.push(
        <Link key={`${keyPrefix}-l${i}`} href={href} className={LINK}>
          {linkText}
        </Link>,
      );
    } else {
      // mailto:, tel: y http(s). Solo los http(s) abren pestaña nueva.
      const external = /^https?:/i.test(href);
      out.push(
        <a
          key={`${keyPrefix}-l${i}`}
          href={href}
          className={LINK}
          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {linkText}
        </a>,
      );
    }

    last = start + m[0].length;
    i += 1;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Igual que renderInline pero respetando los saltos de línea del string. */
function renderParagraph(text: string, keyPrefix: string): ReactNode[] {
  return text.split("\n").flatMap((line, i) => {
    const content = renderInline(line, `${keyPrefix}-${i}`);
    return i === 0
      ? content
      : [<br key={`${keyPrefix}-br${i}`} />, ...content];
  });
}

function Block({ block, id }: { block: PolicyBlock; id: string }) {
  if ("h2" in block) return <h2 className={H2}>{block.h2}</h2>;
  if ("h3" in block) return <h3 className={H3}>{block.h3}</h3>;
  if ("note" in block)
    return (
      <p className="text-sm text-ink-soft/70 mt-2">
        {renderParagraph(block.note, id)}
      </p>
    );
  if ("ul" in block)
    return (
      <ul className="list-disc pl-5 space-y-1">
        {block.ul.map((item, i) => (
          <li key={i}>{renderParagraph(item, `${id}-${i}`)}</li>
        ))}
      </ul>
    );
  return <p>{renderParagraph(block.p, id)}</p>;
}

export default function PolicyPage({ copy }: { copy: PolicyPageCopy }) {
  return (
    <>
      <h1 className={H1} style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}>
        {copy.heading}
      </h1>
      {copy.blocks.map((block, i) => (
        <Fragment key={i}>
          <Block block={block} id={`b${i}`} />
        </Fragment>
      ))}
    </>
  );
}
