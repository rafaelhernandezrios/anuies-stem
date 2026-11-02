"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { correoSolicitudAyuda } from "@/lib/correo";

export type EstadoAyuda = { ok?: boolean; error?: string; campo?: "nombre" | "email" | "mensaje" };

const Esquema = z.object({
  nombre: z.string().trim().min(3, "Escribe tu nombre completo.").max(120, "El nombre es muy largo."),
  email: z.string().trim().toLowerCase().email("Escribe un correo válido.").max(160),
  mensaje: z.string().trim().max(1000, "El mensaje no puede pasar de 1000 caracteres.").optional(),
});

/** Ventana en la que una segunda solicitud del mismo correo no genera otra
 *  fila ni otro aviso: evita que alguien inunde la bandeja de administración. */
const VENTANA_MS = 30 * 60_000;

function describirCuenta(user: { emailVerifiedAt: Date | null } | null) {
  if (!user) return "No hay cuenta con ese correo";
  return user.emailVerifiedAt ? "Existe y ya está verificada" : "Existe, sin verificar";
}

/** La respuesta es la misma exista o no la cuenta: el formulario es público y
 *  no debe servir para averiguar qué correos están registrados. */
export async function pedirAyuda(_previo: EstadoAyuda, datos: FormData): Promise<EstadoAyuda> {
  // Campo trampa: invisible para personas, los bots lo llenan.
  if (String(datos.get("sitio") ?? "")) return { ok: true };

  const parseo = Esquema.safeParse({
    nombre: datos.get("nombre"),
    email: datos.get("email"),
    mensaje: datos.get("mensaje") || undefined,
  });
  if (!parseo.success) {
    const primero = parseo.error.issues[0];
    return { error: primero.message, campo: primero.path[0] as EstadoAyuda["campo"] };
  }
  const d = parseo.data;

  const reciente = await db.solicitudAyuda.findFirst({
    where: { email: d.email, creadaEn: { gte: new Date(Date.now() - VENTANA_MS) } },
  });
  if (reciente) return { ok: true };

  await db.solicitudAyuda.create({
    data: { nombre: d.nombre, email: d.email, mensaje: d.mensaje || null },
  });

  const [user, admins] = await Promise.all([
    db.user.findUnique({ where: { email: d.email }, select: { emailVerifiedAt: true } }),
    db.user.findMany({
      where: { rol: "admin", emailVerifiedAt: { not: null } },
      select: { email: true },
    }),
  ]);

  const cuenta = describirCuenta(user);
  await Promise.all(
    admins.map((a) =>
      correoSolicitudAyuda(a.email, {
        nombre: d.nombre,
        email: d.email,
        mensaje: d.mensaje || null,
        cuenta,
      }),
    ),
  );

  return { ok: true };
}
