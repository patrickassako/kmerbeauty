import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
        urlPrefix: process.env.SUPABASE_URL?.substring(0, 30) || "NOT_SET",
    });
}
