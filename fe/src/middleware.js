import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions } from "./lib/session";

// Public routes that don't require authentication
const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/auth/otp",
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  try {
    // Get session using cookies() from next/headers
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    // Debug log (remove in production)
    if (process.env.NODE_ENV === "development") {
      console.log("Middleware session check:", {
        pathname,
        isLoggedIn: session.isLoggedIn,
        hasUser: !!session.user,
        userId: session.user?.id,
      });
    }

    // If not logged in, redirect to sign-in
    if (!session.isLoggedIn || !session.user) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // User is authenticated, allow access
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, redirect to sign-in
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
