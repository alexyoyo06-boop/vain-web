"use client";

// Logo 3D del VAIN en cromo metálico. El GLB es la silueta COMPLETA del
// logo vectorizada con potrace (un solo mesh `logoBody`) — sin piezas
// sueltas. Los Lightformers van DENTRO de <Environment> para que se
// renderen en el envmap (el cromo los refleja) pero NO aparezcan
// visibles en la escena.
//
// Anti-parpadeo: debajo del Canvas se pinta el PNG plano (mismo que el
// fallback). Se ve al instante y el 3D hace fade-in ENCIMA solo cuando el
// GLB ya está cargado (onReady), así no hay salto seco PNG→cromo.

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import * as THREE from "three";

// Cache-bust: bump cuando regeneremos el GLB.
const GLB_URL = "/logo_3d.glb?v=5";

function LogoModel({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(GLB_URL, true);

  const prepared = useMemo(() => {
    const cloned = scene.clone(true);
    // Cromo oscuro: metalness alto + roughness bajo + clearcoat para los
    // reflejos vivos. envMapIntensity 1.4 hace que coja bien las luces.
    const chromeMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#1a1a1a"),
      metalness: 1.0,
      roughness: 0.18,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.4,
    });
    cloned.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.isMesh) m.material = chromeMat;
    });
    cloned.scale.setScalar(0.85);
    return cloned;
  }, [scene]);

  // useGLTF suspende hasta tener el GLB, así que cuando este efecto corre el
  // modelo ya está montado: avisamos para hacer el fade-in del Canvas.
  useEffect(() => {
    onReady();
  }, [onReady]);

  return <primitive object={prepared} />;
}

export default function MetallicLogo3D() {
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  return (
    <div
      className="relative w-full mx-auto select-none"
      style={{ touchAction: "none" }}
    >
      <div className="relative aspect-square">
        {/* Base estática: visible al instante. El 3D le hace fade-in encima. */}
        <Image
          src="/logo_en3d.png"
          alt="VAIN"
          fill
          priority
          sizes="(max-width: 768px) 80vw, 460px"
          draggable={false}
          className={`object-contain pointer-events-none transition-opacity duration-500 ${
            ready ? "opacity-0" : "opacity-100"
          }`}
        />
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 18], fov: 35 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
          }}
          style={{
            position: "absolute",
            inset: 0,
            background: "transparent",
            opacity: ready ? 1 : 0,
            transition: "opacity 700ms ease",
          }}
        >
          {/* Environment con children → Lightformers se rendererizan solo
              en el envmap (el cromo los refleja como bandas de luz) y NO
              aparecen visibles en la escena. */}
          <Environment frames={1} resolution={256} background={false}>
            {/* Highlight frontal compacto */}
            <Lightformer
              form="rect"
              position={[0, 0, 10]}
              scale={[3, 3, 1]}
              intensity={1.8}
              color="#ffffff"
            />
            {/* Calidez arriba-frente */}
            <Lightformer
              form="rect"
              position={[3, 5, 8]}
              scale={[2, 1.5, 1]}
              intensity={1.2}
              color="#fff1d6"
            />
            {/* Tinte frío abajo-frente */}
            <Lightformer
              form="rect"
              position={[-3, -4, 8]}
              scale={[2, 1.5, 1]}
              intensity={0.9}
              color="#d9e9ff"
            />
            {/* Rim trasero suave para dar perfil al perímetro */}
            <Lightformer
              form="rect"
              position={[0, 0, -8]}
              scale={[8, 6, 1]}
              intensity={0.8}
              color="#ffe1a8"
            />
          </Environment>

          {/* Highlight nítido frontal */}
          <directionalLight position={[0, 2, 10]} intensity={0.7} />
          <directionalLight position={[2, 3, 8]} intensity={0.4} color="#fff5e0" />

          <Suspense fallback={null}>
            <LogoModel onReady={handleReady} />
          </Suspense>

          <OrbitControls
            makeDefault
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            rotateSpeed={0.7}
            enableDamping
            dampingFactor={0.12}
          />
        </Canvas>
      </div>
    </div>
  );
}

useGLTF.preload(GLB_URL);
