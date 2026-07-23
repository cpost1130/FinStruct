import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for getting started.",
    features: ["1 database", "Up to 500 records", "Basic schema builder", "Community support"],
    cta: "Get started free",
    href: "/sign-up",
    highlighted: false,
    current: true,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    desc: "For power users and side-hustlers.",
    features: [
      "Unlimited databases",
      "Unlimited records",
      "CSV export & import",
      "API access",
      "Auto-generated dashboards",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    href: "https://buy.stripe.com/fZu7sK5jF9PC3LvfkveQM05",
    highlighted: true,
    current: false,
  },
  {
    name: "Team",
    price: "$30",
    period: "/mo",
    desc: "For small teams ready to scale.",
    features: [
      "Up to 5 seats",
      "Shared databases & permissions",
      "Team workspaces",
      "Audit log",
      "Data migration assistance",
      "All Pro features",
    ],
    cta: "Upgrade to Team",
    href: "https://buy.stripe.com/eVqbJ08vR9PCfudegreQM06",
    highlighted: false,
    current: false,
  },
];

function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white text-sm font-bold shadow-sm">
            F
          </span>
          <span className="text-lg font-bold tracking-tight text-gray-900">FinStruct</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a href="/#features" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
            Features
          </a>
          <a href="/pricing" className="text-sm font-semibold text-brand-600 transition">
            Pricing
          </a>
          <a href="/#faq" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
            FAQ
          </a>
          <a href="/sign-in" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
            Sign in
          </a>
          <a
            href="/sign-up"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Get started
          </a>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
          <svg className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-6 pb-4 md:hidden">
          <div className="flex flex-col gap-4 pt-4">
            <a href="/#features" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-600">
              Features
            </a>
            <a href="/pricing" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-brand-600">
              Pricing
            </a>
            <a href="/#faq" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-600">
              FAQ
            </a>
            <a href="/sign-in" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-600">
              Sign in
            </a>
            <a
              href="/sign-up"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Get started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white text-xs font-bold">
              F
            </span>
            <span className="text-sm font-bold text-gray-900">FinStruct</span>
          </div>
          <nav className="flex gap-6">
            <a href="/#features" className="text-sm text-gray-500 transition hover:text-gray-900">
              Features
            </a>
            <a href="/pricing" className="text-sm text-brand-600 transition">
              Pricing
            </a>
            <a href="/#faq" className="text-sm text-gray-500 transition hover:text-gray-900">
              FAQ
            </a>
            <a href="/sign-in" className="text-sm text-gray-500 transition hover:text-gray-900">
              Sign in
            </a>
          </nav>
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} FinStruct. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function ComparisonTable() {
  const rows = [
    { feature: "Databases", free: "1", pro: "Unlimited", team: "Unlimited" },
    { feature: "Records", free: "500", pro: "Unlimited", team: "Unlimited" },
    { feature: "Schema builder", free: "Basic", pro: "Advanced", team: "Advanced" },
    { feature: "CSV import/export", free: "—", pro: "✓", team: "✓" },
    { feature: "API access", free: "—", pro: "✓", team: "✓" },
    { feature: "Auto dashboards", free: "—", pro: "✓", team: "✓" },
    { feature: "Team seats", free: "1", pro: "1", team: "Up to 5" },
    { feature: "Permissions", free: "—", pro: "—", team: "✓" },
    { feature: "Audit log", free: "—", pro: "—", team: "✓" },
    { feature: "Priority support", free: "—", pro: "✓", team: "✓" },
    { feature: "Data migration", free: "—", pro: "—", team: "✓" },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-4 font-semibold text-gray-900">Feature</th>
            <th className="px-6 py-4 font-semibold text-gray-900">Free</th>
            <th className="px-6 py-4 font-semibold text-brand-600">Pro</th>
            <th className="px-6 py-4 font-semibold text-gray-900">Team</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.feature} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
              <td className="px-6 py-3 font-medium text-gray-700">{row.feature}</td>
              <td className="px-6 py-3 text-gray-500">{row.free}</td>
              <td className="px-6 py-3 text-gray-500">{row.pro}</td>
              <td className="px-6 py-3 text-gray-500">{row.team}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PricingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Nav />

      <main className="pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-accent-50 px-4 py-1.5 text-xs font-semibold text-accent-700">
              Pricing
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Start free. Upgrade when you need more. No hidden fees.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border p-8 shadow-sm ${
                  tier.highlighted
                    ? "border-brand-200 bg-white shadow-lg shadow-brand-100 ring-2 ring-brand-500"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Badges */}
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                {tier.current && (
                  <span className="absolute -top-3 right-4 rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-700">
                    Current plan
                  </span>
                )}

                <div className="flex flex-1 flex-col">
                  <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.price}</span>
                    <span className="text-sm text-gray-500">{tier.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{tier.desc}</p>

                  <ul className="mt-8 space-y-3 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <a
                      href={tier.href}
                      className={`inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition ${
                        tier.highlighted
                          ? "bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200"
                          : tier.current
                          ? "border border-gray-300 bg-gray-50 text-gray-500 cursor-default"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                      {...(tier.current ? { onClick: (e: React.MouseEvent) => e.preventDefault() } : {})}
                    >
                      {tier.cta}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center sm:text-3xl">
              Full feature comparison
            </h2>
            <p className="mt-2 text-center text-gray-600">
              See exactly what each plan includes.
            </p>
            <div className="mt-8 max-w-4xl mx-auto">
              <ComparisonTable />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
