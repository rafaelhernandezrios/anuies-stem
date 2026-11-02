"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigeRol } from "@/lib/sesion";
import { emitirToken } from "@/lib/tokens";
import { correoVerificacion } from "@/lib/correo";
import { registrar } from "@/lib/bitacora";

export type ResultadoAyuda = { ok?: boolean; error?: string; resumen?: string };

async function cargar(solicitudId: string) {
  const solicitud = await db.solicitudAyuda.findUnique({ where: { id: solicitudId } });
  if (!solicitud) return null;
  const user = await db.user.findUnique({ where: { email: solicitud.email } });
  return { solicitud, user };
}

async function cerrar(solicitudId: string, actorId: string) {
  await db.solicitudAyuda.update({
    where: { id: solicitudId },
    data: { estado: "atendida", atendidaEn: new Date(), atendidaPorId: actorId },
  });
}

/** Marca el correo como verificado sin pasar por el enlace. Es la salida para
 *  quien de plano no recibe correos (filtros institucionales, bandeja llena).
 *  Quien lo hace asume que confirmó que la persona es dueña del correo. */
export async function activarCuenta(solicitudId: string): Promise<ResultadoAyuda> {
  let actor;
  try {
    actor = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  const r = await cargar(solicitudId);
  if (!r) return { error: "La solicitud ya no existe." };
  if (!r.user) return { error: `No hay ninguna cuenta registrada con ${r.solicitud.email}.` };

  if (!r.user.emailVerifiedAt) {
    await db.user.update({ where: { id: r.user.id }, data: { emailVerifiedAt: new Date() } });
    // El enlace pendiente ya no hace falta.
    await db.token.deleteMany({
      where: { userId: r.user.id, tipo: "verificacion_correo", usadoEn: null },
    });
  }
  await cerrar(solicitudId, actor.id);

  await registrar({
    accion: "usuario.verificado.manual",
    actorId: actor.id,
    entidad: "User",
    entidadId: r.user.id,
    detalle: { email: r.user.email, solicitudId },
  });

  revalidatePath("/admin/ayuda");
  revalidatePath("/admin/usuarios");
  return {
    ok: true,
    resumen: `La cuenta de ${r.user.email} quedó activa. Ya puede iniciar sesión con su contraseña.`,
  };
}

export async function reenviarEnlace(solicitudId: string): Promise<ResultadoAyuda> {
  try {
    await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }

  const r = await cargar(solicitudId);
  if (!r) return { error: "La solicitud ya no existe." };
  if (!r.user) return { error: `No hay ninguna cuenta registrada con ${r.solicitud.email}.` };
  if (r.user.emailVerifiedAt) return { error: "Esa cuenta ya está verificada." };

  const token = await emitirToken(r.user.id, "verificacion_correo");
  const enviado = await correoVerificacion(r.user.email, r.user.nombre.split(/\s+/)[0], token);

  return enviado
    ? { ok: true, resumen: `Se reenvió el enlace de confirmación a ${r.user.email}.` }
    : { error: `No se pudo enviar el correo a ${r.user.email}. Revisa la configuración SMTP.` };
}

export async function marcarAtendida(solicitudId: string): Promise<ResultadoAyuda> {
  let actor;
  try {
    actor = await exigeRol("admin");
  } catch {
    return { error: "Sin permiso." };
  }
  const solicitud = await db.solicitudAyuda.findUnique({ where: { id: solicitudId } });
  if (!solicitud) return { error: "La solicitud ya no existe." };

  await cerrar(solicitudId, actor.id);
  revalidatePath("/admin/ayuda");
  return { ok: true, resumen: `Solicitud de ${solicitud.email} marcada como atendida.` };
}
