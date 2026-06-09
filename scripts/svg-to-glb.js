// SVG vectorial → GLB extruido manteniendo COLORES por path.
//
// El SVG `logoooooensvj.svg` tiene 4 paths con fills distintos:
//   - rgb(0,0,0)        → negro (cuerpo del logo)
//   - rgb(175,175,175)  → gris medio (sombra del relieve)
//   - rgb(213,213,213)  → gris claro (relieve)
//   - rgb(215,215,215)  → gris claro (relieve)
//
// Generamos un GLB con TRES meshes para preservar los grises del SVG y
// que el runtime aplique materiales mate distintos (no cromo):
//   - logoBody    → negro
//   - logoBevelMid → gris medio
//   - logoBevelHi  → gris claro

const fs = require("node:fs");
const path = require("node:path");

const SRC = path.join(__dirname, "..", "..", "logoooooensvj.svg");
const OUT_DIR = path.join(__dirname, "..", "public");
const OUT_GLB = path.join(OUT_DIR, "logo_3d.glb");

async function main() {
  // Polyfills
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

  // OJO: SVGO mutaba los colores (cambiaba rgb(215,215,215)→algo distinto)
  // y mezclaba paths. Para conservar EXACTAMENTE los 4 fills originales
  // del SVG (negro + 3 grises) saltamos SVGO y feedeamos el raw al loader.
  const svgText = fs.readFileSync(SRC, "utf8");
  console.log(`SVG raw: ${svgText.length} bytes`);

  const loader = new SVGLoader();
  const data = loader.parse(svgText);
  console.log(`Paths: ${data.paths.length}`);

  const extrudeSettings = {
    depth: 60,
    bevelEnabled: true,
    bevelThickness: 4,
    bevelSize: 3,
    bevelOffset: 0,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 6,
  };

  // Separar por luminance del fill en TRES buckets para conservar los
  // tonos del SVG original (negro + 2 grises).
  //
  // OJO: SVGLoader convierte sRGB→linear al parsear. El SVG dice
  // rgb(213) (sRGB) pero llega como rgb(170) (linear). Por eso los
  // thresholds están en espacio LINEAR, no sRGB.
  //   rgb(0)       sRGB → lum linear ~0      → BODY
  //   rgb(175)     sRGB → lum linear ~0.43   → MID
  //   rgb(213-215) sRGB → lum linear ~0.67   → HI
  const bodyGeometries = [];
  const midGeometries = [];
  const hiGeometries = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const pathData of data.paths) {
    const color = pathData.color; // THREE.Color desde SVGLoader
    const lum = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
    let label;
    let bucket;
    if (lum < 0.2) {
      label = "BODY";
      bucket = bodyGeometries;
    } else if (lum < 0.55) {
      label = "MID";
      bucket = midGeometries;
    } else {
      label = "HI";
      bucket = hiGeometries;
    }
    console.log(
      `Path color rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)}) lum=${lum.toFixed(2)} → ${label}`,
    );

    const shapes = SVGLoader.createShapes(pathData);
    for (const shape of shapes) {
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
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
      bucket.push(geometry);
    }
  }
  console.log(
    `Body: ${bodyGeometries.length}, Mid: ${midGeometries.length}, Hi: ${hiGeometries.length}`,
  );

  const scene = new THREE.Scene();
  const group = new THREE.Group();

  function addBucket(geos, color, name) {
    if (geos.length === 0) return;
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (!merged) {
      console.warn(`merge devolvió null para ${name}`);
      return;
    }
    if (geos.length > 1) for (const g of geos) g.dispose();
    const mat = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(merged, mat);
    mesh.name = name;
    group.add(mesh);
  }
  // SOLO extruimos el BODY (path negro principal).
  //
  // Los buckets MID y HI del SVG son DROP SHADOWS / HALFTONE que en 2D
  // simulan profundidad dibujando copias offset y patrones de puntos. En
  // 3D ya tenemos extrusión real con bevel y luces — esas sombras se
  // vuelven slabs flotando al lado del cuerpo o columnitas ruidosas.
  // Los descartamos y el relieve sale natural del 3D.
  addBucket(bodyGeometries, 0x0a0a0a, "logoBody");
  console.log(
    `Mid/Hi geos descartados: ${midGeometries.length}+${hiGeometries.length} (shadows/halftone 2D)`,
  );
  for (const g of midGeometries) g.dispose();
  for (const g of hiGeometries) g.dispose();

  // Normalizar a ancho ~10 + centrar
  const width = maxX - minX;
  const height = maxY - minY;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = 10 / Math.max(width, height);
  group.scale.setScalar(scale);
  group.position.set(-cx * scale, -cy * scale, 0);
  scene.add(group);

  // Export GLB
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

  // Draco compression
  const { NodeIO } = await import("@gltf-transform/core");
  const { KHRDracoMeshCompression } = await import("@gltf-transform/extensions");
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
  console.log(`Final GLB: ${(compressed.length / 1024).toFixed(1)} KB`);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exitCode = 1;
});
