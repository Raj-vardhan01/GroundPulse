import nodemailer from "nodemailer";

/**
 * Email alert on a new lead. Two ways to send, pick whichever is less hassle:
 *
 *   1. RESEND_API_KEY        — Resend's HTTP API. No SMTP, no app password.
 *   2. SMTP_HOST/USER/PASS   — any SMTP server, including your own Gmail.
 *
 * Resend wins if both are set. If neither is configured this does nothing at
 * all, and the lead is still safely in the database.
 *
 * Never throws. A notification failing must not fail the submission — by the
 * time this runs the lead is already committed.
 */
export async function notify(subject: string, lines: [string, string][]) {
  const to = process.env.LEADS_EMAIL_TO;
  const from = process.env.LEADS_EMAIL_FROM;
  if (!to || !from) return;

  const rows = lines
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#5d5853">${escapeHtml(k)}</td>` +
        `<td style="padding:4px 0"><b>${escapeHtml(v)}</b></td></tr>`
    )
    .join("");
  const html =
    `<h2 style="font-family:system-ui;color:#134027">${escapeHtml(subject)}</h2>` +
    `<table style="font:14px system-ui">${rows}</table>`;

  try {
    if (process.env.RESEND_API_KEY) {
      await sendViaResend(from, to, subject, html);
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendViaSmtp(from, to, subject, html);
    }
  } catch (err) {
    console.error("[notify] failed — the lead is safe in the database", err);
  }
}

async function sendViaResend(from: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: to.split(",").map((s) => s.trim()), subject, html }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
}

async function sendViaSmtp(from: string, to: string, subject: string, html: string) {
  const port = Number(process.env.SMTP_PORT ?? 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 is implicit TLS; 587 upgrades with STARTTLS
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });
  await transport.sendMail({ from, to, subject, html });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
