interface AvatarProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : ''

  if (!src) {
    const initials = alt
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
    return <span className={`avatar avatar-fallback ${sizeClass} ${className ?? ''}`}>{initials || '?'}</span>
  }

  return <img src={src} alt={alt} className={`avatar ${sizeClass} ${className ?? ''}`} />
}
