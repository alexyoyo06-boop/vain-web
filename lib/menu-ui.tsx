"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type MenuUI = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const MenuUIContext = createContext<MenuUI | null>(null);

export function MenuUIProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const firstRenderRef = useRef(true);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // Cierra el menú al cambiar de ruta (incluye atrás/adelante del navegador),
  // evitando que el menú quede abierto persiguiendo al usuario por el historial.
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const reset = () => {
      document.body.style.overflow = "";
    };
    window.addEventListener("pagehide", reset);
    return () => window.removeEventListener("pagehide", reset);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <MenuUIContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </MenuUIContext.Provider>
  );
}

export function useMenuUI() {
  const ctx = useContext(MenuUIContext);
  if (!ctx) throw new Error("useMenuUI must be used within MenuUIProvider");
  return ctx;
}
