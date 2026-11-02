import Link from "next/link";
import type { Rol } from "@prisma/client";
import { ROLES } from "@/lib/constantes";
import { CerrarSesion } from "./cerrar-sesion";
import { NavLateral } from "./nav-lateral";

/** Destinos por rol. La navegacion se arma de aqui, pero cada pagina vuelve a
 *  comprobar el rol del lado del servidor: esconder un enlace no es una
 *  medida de seguridad. */
export const NAVEGACION: Record<Rol, { href: string; label: string }[]> = {
  applicant: [
    { href: "/dashboard", label: "Mi convocatoria" },
    { href: "/aplicacion/datos", label: "Mi aplicación" },
    { href: "/resultado", label: "Resultado" },
    { href: "/confirmacion", label: "Confirmación" },
  ],
  anuies: [{ href: "/aplicaciones", label: "Aplicaciones" }],
  admin: [
    { href: "/admin", label: "Panel general" },
    { href: "/admin/aplicaciones", label: "Aplicaciones" },
    { href: "/admin/recordatorios", label: "Recordatorios" },
    { href: "/admin/equipos", label: "Equipos Demo Day" },
    { href: "/admin/usuarios", label: "Usuarios y roles" },
    { href: "/admin/ayuda", label: "Solicitudes de ayuda" },
  ],
};

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Shell({
  usuario,
  children,
}: {
  usuario: { nombre: string; rol: Rol };
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col justify-between border-b border-linea bg-superficie lg:w-[252px] lg:flex-none lg:border-b-0 lg:border-r">
        <div>
          <div className="border-b border-linea px-5 py-5">
            <Link href="/" className="no-underline hover:no-underline">
              <div className="font-titulo text-[22px] font-extrabold uppercase leading-[0.95] text-tinta">
                ANUIES<span className="text-rosa">4MX</span>
              </div>
            </Link>
            <div className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-gris">
              Mujeres en STEM · 2026
            </div>
          </div>
          <NavLateral enlaces={NAVEGACION[usuario.rol]} />
        </div>

        <div className="flex items-center gap-3 border-t border-linea px-5 py-4">
          <div className="grid size-[34px] flex-none place-items-center bg-rosa-suave font-mono text-xs font-semibold text-rosa-oscuro">
            {iniciales(usuario.nombre)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-medium">{usuario.nombre}</div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-gris">
              {ROLES[usuario.rol]}
            </div>
          </div>
          <CerrarSesion />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
