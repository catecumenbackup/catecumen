// supabase/functions/emitir-constancia/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: Genera la constancia PDF, la guarda en Storage y envía email.
// Disparador: POST desde el frontend al finalizar el Repaso Final (aprobado).
//
// Variables de entorno requeridas (en Supabase Dashboard > Edge Functions > Secrets):
//   SUPABASE_URL              – URL del proyecto
//   SUPABASE_SERVICE_ROLE_KEY – Clave de servicio (bypasses RLS)
//   RESEND_API_KEY            – API key de Resend (https://resend.com)
//   APP_BASE_URL              – URL pública de la app (ej. https://sacramentos.app)
//   FROM_EMAIL                – Correo remitente (ej. noreply@tu-parroquia.com)
//
// Invocación:
//   POST https://<project>.supabase.co/functions/v1/emitir-constancia
//   Authorization: Bearer <supabase_anon_key>
//   Content-Type: application/json
//   Body: { "inscripcion_id": "uuid-de-la-inscripcion" }
// ─────────────────────────────────────────────────────────────────────────────

import { serve }       from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient} from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import QRCode          from "https://esm.sh/qrcode@1.5.3";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // ── 0. Autenticación del llamante ─────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── 1. Parsear payload ────────────────────────────────────────────────
    const { inscripcion_id } = await req.json();
    if (!inscripcion_id) throw new Error("inscripcion_id requerido");

    // ── 2. Crear / recuperar constancia en DB ─────────────────────────────
    const { data: certData, error: rpcErr } = await supabase
      .rpc("crear_constancia", { p_inscripcion_id: inscripcion_id });
    if (rpcErr) throw rpcErr;

    const codigo = certData?.codigo_validacion as string;

    // ── 3. Obtener todos los datos de la constancia ───────────────────────
    const { data: cert, error: cErr } = await supabase
      .from("constancias")
      .select(`
        *,
        estudiantes ( email )
      `)
      .eq("codigo_validacion", codigo)
      .single();
    if (cErr || !cert) throw new Error("No se encontró la constancia generada");

    const studentEmail = cert.estudiantes?.email;
    const validationUrl = `${Deno.env.get("APP_BASE_URL")}/validar/${codigo}`;

    // ── 4. Generar QR como PNG base64 ────────────────────────────────────
    const qrDataUrl: string = await QRCode.toDataURL(validationUrl, {
      width: 200,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    });
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrBytes  = Uint8Array.from(atob(qrBase64), c => c.charCodeAt(0));

    // ── 5. Generar PDF con pdf-lib ────────────────────────────────────────
    const pdfDoc  = await PDFDocument.create();
    const page    = pdfDoc.addPage([595.28, 841.89]); // A4 pt
    const { width, height } = page.getSize();

    const fontBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const GOLD   = rgb(0.784, 0.663, 0.318);
    const NAVY   = rgb(0.039, 0.098, 0.18);
    const IVORY  = rgb(0.941, 0.918, 0.839);
    const DARK   = rgb(0.12,  0.16,  0.22);
    const MUTED  = rgb(0.50,  0.48,  0.44);

    // Fondo
    page.drawRectangle({ x:0, y:0, width, height, color: NAVY });

    // Borde dorado
    const MARGIN = 24;
    page.drawRectangle({ x:MARGIN, y:MARGIN, width:width-MARGIN*2, height:height-MARGIN*2, borderColor:GOLD, borderWidth:1.5 });
    page.drawRectangle({ x:MARGIN+6, y:MARGIN+6, width:width-MARGIN*2-12, height:height-MARGIN*2-12, borderColor:GOLD, borderWidth:0.5, opacity:0.4 });

    // Título
    const title = "✝  Constancia de Formación Sacramental  ✝";
    const titleSize = 16;
    const titleW = fontBold.widthOfTextAtSize(title, titleSize);
    page.drawText(title, { x:(width-titleW)/2, y:height-80, size:titleSize, font:fontBold, color:GOLD });

    // Subtítulo sacramento
    const sacName = cert.nombre_sacramento.toUpperCase();
    const sacSize = 13;
    const sacW = fontNormal.widthOfTextAtSize(sacName, sacSize);
    page.drawText(sacName, { x:(width-sacW)/2, y:height-106, size:sacSize, font:fontBold, color:IVORY });

    // Línea divisoria
    page.drawLine({ start:{x:50, y:height-118}, end:{x:width-50, y:height-118}, color:GOLD, thickness:0.5, opacity:0.5 });

    // Cuerpo — 11 campos
    const fields: [string, string][] = [
      ["Nombre completo",     cert.nombre_estudiante],
      [cert.tipo_documento,   cert.numero_documento],
      ["País de origen",      cert.pais_origen],
      ["País de residencia",  cert.pais_residencia],
      ["Sacramento",          cert.nombre_sacramento],
      ["Fecha de inicio",     new Date(cert.fecha_inicio).toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"})],
      ["Fecha de conclusión", new Date(cert.fecha_conclusion).toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"})],
      ["Horas de formación",  `${cert.horas_formacion} horas`],
      ["Autoriza",            cert.nombre_ministro  || "—"],
      ["Catequista",          cert.nombre_catequista || "—"],
      ["Válida hasta",        new Date(cert.fecha_vigencia).toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"})],
    ];

    const startY   = height - 148;
    const lineH    = 30;
    const labelX   = 56;
    const valueX   = 220;

    fields.forEach(([key, val], i) => {
      const y = startY - i * lineH;
      page.drawText(`${key}:`, { x:labelX, y, size:10, font:fontBold,   color:GOLD });
      page.drawText(val,       { x:valueX, y, size:10, font:fontNormal, color:IVORY });
      page.drawLine({ start:{x:labelX, y:y-8}, end:{x:width-56, y:y-8}, color:IVORY, thickness:0.3, opacity:0.15 });
    });

    // QR Code (incrustar imagen PNG)
    const qrImage = await pdfDoc.embedPng(qrBytes);
    const qrSize  = 110;
    const qrX     = width - 56 - qrSize;
    const qrY     = startY - (fields.length - 1) * lineH - qrSize + 20;
    page.drawImage(qrImage, { x:qrX, y:qrY, width:qrSize, height:qrSize });
    page.drawText("Escanea para validar", { x:qrX + 2, y:qrY - 14, size:8, font:fontNormal, color:MUTED });

    // Código de validación
    const codeY = qrY - 28;
    page.drawText(codigo, { x:qrX, y:codeY, size:7, font:fontNormal, color:MUTED });

    // Nota de vigencia
    const noteY = MARGIN + 50;
    const noteText = `Este documento es válido por 6 meses a partir de la fecha de conclusión (hasta ${new Date(cert.fecha_vigencia).toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"})}).`;
    page.drawText(noteText, { x:56, y:noteY, size:8, font:fontNormal, color:MUTED, maxWidth:width - 112, lineHeight:12 });

    // ── 6. Serializar PDF ─────────────────────────────────────────────────
    const pdfBytes  = await pdfDoc.save();
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

    // ── 7. Subir a Supabase Storage ───────────────────────────────────────
    const storagePath = `constancias/${codigo}.pdf`;
    const { error: storageErr } = await supabase.storage
      .from("certificates")
      .upload(storagePath, pdfBytes.buffer, {
        contentType:  "application/pdf",
        cacheControl: "3600",
        upsert:       true,
      });
    if (storageErr) console.error("[Storage]", storageErr);

    const { data: { publicUrl } } = supabase.storage
      .from("certificates")
      .getPublicUrl(storagePath);

    // ── 8. Actualizar constancia con URL del PDF ──────────────────────────
    await supabase
      .from("constancias")
      .update({ pdf_url: publicUrl })
      .eq("codigo_validacion", codigo);

    // ── 9. Enviar email con Resend ────────────────────────────────────────
    if (studentEmail) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    Deno.env.get("FROM_EMAIL") || "noreply@sacramentos.app",
          to:      [studentEmail],
          subject: `Tu Constancia de ${cert.nombre_sacramento} — Formación Sacramental`,
          html: buildEmailHtml(cert, validationUrl, codigo),
          attachments: [{
            filename:    `Constancia-${cert.nombre_sacramento}-${cert.nombre_estudiante.replace(/ /g,"-")}.pdf`,
            content:     pdfBase64,
            content_type:"application/pdf",
          }],
        }),
      });

      if (!emailRes.ok) {
        const errBody = await emailRes.text();
        console.error("[Resend]", emailRes.status, errBody);
      } else {
        // Marcar como enviado
        await supabase
          .from("constancias")
          .update({ enviado_email: true })
          .eq("codigo_validacion", codigo);
      }
    }

    // ── 10. Respuesta ─────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({ success:true, codigo, pdf_url: publicUrl }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[emitir-constancia]", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});

// ── EMAIL HTML BUILDER ─────────────────────────────────────────────────────
function buildEmailHtml(cert: Record<string,unknown>, validationUrl: string, codigo: string): string {
  const s = (v: unknown) => String(v ?? "—");
  return `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<style>
  body{background:#f5f0e8;font-family:Georgia,serif;color:#2C1810}
  .outer{max-width:600px;margin:32px auto;background:#fff;border:1px solid #d4c4a0;border-radius:12px;overflow:hidden}
  .header{background:linear-gradient(135deg,#0D1B2E,#162840);padding:36px 32px;text-align:center}
  .title{color:#C8A951;font-size:22px;margin:0 0 6px;letter-spacing:0.05em}
  .subtitle{color:#F0EAD6;font-size:15px;margin:0}
  .body{padding:32px}
  .field{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e8e0d0}
  .key{color:#7A6A50;font-size:13px;width:160px;flex-shrink:0}
  .val{font-size:14px;font-weight:600;color:#2C1810;text-align:right}
  .qr-box{text-align:center;margin:28px 0;padding:20px;background:#f9f5ec;border-radius:8px;border:1px solid #ddd}
  .qr-box img{width:140px;height:140px}
  .footer{background:#0D1B2E;color:#9A8F7A;font-size:12px;padding:20px 32px;text-align:center}
  .validity{background:#fffaf0;border:1px solid #C8A951;border-radius:8px;padding:12px 16px;font-size:13px;color:#8B6A20;margin-top:16px}
</style></head><body>
<div class="outer">
  <div class="header">
    <p class="title">✝ Constancia de Formación Sacramental</p>
    <p class="subtitle">${s(cert.nombre_sacramento)}</p>
  </div>
  <div class="body">
    <p style="font-size:16px;margin:0 0 20px">Estimado(a) <strong>${s(cert.nombre_estudiante)}</strong>,</p>
    <p style="color:#5A4A3A;line-height:1.7;margin:0 0 24px">
      En adjunto encontrarás tu constancia oficial de preparación para el sacramento de
      <strong>${s(cert.nombre_sacramento)}</strong>. A continuación el resumen de tu expediente:
    </p>
    ${[
      ["Nombre completo",    s(cert.nombre_estudiante)],
      [s(cert.tipo_documento), s(cert.numero_documento)],
      ["País de origen",     s(cert.pais_origen)],
      ["País de residencia", s(cert.pais_residencia)],
      ["Sacramento",         s(cert.nombre_sacramento)],
      ["Horas de formación", `${cert.horas_formacion} horas`],
      ["Autoriza",           s(cert.nombre_ministro)],
      ["Catequista",         s(cert.nombre_catequista)],
    ].map(([k,v])=>`<div class="field"><span class="key">${k}</span><span class="val">${v}</span></div>`).join("")}
    <div class="qr-box">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(validationUrl)}" alt="QR de validación">
      <p style="margin:10px 0 4px;font-size:13px;color:#7A6A50">Código de verificación</p>
      <code style="font-size:11px;color:#2C1810">${codigo}</code>
      <p style="margin:8px 0 0;font-size:12px;color:#9A8F7A">
        Escanea este código QR para verificar la autenticidad de este documento
      </p>
    </div>
    <div class="validity">
      ⚠ Esta constancia es válida por 6 meses a partir de la fecha de conclusión.<br>
      Vence el: <strong>${new Date(s(cert.fecha_vigencia)).toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"})}</strong>
    </div>
  </div>
  <div class="footer">
    Formación Sacramental Católica &nbsp;·&nbsp;
    <a href="${validationUrl}" style="color:#C8A951">Validar en línea</a>
    <br><span style="font-size:11px">Este correo fue enviado automáticamente. No responder.</span>
  </div>
</div>
</body></html>`;
}
