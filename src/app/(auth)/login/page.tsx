import { Suspense } from "react";
import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar · Gym Tracker" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <Dumbbell className="size-10 text-primary" aria-hidden />
        <h1 className="text-2xl font-semibold">Gym Tracker</h1>
        <p className="text-muted-foreground">
          Ingresá tu email y te mandamos un link para entrar.
        </p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
