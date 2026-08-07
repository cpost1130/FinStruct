import { createFileRoute } from "@tanstack/react-router";
import AppShell from "~/components/AppShell";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const settingLinks = [
  { icon: "👤", label: "Profile", href: "#" },
  { icon: "🔔", label: "Notifications", href: "#" },
  { icon: "🔑", label: "API keys", href: "/docs" },
  { icon: "📤", label: "Export data (CSV)", href: "#" },
  { icon: "💬", label: "Help & support", href: "#" },
];

function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-5 px-4 pt-4 pb-24">
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">Settings</h1>
        <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-base font-bold text-white">A</div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-gray-900">Account Owner</p>
            <p className="text-[13px] text-gray-500">you@email.com</p>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 p-4 shadow-sm">
          <span className="rounded-full bg-brand-600/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-brand-700">FREE PLAN</span>
          <p className="mt-2 mb-3 text-[13px] text-gray-600">1/1 databases · 0/100 records used</p>
          <button className="rounded-full bg-gray-900 px-5 py-2 text-xs font-semibold text-white">Upgrade</button>
        </div>
        <div className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          {settingLinks.map((link) => (
            <a key={link.label} href={link.href} className="flex items-center gap-3.5 px-4 py-3.5 transition hover:bg-gray-50">
              <span className="text-lg">{link.icon}</span>
              <span className="flex-1 text-[15px] font-medium text-gray-900">{link.label}</span>
              <span className="text-sm text-gray-300">›</span>
            </a>
          ))}
        </div>
        <button onClick={() => { if (typeof window !== "undefined") window.location.href = "/onboarding"; }} className="w-full rounded-2xl border-2 border-red-300 bg-transparent py-3.5 text-[15px] font-semibold text-red-500 transition hover:bg-red-50">
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
