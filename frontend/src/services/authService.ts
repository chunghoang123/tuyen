import api from '../api/axios'
import type {
  AuthResponse,
  ChangePasswordPayload,
  UpdateProfilePayload,
  User,
} from '../types/User'

const SESSION_KEY = 'cinex_session'

interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

function saveSession(data: AuthResponse) {
  localStorage.setItem('token', data.token)
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

/** Đồng bộ lại các trường hiển thị trong header sau khi hồ sơ thay đổi. */
function patchSession(data: Partial<AuthResponse>) {
  const current = authService.getUser()
  if (!current) return
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...data }))
}

function normalizeRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    if (typeof item === 'string') return item
    return (item as { name?: string })?.name ?? String(item)
  })
}
function toSessionPatch(user: User): Partial<AuthResponse> {
  return {
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    roles: normalizeRoles(user.roles),
  }
}

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<Envelope<AuthResponse>>('/auth/login', { username, password })
    saveSession(res.data.data)
    return res.data.data
  },
  googleLogin: async (credential: string): Promise<AuthResponse> => {
    const res = await api.post<Envelope<AuthResponse>>('/auth/google', { credential })
    saveSession(res.data.data)
    return res.data.data
  },
  register: async (data: {
    username: string; email: string; password: string; fullName?: string; phone?: string
  }): Promise<AuthResponse> => {
    const res = await api.post<Envelope<AuthResponse>>('/auth/register', data)
    saveSession(res.data.data)
    return res.data.data
  },
  me: async (): Promise<User> => {
    const res = await api.get<Envelope<User>>('/auth/me')
    const user = { ...res.data.data, roles: normalizeRoles(res.data.data.roles) }
    patchSession(toSessionPatch(user))
    return user
  },
  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const res = await api.put<Envelope<User>>('/auth/me', payload)
    const user = { ...res.data.data, roles: normalizeRoles(res.data.data.roles) }
    patchSession(toSessionPatch(user))
    return user
  },
  changePassword: async (payload: ChangePasswordPayload): Promise<string> => {
    const res = await api.put<Envelope<null>>('/auth/password', payload)
    return res.data.message
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem(SESSION_KEY)
  },
  getToken: () => localStorage.getItem('token'),
  getUser: (): AuthResponse | null => {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthResponse
    } catch {
      return null
    }
  },
  getRoles: (): string[] => authService.getUser()?.roles ?? [],
  hasRole: (role: string): boolean => authService.getRoles().includes(role),
  isAuthenticated: (): boolean => Boolean(authService.getToken()),
  isStaffOrAdmin: (): boolean =>
    authService.hasRole('ROLE_ADMIN') || authService.hasRole('ROLE_STAFF'),
  homePath: (): string => {
    if (authService.hasRole('ROLE_ADMIN')) return '/admin'
    if (authService.hasRole('ROLE_STAFF')) return '/staff/pos'
    return '/'
  },
}
