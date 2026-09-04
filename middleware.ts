export { auth as middleware } from "@/auth";
export const runtime = "nodejs";
export const config = {
  // Specify which routes you want the middleware to protect
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
