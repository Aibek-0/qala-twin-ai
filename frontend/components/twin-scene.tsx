"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, ContactShadows } from "@react-three/drei";
import { Suspense, useRef, useState, Component, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { Group } from "three";

function Box({
  position,
  size,
  color,
  emissive = false,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive?: boolean;
}) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.48}
        metalness={0.15}
        emissive={emissive ? color : "#000000"}
        emissiveIntensity={emissive ? 0.35 : 0}
      />
    </mesh>
  );
}
function Shelf({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box position={[0, 0.6, 0]} size={[0.85, 1.2, 2.25]} color="#34445d" />
      {[0.35, 0.7, 1.05].map((y, i) => (
        <group key={y}>
          <Box
            position={[0, y + 0.12, 0]}
            size={[0.93, 0.05, 2.3]}
            color="#8b9cba"
          />
          {Array.from({ length: 8 }, (_, j) => (
            <Box
              key={j}
              position={[
                j % 2 === 0 ? -0.43 : 0.43,
                y,
                Math.floor(j / 2) * 0.5 - 0.76,
              ]}
              size={[0.12, 0.23, 0.3]}
              color={["#6f89eb", "#5ca898", "#e3b46c", "#c38bbd"][(i + j) % 4]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
function Person({ index }: { index: number }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) {
      const t = clock.getElapsedTime();
      group.current.position.x = Math.sin(index * 5.4 + t * 0.12) * 4;
      group.current.position.z = Math.cos(index * 3.3 + t * 0.1) * 2.6;
    }
  });
  return (
    <group
      ref={group}
      position={[Math.sin(index * 5.4) * 4, 0, Math.cos(index * 3.3) * 2.6]}
    >
      <mesh position={[0, 0.36, 0]}>
        <capsuleGeometry args={[0.1, 0.32, 4, 8]} />
        <meshStandardMaterial
          color={index % 3 === 0 ? "#b08bff" : "#6da5ff"}
          emissive="#547bff"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.12, 12, 8]} />
        <meshStandardMaterial color="#c4d7ff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[0.18, 0.24, 24]} />
        <meshBasicMaterial color="#547bff" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
function Store({
  occupancy,
  cashiers,
  shelves,
  heatmap,
  motion,
}: {
  occupancy: number;
  cashiers: number;
  shelves: number;
  heatmap: boolean;
  motion: boolean;
}) {
  return (
    <group>
      <Box position={[0, -0.16, 0]} size={[11, 0.32, 8]} color="#202d44" />
      <Box position={[-5.5, 0.8, 0]} size={[0.1, 1.6, 8]} color="#7185a8" />
      <Box position={[0, 0.8, -4]} size={[11, 1.6, 0.1]} color="#7185a8" />
      <Box
        position={[0, 0.12, 3.96]}
        size={[11, 0.24, 0.08]}
        color="#547bff"
        emissive
      />
      <Box
        position={[5.48, 0.12, 0]}
        size={[0.08, 0.24, 8]}
        color="#547bff"
        emissive
      />
      {Array.from({ length: shelves }, (_, i) => (
        <Shelf key={i} x={(i % 4) * 2 - 3} z={Math.floor(i / 4) * 3 - 1.7} />
      ))}
      {Array.from({ length: cashiers }, (_, i) => (
        <group key={i} position={[-3.7 + i * 1.15, 0, 3]}>
          <Box position={[0, 0.4, 0]} size={[0.8, 0.8, 1.1]} color="#5c6d8e" />
          <Box
            position={[0, 0.82, -0.3]}
            size={[0.24, 0.22, 0.1]}
            color="#58dfbc"
            emissive
          />
        </group>
      ))}
      <Box
        position={[4.6, 0.65, -3.1]}
        size={[1.2, 1.3, 1.4]}
        color="#5a729a"
      />
      {heatmap &&
        [-3, 0, 3].map((x, i) => (
          <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 2]}>
            <circleGeometry args={[1.4, 32]} />
            <meshBasicMaterial
              color={["#5a80ff", "#9272ec", "#f3b55a"][i]}
              transparent
              opacity={0.22}
            />
          </mesh>
        ))}
      {Array.from({ length: Math.min(occupancy, 60) }, (_, i) =>
        motion ? (
          <Person index={i} key={i} />
        ) : (
          <group
            key={i}
            position={[Math.sin(i * 5.4) * 4, 0.4, Math.cos(i * 3.3) * 2.6]}
          >
            <mesh>
              <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
              <meshStandardMaterial color="#6da5ff" />
            </mesh>
          </group>
        ),
      )}
    </group>
  );
}
class Boundary extends Component<
  { children: ReactNode; label: string },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="empty">{this.props.label}</div>
    ) : (
      this.props.children
    );
  }
}
export default function TwinScene({
  occupancy = 18,
  cashiers = 2,
  shelves = 8,
  heatmap = false,
  compact = false,
  reset = 0,
}: {
  occupancy?: number;
  cashiers?: number;
  shelves?: number;
  heatmap?: boolean;
  compact?: boolean;
  reset?: number;
}) {
  const t = useTranslations();
  const [motion] = useState(
    () =>
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  return (
    <Boundary label={t("webglUnavailable")}>
      <Canvas
        key={reset}
        frameloop={motion ? "always" : "demand"}
        dpr={[1, 1.5]}
        camera={{ position: [12, 12, 14], fov: compact ? 39 : 42 }}
        gl={{ antialias: true }}
        aria-label={t("model")}
      >
        <color attach="background" args={["#0c1423"]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 10, 5]} intensity={2.5} />
        <pointLight position={[-4, 4, -3]} color="#7894ff" intensity={25} />
        <Suspense fallback={null}>
          <Store
            occupancy={occupancy}
            cashiers={cashiers}
            shelves={shelves}
            heatmap={heatmap}
            motion={motion}
          />
          <ContactShadows
            frames={1}
            resolution={128}
            position={[0, -0.33, 0]}
            opacity={0.4}
            scale={22}
            blur={2.4}
            far={8}
          />
          <Grid
            position={[0, -0.34, 0]}
            args={[30, 30]}
            cellSize={1}
            cellThickness={0.4}
            cellColor="#253650"
            sectionSize={5}
            sectionThickness={0.6}
            sectionColor="#334766"
            fadeDistance={30}
          />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={!compact}
          minDistance={9}
          maxDistance={26}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={compact && motion}
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </Boundary>
  );
}
