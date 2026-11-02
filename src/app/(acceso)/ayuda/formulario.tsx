"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AreaTexto, Aviso, Boton, Campo, Entrada } from "@/components/ui";
import { pedirAyuda, type EstadoAyuda } from "./acciones";

const VACIO: EstadoAyuda = {};

export function FormularioAyuda() {
  const [estado, accion, enviando] = useActionState(pedirAyuda, VACIO);

  if (estado.ok) {
    return (
      <div>
        <Aviso tono="exito">
          Recibimos tu solicitud. El equipo de la convocatoria la revisará y te contactará en el
          correo que escribiste. Si tu cuenta ya existe, es posible que la activen sin que tengas
          que hacer nada más.
        </Aviso>
        <p className="mt-5 text-[13px] text-gris">
          <Link href="/login">Volver a iniciar sesión</Link>
        </p>
      </div>
    );
  }

  const error = (c: EstadoAyuda["campo"]) => (estado.campo === c ? estado.error : undefined);

  return (
    <form action={accion} noValidate>
      <p className="mb-5 text-[13.5px] leading-relaxed text-gris">
        ¿No te llegó el correo de confirmación o no puedes entrar? Antes de escribirnos, revisa tu
        carpeta de spam o correo no deseado. Si no está ahí, déjanos tus datos y el equipo de la
        convocatoria te ayudará con tu cuenta.
      </p>

      {estado.error && !estado.campo && (
        <div className="mb-4">
          <Aviso>{estado.error}</Aviso>
        </div>
      )}

      {/* Campo trampa para bots: fuera de la vista y del orden de tabulación. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="sitio">No llenar</label>
        <input id="sitio" name="sitio" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Campo id="nombre" etiqueta="Nombre completo" error={error("nombre")} className="mb-4">
        <Entrada
          id="nombre"
          name="nombre"
          autoComplete="name"
          required
          placeholder="Nombre Apellido Apellido"
          aria-invalid={estado.campo === "nombre"}
          aria-describedby={estado.campo === "nombre" ? "nombre-error" : undefined}
        />
      </Campo>

      <Campo
        id="email"
        etiqueta="Correo con el que te registraste"
        error={error("email")}
        className="mb-4"
      >
        <Entrada
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="nombre@universidad.mx"
          aria-invalid={estado.campo === "email"}
          aria-describedby={estado.campo === "email" ? "email-error" : undefined}
        />
      </Campo>

      <Campo
        id="mensaje"
        etiqueta="¿Qué está pasando? (opcional)"
        error={error("mensaje")}
        className="mb-5"
      >
        <AreaTexto
          id="mensaje"
          name="mensaje"
          rows={4}
          maxLength={1000}
          placeholder="Ej. Me registré ayer y no me llegó el correo para confirmar mi cuenta."
          aria-invalid={estado.campo === "mensaje"}
          aria-describedby={estado.campo === "mensaje" ? "mensaje-error" : undefined}
        />
      </Campo>

      <Boton type="submit" disabled={enviando} className="w-full py-3.5">
        {enviando ? "Enviando…" : "Enviar solicitud →"}
      </Boton>

      <p className="mt-6 border-t border-linea pt-6 text-[13px] text-gris">
        <Link href="/login">Volver a iniciar sesión</Link>
      </p>
    </form>
  );
}
