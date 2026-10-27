import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { Icon } from '../components/ui/Icon'
import { Logo } from '../components/ui/Logo'
import { DEMO_ACCOUNTS } from '../types/User'
import { errorMessage } from '../utils/consoleFormat'

const heroImage =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  const performLogin = async (loginUsername: string, loginPassword: string) => {
    setLoading(true)
    setError('')
    try {
      await authService.login(loginUsername, loginPassword)
      if (authService.hasRole('ROLE_ADMIN')) {
        navigate('/admin', { replace: true })
      } else if (authService.hasRole('ROLE_STAFF')) {
        navigate('/staff/pos', { replace: true })
      } else {
        navigate(from && !from.startsWith('/admin') && !from.startsWith('/staff') ? from : '/', { replace: true })
      }
    } catch (err) {
      setError(errorMessage(err, 'Không thể kết nối máy chủ. Vui lòng kiểm tra backend hoặc dùng chế độ demo.'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await performLogin(username, password)
  }

  const handleDemo = () => {
    localStorage.setItem('token', 'demo-token')
    navigate('/')
  }

  const loginAsDemo = async (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername)
    setPassword(demoPassword)
    await performLogin(demoUsername, demoPassword)
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <img className="auth-hero__bg" src={heroImage} alt="" />
        <div className="auth-hero__shade" />
        <div className="auth-hero__content">
          <Logo />
          <div className="auth-hero__quote">Mỗi bộ phim là một hành trình mới.</div>
          <p className="muted" style={{ marginTop: 10, maxWidth: 380 }}>
            Đăng nhập để đặt vé, tích điểm và nhận những ưu đãi độc quyền từ Cinex.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <h1 className="auth-title">Chào mừng trở lại</h1>
          <p className="auth-sub">Đăng nhập vào tài khoản Cinex của bạn.</p>

          {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="username">Tên đăng nhập</label>
              <div className="input-wrap">
                <Icon name="user" size={17} />
                <input
                  id="username"
                  className="input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Mật khẩu</label>
              <div className="input-wrap">
                <Icon name="lock" size={17} />
                <input
                  id="password"
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={17} />
                </button>
              </div>
            </div>

            <div className="row between">
              <label className="checkbox">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                Ghi nhớ đăng nhập
              </label>
              <a href="#forgot" className="btn-link">
                Quên mật khẩu?
              </a>
            </div>

            <button type="submit" className="btn btn-gradient btn-block btn-lg" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              {!loading && <Icon name="arrow-right" size={17} />}
            </button>
          </form>

          <div className="auth-sep">hoặc tiếp tục với</div>

          <div className="auth-social">
            <button type="button" className="btn btn-ghost btn-block" onClick={handleDemo}>
              <Icon name="google" size={18} />
              Tiếp tục với Google
            </button>
            <button type="button" className="btn btn-outline btn-block" onClick={handleDemo}>
              <Icon name="sparkles" size={17} />
              Dùng tài khoản demo
            </button>
          </div>

          <div className="auth-sep">Tài khoản demo</div>
          <div className="auth-demo-list">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                type="button"
                className="auth-demo-card"
                key={account.username}
                onClick={() => loginAsDemo(account.username, account.password)}
                disabled={loading}
              >
                <span className="auth-demo-card__role">{account.label}</span>
                <strong>{account.username} / {account.password}</strong>
                <small>{account.description}</small>
              </button>
            ))}
          </div>

          <p className="auth-foot">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
