"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { db } from "@/lib/db";

const Esquema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

export type EstadoLogin = {
  error?: string;
  campo?: "email" | "password";
  sinVerificar?: boolean;
};

export async function iniciarSesion(
  _previo: EstadoLogin,
  datos: FormData,
): Promise<EstadoLogin> {
  const parseo = Esquema.safeParse({
    email: datos.get("email"),
    password: datos.get("password"),
  });

  if (!parseo.success) {
    const primero = parseo.error.issues[0];
    return { error: primero.message, campo: primero.path[0] as "email" | "password" };
  }

  const { email, password } = parseo.data;

  // Se distingue el correo sin verificar del password incorrecto para poder
  // ofrecer el reenvio del enlace. No revela si el correo existe cuando la
  // cuenta si esta verificada: ahi el mensaje es siempre el generico.
  const user = await db.user.findUnique({ where: { email }, select: { emailVerifiedAt: true } });
  if (user && !user.emailVerifiedAt) {
    return {
      error:
        "Tu correo aún no está verificado. Revisa tu bandeja o pide un enlace nuevo.",
      campo: "email",
      sinVerificar: true,
    };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (e) {
    // signIn lanza la redireccion de Next cuando tiene exito: hay que dejarla pasar.
    if (e instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos.", campo: "password" };
    }
    throw e;
  }

  return {};
}
