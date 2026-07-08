import { NextRequest } from "next/server";

function validateString(value: unknown, maxLength = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const firstName = validateString(body.firstName, 200);
    const lastName = validateString(body.lastName, 200);
    const email = validateString(body.email, 200);
    const phone = validateString(body.phone, 50);
    const city = validateString(body.city, 200);
    
    // Validate interestedIn (multi-select array of strings)
    const rawInterested = body.interestedIn;
    let interestedIn: string[] = [];
    if (Array.isArray(rawInterested)) {
      interestedIn = rawInterested
        .map(item => validateString(item, 100))
        .filter((item): item is string => item !== null);
    }

    const source = validateString(body.source, 100);

    if (!firstName || !lastName || !phone || !city) {
      return Response.json(
        { success: false, error: "First Name, Last Name, Phone, and City are required." },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn("[LeadAPI] GOOGLE_SHEETS_WEBHOOK_URL environment variable is not configured.");
      return Response.json(
        { 
          success: false, 
          error: "API configured correctly but Google Sheets integration is pending. Please configure GOOGLE_SHEETS_WEBHOOK_URL in .env.local." 
        },
        { status: 501 }
      );
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email: email ?? "",
        phone,
        city,
        interestedIn,
        source
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[LeadAPI] Google Sheets webhook failed status:", res.status, errorText);
      throw new Error(`Google Sheets responded with status ${res.status}`);
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    console.error("[LeadAPI] Error processing lead:", error instanceof Error ? error.message : "Unknown error");
    return Response.json(
      { success: false, error: "Internal server error. Failed to save lead data." },
      { status: 500 }
    );
  }
}
