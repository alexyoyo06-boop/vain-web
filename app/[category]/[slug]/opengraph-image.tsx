import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { formatPrice } from "@/lib/products";
import { getAvailableProducts, getProduct } from "@/lib/products-server";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionary";

export const alt = "VAIN — DRESS THE NOISE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Script latino: la fuente de satori solo cubre latín. Para otros (el/ru/ar)
// caemos a EN en la imagen para evitar tofu.
const LATIN_OG = new Set(["es", "en", "fr", "it", "de", "pt", "nl", "pl"]);

export async function generateStaticParams() {
  const products = await getAvailableProducts();
  return products.map((p) => ({ category: p.category, slug: p.slug }));
}

// satori (next/og) acepta PNG/JPEG nativos pero falla con webp/avif.
// Reconvertimos cualquier formato a PNG en memoria para servir siempre lo mismo.
async function fileToPngDataUrl(relPath: string, resizeWidth?: number) {
  const buf = await readFile(path.join(process.cwd(), "public", relPath));
  let pipe = sharp(buf);
  if (resizeWidth) pipe = pipe.resize({ width: resizeWidth });
  const pngBuf = await pipe.png().toBuffer();
  return `data:image/png;base64,${pngBuf.toString("base64")}`;
}

/** Carga una imagen desde URL absoluta (Shopify CDN) o ruta relativa (asset local). */
async function loadImageAsPng(src: string, resizeWidth?: number) {
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src, { next: { revalidate: 3600 } });
    const arr = new Uint8Array(await res.arrayBuffer());
    let pipe = sharp(arr);
    if (resizeWidth) pipe = pipe.resize({ width: resizeWidth });
    const pngBuf = await pipe.png().toBuffer();
    return `data:image/png;base64,${pngBuf.toString("base64")}`;
  }
  return fileToPngDataUrl(src.replace(/^\//, ""), resizeWidth);
}

// Como satori no respeta width: auto, calculamos dimensiones reales.
async function fileToSizedPng(relPath: string, targetHeight: number) {
  const buf = await readFile(path.join(process.cwd(), "public", relPath));
  const meta = await sharp(buf).metadata();
  const aspect = (meta.width ?? 1) / (meta.height ?? 1);
  const width = Math.round(targetHeight * aspect);
  const pngBuf = await sharp(buf).resize({ width, height: targetHeight }).png().toBuffer();
  return {
    url: `data:image/png;base64,${pngBuf.toString("base64")}`,
    width,
    height: targetHeight,
  };
}

export default async function Image({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return new ImageResponse(<div>Not found</div>, size);
  }

  const locale = await getLocale();
  const t = await getDictionary(LATIN_OG.has(locale) ? locale : "en");

  // Las fotos de Shopify son URLs absolutas (CDN). Si es absoluto, fetch;
  // si es relativo (asset local legacy), leemos de disk.
  const [productImg, logo] = await Promise.all([
    loadImageAsPng(product.primaryImage, 1100),
    fileToSizedPng("logo2.png", 80),
  ]);

  const bone = "#ffffff";
  const boneDim = "#f2f2f2";
  const ink = "#0f0f0f";
  const inkSoft = "#3a3a3a";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: bone,
          color: ink,
          fontFamily: "Helvetica, Arial, sans-serif",
          padding: 56,
          gap: 48,
        }}
      >
        {/* Foto */}
        <div
          style={{
            width: 518,
            height: 518,
            borderRadius: 40,
            overflow: "hidden",
            display: "flex",
            background: boneDim,
            boxShadow: "0 18px 40px -16px rgba(14,14,14,0.25)",
          }}
        >
          <img
            src={productImg}
            width={518}
            height={518}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
            alt={product.name}
          />
        </div>

        {/* Texto */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <img src={logo.url} width={logo.width} height={logo.height} alt="VAIN" />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 22,
                color: inkSoft,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  background: ink,
                  color: bone,
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 18,
                }}
              >
                {product.drop}
              </span>
              <span>{t.product.limitedEdition}</span>
            </div>
            <div
              style={{
                fontSize: 92,
                lineHeight: 0.95,
                fontWeight: 900,
                letterSpacing: -3,
                textTransform: "uppercase",
                color: ink,
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              {product.name}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 16,
              }}
            >
              <span
                style={{
                  fontSize: 64,
                  fontWeight: 800,
                  letterSpacing: -2,
                  color: ink,
                }}
              >
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span
                  style={{
                    fontSize: 30,
                    color: inkSoft,
                    textDecoration: "line-through",
                    opacity: 0.55,
                  }}
                >
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 22,
                fontSize: 18,
                color: inkSoft,
                textTransform: "uppercase",
                letterSpacing: 1.6,
              }}
            >
              <span>{t.common.freeShipping}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>Made in Spain</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
