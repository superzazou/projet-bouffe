"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <p className="text-stone-700 text-sm">Une erreur est survenue.</p>
      <button
        onClick={reset}
        className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-stone-500 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
