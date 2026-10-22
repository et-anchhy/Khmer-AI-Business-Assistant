"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error.digest ?? error);
  }, [error]);

  return (
    <main className="px-4">
      <ErrorState reset={reset} />
    </main>
  );
}
