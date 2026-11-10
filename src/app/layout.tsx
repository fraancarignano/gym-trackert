import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Registro de entrenamientos y progresión por ejercicio",
  applicationName: "Gym Tracker",
  appleWebApp: {
    capable: true,
    title: "Gym",
    // Barra de estado opaca: el contenido arranca debajo y no hace falta
    // compensar el margen superior.
    statusBarStyle: "black",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Para que env(safe-area-inset-bottom) funcione (barra inferior en iPhone).
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      // Algunas extensiones del navegador agregan atributos a <html>.
      suppressHydrationWarning
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
