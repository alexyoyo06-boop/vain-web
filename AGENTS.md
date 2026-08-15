<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Lo que puede tirar esta tienda

Esta web vive en el plan gratis de Vercel. La cuota que importa es **Active CPU
(4 h/mes)**, y cuando se agota Vercel **PAUSA el proyecto**: la tienda se cae.
Se ha llegado al 86% más de una vez. Todo lo de abajo son fallos que YA han
pasado aquí, no hipótesis.

## Regla 1: nada de cookies() ni headers() en algo que pinte una página

Una página que lee la request no se puede pre-generar: Next la monta entera en
el servidor **en cada visita**, y el gasto crece con el tráfico. O sea que el
día que un vídeo funciona es el día que la tienda se cae.

Esto incluye lo que se llame *dentro* de un componente compartido. El caso real:
`NavServer` llamaba a `isAdmin()`, que lee cookies. Como el menú va en todas las
páginas, **la web entera era dinámica** — 150 páginas pre-generadas pasaban a 18.

Y lo peor: **en local no se notaba**. `isAdmin()` sale antes de tocar la cookie
si no hay `ADMIN_PASSWORD`, y en local no la hay. El build local decía "estático"
y producción renderizaba cada visita.

**Cómo comprobarlo de verdad** (no vale `npm run build` a secas):

```bash
SHOPIFY_STORE_DOMAIN=x.myshopify.com SHOPIFY_STOREFRONT_PUBLIC_TOKEN=x \
ADMIN_PASSWORD=x npm run build
```

En la tabla de rutas, solo deberían salir con `ƒ` (dinámica) las de `/api`,
`/admin` y `/products/[handle]`. Si aparece cualquier otra, algo ha vuelto a
leer la request.

El idioma ya no se lee de la cookie por esto mismo: va en la URL interna
(`/l/es/todo`) y el proxy reescribe. Ver `app/l/[locale]/layout.tsx`.

## Regla 2: cuidado con cada cuánto caducan los datos

`DEFAULT_REVALIDATE_S` en `lib/shopify/client.ts` marca cada cuánto se vuelve a
montar una página. Estuvo en 60 segundos: con 11 idiomas son ~133 variantes, y
con tráfico continuo eso son decenas de miles de renders al día que no caben en
las 4 h/mes. Está en 1 hora, y los webhooks de Shopify (`/api/revalidate`)
actualizan al instante cuando cambia un producto, así que no hace falta más.

## Regla 3: si Shopify falla, hay que ROMPER, no devolver vacío

`storefront()` lanza `ShopifyUnavailableError` en vez de devolver `null`. Es a
propósito: antes un fallo de red se convertía en "0 productos", la página se
regeneraba *con éxito* pero vacía, y **esa versión vacía se quedaba cacheada una
hora**. Lanzando, Next sigue sirviendo la última versión buena.

Lo que atiende a una persona en directo (carrito, suscripción) sí captura el
error y responde con un mensaje — ver `sinRomper()` en `lib/cart-actions.ts`.

## Regla 4: lo que crece con las visitas es lo peligroso

Cualquier cosa que haga una petición por visitante escala con el tráfico. Ahora
mismo solo queda el latido de presencia (`OnlineBeacon`, cada 2 min) y alimenta
un contador del panel. Si hace falta recortar, es lo primero que sobra.

Las imágenes tienen su propia cuota (300.000 lecturas/mes, también llegó aviso):
las fotos de producto van directas al CDN de Shopify (`lib/image-loader.ts`) y
el logo va `unoptimized` por ser de 5 KB. No metas imágenes pequeñas por
`next/image` sin pensarlo.

## Antes de dar algo por bueno

En local no hay Shopify ni `ADMIN_PASSWORD`, así que **el build local miente**.
Comprueba contra producción (`https://www.v4in.com`, con `www`: el dominio sin
`www` redirige y falsea los códigos de estado).
