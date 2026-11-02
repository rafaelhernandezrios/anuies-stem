"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Aviso, Boton, BotonEnlace, Campo, Entrada } from "@/components/ui";
import { iniciarSesion, type EstadoLogin } from "./acciones";

const INICIAL: EstadoLogin = {};

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, INICIAL);

  return (
    <form action={accion} noValidate>
      {estado.error && (
        <div className="mb-5">
          <Aviso>
            {estado.error}
            {estado.sinVerificar && (
              <>
                {" "}
                ¿No te llega? <Link href="/ayuda">Pide ayuda</Link>.
              </>
            )}
          </Aviso>
        </div>
      )}

      <Campo
        id="email"
        etiqueta="Correo institucional"
        error={estado.campo === "email" ? estado.error : undefined}
        className="mb-4"
      >
        <Entrada
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="nombre@universidad.mx"
          aria-invalid={estado.campo === "email"}
          aria-describedby={estado.campo === "email" ? "email-error" : undefined}
        />
      </Campo>

      <Campo
        id="password"
        etiqueta="Contraseña"
        error={estado.campo === "password" ? estado.error : undefined}
        className="mb-3"
      >
        <Entrada
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          aria-invalid={estado.campo === "password"}
          aria-describedby={estado.campo === "password" ? "password-error" : undefined}
        />
      </Campo>

      <div className="mb-6 flex items-center justify-between gap-3 text-[12.5px]">
        <label className="flex items-center gap-2 text-gris">
          <input type="checkbox" name="recordar" className="accent-rosa" /> Mantener sesión
        </label>
        <Link href="/recuperar">¿Olvidaste tu contraseña?</Link>
      </div>

      <Boton type="submit" disabled={enviando} className="w-full py-3.5">
        {enviando ? "Entrando…" : "Entrar →"}
      </Boton>

      <div className="mt-6 border-t border-linea pt-6 text-[13px] text-gris">
        ¿Aún no tienes cuenta? <Link href="/registro">Crea tu registro</Link>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-[12.5px] text-gris">
        <span>¿No te llegó el correo de confirmación?</span>
        <BotonEnlace href="/ayuda" variante="secundario" className="flex-none px-4 py-2">
          Ayuda
        </BotonEnlace>
      </div>
      <p className="mt-3.5 font-mono text-[10.5px] leading-relaxed text-gris">
        Acceso de comité y ANUIES con las mismas credenciales;
        <br />
        el rol define la vista.
      </p>
    </form>
  );
}
