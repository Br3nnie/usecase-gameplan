import { Resend } from "resend";

export async function sendMagicLinkEmail({ to, link, tier, orderId, source = "order" }) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const subject = tier === "diy"
    ? "Your Corbelle DIY access link"
    : "Your AI Use Case Gameplan access link";

  const { error } = await resend.emails.send({
    from: process.env.MAIL_FROM || "Corbelle <hello@corbelle.ai>",
    to,
    subject,
    html: `
      <p>Thanks for your order.</p>
      <p><a href="${link}">Open your Corbelle tool</a></p>
      <p>This one-time link expires in 24 hours. Once opened, this device stays signed in for 180 days.</p>
    `,
    headers: { "X-Entity-Ref-ID": `${source}-${orderId}` },
  });

  if (error) throw new Error(`Resend failed: ${error.message}`);
}
