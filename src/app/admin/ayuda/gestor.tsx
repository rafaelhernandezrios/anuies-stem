"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Boton, Chip, Etiqueta, Tarjeta, Vacio } from "@/components/ui";
import { activarCuenta, marcarAtendida, reenviarEnlace, type ResultadoAyuda } from "./acciones";

export type FilaAyuda = {
  id: string;
  nombre: string;
  email: string;
  mensaje: string | null;
  pendiente: boolean;
  creadaEn: string;
  atendida: string | null;
  cuenta: "sin_cuenta" | "sin_verificar" | "verificada";
  nombreCuenta: string | null;
};

const CUENTA = {
  sin_cuenta: { texto: "Sin cuenta", tono: "gris" },
  sin_verificar: { texto: "Sin verificar", tono: "rosa" },
  verificada: { texto: "Verificada", tono: "teal" },
} as const;

export function GestorAyuda({ filas }: { filas: FilaAyuda[] }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ tono: "exito" | "error"; texto: string } | null>(null);

  function ejecutar(accion: () => Promise<ResultadoAyuda>) {
    iniciar(async () => {
      const r = await accion();
      setMensaje(
        r.error ? { tono: "error", texto: r.error } : { tono: "exito", texto: r.resumen ?? "Listo." },
      );
      router.refresh();
    });
  }

  const abiertas = filas.filter((f) => f.pendiente);
  const cerradas = filas.filter((f) => !f.pendiente);

  return (
    <div className="grid gap-6">
      {mensaje && <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso>}

      <section>
        <Etiqueta className="mb-3 text-rosa">Pendientes · {abiertas.length}</Etiqueta>
        {abiertas.length === 0 ? (
          <Vacio titulo="Nada pendiente" detalle="Cuando alguien pida ayuda desde el login, aparecerá aquí." />
        ) : (
          <div className="grid gap-3">
            {abiertas.map((f) => (
              <Tarjeta key={f.id} className="p-5!">
                <Cabecera f={f} />
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {f.cuenta === "sin_verificar" && (
                    <>
                      <Boton disabled={pendiente} onClick={() => ejecutar(() => activarCuenta(f.id))}>
                        Activar cuenta
                      </Boton>
                      <Boton
                        variante="secundario"
                        disabled={pendiente}
                        onClick={() => ejecutar(() => reenviarEnlace(f.id))}
                      >
                        Reenviar enlace
                      </Boton>
                    </>
                  )}
                  <Boton
                    variante="secundario"
                    disabled={pendiente}
                    onClick={() => ejecutar(() => marcarAtendida(f.id))}
                  >
                    Marcar atendida
                  </Boton>
                </div>
                {f.cuenta === "sin_cuenta" && (
                  <p className="mt-3 text-[12.5px] text-gris">
                    No hay cuenta con este correo. Puede que lo haya escrito distinto al registrarse
                    o que aún no se registre: contáctala para confirmarlo.
                  </p>
                )}
                {f.cuenta === "verificada" && (
                  <p className="mt-3 text-[12.5px] text-gris">
                    La cuenta ya está verificada. Si no puede entrar, puede cambiar su contraseña
                    desde “¿Olvidaste tu contraseña?”.
                  </p>
                )}
              </Tarjeta>
            ))}
          </div>
        )}
      </section>

      {cerradas.length > 0 && (
        <section>
          <Etiqueta className="mb-3">Atendidas · {cerradas.length}</Etiqueta>
          <div className="grid gap-3">
            {cerradas.map((f) => (
              <Tarjeta key={f.id} className="p-5! opacity-80">
                <Cabecera f={f} />
                {f.atendida && (
                  <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-gris">
                    Atendida · {f.atendida}
                  </p>
                )}
              </Tarjeta>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Cabecera({ f }: { f: FilaAyuda }) {
  const c = CUENTA[f.cuenta];
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[14.5px] font-medium">{f.nombre}</div>
          <div className="mt-0.5 break-all font-mono text-[12px] text-gris">{f.email}</div>
          {f.nombreCuenta && f.nombreCuenta !== f.nombre && (
            <div className="mt-1 text-[12px] text-gris">Registrada como: {f.nombreCuenta}</div>
          )}
        </div>
        <div className="flex flex-none items-center gap-2.5">
          <Chip tono={c.tono}>{c.texto}</Chip>
          <span className="font-mono text-[10.5px] text-gris">{f.creadaEn}</span>
        </div>
      </div>
      {f.mensaje && (
        <p className="mt-3 whitespace-pre-wrap border-l-2 border-rosa bg-fondo px-3.5 py-2.5 text-[13px] leading-relaxed">
          {f.mensaje}
        </p>
      )}
    </>
  );
}
