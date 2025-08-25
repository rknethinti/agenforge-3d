"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Html, Stars, Sparkles } from "@react-three/drei";
import Link from "next/link";
import { useRef } from "react";

/**
 * World Hub 3D — Mandatory graphics baseline
 * Route: /world
 *
 * What this provides now:
 * - A lightweight 3D hub scene with animated floating islands (portals)
 * - Each island links to a quest route (Git, Docker, K8s, Jenkins, Terraform)
 * - Nice juice: stars, sparkles, floating animation, soft lighting
 * - Works as a client component under Next.js App Router
 *
 * Roadmap to enrich:
 * - Replace placeholder islands with GLTF assets (low-poly islands, gates)
 * - Add NPCs using <Html> overlays for dialogues
 * - Add camera rails / cutscenes, postprocessing, SFX
 */

export default function WorldPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-black to-zinc-900 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">AgenForge — World Hub (3D)</h1>
          <Link href="/" className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/20">← Back</Link>
        </header>
        <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl border border-white/10">
          <Canvas camera={{ position: [0, 4, 10], fov: 55 }}>
            <color attach="background" args={["#0b0f17"]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 8, 2]} intensity={1.2} />

            <Stars radius={120} depth={60} count={4000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={60} scale={[30, 10, 30]} size={2} speed={0.5} noise={1} />

            {/* Portals */}
            <group position={[0, 0, 0]}>
              <Portal position={[-6, 0, 0]} label="Git Quest" href="/games/git-quest" color="#34d399" />
              <Portal position={[-3, 0.3, -2]} label="Docker Dungeon" href="/games/docker-dungeon" color="#60a5fa" />
              <Portal position={[0, -0.1, 1.5]} label="Kubernetes Arena" href="/games/k8s-arena" color="#a78bfa" />
              <Portal position={[3, 0.25, -1.5]} label="Jenkins Runner" href="/games/jenkins-runner" color="#fbbf24" />
              <Portal position={[6, -0.2, 0.5]} label="Terraform Trials" href="/games/terraform-trials" color="#f472b6" />
            </group>

            <OrbitControls enablePan={false} minDistance={5} maxDistance={18} />
          </Canvas>

          {/* On-screen tips */}
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/50 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10">
            Tip: drag to orbit • scroll to zoom • click a glowing island to enter a quest
          </div>
        </div>
      </div>
    </main>
  );
}

function Portal({ position = [0,0,0], label, href, color = "#34d399" }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t + position[0]) * 0.2;
      ref.current.rotation.y = Math.sin(t * 0.4) * 0.2;
    }
  });

  return (
    <group position={position}>
      <Float floatIntensity={0.6} rotationIntensity={0.2} speed={1.2}>
        <mesh ref={ref} castShadow onClick={(e) => { e.stopPropagation(); window.location.href = href; }}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.2} emissive={color} emissiveIntensity={0.25} />
        </mesh>
        {/* Island base */}
        <mesh position={[0, -1.3, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusKnotGeometry args={[0.6, 0.15, 80, 16]} />
          <meshStandardMaterial color="#1f2937" metalness={0.2} roughness={0.8} />
        </mesh>
      </Float>
      {/* Label */}
      <Html center distanceFactor={10} position={[0, 1.8, 0]}>
        <Link href={href} className="rounded-xl bg-white/10 px-3 py-1 text-xs backdrop-blur hover:bg-white/20">
          {label} →
        </Link>
      </Html>
    </group>
  );
}
