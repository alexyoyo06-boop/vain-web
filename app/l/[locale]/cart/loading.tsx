/**
 * Esqueleto de la cesta mientras el servidor la renderiza.
 *
 * Hace falta porque el enlace del carrito ya no se precarga (ver el comentario
 * de `prefetch={false}` en components/Nav.tsx): antes el clic era instantáneo
 * porque la página venía precargada, y precargarla costaba una invocación de
 * función en CADA página vista. Con esto el clic sigue respondiendo al momento
 * — se pinta esto en cuanto tocas — pero sin pagar nada de servidor por las
 * visitas que nunca abren la cesta.
 *
 * Deliberadamente sin Nav ni Footer: son lo que estamos esperando a que llegue,
 * y montarlos aquí duplicaría el trabajo en cliente para ganar unos ms.
 */
export default function CartLoading() {
  return (
    <main className="flex flex-col min-h-screen bg-bone">
      <section className="py-12 md:py-20">
        <div className="px-4 sm:px-6 max-w-3xl mx-auto animate-pulse motion-reduce:animate-none">
          {/* "Volver" */}
          <div className="h-4 w-24 rounded-full bg-ink/10 mb-10" />

          {/* Título */}
          <div className="h-12 md:h-16 w-2/3 rounded-2xl bg-ink/10 mb-8" />

          {/* Líneas de producto */}
          <div className="flex flex-col gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="size-20 md:size-24 rounded-2xl bg-ink/10 shrink-0" />
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="h-4 w-1/2 rounded-full bg-ink/10" />
                  <div className="h-3 w-1/4 rounded-full bg-ink/10" />
                </div>
              </div>
            ))}
          </div>

          {/* Total + botón de pagar */}
          <div className="h-px w-full bg-ink/10 my-8" />
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="h-4 w-20 rounded-full bg-ink/10" />
            <div className="h-5 w-24 rounded-full bg-ink/10" />
          </div>
          <div className="h-14 w-full rounded-full bg-ink/10" />
        </div>
      </section>
    </main>
  );
}
