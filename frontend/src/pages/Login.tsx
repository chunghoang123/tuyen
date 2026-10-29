import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { Icon } from '../components/ui/Icon'
import { Logo } from '../components/ui/Logo'
import { FieldError } from '../components/ui/FieldError'
import { errorMessage } from '../utils/consoleFormat'

const heroImage =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80'

type LoginField = 'username' | 'password'
type FieldErrors = Partial<Record<LoginField, string>>

/** Thư viện GIS (Google Identity Services) nạp từ index.html */
interface GoogleCredentialResponse {
  credential?: string
}

interface GoogleAccountsId {
  initialize(config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void
  renderButton(element: HTMLElement, options: Record<string, unknown>): void
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } }
    __cinexGoogleInitialized?: boolean
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  // Khởi tạo nút Google Identity Services (popup), mỗi lần bấm gửi credential về backend
  const googleRef = useRef<HTMLDivElement>(null)
  const [googleError, setGoogleError] = useState('')

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false
    let attempts = 0
    const tryInit = () => {
      if (cancelled) return
      if (window.google?.accounts?.id) {
        if (!window.__cinexGoogleInitialized) {
          window.__cinexGoogleInitialized = true
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => void handleGoogleCredential(response.credential ?? ''),
          })
        }
        if (googleRef.current) {
          googleRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(googleRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'pill',
            locale: 'vi',
          })
        } else if (attempts < 40) {
          attempts += 1
          window.setTimeout(tryInit, 250)
        }
      } else if (attempts < 40) {
        attempts += 1
        window.setTimeout(tryInit, 250)
      } else {
        setGoogleError('Không tải được Google Sign-In. Vui lòng kiểm tra kết nối mạng.')
      }
    }
    tryInit()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Đảm bảo overlay loading không bị kẹt nếu component unmount.
  useEffect(() => {
    return () => {
      setLoading(false)
    }
  }, [])

  const handleGoogleCredential = async (credential: string) => {
    if (!credential) return
    setGoogleError('')
    setLoading(true)
    try {
      await authService.googleLogin(credential)
      if (authService.hasRole('ROLE_ADMIN')) {
        navigate('/admin', { replace: true })
      } else if (authService.hasRole('ROLE_STAFF')) {
        navigate('/staff/pos', { replace: true })
      } else {
        navigate(from && !from.startsWith('/admin') && !from.startsWith('/staff') ? from : '/', { replace: true })
      }
    } catch (err) {
      setGoogleError(errorMessage(err, 'Không thể đăng nhập bằng Google. Vui lòng thử lại.'))
    } finally {
      setLoading(false)
    }
  }

  const clearFieldError = (field: LoginField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

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
      setError(errorMessage(err, 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: FieldErrors = {}
    if (!username.trim()) nextErrors.username = 'Vui lòng nhập tên đăng nhập.'
    if (!password) nextErrors.password = 'Vui lòng nhập mật khẩu.'
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      const first = (Object.keys(nextErrors) as LoginField[])[0]
      document.getElementById(first)?.focus()
      return
    }
    setFieldErrors({})
    await performLogin(username, password)
  }

  return (
    <div className="auth-page">
      {loading && (
        <div className="auth-loading-overlay" role="status" aria-live="polite">
          <div className="spinner" />
          <p>Đang đăng nhập...</p>
        </div>
      )}
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

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="username">Tên đăng nhập</label>
              <div className={`input-wrap${fieldErrors.username ? ' input-wrap--error' : ''}`}>
                <Icon name="user" size={17} />
                <input
                  id="username"
                  className="input"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    clearFieldError('username')
                  }}
                  placeholder="Nhập tên đăng nhập hoặc email"
                  autoComplete="username"
                  required
                  aria-invalid={Boolean(fieldErrors.username)}
                  aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                />
              </div>
              <FieldError id="username-error" message={fieldErrors.username} />
            </div>

            <div className="field">
              <label htmlFor="password">Mật khẩu</label>
              <div className={`input-wrap${fieldErrors.password ? ' input-wrap--error' : ''}`}>
                <Icon name="lock" size={17} />
                <input
                  id="password"
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    clearFieldError('password')
                  }}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  required
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
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
              <FieldError id="password-error" message={fieldErrors.password} />
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
              {loading ? (
                <>
                  <span className="spinner spinner-sm" aria-hidden="true" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <Icon name="arrow-right" size={17} />
                </>
              )}
            </button>
          </form>

          <div className="auth-sep">hoặc tiếp tục với</div>

          <div className="auth-social">
            {GOOGLE_CLIENT_ID ? (
              <div ref={googleRef} style={{ display: 'flex', justifyContent: 'center' }} />
            ) : (
              <div className="muted" style={{ fontSize: 14 }}>
                Đăng nhập Google chưa được cấu hình (thiếu <code>VITE_GOOGLE_CLIENT_ID</code>).
              </div>
            )}
          </div>
          {googleError && <div className="form-error" style={{ marginTop: 10 }}>{googleError}</div>}

          <p className="auth-foot">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
