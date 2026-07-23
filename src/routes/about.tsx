import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Simple nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white text-sm font-bold shadow-sm">
              F
            </span>
            <span className="text-lg font-bold tracking-tight text-gray-900">FinStruct</span>
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Back to home
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          What is <span className="gradient-brand">FinStruct</span>?
        </h1>

        <div className="mt-10 space-y-6 text-lg leading-relaxed text-gray-600">
          <p>
            <strong className="text-gray-900">FinStruct</strong> is a flexible financial database builder designed for people who've outgrown spreadsheets but don't need the complexity of an ERP.
          </p>

          <p>
            We believe financial tracking shouldn't require a degree in accounting or a month-long software implementation. With FinStruct, you define exactly what you need to track — expenses, invoices, investments, budgets — and we handle the structure.
          </p>

          <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">
            Why we built it
          </h2>
          <p>
            Every freelancer, solopreneur, and small team we knew was managing their finances in a mess of spreadsheets — different tabs for different quarters, formulas breaking, files emailed back and forth. The alternatives were either too simple (spreadsheets) or too complex (ERP systems with six-figure price tags).
          </p>
          <p>
            We wanted something in the middle: a tool that gives you the power of a real database with the simplicity of a modern app. So we built it.
          </p>

          <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">
            Who it's for
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-gray-900">Indie freelancers & solopreneurs</strong> who need to track business finances but don't want to hire a bookkeeper or learn QuickBooks.
            </li>
            <li>
              <strong className="text-gray-900">Small teams (2–20 people)</strong> who've outgrown spreadsheets but aren't ready for a full ERP.
            </li>
            <li>
              <strong className="text-gray-900">Power users</strong> — investors, side-hustlers, hobbyists — who want custom financial tracking beyond off-the-shelf apps.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">
            The philosophy
          </h2>
          <p>
            Your financial data belongs to you. We believe in <strong className="text-gray-900">radical data portability</strong> — import from CSV, export to CSV, access via API. No lock-in. No proprietary formats. Your data, your rules.
          </p>
          <p>
            We also believe financial tools should be <strong className="text-gray-900">beautiful and simple</strong>. Not intimidating. Not cluttered. Just clean, functional design that gets out of your way.
          </p>
        </div>

        <div className="mt-16">
          <Link
            to="/sign-up"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-600 px-8 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700"
          >
            Get started free
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} FinStruct. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
