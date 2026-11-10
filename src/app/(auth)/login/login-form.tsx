"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  );
  const linkError = useSearchParams().get("error") === "link";

  if (state.status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-10 text-primary" aria-hidden />
        <p className="text-lg font-medium">Revisá tu email</p>
        <p className="text-muted-foreground">
          Te mandamos un link a <strong>{state.email}</strong>. Abrilo para
          entrar.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="vos@ejemplo.com"
          required
          className="h-12 text-base"
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state.status === "idle" && linkError && (
        <p role="alert" className="text-sm text-destructive">
          El link no es válido o ya venció. Pedí uno nuevo.
        </p>
      )}

      <Button type="submit" size="xl" disabled={pending}>
        {pending ? "Enviando…" : "Enviar magic link"}
      </Button>
    </form>
  );
}
