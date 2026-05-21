export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();

    const nombre = clean(formData.get("nombre"));
    const email = clean(formData.get("email"));
    const telefono = clean(formData.get("telefono"));
    const pueblo = clean(formData.get("pueblo"));
    const tipo = clean(formData.get("tipo"));
    const origen = clean(formData.get("origen"));
    const mensaje = clean(formData.get("mensaje"));

    if (!nombre || !telefono) {
      return htmlResponse("Información incompleta", "Por favor incluya su nombre y teléfono para poder responderle.", 400);
    }

    if (email && !isValidEmail(email)) {
      return htmlResponse("Correo inválido", "Por favor verifique el correo electrónico o deje ese campo en blanco.", 400);
    }

    const missing = [
      "CF_ACCOUNT_ID",
      "CF_EMAIL_API_TOKEN",
      "LEAD_NOTIFICATION_TO",
      "LEAD_NOTIFICATION_FROM",
    ].filter((key) => !env[key]);

    if (missing.length > 0) {
      return htmlResponse(
        "Error de configuración",
        `Faltan variables de ambiente: ${missing.join(", ")}`,
        500
      );
    }

    const submittedAt = new Date().toISOString();
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "desconocido";
    const subject = `Nuevo estimado desde brspr.com - ${nombre}`;

    const text = [
      "Nuevo mensaje desde brspr.com",
      "",
      `Fecha: ${submittedAt}`,
      `IP: ${ip}`,
      `Origen: ${origen || "-"}`,
      "",
      `Nombre: ${nombre}`,
      `Teléfono: ${telefono}`,
      `Correo: ${email || "-"}`,
      `Pueblo: ${pueblo || "-"}`,
      `Tipo de trabajo: ${tipo || "-"}`,
      "",
      "Mensaje:",
      mensaje || "-",
    ].join("\n");

    const html = `
      <h2>Nuevo mensaje desde brspr.com</h2>
      <p><strong>Fecha:</strong> ${escapeHtml(submittedAt)}</p>
      <p><strong>IP:</strong> ${escapeHtml(ip)}</p>
      <p><strong>Origen:</strong> ${escapeHtml(origen || "-")}</p>
      <hr>
      <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(telefono)}</p>
      <p><strong>Correo:</strong> ${escapeHtml(email || "-")}</p>
      <p><strong>Pueblo:</strong> ${escapeHtml(pueblo || "-")}</p>
      <p><strong>Tipo de trabajo:</strong> ${escapeHtml(tipo || "-")}</p>
      <p><strong>Mensaje:</strong></p>
      <pre style="white-space:pre-wrap;font-family:monospace;">${escapeHtml(mensaje || "-")}</pre>
    `;

    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CF_ACCOUNT_ID)}/email/sending/send`;

    const emailResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CF_EMAIL_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: env.LEAD_NOTIFICATION_TO,
        from: env.LEAD_NOTIFICATION_FROM,
        subject,
        text,
        html,
      }),
    });

    const responseText = await emailResponse.text();

    if (!emailResponse.ok) {
      console.error("Cloudflare Email Sending failed", {
        status: emailResponse.status,
        responseText,
      });

      return htmlResponse(
        "No se pudo enviar el mensaje",
        `Cloudflare Email Sending devolvió HTTP ${emailResponse.status}: ${safeError(responseText)}`,
        500
      );
    }

    return htmlResponse(
      "Mensaje recibido",
      "Gracias. Su mensaje fue enviado correctamente. El Sr. Cruz se comunicará con usted lo antes posible.",
      200
    );
  } catch (error) {
    console.error("Error en formulario de estimado:", error && error.stack ? error.stack : error);
    return htmlResponse(
      "No se pudo enviar el mensaje",
      `Error del servidor: ${safeError(error && error.message ? error.message : String(error))}`,
      500
    );
  }
}

export async function onRequestGet() {
  return htmlResponse("Método no permitido", "Este enlace acepta solamente envíos del formulario.", 405);
}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, 4000);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeError(value) {
  return String(value || "").replaceAll(/[A-Za-z0-9_-]{30,}/g, "[redacted]").slice(0, 900);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function htmlResponse(title, message, status) {
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | BRS Puerto Rico</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07131f; color: #ffffff; font-family: Arial, Helvetica, sans-serif; }
    main { width: min(760px, calc(100% - 40px)); border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06); padding: 34px; box-shadow: 0 22px 70px rgba(0,0,0,.36); }
    h1 { margin: 0; font-size: 34px; }
    p { color: rgba(255,255,255,.78); font-size: 18px; line-height: 1.6; white-space: pre-wrap; }
    a { display: inline-flex; margin-top: 18px; min-height: 46px; align-items: center; padding: 0 18px; background: #0a66a3; color: #ffffff; text-decoration: none; font-weight: 800; text-transform: uppercase; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <a href="/">Volver al inicio</a>
  </main>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
