"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isApiUnavailable =
    error.message.includes("Cannot reach API") ||
    error.message.includes("fetch failed");

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 py-16 text-center">
      <h2 className="text-xl font-semibold text-foreground">
        {isApiUnavailable ? "Backend API unavailable" : "Something went wrong"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {isApiUnavailable
          ? "The frontend could not connect to the API at localhost:8000. Start the backend in a separate terminal, then refresh."
          : error.message || "An unexpected error occurred."}
      </p>
      {isApiUnavailable ? (
        <p className="rounded-lg bg-muted px-4 py-2 font-mono text-xs text-muted-foreground">
          cd backend; .\run_dev.ps1
        </p>
      ) : null}
      <Button type="button" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
