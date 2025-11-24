// Authentication utilities for admin panel

export function checkAuth(cookies: any): boolean {
  const authCookie = cookies.get('admin_authenticated');
  return authCookie?.value === 'true';
}

export function setAuthCookie(cookies: any): void {
  cookies.set('admin_authenticated', 'true', {
    path: '/',
    httpOnly: true,
    secure: false, // Allow in development
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 24 hours
  });
}

export function clearAuthCookie(cookies: any): void {
  cookies.delete('admin_authenticated', { path: '/' });
  cookies.delete('parsed_data', { path: '/' });
  cookies.delete('data_confirmed', { path: '/' });
  cookies.delete('failed_row_numbers', { path: '/' });
}

export function clearDataCookies(cookies: any): void {
  cookies.delete('parsed_data', { path: '/' });
  cookies.delete('data_confirmed', { path: '/' });
  cookies.delete('failed_row_numbers', { path: '/' });
}

export function verifyPassword(submittedPassword: string): boolean {
  const correctPassword = import.meta.env.ADMIN_PASSWORD || '';
  return submittedPassword === correctPassword;
}


