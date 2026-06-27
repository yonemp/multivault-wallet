"use client";

export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[var(--bg-base)]" />

      <div
        className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(82,111,255,0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(0,192,118,0.2) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(153,69,255,0.2) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(11,11,15,0.4) 100%)",
        }}
      />
    </div>
  );
}