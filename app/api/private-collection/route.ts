import { accessPrivateCollection } from "@/lib/zohoClient";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const slug = typeof body.slug === "string" ? body.slug.trim() : "";
        const password = typeof body.password === "string" ? body.password.trim() : "";

        if (!slug || slug.length > 200 || !password || password.length > 200) {
            return Response.json(
                { error: "Slug and password are required" },
                { status: 400 }
            );
        }

        const collection = await accessPrivateCollection(slug, password);
        return Response.json(collection);
    } catch (err: any) {
        const message = err.message || "Failed to access collection";

        if (message === "Invalid password") {
            return Response.json({ error: message }, { status: 401 });
        }
        if (message === "Collection not found") {
            return Response.json({ error: message }, { status: 404 });
        }

        return Response.json({ error: message }, { status: 500 });
    }
}
