import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = ['/', '/login', '/register', '/auth/callback', '/auth/confirm'];

const isPublicPath = (pathname: string) => {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }
  return PUBLIC_PATHS.some((publicPath) => publicPath !== '/' && pathname.startsWith(`${publicPath}/`));
};

export async function middleware(req: NextRequest) {
  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    // Allow request to continue without auth in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }
    // In production, return error
    return new NextResponse(
      JSON.stringify({ error: 'Server configuration error. Please contact support.' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  let supabaseResponse = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname, searchParams } = req.nextUrl;
  const isAssetRequest =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/photos/') ||
    /\.[^/]+$/.test(pathname);

  if (isAssetRequest) {
    return supabaseResponse;
  }
  const isRequestingPublicPath = isPublicPath(pathname);

  if (!session && !isRequestingPublicPath) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('redirectTo', `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (session && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    const redirectToParam = searchParams.get('redirectTo');
    const fallbackPath = '/challenger';
    const destination = redirectToParam && redirectToParam.startsWith('/')
      ? new URL(redirectToParam, req.nextUrl.origin)
      : new URL(fallbackPath, req.nextUrl.origin);
    return NextResponse.redirect(destination);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
