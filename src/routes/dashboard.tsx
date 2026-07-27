import { createFileRoute, Navigate, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-start";
import { useState, useEffect } from "react";
import type { getUserDatabases } from "~/db";
import { TEMPLATES } from "~/db";
import { sendWelcomeEmail, sendSignupNotification } from "~/email";

type Database = Awaited<ReturnType<typeof getUserDatabases>>[number];

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const isChildActive = routerState.matches.some((m) => m.routeId === "/dashboard/$databaseId");
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [subscription, setSubscription] = useState<{ tier: string }>({ tier: "free" });
  const [dbLimit, setDbLimit] = useState<{ allowed: boolean; current: number; limit: number }>({ allowed: true, current: 0, limit: 1 });
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      loadData();
    }
  }, [isLoaded, isSignedIn, user]);

  // Check for first-visit welcome banner (only once localStorage is available)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("finstruct_welcome_dismissed");
      setWelcomeDismissed(dismissed === "true");
    }
  }, []);

  const dismissWelcome = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("finstruct_welcome_dismissed", "true");
    }
    setWelcomeDismissed(true);
  };

  const loadData = async () => {
    const mod = await import("~/db");
    try {
      // Initialize schema if this is the first-ever request
      try {
        await mod.initSchema({ data: {} });
      } catch (e) {
        console.error("Failed to init schema:", e);
      }

      // Ensure the user exists in the database (first-time signups from Clerk)
      if (user) {
        try {
          const result = await mod.upsertUser({
            data: {
              id: user.id,
              email: user.primaryEmailAddress?.emailAddress || "",
              name: user.fullName || user.firstName || undefined,
            },
          });
          // Fire welcome + notification emails for brand-new signups
          if (result.isNewUser) {
            const email = user.primaryEmailAddress?.emailAddress || "";
            const name = user.fullName || user.firstName || undefined;
            sendWelcomeEmail(email, name).catch(() => {});
            sendSignupNotification(email, name).catch(() => {});
          }
        } catch (e) {
          console.error("Failed to upsert user:", e);
        }
      }

      const [result, sub, limit] = await Promise.all([
        mod.getUserDatabases({ data: { userId: user!.id } }),
        mod.getUserSubscription({ data: { userId: user!.id } }),
        mod.checkDatabaseLimit({ data: { userId: user!.id } }),
      ]);
      setDatabases(result);
      setSubscription(sub);
      setDbLimit(limit);
    } catch (e) {
      console.error("Failed to load:", e);
    }
    setLoading(false);
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    if (!user) return;
    setCreatingTemplate(templateId);
    const mod = await import("~/db");
    try {
      // Ensure schema is initialized
      await mod.initSchema({ data: {} }).catch(() => {});
      const result = await mod.createDatabaseFromTemplate({ data: { userId: user.id, templateId } });
      setDatabases([{ ...result, description: result.description || "" }, ...databases]);
      setShowTemplates(false);
      console.log("Template created, id:", result.id);
      navigate({ to: `/dashboard/${result.id}` }).catch((e: unknown) => {
        console.error("Navigate failed:", e);
      });
    } catch (e) {
      console.error("Failed to create from template:", e);
      alert("Error: " + (e instanceof Error ? e.message : String(e)));
    }
    setCreatingTemplate(null);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    const mod = await import("~/db");
    const result = await mod.createDatabase({ data: { userId: user.id, name: newName.trim(), description: newDesc.trim() } });
    setDatabases([{ ...result, description: result.description || "" }, ...databases]);
    setNewName("");
    setNewDesc("");
    setShowCreateModal(false);
    setDbLimit({ ...dbLimit, current: dbLimit.current + 1 });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user || !confirm("Delete this database permanently?")) return;
    const mod = await import("~/db");
    await mod.deleteDatabase({ data: { databaseId: id, userId: user.id } });
    setDatabases(databases.filter((d) => d.id !== id));
  };

  const openApiKeys = async () => {
    setNewKeyName("");
    setGeneratedKey("");
    const mod = await import("~/db");
    const keys = await mod.listApiKeys({ data: { userId: user!.id } });
    setApiKeys(keys);
    setShowApiKeys(true);
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim() || !user) return;
    const mod = await import("~/db");
    const result = await mod.generateApiKey({ data: { userId: user.id, name: newKeyName.trim() } });
    setGeneratedKey(result.rawKey);
    const keys = await mod.listApiKeys({ data: { userId: user.id } });
    setApiKeys(keys);
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!user || !confirm("Revoke this API key? Applications using it will lose access.")) return;
    const mod = await import("~/db");
    await mod.revokeApiKey({ data: { userId: user.id, keyId } });
    const keys = await mod.listApiKeys({ data: { userId: user.id } });
    setApiKeys(keys);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  if (isChildActive) {
    return <Outlet />;
  }

  const canCreate = dbLimit.allowed || subscription.tier !== "free";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white text-sm font-bold shadow-sm">F</span>
            <span className="text-lg font-bold tracking-tight text-gray-900">FinStruct</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900">
              {subscription.tier === "free" ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Free Plan</span>
              ) : subscription.tier === "pro" ? (
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">Pro Plan</span>
              ) : (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">Team Plan</span>
              )}
            </Link>
            <span className="text-sm text-gray-600">{user.primaryEmailAddress?.emailAddress}</span>
            <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900">Home</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        {/* First-visit welcome banner */}
        {!welcomeDismissed && databases.length === 0 && !loading && (
          <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👋</span>
              <p className="text-sm font-medium text-brand-800">
                Welcome to FinStruct! Start by picking a template or creating a blank database.
              </p>
            </div>
            <button
              onClick={dismissWelcome}
              className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-brand-500 hover:bg-brand-100 hover:text-brand-700 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Databases</h1>
            <p className="mt-1 text-sm text-gray-600">
              {subscription.tier === "free"
                ? `Free plan: ${databases.length}/1 database used`
                : `${databases.length} database${databases.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => {
              if (!canCreate) {
                alert("Free plan is limited to 1 database. Upgrade to Pro for unlimited databases.");
                return;
              }
              setShowCreateModal(true);
            }}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            + New Database
          </button>
        </div>

        {subscription.tier === "free" && databases.length >= 1 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-amber-800">
                  You've reached the free plan limit. <Link to="/pricing" className="font-semibold underline hover:text-amber-900">Upgrade to Pro</Link> to create unlimited databases.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            </div>
          ) : databases.length === 0 && !showTemplates ? (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-300 py-20 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Welcome to FinStruct!</h3>
              <p className="mt-1 text-sm text-gray-500">Choose a template to get started instantly, or create a blank database from scratch.</p>
              <div className="mt-6 flex items-center justify-center gap-4">
                <button onClick={() => setShowTemplates(true)} className="inline-flex items-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
                  Start from Template
                </button>
                <button onClick={() => {
                  if (!canCreate) {
                    alert("Free plan is limited to 1 database. Upgrade to Pro for unlimited databases.");
                    return;
                  }
                  setShowCreateModal(true);
                }} className="inline-flex items-center rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                  Blank Database
                </button>
              </div>
            </div>
          ) : (
            databases.map((db) => (
              <Link
                key={db.id}
                to={`/dashboard/${db.id}`}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{db.name}</h3>
                    {db.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{db.description}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(db.id, e)}
                    className="ml-2 flex-shrink-0 rounded-lg p-1.5 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    title="Delete database"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="inline-flex items-center rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                    Open
                  </span>
                  <span className="text-xs text-gray-400">
                    Created {new Date(db.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Template Picker */}
        {showTemplates && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Choose a Template</h2>
                <p className="mt-1 text-sm text-gray-500">Start with a pre-built database — schema and sample data included.</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="text-sm font-medium text-gray-500 hover:text-gray-900">Skip</button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((t) => (
                <div key={t.id} className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-brand-300">
                  <div className="text-3xl">{t.icon}</div>
                  <h3 className="mt-3 text-lg font-semibold text-gray-900">{t.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {t.fields.map((f: any) => (
                      <span key={f.name} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{f.name}</span>
                    ))}
                  </div>
                  <div className="mt-4 text-xs text-gray-400">{t.records.length} sample records</div>
                  <button onClick={() => handleCreateFromTemplate(t.id)} disabled={creatingTemplate === t.id}
                    className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50">
                    {creatingTemplate === t.id ? "Creating..." : "Use This Template"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Keys Section */}
        {subscription.tier !== "free" && (
          <div className="mt-12">
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Programmatic access to your databases.{" "}
                    <Link to="/docs" className="font-semibold text-brand-600 underline">View API docs</Link>
                  </p>
                </div>
                <button
                  onClick={openApiKeys}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                >
                  Manage Keys
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Key Modal */}
        {showApiKeys && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">API Keys</h2>
                <button onClick={() => { setShowApiKeys(false); setGeneratedKey(""); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Generated key flash */}
              {generatedKey ? (
                <div className="mt-4">
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-green-800">Key generated successfully!</p>
                    </div>
                    <p className="mt-1 text-xs text-green-700">Copy it now — it won't be shown again.</p>
                    <div className="mt-3 flex items-center gap-2">
                      <pre className="flex-1 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-green-400 select-all font-mono">{generatedKey}</pre>
                      <button
                        onClick={() => copyToClipboard(generatedKey)}
                        className="flex-shrink-0 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => { setGeneratedKey(""); setNewKeyName(""); }}
                    className="mt-3 text-sm text-brand-600 hover:underline"
                  >
                    Generate another key
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {/* Generate new key */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Production API"
                      className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      onKeyDown={(e) => { if (e.key === "Enter") handleGenerateKey(); }}
                    />
                    <button
                      onClick={handleGenerateKey}
                      disabled={!newKeyName.trim()}
                      className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                    >
                      Generate
                    </button>
                  </div>

                  {/* Key list */}
                  {apiKeys.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center">
                      <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No API keys yet. Generate one above.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {apiKeys.map((key: any) => (
                        <div
                          key={key.id}
                          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{key.name}</p>
                              {key.revoked && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Revoked</span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">
                              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">{key.key_prefix}...</code>
                              {" "}— Created {new Date(key.created_at).toLocaleDateString()}
                              {key.last_used_at
                                ? ` — Last used ${new Date(key.last_used_at).toLocaleDateString()}`
                                : " — Never used"}
                            </p>
                          </div>
                          {!key.revoked && (
                            <button
                              onClick={() => handleRevokeKey(key.id)}
                              className="ml-3 flex-shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <h2 className="text-xl font-bold text-gray-900">Create Database</h2>
              <p className="mt-1 text-sm text-gray-500">Give your new database a name and optional description.</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Business Expenses"
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="What will this database track?"
                    rows={3}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}