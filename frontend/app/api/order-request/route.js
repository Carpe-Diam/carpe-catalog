import nodemailer from "nodemailer";

// Optional GET for testing the endpoint in the browser
export async function GET() {
  return Response.json({ message: "Order request API is live" });
}

export async function POST(req) {
  try {
    const {
      name,
      company,
      email,
      phone,
      whatsapp,
      communication,
      orderType,
      message,
      productTitle,
      variantSku,
      price,
      productLink,
    } = await req.json();

    // Determine preferred contact
    const contact =
      communication === "email"
        ? email
        : communication === "whatsapp"
        ? whatsapp
        : phone;

    // Basic validation
    if (!name || !contact) {
      return Response.json(
        { success: false, error: "Name and contact info are required" },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: Number(process.env.BREVO_SMTP_PORT),
      secure: Number(process.env.BREVO_SMTP_PORT) === 465, // SSL if port 465
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
      logger: true,    // <--- ADD
      debug: true,  
    });

    // Verify SMTP connection
    // await transporter.verify();
    // console.log("✅ SMTP configuration verified!");

    // Send email
    const info = await transporter.sendMail({
      from: `"UD Catalog" <${process.env.BREVO_SMTP_USER}>`,
      to: process.env.ORDER_REQUEST_EMAIL,
      subject: `New Order Request - ${productTitle}`,
      html: `
        <h2>New Order Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Preferred Communication:</strong> ${communication}</p>
        <p><strong>Contact:</strong> ${contact}</p>
        <p><strong>Message:</strong> ${message || "(none)"}</p>

        <h3>Order Details</h3>
        <p><strong>Order Type:</strong> ${orderType}</p>

        <h3>Product Details</h3>
        <p><strong>Product:</strong> ${productTitle}</p>
        <p><strong>Variant SKU:</strong> ${variantSku}</p>
        <p><strong>Price:</strong> $${price}</p>
        <p><strong>Product Link:</strong> <a href="${productLink}">${productLink}</a></p>
      `,
    });

    console.log("📧 Email sent! Info:", info);

    // Return success
    return Response.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}