import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from '../ui/Icon'

const items: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/', label: 'Trang chủ', icon: 'home' },
  { to: '/search', label: 'Tìm kiếm', icon: 'search' },
  { to: '/history', label: 'Vé', icon: 'ticket' },
  { to: '/profile', label: 'Tài khoản', icon: 'user' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Điều hướng di động">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <Icon name={item.icon} size={22} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
