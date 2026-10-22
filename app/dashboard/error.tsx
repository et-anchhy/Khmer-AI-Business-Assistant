"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production the message is replaced by a digest that matches the server log.
    console.error(error.digest ?? error);
  }, [error]);

  return <ErrorState reset={reset} />;
}
