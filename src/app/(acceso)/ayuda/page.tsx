import { edicionActual } from "@/lib/edicion";
import { ColumnaFormulario, PanelAcceso } from "../panel-lateral";
import { FormularioAyuda } from "./formulario";

export const metadata = { title: "Ayuda con tu cuenta · Reto ANUIES4MX 2026" };

export default async function Ayuda() {
  const edicion = await edicionActual();
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <PanelAcceso
        cierre={edicion.cierreRecepcion}
        eventoInicia={edicion.eventoInicia}
        eventoTermina={edicion.eventoTermina}
      />
      <ColumnaFormulario etiqueta="Acceso a la plataforma" titulo="Ayuda con tu cuenta">
        <FormularioAyuda />
      </ColumnaFormulario>
    </main>
  );
}
