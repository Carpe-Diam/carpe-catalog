import nodemailer from "nodemailer";
import { NextRequest } from "next/server";

export async function GET() {
  return Response.json({ message: "Order request API is live" });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function validateString(value: unknown, maxLength = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = validateString(body.name, 200);
    const company = validateString(body.company, 200) ?? "";
    const email = validateString(body.email, 200) ?? "";
    const phone = validateString(body.phone, 50) ?? "";
    const whatsapp = validateString(body.whatsapp, 50) ?? "";
    const communication = validateString(body.communication, 50);
    const orderType = validateString(body.orderType, 100) ?? "";
    const message = validateString(body.message, 2000) ?? "";
    const productTitle = validateString(body.productTitle, 500) ?? "";
    const variantSku = validateString(body.variantSku, 200) ?? "";
    const price = typeof body.price === "number" ? body.price : null;
    const productLink = validateString(body.productLink, 1000) ?? "";

    const contact =
      communication === "email"
        ? email
        : communication === "whatsapp"
        ? whatsapp
        : phone;

    if (!name || !contact) {
      return Response.json(
        { success: false, error: "Name and contact info are required" },
        { status: 400 }
      );
    }

    const smtpPort = parseInt(process.env.BREVO_SMTP_PORT ?? "587", 10);

    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"UD Catalog" <${process.env.BREVO_SMTP_USER}>`,
      to: process.env.ORDER_REQUEST_EMAIL,
      subject: `New Order Request - ${escapeHtml(productTitle)}`,
      html: `
        <h2>New Order Request</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company)}</p>
        <p><strong>Preferred Communication:</strong> ${escapeHtml(communication ?? "")}</p>
        <p><strong>Contact:</strong> ${escapeHtml(contact)}</p>
        <p><strong>Message:</strong> ${escapeHtml(message) || "(none)"}</p>

        <h3>Order Details</h3>
        <p><strong>Order Type:</strong> ${escapeHtml(orderType)}</p>

        <h3>Product Details</h3>
        <p><strong>Product:</strong> ${escapeHtml(productTitle)}</p>
        <p><strong>Variant SKU:</strong> ${escapeHtml(variantSku)}</p>
        ${price != null ? `<p><strong>Price:</strong> ₹${price}</p>` : ""}
        <p><strong>Product Link:</strong> <a href="${encodeURI(productLink)}">${escapeHtml(productLink)}</a></p>
      `,
    });

    return Response.json({ success: true, messageId: info.messageId });
  } catch (error: unknown) {
    console.error("Order request error:", error instanceof Error ? error.message : "Unknown error");
    return Response.json(
      { success: false, error: "Failed to send request. Please try again." },
      { status: 500 }
    );
  }
}
