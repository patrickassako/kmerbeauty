import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone, city, profile } = body;

        // Validate required fields
        if (!name || !email || !phone || !profile?.length) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check environment variables
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing environment variables:", {
                hasUrl: !!supabaseUrl,
                hasKey: !!supabaseKey
            });
            return NextResponse.json(
                { error: "Configuration error. Please contact support." },
                { status: 503 }
            );
        }

        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Insert beta tester
        const { data, error } = await supabase
            .from("beta_testers")
            .insert({
                name,
                email,
                phone,
                city: city || null,
                profile_type: profile.join(", "),
                status: "pending",
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase insert error:", error);

            // Handle duplicate email
            if (error.code === "23505") {
                return NextResponse.json(
                    { error: "Cet email est déjà inscrit au programme beta." },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { error: "Erreur lors de l'inscription. Veuillez réessayer." },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Une erreur est survenue. Veuillez réessayer." },
            { status: 500 }
        );
    }
}
