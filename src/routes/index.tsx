import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

// ─── Types ───────────────────────────────────────────────────────────────
type PricingPlan = {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  highlighted: boolean;
};

type FAQ = {
  q: string;
  a: string;
};

// ─── Data ────────────────────────────────────────────────────────────────
const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for getting started.",
    features: ["1 database", "Up to 500 records", "Basic schema builder", "Community support"],
    cta: "Get started free",
    highlighted: false,
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
    cta: "Start Pro trial",
    highlighted: true,
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
    cta: "Start Team trial",
    highlighted: false,
  },
];

const faqs: FAQ[] = [
  {
    q: "Do I need to know SQL or coding to use FinStruct?",
    a: "Not at all. FinStruct's drag-and-drop schema builder lets you design your database visually — no SQL required. If you ever want to dig deeper, we provide API access on Pro plans for custom integrations.",
  },
  {
    q: "What kind of data can I track?",
    a: "Anything financial. Personal budgets, business expenses, investment portfolios, invoice tracking, tax records — you name it. You define the fields, we provide the structure.",
  },
  {
    q: "Can I import data from spreadsheets?",
    a: "Yes. FinStruct supports CSV import, so you can migrate your existing spreadsheets in minutes. We also offer data migration assistance on Team plans.",
  },
  {
    q: "How is this different from QuickBooks or an ERP?",
    a: "FinStruct is a flexible database builder, not an accounting app. You design exactly the tracking system you need — unlike rigid off-the-shelf software — without the complexity or cost of an ERP.",
  },
  {
    q: "Can I share my database with my team?",
    a: "Yes. Our Team plan includes shared databases, role-based permissions, and workspaces so everyone stays in sync. Upgrade anytime.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use encryption at rest and in transit, regular backups, and strict access controls. Your financial data belongs to you.",
  },
  {
    q: "Can I export my data if I leave?",
    a: "Yes — your data is yours. Export to CSV or via our API at any time, even on the Free plan. No lock-in.",
  },
  {
    q: "What if I need help getting started?",
    a: "Pro plans include priority support. Team plans include data migration assistance. We're here to help you succeed.",
  },
];

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    title: "Drag-and-drop schema builder",
    desc: "Design your database visually. Add fields, set types, create relationships — all without writing a single line of code or SQL.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Auto-generated dashboards",
    desc: "Get instant visual insights into your financial data. Charts, summaries, and key metrics — generated automatically from your schema.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    title: "CSV import & export",
    desc: "Migrate from spreadsheets in minutes or export your data anytime. Your data in, your data out — always under your control.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "API access",
    desc: "Connect your FinStruct database to your other tools. REST API with full CRUD support — available on Pro plans and above.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Team sharing & permissions",
    desc: "Share databases with your team, set role-based permissions, and collaborate in real time. Perfect for small teams.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    title: "Single source of truth",
    desc: "Replace scattered spreadsheets and ad-hoc tracking. One database, everyone on the same page, always up to date.",
  },
];

function FAQItem({ q, a }: FAQ) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left transition hover:text-brand-600"
      >
        <span className="text-base font-medium text-gray-900">{q}</span>
        <span className={`ml-6 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="pb-5 pr-12">
          <p className="text-base leading-relaxed text-gray-600">{a}</p>
        </div>
      )}
    </div>
  );
}

function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white text-sm font-bold shadow-sm">
            F
          </span>
          <span className="text-lg font-bold tracking-tight text-gray-900">FinStruct</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
            Features
          </a>
          <a href="/pricing" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
            Pricing
          </a>
          <a href="#faq" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
            FAQ
          </a>
          <a href="mailto:finstruct-2462085a@ctomail.io" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
            Contact
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

        {/* Mobile toggle */}
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-6 pb-4 md:hidden">
          <div className="flex flex-col gap-4 pt-4">
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-600">
              Features
            </a>
            <a href="/pricing" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-600">
              Pricing
            </a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-600">
              FAQ
            </a>
            <a href="mailto:finstruct-2462085a@ctomail.io" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-600">
              Contact
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

function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-brand-50/60 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-accent-50/40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
          <span className="flex h-1.5 w-1.5 rounded-full bg-brand-500" />
          Now in public beta
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
          Build your own{" "}
          <span className="gradient-brand">financial database</span>
          <br />
          in minutes. No code.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
          FinStruct lets anyone create a custom financial tracking system — no SQL, no
          spreadsheets, no headaches. Drag, drop, and done.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/sign-up"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-600 px-8 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 hover:shadow-xl"
          >
            Start building free
          </a>
          <a
            href="#features"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-8 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            See how it works
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-16 border-t border-gray-100 pt-8">
          <p className="text-sm font-medium text-gray-500">
            Replace scattered spreadsheets with a single source of truth
          </p>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="border-t border-gray-100 bg-gray-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
            Features
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to track your finances
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From schema design to dashboards — all the tools you need in one place.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md hover:border-brand-100"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
                {f.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-accent-50 px-4 py-1.5 text-xs font-semibold text-accent-700">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-6">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 shadow-sm ${
                plan.highlighted
                  ? "border-brand-200 bg-white shadow-lg shadow-brand-100 ring-2 ring-brand-500"
                  : "border-gray-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{plan.desc}</p>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8">
                <a
                  href="/sign-up"
                  className={`inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition ${
                    plan.highlighted
                      ? "bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          All plans include community support. Priority support on Pro. Data migration assistance on Team.
        </p>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="border-t border-gray-100 bg-gray-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to know about FinStruct.
          </p>
        </div>

        <div className="mt-12 divide-y divide-gray-200">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="cta" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-16 text-center shadow-xl sm:px-16">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to build your financial database?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
            Join thousands of freelancers, solopreneurs, and small teams who've replaced scattered spreadsheets with a single source of truth.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/sign-up"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50"
            >
              Get started free →
            </a>
          </div>
          <p className="mt-4 text-xs text-brand-200">No credit card required. Free plan included forever.</p>
        </div>
      </div>
    </section>
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
            <a href="#features" className="text-sm text-gray-500 transition hover:text-gray-900">
              Features
            </a>
            <a href="/pricing" className="text-sm text-gray-500 transition hover:text-gray-900">
              Pricing
            </a>
            <a href="#faq" className="text-sm text-gray-500 transition hover:text-gray-900">
              FAQ
            </a>
            <a href="mailto:finstruct-2462085a@ctomail.io" className="text-sm text-gray-500 transition hover:text-gray-900">
              Contact us
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

function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Nav />
      <Hero />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
