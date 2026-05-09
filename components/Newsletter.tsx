"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" className="relative bg-acid text-ink border-b-2 border-ink overflow-hidden">
      {/* Texto fondo */}
      <p
        aria-hidden
        className="absolute -top-4 left-0 right-0 font-display uppercase whitespace-nowrap text-ink/[0.07] tracking-tighter pointer-events-none select-none"
        style={{ fontSize: "clamp(7rem, 26vw, 22rem)", lineHeight: 0.8 }}
      >
        CONÉCTATE
      </p>

      <div className="relative grid grid-cols-12 gap-6 px-4 sm:px-6 py-20 md:py-28">
        <div className="col-span-12 md:col-span-7 flex flex-col gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
            [ §04 / TRANSMISIÓN PRIVADA ]
          </span>
          <h2
            className="font-display uppercase leading-[0.85] tracking-tighter"
            style={{ fontSize: "clamp(2.5rem, 9vw, 8rem)" }}
          >
            DROPS
            <br />
            ANTES QUE
            <br />
            <span className="outline-text">NADIE.</span>
          </h2>
          <p className="text-ink-soft max-w-md">
            Acceso anticipado, codes -20% para suscriptores y aviso 12h antes
            de cada drop. Cero spam, cero relleno.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.includes("@")) return;
            setSent(true);
          }}
          className="col-span-12 md:col-span-5 flex flex-col gap-3 self-end"
        >
          <label className="font-mono text-[10px] uppercase tracking-[0.22em]">
            [ TU EMAIL ]
          </label>
          <div className="flex border-2 border-ink bg-bone shadow-brut">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="flex-1 px-4 py-4 font-mono text-sm bg-transparent outline-none text-ink placeholder:text-haze"
            />
            <button
              type="submit"
              className="bg-ink text-bone px-5 font-mono text-[11px] uppercase tracking-[0.22em] hover:bg-blood transition-colors"
            >
              SUBSCRIBE →
            </button>
          </div>
          {sent ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink">
              ✓ TRANSMISIÓN ACTIVA. NOS VEMOS EN EL DROP.
            </p>
          ) : (
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              al unirte aceptas recibir mails de VAIN. unsubscribe en 1 click.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
