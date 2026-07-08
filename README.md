<div align="center">

# Vain

**Tienda de ropa online — proyecto real, en producción, para un cliente real.**

E-commerce headless construido con Next.js sobre Shopify. Desplegado en Vercel con CI/CD.

[🛒 Ver tienda en vivo](https://v4in.com)

</div>

---

## Resultados

Una tienda de verdad, con clientes de verdad:

- 🧾 **40 pedidos** en los primeros 30 días.
- 📈 **8,7 % de conversión** — frente al 2–3 % de media del sector (≈ 3–4×).
- 🚀 En producción en [v4in.com](https://v4in.com).

## Qué es

Vain es una tienda de ropa con **arquitectura headless**: Shopify se encarga del catálogo, el carrito, el checkout y los pagos, y todo el *frontend* está construido a medida con Next.js. Eso da control total sobre el diseño y el rendimiento sin renunciar a la fiabilidad del checkout de Shopify.

## Características

- 🛍️ **Catálogo y producto** conectados a la **Shopify Storefront API** (GraphQL) — colecciones, fichas de producto, variantes.
- 🛒 **Carrito completo** con la Cart API de Shopify (añadir, actualizar, eliminar) y checkout nativo de Shopify.
- 🧊 **Logo en 3D** interactivo con React Three Fiber / Three.js.
- 🌐 **Internacionalización (i18n)** propia, servidor y cliente.
- 🔒 **Zona de administración** con autenticación y *rate limiting*.
- ✉️ **Early access / lista de espera** para drops.
- ⚡ **Optimización y analítica**: Vercel Analytics, Speed Insights y Edge Config para *feature flags* / estado del sitio.
- 🎨 Diseño y animaciones a medida (Framer Motion), sin librería de componentes.

## Stack

| Área | Tecnología |
|------|-----------|
| Framework | Next.js 16 · React 19 · TypeScript |
| Commerce | Shopify Storefront API (headless, GraphQL) |
| 3D | React Three Fiber · Three.js · Drei |
| Estilos / animación | Tailwind CSS v4 · Framer Motion |
| Infra | Vercel · Edge Config · Analytics · Speed Insights |
| CI/CD | Despliegue continuo en Vercel |

## Capturas

| Home | Producto | Carrito |
|------|----------|---------|
| ![Home](_mobile_shots/home.png) | ![Producto](_mobile_shots/producto.png) | ![Carrito](_mobile_shots/cart.png) |

## Arquitectura (breve)

La integración con Shopify vive en [`lib/shopify/`](lib/shopify) (cliente GraphQL, `products`, `collections`, `cart`, `customer` y las `queries`). El estado del carrito y el menú se manejan en el cliente (`lib/cart-ui.tsx`, `lib/menu-ui.tsx`), y la internacionalización en [`lib/i18n/`](lib/i18n). El renderizado de producto usa datos servidos desde el servidor (`lib/products-server.ts`) para SEO y velocidad.

---

<div align="center">
Desarrollado por <a href="https://github.com/alexyoyo06-boop">Alex García Marcos</a>
</div>
