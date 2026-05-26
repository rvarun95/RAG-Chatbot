import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/login',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/forgot-password',
]);

const isAdminRoute = createRouteMatcher([
  '/upload',
]);

export default clerkMiddleware(async (auth, req) => {
  // TODO: Re-enable admin role check once Clerk JWT template propagates the role claim
  // const authObject = await auth();
  // const { sessionClaims, userId } = authObject;
  //
  // if (isAdminRoute(req)) {
  //   if (!userId) {
  //     await auth.protect();
  //   }
  //
  //   const claims = sessionClaims as any || {};
  //   let isAdmin = false;
  //
  //   if (claims?.role === 'admin') {
  //     isAdmin = true;
  //   } else if (claims?.metadata?.role === 'admin') {
  //     isAdmin = true;
  //   }
  //
  //   if (!isAdmin) {
  //     console.warn(`Access denied to ${req.nextUrl.pathname}: user ${userId} is not admin.`);
  //     const redirectUrl = new URL('/', req.url);
  //     return NextResponse.redirect(redirectUrl);
  //   }
  // }

  // Protect all non-public routes (still requires sign-in for /upload)
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/(.*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};