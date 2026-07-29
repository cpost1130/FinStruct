import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { type ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";

import appCss from "~/styles/app.css?url";

const SITE_URL = "https://finstruct.vercel.app";
const SITE_TITLE = "FinStruct — Build your own financial database. No code required.";
const SITE_DESC =
  "FinStruct lets anyone create a custom financial database in minutes. Drag-and-drop schema builder, auto-generated dashboards, CSV/API import/export. Replace scattered spreadsheets with a single source of truth.";
const OG_IMAGE = `${SITE_URL}/og-image.svg`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESC },
      // Open Graph (Facebook, LinkedIn, Product Hunt)
      { property: "og:title", content: "FinStruct — Build your own financial database" },
      { property: "og:description", content: "Create a custom financial database in minutes — no coding or SQL required. Drag, drop, and done." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FinStruct — Build your own financial database" },
      { name: "twitter:description", content: SITE_DESC },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:creator", content: "@finstruct" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='28' font-size='28'>📊</text></svg>" },
      { rel: "canonical", href: SITE_URL },
    ],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-lg text-gray-600">Page not found</p>
        <a href="/" className="mt-4 inline-block text-brand-600 hover:text-brand-700">
          Go home
        </a>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-lg px-6">
        <h1 className="text-3xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-3 text-gray-600">
          {error instanceof Error ? error.message : "An unexpected error occurred. Please try refreshing the page."}
        </p>
        <a href="/" className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Go home
        </a>
      </div>
    </div>
  ),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
          {children}
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  );
}