import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-start";
import { useState, useEffect } from "react";

type AnalyticsData = {
  today: number;
  week: number;
  allTime: number;
  topReferrers: { source: string; count: number }[];
  topPages: { path: string; count: number }[];
  viewsByHour: { hour: string; count: number }[];
};

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadAnalytics();
    }
  }, [isLoaded, isSignedIn]);

  const loadAnalytics = async () => {
    try {
      const { getAnalyticsSummary } = await import("~/db");
      const result = await getAnalyticsSummary({ data: {} });
      setData(result as AnalyticsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    }
    setLoading(false);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  const formatHour = (hour: string) => {
    try {
      const d = new Date(hour);
      return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })
        + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } catch {
      return hour;
    }
  };

  const maxReferrerCount = data?.topReferrers?.[0]?.count ?? 1;
  const maxPageCount = data?.topPages?.[0]?.count ?? 1;
  const maxHourCount = data?.viewsByHour?.[0]?.count ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white text-sm font-bold shadow-sm">F</span>
            <span className="text-lg font-bold tracking-tight text-gray-900">FinStruct</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900">Dashboard</a>
            <span className="text-sm text-gray-600">{user?.primaryEmailAddress?.emailAddress}</span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Public page views for finstruct.correct-counts.com
            </p>
          </div>
          <button
            onClick={loadAnalytics}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
          </div>
        ) : data ? (
          <>
            {/* Count cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <p className="text-sm font-medium text-gray-500">Today</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{data.today}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <p className="text-sm font-medium text-gray-500">This Week</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{data.week}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <p className="text-sm font-medium text-gray-500">All Time</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{data.allTime}</p>
              </div>
            </div>

            {/* Top referrers + Top pages side by side */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Referrers */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Referrers (7 days)</h2>
                {data.topReferrers.length === 0 ? (
                  <p className="text-sm text-gray-500">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.topReferrers.map((r) => (
                      <div key={r.source}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 truncate max-w-[240px]" title={r.source}>
                            {r.source === "Direct" ? "Direct / No Referrer" : r.source.replace(/^https?:\/\//, "").replace(/\/.*/, "")}
                          </span>
                          <span className="text-gray-500">{r.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-500 transition-all"
                            style={{ width: `${Math.max((r.count / maxReferrerCount) * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top pages */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Pages (7 days)</h2>
                {data.topPages.length === 0 ? (
                  <p className="text-sm text-gray-500">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.topPages.map((p) => (
                      <div key={p.path}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{p.path}</span>
                          <span className="text-gray-500">{p.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent-500 transition-all"
                            style={{ width: `${Math.max((p.count / maxPageCount) * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Views by hour */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Views by Hour (last 48h)</h2>
              {data.viewsByHour.length === 0 ? (
                <p className="text-sm text-gray-500">No data yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-4 font-medium text-gray-500">Time</th>
                        <th className="text-left py-2 pr-4 font-medium text-gray-500">Views</th>
                        <th className="text-left py-2 font-medium text-gray-500 w-full"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.viewsByHour.map((h) => (
                        <tr key={h.hour} className="border-b border-gray-50">
                          <td className="py-2 pr-4 whitespace-nowrap text-gray-700">{formatHour(h.hour)}</td>
                          <td className="py-2 pr-4 text-gray-900 font-medium">{h.count}</td>
                          <td className="py-2">
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-brand-400 transition-all"
                                style={{ width: `${Math.max((h.count / maxHourCount) * 100, 2)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
