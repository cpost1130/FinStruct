import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  backTo?: string;
  hideTabs?: boolean;
  onFabClick?: () => void;
};

function AppShell({ children, backTo, hideTabs, onFabClick }: AppShellProps) {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const pathname = routerState.location.pathname;
  const isDetailView = pathname.includes("/dashboard/");

  const tabs = [
    { label: "Home", href: "/dashboard", icon: "📊" },
    { label: "Templates", href: "/dashboard", icon: "📋" },
    { label: "Settings", href: "/settings", icon: "⚙️" },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-50">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-2">
          {backTo || isDetailView ? (
            <button
              onClick={() => backTo ? navigate({ to: backTo }) : (typeof window !== "undefined" && window.history.back())}
              className="mr-1 flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-600"
            >
              ←
            </button>
          ) : null}
          <img src="/icon.svg" alt="FinStruct" className="h-8 w-8 rounded-lg" />
          {!isDetailView && <span className="text-[15px] font-bold tracking-tight text-gray-900">FinStruct</span>}
        </div>
        {!isDetailView && <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-brand-50 text-sm font-bold text-brand-600">A</div>}
      </header>

      <main className="flex-1">{children}</main>

      {(!hideTabs && !isDetailView) && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white safe-area-bottom">
          <div className="mx-auto flex max-w-lg">
            {tabs.map((tab) => {
              const isActive = tab.href === "/dashboard"
                ? pathname.startsWith("/dashboard") && tab.label === "Home"
                : pathname.startsWith(tab.href);
              return (
                <Link key={tab.label} to={tab.href}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px] font-bold transition-colors ${isActive ? "text-brand-600" : "text-gray-400"}`}
                >
                  <span className="text-lg leading-none">{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {isDetailView && !hideTabs && onFabClick && (
        <button
          onClick={onFabClick}
          className="fixed bottom-6 right-4 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent-500 text-white text-2xl shadow-lg shadow-accent-500/30 transition active:scale-95"
          style={{ boxShadow: "0 8px 24px rgba(237,21,102,0.35)" }}
        >+</button>
      )}
    </div>
  );
}

export default AppShell;
