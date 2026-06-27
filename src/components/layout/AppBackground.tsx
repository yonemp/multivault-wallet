"use client";

import { useEffect, useState } from "react";

const SPOTS = [
  { x: 12, y: 18, size: 6, speed: 0.08 },
  { x: 78, y: 12, size: 4, speed: 0.12 },
  { x: 45, y: 35, size: 8, speed: 0.05 },
  { x: 88, y: 48, size: 5, speed: 0.1 },
  { x: 22, y: 62, size: 7, speed: 0.07 },
  { x: 65, y: 72, size: 4, speed: 0.11 },
  { x: 8, y: 85, size: 5, speed: 0.09 },
  { x: 52, y: 8, size: 3, speed: 0.14 },
  { x: 94, y: 78, size: 6, speed: 0.06 },
  { x: 35, y: 92, size: 4, speed: 0.13 },
];

export function AppBackground() {
  const [scrollY, setScrollY] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(255,255,255,0.9) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 85% 25%, rgba(255,255,255,0.75) 0%, transparent 50%),
            radial-gradient(ellipse 60% 70% at 50% 90%, rgba(47,111,237,0.08) 0%, transparent 45%),
            radial-gradient(ellipse 90% 80% at 70% 60%, rgba(200,204,210,0.6) 0%, transparent 60%),
            linear-gradient(145deg, #b8bcc4 0%, #d5d9e0 35%, #e8ebf0 65%, #c4c8d0 100%)
          `,
        }}
      />

      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            conic-gradient(from 210deg at 30% 40%, transparent 0deg, rgba(255,255,255,0.5) 90deg, transparent 180deg),
            conic-gradient(from 30deg at 75% 65%, transparent 0deg, rgba(47,111,237,0.06) 120deg, transparent 240deg)
          `,
          transform: `translate(${mouse.x * 12}px, ${scrollY * 0.02 + mouse.y * 8}px)`,
          transition: "transform 0.4s ease-out",
        }}
      />

      {SPOTS.map((spot, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            width: spot.size,
            height: spot.size,
            background: "var(--spot)",
            opacity: 0.35 + (i % 3) * 0.1,
            transform: `translate3d(${mouse.x * spot.speed * 30}px, ${scrollY * spot.speed + mouse.y * spot.speed * 20}px, 0)`,
            transition: "transform 0.35s ease-out",
            filter: "blur(0.2px)",
          }}
        />
      ))}
    </div>
  );
}