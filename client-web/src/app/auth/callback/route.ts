import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/login';

    if (code) {
        const supabase = createClient();

        try {
            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (!error) {
                // Successfully confirmed - redirect to login with success message
                return NextResponse.redirect(new URL('/login?confirmed=true', requestUrl.origin));
            }
        } catch (e) {
            console.error('Auth callback error:', e);
        }
    }

    // Redirect to login page
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
