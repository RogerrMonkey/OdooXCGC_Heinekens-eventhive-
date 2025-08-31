import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear the authentication cookie
    cookieStore.delete("eventhive_token");
    
    return NextResponse.json({ ok: true, message: "Logged out successfully" });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json({ ok: false, error: 'Logout failed' }, { status: 500 });
  }
}
