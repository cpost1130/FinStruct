import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

const slides = [
  {
    icon: "🗂️",
    title: "Build your own financial database",
    desc: "No SQL. No spreadsheets. Design exactly the tracking system you need.",
  },
  {
    icon: "⚡",
    title: "Auto-generated dashboards",
    desc: "Add records and watch charts, totals, and insights build themselves.",
  },
  {
    icon: "🔒",
    title: "Your data, always yours",
    desc: "Export to CSV anytime. Bank-level encryption, no lock-in.",
  },
];

function OnboardingPage() {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const current = slides[idx];
  const isLast = idx === slides.length - 1;

  return (
    <div className="relative flex h-dvh flex-col text-white overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0d5ad0 0%, #116dff 55%, #ED1566 130%)" }}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute bottom-32 -left-20 h-52 w-52 rounded-full bg-white/[0.06]" />

      <div className="flex justify-end px-5 pt-5">
        <button onClick={() => navigate({ to: "/sign-up" })} className="rounded-full px-4 py-1.5 text-sm font-semibold text-white/70 hover:text-white">
          Skip
        </button>
      </div>

      <div key={idx} className="flex flex-1 flex-col items-center justify-center px-8 text-center" style={{ animation: "fadeUp 0.4s ease" }}>
        <div className="mb-7 flex h-[88px] w-[88px] items-center justify-center rounded-[26px] bg-white/15 text-[40px] backdrop-blur-sm">
          {current.icon}
        </div>
        <h1 className="mb-3 text-[26px] font-extrabold leading-tight tracking-tight">{current.title}</h1>
        <p className="max-w-[280px] text-[15px] leading-relaxed text-white/80">{current.desc}</p>
      </div>

      <div className="flex justify-center gap-1.5 pb-5">
        {slides.map((_, i) => (
          <span key={i} className={`rounded-full transition-all ${i === idx ? "h-1.5 w-5 bg-white" : "h-1.5 w-1.5 bg-white/40"}`} />
        ))}
      </div>

      <div className="px-6 pb-7">
        <button
          onClick={() => isLast ? navigate({ to: "/sign-up" }) : setIdx(idx + 1)}
          className="w-full rounded-2xl bg-white py-[14px] text-[15px] font-bold text-brand-700 shadow-lg shadow-black/15 transition active:scale-[0.98]"
        >
          {isLast ? "Get started" : "Next"}
        </button>
      </div>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
