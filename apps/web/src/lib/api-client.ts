/**
 * Auth utility for the web app.
 * Stores JWT in localStorage and provides helpers for API calls.
 */

const TOKEN_KEY = 'cap-auth-token'
const REFRESH_KEY = 'cap-auth-refresh'

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Authenticated fetch wrapper.
 * Returns null on 401 (caller can redirect to login).
 */
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(init?.headers as Record<string, string> ?? {}),
  }

  const res = await fetch(`/api${path}`, { ...init, headers })

  if (res.status === 401) {
    clearAuthToken()
    return null
  }

  return res
}
