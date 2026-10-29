export interface User {
  id: number
  username: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  roles: string[]
  active: boolean
  createdAt?: string
}

export interface AuthResponse {
  token: string
  username: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  roles: string[]
}

export interface UpdateProfilePayload {
  fullName: string
  email: string
  phone?: string
  avatarUrl?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}
