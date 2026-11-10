"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function ErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <TriangleAlert className="size-10 text-destructive" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Algo salió mal</h1>
        <p className="text-sm text-muted-foreground">
          Revisá tu conexión y probá de nuevo.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button size="xl" onClick={() => retry()}>
          Reintentar
        </Button>
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "lg" })}>
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
