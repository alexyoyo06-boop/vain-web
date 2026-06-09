// Verificación de integridad móvil: recorre las rutas clave con viewport de
// iPhone, detecta overflow horizontal (la lacra clásica en móvil), recoge
// errores de consola/página y guarda capturas en _mobile_shots/.
// Uso: node scripts/mobile-check.js [baseUrl]

const { chromium, devices } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.argv[2] || "http://localhost:3000";
const OUT = path.join(process.cwd(), "_mobile_shots");

const ROUTES = [
  "/",
  "/todo",
  "/nuevo-drop",
  "/cart",
  "/archivo",
  "/coming-soon",
  "/admin/login",
  "/policies/privacy-policy",
  "/ruta-que-no-existe-404",
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
    locale: "es-ES",
  });
  // Saltarse el gate de coming-soon en local (misma cookie que setea unlock).
  const base = new URL(BASE);
  await ctx.addCookies([
    {
      name: "vain_early_access",
      value: "1",
      domain: base.hostname,
      path: "/",
    },
  ]);
  const page = await ctx.newPage();

  const issues = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") issues.push(`[console] ${page.url()}: ${msg.text().slice(0, 200)}`);
  });
  page.on("pageerror", (err) => issues.push(`[pageerror] ${page.url()}: ${String(err).slice(0, 200)}`));

  // Descubrir una ficha de producto real desde /todo.
  let productHref = null;

  for (const route of ROUTES) {
    const url = BASE + route;
    try {
      const resp = await page.goto(url, { waitUntil: "load", timeout: 90000 });
      await page.waitForTimeout(2200); // dejar terminar animaciones de entrada
      const status = resp ? resp.status() : 0;
      const overflow = await page.evaluate(() => {
        const d = document.documentElement;
        return { scrollW: d.scrollWidth, clientW: d.clientWidth };
      });
      const over = overflow.scrollW > overflow.clientW + 1;
      const name = route === "/" ? "home" : route.replace(/[\/[\]]/g, "_").replace(/^_/, "");
      await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
      console.log(`${over ? "OVERFLOW-X" : "ok"}  ${status}  ${route}  (${overflow.scrollW}/${overflow.clientW})`);
      if (over) issues.push(`[overflow-x] ${route}: scrollWidth ${overflow.scrollW} > viewport ${overflow.clientW}`);

      if (route === "/todo" && !productHref) {
        productHref = await page.evaluate(() => {
          const a = Array.from(document.querySelectorAll("a[href]")).find((el) =>
            /^\/[a-z-]+\/[a-z0-9-]+$/.test(el.getAttribute("href") || "") &&
            !el.getAttribute("href").startsWith("/policies"),
          );
          return a ? a.getAttribute("href") : null;
        });
      }
    } catch (err) {
      issues.push(`[nav] ${route}: ${String(err).slice(0, 200)}`);
      console.log(`ERROR  ${route}: ${String(err).slice(0, 120)}`);
    }
  }

  if (productHref) {
    try {
      await page.goto(BASE + productHref, { waitUntil: "load", timeout: 90000 });
      await page.waitForTimeout(2200);
      const overflow = await page.evaluate(() => {
        const d = document.documentElement;
        return { scrollW: d.scrollWidth, clientW: d.clientWidth };
      });
      const over = overflow.scrollW > overflow.clientW + 1;
      await page.screenshot({ path: path.join(OUT, "producto.png"), fullPage: true });
      console.log(`${over ? "OVERFLOW-X" : "ok"}  200  ${productHref}  (${overflow.scrollW}/${overflow.clientW})`);
      if (over) issues.push(`[overflow-x] ${productHref}`);
    } catch (err) {
      issues.push(`[nav] ${productHref}: ${String(err).slice(0, 200)}`);
    }
  } else {
    console.log("AVISO: no se encontró ficha de producto desde /todo");
  }

  await browser.close();
  console.log("\n=== INCIDENCIAS ===");
  if (issues.length === 0) console.log("ninguna");
  else issues.forEach((i) => console.log("- " + i));
})();
