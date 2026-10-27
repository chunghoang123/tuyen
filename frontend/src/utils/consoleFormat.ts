export function todayIso(): string {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 10)
}

export function formatTime(iso?: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  return `${formatTime(iso)} · ${formatDate(iso)}`
}

export function formatDateLong(iso?: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function initials(name?: string): string {
  return (name || 'CX')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function errorMessage(error: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại'): string {
  if (typeof error === 'object' && error !== null) {
    const maybe = error as { response?: { data?: { message?: string } }; message?: string }
    const serverMessage = maybe.response?.data?.message
    if (serverMessage) return serverMessage
    if (maybe.response) return maybe.message || fallback
  }
  return fallback
}
