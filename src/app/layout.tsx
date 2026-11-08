import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";
export const metadata: Metadata = { title: "Biblioteca Digital", description: "Gestión de autores, libros y estadísticas de tu biblioteca" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body><Shell>{children}</Shell></body></html>;
}
