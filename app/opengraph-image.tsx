import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionary";

export const alt = "VAIN — DRESS THE NOISE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// La fuente por defecto de satori solo cubre alfabeto latino. Para idiomas con
// otro script (griego, ruso, árabe) caemos a EN en la imagen para no ver tofu.
// El texto del <head> (meta og) sí va traducido en cada idioma.
const LATIN_OG = new Set(["es", "en", "fr", "it", "de", "pt", "nl", "pl"]);

export default async function Image() {
  const locale = await getLocale();
  const t = await getDictionary(LATIN_OG.has(locale) ? locale : "en");
  const eyebrow = `Drop/01 — ${t.product.limitedEdition}`;
  const ogTitle = t.hero.taglineLine1.replace(/\.\s*$/, "");
  const ogSub = t.meta.ogDescription;
  // Re-renderizamos el logo en un PNG de ancho fijo para que satori no necesite
  // calcular el alto automáticamente (no soporta height: auto fiable).
  const logoBuf = await sharp(
    await readFile(path.join(process.cwd(), "public", "logo2.png"))
  )
    .resize({ width: 900 })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logoBuf).metadata();
  const logoUrl = `data:image/png;base64,${logoBuf.toString("base64")}`;
  const logoW = logoMeta.width ?? 900;
  const logoH = logoMeta.height ?? 180;

  const bone = "#ffffff";
  const ink = "#0f0f0f";
  const inkSoft = "#3a3a3a";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: bone,
          color: ink,
          fontFamily: "Helvetica, Arial, sans-serif",
          padding: 64,
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: inkSoft,
            textTransform: "uppercase",
            letterSpacing: 1.6,
          }}
        >
          <span>{eyebrow}</span>
          <span>v4in.com</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          <img src={logoUrl} alt="VAIN" width={logoW} height={logoH} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: -1.5,
              color: ink,
            }}
          >
            {ogTitle}
          </div>
          <div
            style={{
              fontSize: 24,
              color: inkSoft,
            }}
          >
            {ogSub}
          </div>
        </div>
      </div>
    ),
    size
  );
}
