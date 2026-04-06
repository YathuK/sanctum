import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://sanctum-tawny.vercel.app",
  process.env.NEXTAUTH_URL,
].filter(Boolean) as string[];

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");

  // Handle CORS preflight for API routes
  if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api/")) {
    const headers: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Sanctum-API-Key",
      "Access-Control-Max-Age": "86400",
    };

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Credentials"] = "true";
    }

    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();

  // Add CORS headers to API responses
  if (req.nextUrl.pathname.startsWith("/api/") && origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
