import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import { authService } from '../../services/authService'
import { Avatar } from '../ui/Avatar'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'

const navItems = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/movies', label: 'Phim' },
  { to: '/showtimes', label: 'Lịch chiếu' },
]

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = authService.getToken()
  const user = authService.getUser()
  const isConsoleUser = authService.isStaffOrAdmin()
  const consolePath = authService.hasRole('ROLE_ADMIN') ? '/admin' : '/staff/pos'
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!loggingOut) return
    const safety = window.setTimeout(() => setLoggingOut(false), 5000)
    return () => {
      window.clearTimeout(safety)
      setLoggingOut(false)
    }
  }, [loggingOut])

  if (isAuthPage) return null

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const query = String(form.get('q') ?? '').trim()
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  const handleLogout = () => {
    setMenuOpen(false)
    setLoggingOut(true)
    window.setTimeout(() => {
      authService.logout()
      navigate('/login')
    }, 300)
  }

  const displayName = user?.fullName || user?.username || (isConsoleUser ? 'Cinex Console' : 'Khách')

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Logo />

        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form className="header-search" onSubmit={handleSearch} role="search">
          <Icon name="search" size={17} />
          <input name="q" placeholder="Tìm phim, rạp, suất chiếu..." aria-label="Tìm kiếm" />
        </form>

        <div className="header-actions">
          <Link to="/history" className="header-icon mobile-only" aria-label="Vé của tôi">
            <Icon name="ticket" size={19} />
          </Link>
          <Link to="/history" className="header-icon hide-mobile" aria-label="Thông báo">
            <Icon name="bell" size={19} />
          </Link>

          {token ? (
            <div className="header-user-wrap" ref={menuRef}>
              <button
                type="button"
                className="header-user"
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <div>
                  <div className="header-user__name">{displayName}</div>
                  <div className="header-user__role">
                    {isConsoleUser ? 'Vào console' : 'Thành viên Cinex'}
                  </div>
                </div>
                {isConsoleUser ? (
                  <span className="console-avatar" style={{ width: 30, height: 30, fontSize: 10 }}>
                    {(user?.fullName || user?.username || 'CX').slice(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <Avatar alt={displayName} size="sm" />
                )}
                <Icon name="chevron-down" size={14} />
              </button>

              {menuOpen && (
                <div className="header-dropdown" role="menu">
                  <Link to="/profile" className="header-dropdown__item" role="menuitem" onClick={() => setMenuOpen(false)}>
                    <Icon name="user" size={16} />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  {isConsoleUser && (
                    <Link to={consolePath} className="header-dropdown__item" role="menuitem" onClick={() => setMenuOpen(false)}>
                      <Icon name="dashboard" size={16} />
                      <span>Cinex Console</span>
                    </Link>
                  )}
                  <button type="button" className="header-dropdown__item header-dropdown__item--danger" role="menuitem" onClick={handleLogout}>
                    <Icon name="logout" size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
      {loggingOut && createPortal(
        <div className="auth-loading-overlay" role="status" aria-live="polite">
          <div className="spinner" />
          <p>Đang đăng xuất...</p>
        </div>,
        document.body
      )}
    </header>
  )
}
