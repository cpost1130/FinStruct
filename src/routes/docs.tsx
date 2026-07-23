import { createFileRoute, Link } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-start";
import { useState } from "react";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/databases",
    desc: "List all databases for the authenticated user. Supports pagination via ?limit=N&offset=M.",
    auth: "X-API-Key header",
  },
  {
    method: "GET",
    path: "/api/v1/databases/:id",
    desc: "Get database schema (fields) and paginated records. Supports ?limit=N&offset=M (max 1000).",
    auth: "X-API-Key header",
  },
  {
    method: "POST",
    path: "/api/v1/databases/:id/records",
    desc: "Create a new record. JSON body validated against the database schema. Max 1MB body.",
    auth: "X-API-Key header",
  },
  {
    method: "PUT",
    path: "/api/v1/databases/:id/records/:recordId",
    desc: "Update an existing record. JSON body validated against the database schema. Max 1MB body.",
    auth: "X-API-Key header",
  },
  {
    method: "DELETE",
    path: "/api/v1/databases/:id/records/:recordId",
    desc: "Delete a record. All IDs must be valid UUIDs.",
    auth: "X-API-Key header",
  },
  {
    method: "GET",
    path: "/api/v1/databases/:id/export",
    desc: "Export all records as CSV download.",
    auth: "X-API-Key header",
  },
];

function DocsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [copied, setCopied] = useState("");

  const copyExample = (example: string) => {
    navigator.clipboard.writeText(example);
    setCopied(example);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white text-sm font-bold shadow-sm">F</span>
            <span className="text-lg font-bold tracking-tight text-gray-900">FinStruct</span>
          </Link>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link to="/dashboard" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Dashboard</Link>
            ) : (
              <Link to="/sign-in" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 pt-28 pb-16">
        <h1 className="text-3xl font-bold text-gray-900">API Reference</h1>
        <p className="mt-2 text-gray-600">
          Programmatic access to your FinStruct databases. Requires a Pro or Team subscription.
        </p>

        {/* Authentication */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900">Authentication</h2>
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">
              All API requests require an API key. Generate one from your{" "}
              <Link to="/dashboard" className="font-semibold text-brand-600 underline">Dashboard</Link> settings.
              Include it in every request via the <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">X-API-Key</code> header
              or as a Bearer token in the <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">Authorization</code> header.
            </p>
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Example</p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
                <code>{`curl -H "X-API-Key: fs_your_api_key_here" \\
  https://finstruct.vercel.app/api/v1/databases`}</code>
              </pre>
              <button onClick={() => copyExample(`curl -H "X-API-Key: fs_your_api_key_here" https://finstruct.vercel.app/api/v1/databases`)} 
                className="mt-2 text-xs text-brand-600 hover:underline">
                {copied ? "Copied!" : "Copy example"}
              </button>
            </div>
          </div>
        </section>

        {/* Rate Limiting */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900">Rate Limiting</h2>
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">
              API requests are rate-limited per API key to ensure fair usage:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
              <li>• <strong>GET requests</strong> — 100 requests per minute</li>
              <li>• <strong>POST / PUT / DELETE requests</strong> — 20 requests per minute</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              Exceeding the limit returns <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">429 Too Many Requests</code> with a <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">Retry-After</code> header (seconds until reset).
            </p>
          </div>
        </section>

        {/* Validation */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900">Input Validation</h2>
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">
              The API validates all inputs and returns descriptive error messages:
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">UUID Validation</h3>
                <p className="mt-1 text-sm text-gray-600">
                  All database IDs and record IDs in URL paths must be valid UUID v4 format.
                  Invalid IDs return <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">400 Bad Request</code>.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Schema Validation (POST/PUT records)</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Record bodies are validated against the database's field schema:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• <strong>Unknown fields</strong> are rejected</li>
                  <li>• <strong>Number fields</strong> must be numeric values</li>
                  <li>• <strong>Currency fields</strong> must be numeric values</li>
                  <li>• <strong>Text fields</strong> must be strings</li>
                  <li>• <strong>Select fields</strong> must be strings (optionally validated against allowed options)</li>
                  <li>• <strong>Boolean fields</strong> must be true/false</li>
                  <li>• <strong>Date fields</strong> must be valid date strings (ISO 8601 or YYYY-MM-DD)</li>
                </ul>
                <p className="mt-2 text-sm text-gray-600">
                  Validation errors return <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">400 Bad Request</code> with a <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">details</code> array listing each error.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Body Size Limit</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Request bodies are limited to <strong>1 MB</strong>. Larger bodies return <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">400 Bad Request</code>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pagination */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900">Pagination</h2>
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">
              GET endpoints that return lists support pagination via query parameters:
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg bg-gray-100 p-4 font-mono text-sm">
              <code className="text-gray-800">
                ?limit=50&offset=0
              </code>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
              <li>• <strong>limit</strong> — Records per page (default: 100, max: 1000)</li>
              <li>• <strong>offset</strong> — Number of records to skip (default: 0)</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              Responses include a <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">pagination</code> object with <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">limit</code>, <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">offset</code>, and <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">total</code> fields.
            </p>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900">Endpoints</h2>
          <div className="mt-4 space-y-4">
            {ENDPOINTS.map((ep) => (
              <div key={ep.path + ep.method} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                    ep.method === "GET" ? "bg-green-100 text-green-800" :
                    ep.method === "POST" ? "bg-blue-100 text-blue-800" :
                    ep.method === "PUT" ? "bg-amber-100 text-amber-800" :
                    "bg-red-100 text-red-800"
                  }`}>{ep.method}</span>
                  <code className="text-sm font-mono text-gray-900">{ep.path}</code>
                </div>
                <p className="mt-3 text-sm text-gray-600">{ep.desc}</p>
                <p className="mt-2 text-xs text-gray-400">Auth: {ep.auth}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Code Examples */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900">Code Examples</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700">List databases (with pagination)</h3>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
                <code>{`curl -H "X-API-Key: fs_xxxx" \\
  "https://finstruct.vercel.app/api/v1/databases?limit=10&offset=0"`}</code>
              </pre>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700">Create a record with schema validation (JavaScript)</h3>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
                <code>{`const res = await fetch("https://finstruct.vercel.app/api/v1/databases/DATABASE_ID/records", {
  method: "POST",
  headers: { "X-API-Key": "fs_xxxx", "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Sample", amount: 1500, category: "Food" }),
});
if (res.status === 400) {
  const err = await res.json();
  console.error("Validation errors:", err.details);
} else {
  const data = await res.json();
  console.log("Created:", data);
}`}</code>
              </pre>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700">Python (with error handling)</h3>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
                <code>{`import requests
headers = {"X-API-Key": "fs_xxxx"}
res = requests.get("https://finstruct.vercel.app/api/v1/databases", headers=headers)
if res.status_code == 429:
    print("Rate limited, retry after", res.headers["Retry-After"], "seconds")
elif res.status_code == 400:
    print("Validation error:", res.json()["details"])
else:
    print(res.json())`}</code>
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
