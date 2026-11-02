import { requiereRol } from "@/lib/sesion";
import { db } from "@/lib/db";
import { fechaHora } from "@/lib/fechas";
import { Etiqueta, Titulo } from "@/components/ui";
import { GestorAyuda, type FilaAyuda } from "./gestor";

export const metadata = { title: "Solicitudes de ayuda · Administración ANUIES4MX" };

export default async function SolicitudesAyuda() {
  await requiereRol("admin");

  const solicitudes = await db.solicitudAyuda.findMany({
    orderBy: [{ estado: "asc" }, { creadaEn: "desc" }],
    take: 300,
  });

  const correos = [...new Set(solicitudes.map((s) => s.email))];
  const atendioIds = [...new Set(solicitudes.map((s) => s.atendidaPorId).filter(Boolean))] as string[];
  const [usuarios, atendieron] = await Promise.all([
    db.user.findMany({
      where: { email: { in: correos } },
      select: { email: true, nombre: true, rol: true, emailVerifiedAt: true },
    }),
    db.user.findMany({ where: { id: { in: atendioIds } }, select: { id: true, nombre: true } }),
  ]);
  const porCorreo = new Map(usuarios.map((u) => [u.email, u]));
  const nombres = new Map(atendieron.map((u) => [u.id, u.nombre]));

  const filas: FilaAyuda[] = solicitudes.map((s) => {
    const u = porCorreo.get(s.email);
    return {
      id: s.id,
      nombre: s.nombre,
      email: s.email,
      mensaje: s.mensaje,
      pendiente: s.estado === "pendiente",
      creadaEn: fechaHora(s.creadaEn),
      atendida: s.atendidaEn
        ? `${fechaHora(s.atendidaEn)}${s.atendidaPorId ? ` · ${nombres.get(s.atendidaPorId) ?? ""}` : ""}`
        : null,
      cuenta: !u ? "sin_cuenta" : u.emailVerifiedAt ? "verificada" : "sin_verificar",
      nombreCuenta: u?.nombre ?? null,
    };
  });

  return (
    <div className="max-w-[1140px] px-8 pb-16 pt-10">
      <Etiqueta className="tracking-[0.14em]">Administración · Cuentas</Etiqueta>
      <Titulo className="mb-3 mt-1.5 text-[40px]">Solicitudes de ayuda</Titulo>
      <p className="mb-6 max-w-[72ch] text-[13.5px] leading-relaxed text-gris">
        Llegan desde el botón de Ayuda del inicio de sesión. Cada solicitud nueva también se avisa
        por correo a las cuentas de administración. Antes de activar una cuenta a mano, confirma que
        el correo es de la persona que escribe.
      </p>
      <GestorAyuda filas={filas} />
    </div>
  );
}
