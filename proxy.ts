import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasSupabaseAuthCookie } from "@/lib/auth-cookie";
import { createFetchWithTimeout, supabaseFetchTimeoutMs } from "@/lib/fetch-with-timeout";

function withFramePolicy(response: NextResponse, pathname: string) {
  if (pathname.startsWith("/embed")) {
    response.headers.set("Content-Security-Policy", "frame-ancestors *");
    return response;
  }
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'self'");
  return response;
}

export async function proxy(request: NextRequest) {
  const response = withFramePolicy(NextResponse.next({ request }), request.nextUrl.pathname);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  if (!hasSupabaseAuthCookie(request.cookies.getAll())) return response;

  const supabase = createServerClient(url, key, {
    global: {
      fetch: (input, init) => createFetchWithTimeout(supabaseFetchTimeoutMs())(input, init),
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  try {
    await supabase.auth.getUser();
  } catch {
    // Un timeout de Auth no debe convertir la página en un 500.
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
