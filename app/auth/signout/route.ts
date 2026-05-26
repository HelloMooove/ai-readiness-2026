import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } catch {
    // If Supabase isn't configured we still redirect cleanly.
  }
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/admin/login`, { status: 303 });
}
