"use client";

// Si WebGL no arranca (GPU bloqueada, driver viejo, navegador sin soporte),
// el globo se cae solo y el resto del panel — que es lo que de verdad hace
// falta para abrir y cerrar la web — sigue en pie.

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback: ReactNode };
type State = { hasError: boolean };

export default class GlobeErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[AdminGlobe] WebGL falló, se enseña la lista:", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
