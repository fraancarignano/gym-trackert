import { Dumbbell, LogOut } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { signOut } from "./actions";

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Inicio"
        action={
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon-lg" aria-label="Cerrar sesión">
              <LogOut />
            </Button>
          </form>
        }
      />
      <EmptyState
        icon={Dumbbell}
        title="Todavía no entrenaste"
        description="Cuando tengas rutinas, vas a poder empezar a entrenar desde acá."
      />
    </>
  );
}
