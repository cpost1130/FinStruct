import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-start";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/payment/success")({
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [status, setStatus] = useState<"upgrading" | "upgraded" | "error">("upgrading");

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const params = new URLSearchParams(window.location.search);
    const tier = params.get("tier") || "pro";

    import("~/db").then(async (mod) => {
      try {
        await mod.upgradeUserTier({ data: { userId: user.id, tier } });
        setStatus("upgraded");
      } catch {
        setStatus("error");
      }
    });
  }, [isLoaded, isSignedIn, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-xl">
        {status === "upgrading" && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Upgrading your account...</h2>
            <p className="mt-2 text-gray-600">Please wait while we activate your subscription.</p>
          </>
        )}
        {status === "upgraded" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Payment Successful!</h2>
            <p className="mt-2 text-gray-600">Your account has been upgraded. You now have access to all features.</p>
            <Link to="/dashboard" className="mt-8 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
              Go to Dashboard
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Something went wrong</h2>
            <p className="mt-2 text-gray-600">We couldn't upgrade your account. Please contact support.</p>
            <Link to="/dashboard" className="mt-8 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
              Back to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}