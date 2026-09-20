/**
 * Email alert on a new lead, via Resend's HTTP API.
 *
 * Deliberately no SDK — it is one fetch, and a dependency here would be a
 * dependency in the request path of every lead we capture.
 *
 * Never throws: a notification failing must not fail the submission. The lead
 * is already committed to the database by the time this runs.
 */
export async function notify(subject: string, lines: [string, string][]) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_EMAIL_TO;
  const from = process.env.LEADS_EMAIL_FROM;
  if (!key || !to || !from) return;

  const body = lines
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5d5853">${k}</td><td style="padding:4px 0"><b>${escapeHtml(v)}</b></td></tr>`)
    .join("");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()),
        subject,
        html: `<h2 style="font-family:system-ui;color:#134027">${escapeHtml(subject)}</h2><table style="font:14px system-ui">${body}</table>`,
      }),
    });
  } catch (err) {
    console.error("[notify] failed, lead is safe in the database", err);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
