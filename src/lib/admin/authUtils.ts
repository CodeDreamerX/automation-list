// Authentication utilities for admin panel

export function checkAuth(cookies: any): boolean {
  const authCookie = cookies.get('adminSession');
  return authCookie?.value === '1';
}

export function setAuthCookie(cookies: any): void {
  cookies.set('adminSession', '1', {
    path: '/',
    httpOnly: true,
    secure: false, // Allow in development
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 24 hours
  });
}

export function clearAuthCookie(cookies: any): void {
  // Delete cookie by setting it to expire immediately
  cookies.delete('adminSession', { 
    path: '/',
    httpOnly: true,
    sameSite: 'lax'
  });
  // Also try to set it to empty/expired to ensure it's cleared
  cookies.set('adminSession', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0 // Expire immediately
  });
}

export function verifyPassword(submittedPassword: string): boolean {
  const correctPassword = import.meta.env.ADMIN_PASSWORD || '';
  return submittedPassword === correctPassword;
}

// Protect admin routes - redirect to login if not authenticated
export async function protectAdminRoute(cookies: any): Promise<Response | null> {
  if (!checkAuth(cookies)) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin/login'
      }
    });
  }
  return null;
}


