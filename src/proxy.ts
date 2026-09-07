import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// Protege todas as rotas do sistema: exige sessão válida, exceto em /login
// e nos endpoints de autenticação. Renomeado de "middleware" para "proxy"
// conforme a convenção do Next.js 16.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = pathname === "/login" || pathname.startsWith("/api/auth");
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const usuario = await verifySessionToken(token);

  if (!isPublicPath && !usuario) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && usuario) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
