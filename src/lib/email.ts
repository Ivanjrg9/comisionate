const FROM = process.env.EMAIL_FROM ?? "ComisionaTe <avisos@comisionate.com>";

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderEmail(title: string, body: string, url: string | null) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://comisionate.com";
  const button = url ? `<p><a href="${site}${url}" style="background:#171717;color:#fafafa;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Abrir en ComisionaTe</a></p>` : "";
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#14181f">
<p style="font-size:20px;font-weight:800">Comisiona<span style="color:#d98a00">Te</span></p>
<h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p>${button}
<p style="color:#5b6472;font-size:12px">Recibes este aviso porque tienes una cuenta en ComisionaTe.</p></div>`;
}

/** Envía un email con la API de Resend (sin librería). Devuelve true si se envió. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  return res.ok;
}
