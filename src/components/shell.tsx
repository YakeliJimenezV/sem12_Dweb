"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icon";
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const links: { href: string; text: string; icon: IconName; active: boolean }[] = [
    { href: "/", text: "Inicio", icon: "home", active: path === "/" },
    { href: "/books", text: "Libros", icon: "book", active: path === "/books" },
    { href: "/#autores", text: "Autores", icon: "users", active: path.startsWith("/authors/") },
    { href: "/#estadisticas", text: "Estadísticas", icon: "chart", active: false },
  ];
  return <div className="app-shell"><aside className="sidebar"><Link href="/" className="brand"><Icon name="book" size={54}/><span>Biblioteca<br/> Digital</span></Link><nav aria-label="Navegación principal">{links.map(link => <Link key={link.text} href={link.href} className={link.active ? "nav-link active" : "nav-link"} aria-current={link.active ? "page" : undefined}><Icon name={link.icon}/>{link.text}</Link>)}</nav><div className="sidebar-footer"><span className="avatar">BD</span><span>Mi biblioteca<small>Colección personal</small></span></div></aside><main className="main-content">{children}</main></div>;
}

