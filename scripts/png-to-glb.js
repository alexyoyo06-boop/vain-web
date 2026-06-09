// PNG (silueta del logo) → GLB extruido.
//
// El SVG original `logoooooensvj.svg` tiene 4 paths de colores distintos
// que JUNTOS forman el visual del logo (negro + drop-shadow gris + halftone).
// Extruir paths sueltos da piezas flotando. La solución limpia:
//
//   1. Tomar `public/logo_en3d.png` (logo + sombra gris sobre alpha).
//   2. Threshold para quedarnos SOLO con los píxeles negros (la silueta
//      real del logo, sin la sombra).
//   3. potrace → vectoriza esa silueta en UN solo path SVG.
//   4. SVGLoader + ExtrudeGeometry → GLB final con UN mesh `logoBody`.
//
// Resultado: 3D del logo completo, no fragmentos.

const fs = require("node:fs");
const path = require("node:path");

const SRC_PNG = path.join(__dirname, "..", "public", "logo_en3d.png");
const OUT_DIR = path.join(__dirname, "..", "public");
const OUT_GLB = path.join(OUT_DIR, "logo_3d.glb");
const TMP_MASK = path.join(OUT_DIR, "_logo_silhouette.png");
const TMP_SVG = path.join(OUT_DIR, "_logo_silhouette.svg");

// Cualquier píxel con luminance ≤ esto se considera silueta (negro).
// El drop-shadow gris del PNG tiene luminance ~150-200, lo descartamos.
const BLACK_THRESHOLD = 80;

async function main() {
  const sharp = require("sharp");
  const potrace = require("potrace");

  // ── 1+2. Threshold: PNG con solo los píxeles negros, resto transparente.
  const { data, info } = await sharp(SRC_PNG)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width;
  const H = info.height;

  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    const a = data[o + 3];
    if (a === 0) continue;
    const lum = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
    if (lum > BLACK_THRESHOLD) {
      // gris/blanco (drop-shadow) → transparente
      data[o + 3] = 0;
    } else {
      // negro → opaco puro (sin antialias, mejor para potrace)
      data[o] = 0;
      data[o + 1] = 0;
      data[o + 2] = 0;
      data[o + 3] = 255;
    }
  }

  // ── 2b. Connected-components: nos quedamos SOLO con la blob más grande.
  // Cualquier isla suelta (artefactos del threshold, motas) → transparente.
  // BFS iterativo con cola circular para no reventar el stack en 535×559.
  const labels = new Int32Array(W * H);
  let currentLabel = 0;
  const componentSizes = [0]; // index 0 reservado para "sin etiqueta"
  const queue = new Int32Array(W * H);

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const startIdx = py * W + px;
      if (labels[startIdx] !== 0) continue;
      if (data[startIdx * 4 + 3] === 0) continue;
      currentLabel++;
      let size = 0;
      let head = 0;
      let tail = 0;
      queue[tail++] = startIdx;
      labels[startIdx] = currentLabel;
      while (head < tail) {
        const idx = queue[head++];
        size++;
        const x = idx % W;
        const y = (idx - x) / W;
        // 4-conectividad: arriba, abajo, izq, der
        const neighbors = [
          y > 0 ? idx - W : -1,
          y < H - 1 ? idx + W : -1,
          x > 0 ? idx - 1 : -1,
          x < W - 1 ? idx + 1 : -1,
        ];
        for (const n of neighbors) {
          if (n < 0 || labels[n] !== 0) continue;
          if (data[n * 4 + 3] === 0) continue;
          labels[n] = currentLabel;
          queue[tail++] = n;
        }
      }
      componentSizes.push(size);
    }
  }

  let biggestLabel = 0;
  let biggestSize = 0;
  for (let l = 1; l < componentSizes.length; l++) {
    if (componentSizes[l] > biggestSize) {
      biggestSize = componentSizes[l];
      biggestLabel = l;
    }
  }
  console.log(
    `Componentes: ${currentLabel}, mayor=${biggestSize}px (label ${biggestLabel}), descartando el resto`,
  );

  // Borrar todo lo que no sea la blob principal.
  for (let i = 0; i < W * H; i++) {
    if (labels[i] !== biggestLabel) {
      data[i * 4 + 3] = 0;
    }
  }

  // potrace ignora el canal alpha y lee luminance. Si dejamos transparentes
  // con RGB=(0,0,0) potrace los detecta como negros y crea islas extra.
  // Por eso escribimos la máscara como B&W PURO (1 canal): logo→0, resto→255.
  const grayscale = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) {
    grayscale[i] = data[i * 4 + 3] === 255 ? 0 : 255;
  }

  await sharp(grayscale, {
    raw: { width: W, height: H, channels: 1 },
  })
    .png()
    .toFile(TMP_MASK);
  console.log(`Silueta negra: ${TMP_MASK} (${W}x${H})`);

  // ── 3. potrace: PNG silueta → SVG path único.
  const svgText = await new Promise((resolve, reject) => {
    potrace.trace(
      TMP_MASK,
      {
        // turdSize alto = mata cualquier sub-contorno suelto que el trace
        // pudiera generar a partir de imperfecciones internas del bitmap.
        // El logo principal mide ~111k px, así que 2000 es un colchón
        // grande sin riesgo de borrar partes legítimas.
        turdSize: 2000,
        alphaMax: 1.0, // suavizado de esquinas
        optTolerance: 0.2,
        threshold: 128,
        color: "#000000",
        background: "transparent",
      },
      (err, svg) => (err ? reject(err) : resolve(svg)),
    );
  });
  // potrace puede meter varios sub-paths dentro de un único <path d="..."/>,
  // separados por comandos `M`. Si la silueta tiene un puente de un solo
  // píxel, el simplificador lo descarta y genera una isla suelta. Aquí
  // partimos la `d`, calculamos el bounding box de cada subpath y nos
  // quedamos SOLO con el más grande. El resto desaparece.
  const filtered = filterLargestSubpath(svgText);
  fs.writeFileSync(TMP_SVG, filtered);
  console.log(
    `Trace SVG: ${TMP_SVG} (${svgText.length} → ${filtered.length} bytes tras filtrar islas)`,
  );
  const svgTextFinal = filtered;

  // ── 4. SVGLoader + extrusión.
  const { DOMParser } = require("@xmldom/xmldom");
  globalThis.DOMParser = DOMParser;
  const { Blob } = require("node:buffer");
  globalThis.Blob = Blob;
  class FileReaderPolyfill {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        this.onload?.({ target: this });
        this.onloadend?.({ target: this });
      });
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buf) => {
        const b64 = Buffer.from(buf).toString("base64");
        this.result = `data:${blob.type || "application/octet-stream"};base64,${b64}`;
        this.onload?.({ target: this });
        this.onloadend?.({ target: this });
      });
    }
  }
  globalThis.FileReader = FileReaderPolyfill;

  const THREE = await import("three");
  const { SVGLoader } = await import("three/examples/jsm/loaders/SVGLoader.js");
  const { GLTFExporter } = await import(
    "three/examples/jsm/exporters/GLTFExporter.js"
  );
  const { mergeGeometries } = await import(
    "three/examples/jsm/utils/BufferGeometryUtils.js"
  );

  const loader = new SVGLoader();
  const parsed = loader.parse(svgTextFinal);
  console.log(`Paths del trace: ${parsed.paths.length}`);

  // Depth/bevel calibrados para que el logo se vea como una "placa 3D",
  // ni galleta plana ni ladrillo.
  const extrudeSettings = {
    depth: 40,
    bevelEnabled: true,
    bevelThickness: 3,
    bevelSize: 2.5,
    bevelOffset: 0,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 6,
  };

  const geometries = [];
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const pathData of parsed.paths) {
    const shapes = SVGLoader.createShapes(pathData);
    for (const shape of shapes) {
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // potrace devuelve coords con Y hacia abajo (sistema SVG); invertimos.
      geometry.scale(1, -1, 1);
      geometry.computeBoundingBox();
      if (geometry.boundingBox) {
        const bb = geometry.boundingBox;
        minX = Math.min(minX, bb.min.x);
        minY = Math.min(minY, bb.min.y);
        maxX = Math.max(maxX, bb.max.x);
        maxY = Math.max(maxY, bb.max.y);
      }
      geometry.deleteAttribute("uv");
      geometries.push(geometry);
    }
  }
  console.log(`Total shapes extruidas: ${geometries.length}`);

  const merged =
    geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
  if (!merged) throw new Error("merge devolvió null");
  if (geometries.length > 1) for (const g of geometries) g.dispose();

  const mat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
  const mesh = new THREE.Mesh(merged, mat);
  mesh.name = "logoBody";

  // Normalizar a ancho ~10 + centrar (el runtime aplica scale 0.85).
  const width = maxX - minX;
  const height = maxY - minY;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = 10 / Math.max(width, height);

  const scene = new THREE.Scene();
  const group = new THREE.Group();
  group.add(mesh);
  group.scale.setScalar(scale);
  group.position.set(-cx * scale, -cy * scale, 0);
  scene.add(group);

  const exporter = new GLTFExporter();
  const buffer = await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => resolve(result),
      (err) => reject(err),
      { binary: true, embedImages: false },
    );
  });

  const RAW_GLB = path.join(OUT_DIR, "_logo_3d_raw.glb");
  const bytes = Buffer.from(buffer);
  fs.writeFileSync(RAW_GLB, bytes);
  console.log(`Raw GLB: ${(bytes.length / 1024).toFixed(1)} KB`);

  // Draco compression.
  const { NodeIO } = await import("@gltf-transform/core");
  const { KHRDracoMeshCompression } = await import(
    "@gltf-transform/extensions"
  );
  const { draco } = await import("@gltf-transform/functions");
  const draco3d = require("draco3dgltf");

  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule(),
    });

  const document = await io.readBinary(bytes);
  await document.transform(
    draco({
      method: "edgebreaker",
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
      quantizeColor: 8,
      quantizeGeneric: 12,
    }),
  );
  const compressed = await io.writeBinary(document);
  fs.writeFileSync(OUT_GLB, compressed);
  fs.unlinkSync(RAW_GLB);
  // (temporales _logo_silhouette.{png,svg} se dejan para debug)
  console.log(`Final GLB: ${(compressed.length / 1024).toFixed(1)} KB`);
}

// Dado un SVG con un único <path d="M ... M ... "/>, separa los subpaths
// (cada uno empieza por `M`/`m`) y devuelve un SVG idéntico pero con SOLO
// el subpath cuyo bounding box tiene mayor área. Es lo que mata cualquier
// isla suelta del trace que sobrevivió a turdSize.
function filterLargestSubpath(svgText) {
  const pathMatch = svgText.match(/<path\s+([^>]*?)d="([^"]+)"([^>]*?)\/?>/);
  if (!pathMatch) return svgText;
  const before = pathMatch[1];
  const dAttr = pathMatch[2];
  const after = pathMatch[3];

  // Split por movimiento absoluto M (mayúscula). Conservamos el `M` al
  // inicio de cada subpath. Ignoramos `m` minúscula porque potrace usa
  // absolutas para iniciar contornos.
  const parts = dAttr.split(/(?=[Mm])/g).filter((p) => p.trim().length > 0);
  if (parts.length <= 1) return svgText;

  let best = parts[0];
  let bestArea = 0;
  for (const sub of parts) {
    // Extraer todos los números del subpath y agruparlos en pares (x, y).
    const nums = sub.match(/-?\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 4) continue;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = parseFloat(nums[i]);
      const y = parseFloat(nums[i + 1]);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    const area = (maxX - minX) * (maxY - minY);
    if (area > bestArea) {
      bestArea = area;
      best = sub;
    }
  }
  console.log(
    `Subpaths del trace: ${parts.length}, mejor área bbox=${bestArea.toFixed(0)}, descartando ${parts.length - 1}`,
  );

  const newPath = `<path ${before}d="${best.trim()}"${after}/>`;
  return svgText.replace(pathMatch[0], newPath);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exitCode = 1;
});
