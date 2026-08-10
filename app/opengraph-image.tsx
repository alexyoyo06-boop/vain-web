import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getDictionary } from "@/lib/i18n/dictionary";

export const alt = "VAIN";
export const size = { width: 1200, height: 630 };
// JPEG y no PNG: con una foto de fondo el PNG se va a >1 MB y WhatsApp o
// Telegram no llegan a cargar previews tan pesadas. En JPEG baja a ~150 KB.
export const contentType = "image/jpeg";

// Idioma FIJO, sin getLocale(). Igual que en la OG de producto (ver el porqué
// largo en app/[category]/[slug]/opengraph-image.tsx): quien pide esta imagen
// es el crawler, que no trae el idioma del visitante, y leer cookies obligaba a
// rasterizarla en CADA petición — sharp + satori es de lo más caro que corre
// aquí y se paga en Active CPU. Sin APIs de request, Next la prerenderiza en el
// build y se sirve cacheada.
//
// Tiene que ser de script latino: la fuente por defecto de satori no cubre
// griego, cirílico ni árabe (saldría tofu). El texto del <head> (meta og) sí
// va traducido en cada idioma.
const OG_LOCALE = "en" as const;

// La misma foto del banner de portada: al compartir el enlace se ve lo mismo
// que al entrar en la web. Si cambias la foto en PhotoHero, cambia esta.
const BANNER = "hero/banner-1.jpg";

/** Recorta la foto a 1200x630 con el mismo encuadre que la portada
 *  (`object-cover` centrado al 35% de alto) y la devuelve como data URL. */
async function bannerDataUrl() {
  const buf = await readFile(path.join(process.cwd(), "public", BANNER));
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? size.width;
  const h = meta.height ?? size.height;
  const cropH = Math.min(h, Math.round(w / (size.width / size.height)));
  const top = Math.round((h - cropH) * 0.35);
  const out = await sharp(buf)
    .extract({ left: 0, top, width: w, height: cropH })
    .resize(size.width, size.height)
    .png()
    .toBuffer();
  return `data:image/png;base64,${out.toString("base64")}`;
}

/** El logo mono es tinta sobre transparente; sobre la foto oscura hace falta
 *  en blanco, así que se pintan los píxeles de blanco conservando el alfa. */
async function whiteLogoDataUrl(height: number) {
  const buf = await readFile(path.join(process.cwd(), "public", "logo_mono.png"));
  const resized = sharp(buf).resize({ height }).ensureAlpha();
  const { data, info } = await resized
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }
  const png = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
  return {
    url: `data:image/png;base64,${png.toString("base64")}`,
    width: info.width,
    height: info.height,
  };
}

export default async function Image() {
  const t = await getDictionary(OG_LOCALE);
  const [photo, logo] = await Promise.all([
    bannerDataUrl(),
    whiteLogoDataUrl(64),
  ]);

  const bone = "#ffffff";

  const png = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0f0f0f",
          color: bone,
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <img
          src={photo}
          width={size.width}
          height={size.height}
          alt=""
          style={{ position: "absolute", top: 0, left: 0 }}
        />

        {/* Mismo velo que en la portada: oscuro por la izquierda y por abajo
            para que el texto se lea caiga donde caiga el recorte. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
            background:
              "linear-gradient(90deg, rgba(15,15,15,0.82) 0%, rgba(15,15,15,0.45) 45%, rgba(15,15,15,0.05) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
            background:
              "linear-gradient(0deg, rgba(15,15,15,0.75) 0%, rgba(15,15,15,0) 55%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: 64,
          }}
        >
          <img src={logo.url} width={logo.width} height={logo.height} alt="VAIN" />

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 84,
                lineHeight: 0.95,
                fontWeight: 900,
                letterSpacing: -3,
                textTransform: "uppercase",
                display: "flex",
                flexWrap: "wrap",
                textShadow: "0 2px 24px rgba(15,15,15,0.55)",
              }}
            >
              {t.nav.newDrop}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                fontSize: 26,
                textTransform: "uppercase",
                letterSpacing: 1.8,
                opacity: 0.95,
              }}
            >
              <span>{t.meta.ogOutNow}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>v4in.com</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );

  const jpeg = await sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": contentType },
  });
}
