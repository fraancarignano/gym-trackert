import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function PageHeader({
  title,
  action,
  backHref,
  backLabel = "Volver",
}: {
  title: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="mb-6 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1">
        {backHref && (
          <Link
            href={backHref}
            aria-label={backLabel}
            className={buttonVariants({ variant: "ghost", size: "icon-lg", className: "-ml-2" })}
          >
            <ChevronLeft className="size-6" />
          </Link>
        )}
        <h1 className="truncate text-2xl font-semibold">{title}</h1>
      </div>
      {action}
    </header>
  );
}
