/** Sesión en vivo: pantalla completa, sin navegación inferior. */
export default function TrainLayout({ children }: LayoutProps<"/entrenar">) {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      {children}
    </main>
  );
}
