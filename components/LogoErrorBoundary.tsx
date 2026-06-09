"use client";

// Error boundary alrededor del MetallicLogo3D. Si three.js explota (sin
// WebGL, GPU bloqueada, GLB no carga, OOM en mobile), renderiza el fallback
// pasado por children del prop `fallback` — típicamente el MetallicLogo CSS.

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode;
};

type State = { hasError: boolean };

export default class LogoErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[LogoErrorBoundary] 3D logo failed, using CSS fallback:", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
