import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

const PUBLIC_PATHS = ['/', '/login', '/register', '/auth/callback', '/auth/confirm'];

const isPublicPath = (pathname: string) => {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }
  return PUBLIC_PATHS.some((publicPath) => publicPath !== '/' && pathname.startsWith(`${publicPath}/`));
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

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
    return res;
  }
  const isRequestingPublicPath = isPublicPath(pathname);

  if (!session && !isRequestingPublicPath) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('redirectTo', `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    return NextResponse.redirect(redirectUrl);
  }

  const userRole = session?.user?.user_metadata?.role;

  if (session && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    const redirectToParam = searchParams.get('redirectTo');
    const fallbackPath = userRole === 'admin' ? '/admin' : '/student';
    const destination = redirectToParam && redirectToParam.startsWith('/')
      ? new URL(redirectToParam, req.nextUrl.origin)
      : new URL(fallbackPath, req.nextUrl.origin);
    return NextResponse.redirect(destination);
  }

  if (pathname.startsWith('/admin')) {
    if (!session) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }

    if (userRole !== 'admin') {
      const fallbackPath = '/student';
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = fallbackPath;
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
