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

    // Log the request for now, since nodemailer is removed
    console.log("New Order Request:", {
      name,
      company,
      contact,
      communication,
      orderType,
      message,
      productTitle,
      variantSku,
      price,
      productLink,
    });

    // In a real scenario, you might want to save this to a database
    // or use a different service like Brevo API directly.

    return Response.json({ 
      success: true, 
      message: "Order request received successfully" 
    });
  } catch (error: unknown) {
    console.error("Order request error:", error instanceof Error ? error.message : "Unknown error");
    return Response.json(
      { success: false, error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
