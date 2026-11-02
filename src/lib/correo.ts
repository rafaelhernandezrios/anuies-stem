import nodemailer from "nodemailer";
import { diasPara, fecha } from "./fechas";
import { FORMATO_CARTA_COMPROMISO } from "./constantes";

/** Correos de la convocatoria.
 *
 *  El envío nunca hace fallar la operación que lo dispara: si el SMTP está
 *  caído, la aplicante igual queda registrada y su envío igual se guarda. El
 *  fallo se registra en consola y la interfaz ofrece reenviar el enlace. */

const REMITENTE =
  process.env.CORREO_REMITENTE ?? "Reto ANUIES4MX <no-reply@anuies4mx.mx>";
/** Base para los enlaces de los correos.
 *
 *  Un enlace de verificación que apunta a localhost es inservible: la persona
 *  lo abre en su equipo y no llega a ninguna parte. Por eso la URL no se
 *  confía a una sola variable escrita a mano.
 *
 *  Si el despliegue corre en Vercel y FRONTEND_URL falta —o quedó apuntando a
 *  localhost porque se importó el archivo de entorno de desarrollo— se usa el
 *  dominio que Vercel expone. Una URL local en un servidor desplegado nunca es
 *  la correcta, así que se descarta en lugar de obedecerla. */
function baseDeEnlaces() {
  const configurada = process.env.FRONTEND_URL?.trim();
  const enVercel = Boolean(process.env.VERCEL);
  const esLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(configurada ?? "");

  if (configurada && !(enVercel && esLocal)) return configurada.replace(/\/+$/, "");

  const dominio =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? null;
  if (dominio) return `https://${dominio}`;

  return "http://localhost:3000";
}

const BASE = baseDeEnlaces();

function transporte() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export function correoConfigurado() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

/** Plantilla común: el diseño de la plataforma no se traslada tal cual al
 *  correo porque los clientes de correo no soportan flexbox ni fuentes
 *  externas de forma fiable. Se conserva la paleta y la jerarquía. */
function plantilla(titulo: string, cuerpo: string, boton?: { texto: string; url: string }) {
  return `<!doctype html>
<html lang="es-MX"><body style="margin:0;background:#FBF5F8;font-family:Helvetica,Arial,sans-serif;color:#26212E">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF5F8;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #EEE3EA">
        <tr><td style="background:#26212E;padding:24px 28px">
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B9AEC2">ANUIES &times; Mirai Innovation</div>
          <div style="font-size:26px;font-weight:bold;text-transform:uppercase;color:#FFFFFF;margin-top:6px">Reto ANUIES4MX <span style="color:#FF6FA5">Mujeres STEM</span></div>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 16px;font-size:20px;text-transform:uppercase;color:#26212E">${titulo}</h1>
          <div style="font-size:15px;line-height:1.65;color:#26212E">${cuerpo}</div>
          ${
            boton
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px"><tr><td style="background:#D6336C">
                   <a href="${boton.url}" style="display:inline-block;padding:14px 26px;color:#FFFFFF;text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:bold">${boton.texto}</a>
                 </td></tr></table>
                 <p style="font-size:12px;color:#736C7B;line-height:1.6;margin:14px 0 0">Si el botón no funciona, copia esta dirección en tu navegador:<br><span style="color:#8A1F49;word-break:break-all">${boton.url}</span></p>`
              : ""
          }
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #EEE3EA;font-size:11px;color:#736C7B;line-height:1.6">
          Este mensaje se envió de forma automática. Tus datos se tratan conforme al aviso de privacidad de la convocatoria.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function enviar(para: string, asunto: string, html: string) {
  const t = transporte();
  if (!t) {
    console.warn(`[correo] sin configurar; no se envió "${asunto}" a ${para}`);
    return false;
  }
  try {
    await t.sendMail({ from: REMITENTE, to: para, subject: asunto, html });
    return true;
  } catch (e) {
    console.error(`[correo] falló el envío de "${asunto}" a ${para}:`, e);
    return false;
  }
}

export function correoVerificacion(para: string, nombre: string, token: string) {
  return enviar(
    para,
    "Confirma tu correo · Reto ANUIES4MX 2026",
    plantilla(
      "Confirma tu correo",
      `<p>Hola ${nombre}:</p><p>Tu cuenta quedó creada. Confirma tu correo para poder iniciar sesión y empezar tu postulación.</p><p>El enlace vence en 48 horas.</p>`,
      { texto: "Confirmar mi correo", url: `${BASE}/verificar?token=${token}` },
    ),
  );
}

export function correoRecuperacion(para: string, nombre: string, token: string) {
  return enviar(
    para,
    "Restablece tu contraseña · Reto ANUIES4MX 2026",
    plantilla(
      "Restablece tu contraseña",
      `<p>Hola ${nombre}:</p><p>Recibimos una solicitud para cambiar tu contraseña. Si no fuiste tú, ignora este mensaje: tu contraseña actual sigue vigente.</p><p>El enlace vence en una hora.</p>`,
      { texto: "Cambiar mi contraseña", url: `${BASE}/recuperar/${token}` },
    ),
  );
}

export function correoEnvioRecibido(para: string, nombre: string, folio: string, cierre: string) {
  return enviar(
    para,
    `Recibimos tu aplicación · ${folio}`,
    plantilla(
      "Recibimos tu aplicación",
      `<p>Hola ${nombre}:</p><p>Tu aplicación quedó registrada con el folio <strong>${folio}</strong>. A partir de este momento no puede editarse.</p>
       <p>El periodo de recepción cierra el ${cierre}. Después viene la evaluación del comité y la publicación de resultados.</p>`,
      { texto: "Ver mi convocatoria", url: `${BASE}/dashboard` },
    ),
  );
}

export function correoResultados(para: string, nombre: string, folio: string) {
  return enviar(
    para,
    `Ya puedes consultar tu resultado · ${folio}`,
    plantilla(
      "Resultados publicados",
      `<p>Hola ${nombre}:</p><p>El comité publicó los dictámenes de la convocatoria. Entra a la plataforma para ver tu puntaje por criterio y la retroalimentación.</p>`,
      { texto: "Ver mi resultado", url: `${BASE}/resultado` },
    ),
  );
}

export function correoRecordatorioConfirmacion(
  para: string,
  nombre: string,
  cierra: string,
) {
  return enviar(
    para,
    "Confirma tu participación · Reto ANUIES4MX 2026",
    plantilla(
      "Confirma tu lugar",
      `<p>Hola ${nombre}:</p><p>Fuiste seleccionada para el Reto ANUIES4MX 2026. Para conservar tu lugar necesitas confirmar tu participación y llenar tus datos logísticos <strong>antes del ${cierra}</strong>.</p>`,
      { texto: "Confirmar mi participación", url: `${BASE}/confirmacion` },
    ),
  );
}

/** Lo que escribe la aplicante (su nombre) viaja dentro del HTML del correo. */
function escapar(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function quedan(dias: number) {
  if (dias <= 0) return "cierra hoy";
  if (dias === 1) return "queda 1 día";
  return `quedan ${dias} días`;
}

/** Recordatorio de cierre de recepción.
 *
 *  Se separa el contenido del envío para que el panel pueda mostrar la vista
 *  previa exacta y mandar la prueba con el mismo HTML que recibirán las
 *  aplicantes. `faltantes` en null significa que aún no inicia su aplicación. */
export function recordatorioCierre(opts: {
  nombre: string;
  cierre: Date;
  faltantes: string[] | null;
  prueba?: boolean;
  ahora?: Date;
}) {
  const dia = fecha(opts.cierre, "EEEE d 'de' MMMM");
  const hora = fecha(opts.cierre, "HH:mm");
  const restante = quedan(diasPara(opts.cierre, opts.ahora));
  const sinIniciar = opts.faltantes === null;

  const intro = sinIniciar
    ? "<p>Creaste tu cuenta en el Reto ANUIES4MX 2026, pero todavía no empiezas tu aplicación.</p>"
    : "<p>Tu aplicación al Reto ANUIES4MX 2026 todavía no está enviada.</p>";

  const lista =
    opts.faltantes && opts.faltantes.length > 0
      ? `<p style="margin-bottom:6px"><strong>Lo que te falta:</strong></p>
         <ul style="margin:0 0 16px;padding-left:20px">${opts.faltantes
           .map((f) => `<li style="margin-bottom:4px">${escapar(f)}</li>`)
           .join("")}</ul>`
      : "";

  const formato = `<p style="background:#FBF5F8;border-left:3px solid #D6336C;padding:10px 14px;margin:0 0 16px">La <strong>carta compromiso</strong> debe llenarse en el formato oficial: <a href="${FORMATO_CARTA_COMPROMISO}" style="color:#8A1F49">abrir formato de carta compromiso</a>. Descárgalo, llénalo, fírmalo y súbelo en PDF en el paso de Documentos.</p>`;

  const cierre = sinIniciar
    ? "<p>El registro toma unos minutos por paso y tu avance se guarda solo, así que puedes hacerlo en varias sesiones.</p>"
    : "<p>Tu avance está guardado: entra y continúa donde te quedaste. Recuerda que la aplicación solo cuenta cuando presionas <strong>Enviar</strong> en el último paso.</p>";

  const aviso = opts.prueba
    ? `<p style="background:#FBF5F8;border:1px dashed #D6336C;padding:10px 12px;font-size:12px;color:#8A1F49;margin:0 0 18px">Correo de prueba enviado desde el panel de administración. Las aplicantes no reciben este aviso.</p>`
    : "";

  return {
    asunto: `${opts.prueba ? "[PRUEBA] " : ""}La recepción cierra el ${fecha(opts.cierre, "d 'de' MMMM")} · Reto ANUIES4MX 2026`,
    html: plantilla(
      `Tu aplicación cierra pronto`,
      `${aviso}<p>Hola ${escapar(opts.nombre)}:</p>${intro}
       <p>La recepción cierra el <strong>${dia} a las ${hora} h</strong> (hora del centro de México): ${restante}. Después de esa hora la plataforma ya no acepta envíos.</p>
       ${lista}${formato}${cierre}`,
      {
        texto: sinIniciar ? "Empezar mi aplicación" : "Terminar mi aplicación",
        url: `${BASE}/dashboard`,
      },
    ),
  };
}

export function correoRecordatorioCierre(
  para: string,
  opts: Parameters<typeof recordatorioCierre>[0],
) {
  const { asunto, html } = recordatorioCierre(opts);
  return enviar(para, asunto, html);
}

/** Aviso a la administración de que alguien pidió ayuda desde el login. Todo
 *  lo que viene del formulario es texto de un desconocido: se escapa. */
export function correoSolicitudAyuda(
  para: string,
  s: { nombre: string; email: string; mensaje: string | null; cuenta: string },
) {
  const mensaje = s.mensaje
    ? `<p style="margin-bottom:6px"><strong>Mensaje:</strong></p>
       <p style="background:#FBF5F8;border-left:3px solid #D6336C;padding:10px 14px;margin:0 0 16px;white-space:pre-wrap">${escapar(s.mensaje)}</p>`
    : "";
  return enviar(
    para,
    `Solicitud de ayuda · ${s.email}`,
    plantilla(
      "Alguien pidió ayuda",
      `<p>Llegó una solicitud de ayuda desde la pantalla de inicio de sesión.</p>
       <p><strong>Nombre:</strong> ${escapar(s.nombre)}<br><strong>Correo:</strong> ${escapar(s.email)}<br><strong>Cuenta:</strong> ${escapar(s.cuenta)}</p>
       ${mensaje}
       <p>Desde el panel puedes reenviar el enlace de confirmación o activar la cuenta a mano.</p>`,
      { texto: "Ver solicitudes", url: `${BASE}/admin/ayuda` },
    ),
  );
}
