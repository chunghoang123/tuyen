import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { Icon } from '../components/ui/Icon'
import { Logo } from '../components/ui/Logo'
import { FieldError } from '../components/ui/FieldError'
import { errorMessage } from '../utils/consoleFormat'

const heroImage =
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80'

type RegisterField = 'fullName' | 'email' | 'phone' | 'password' | 'confirm' | 'agree'
type FieldErrors = Partial<Record<RegisterField, string>>

export function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agree, setAgree] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  const clearFieldError = (field: RegisterField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!fullName.trim()) next.fullName = 'Vui lòng nhập họ và tên.'
    if (!email.trim()) {
      next.email = 'Vui lòng nhập email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Email không hợp lệ.'
    }
    if (!phone.trim()) {
      next.phone = 'Vui lòng nhập số điện thoại.'
    } else if (!/^[0-9+\s.-]{8,15}$/.test(phone.trim())) {
      next.phone = 'Số điện thoại không hợp lệ.'
    }
    if (!password) {
      next.password = 'Vui lòng nhập mật khẩu.'
    } else if (password.length < 6) {
      next.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
    }
    if (!confirm) {
      next.confirm = 'Vui lòng xác nhận mật khẩu.'
    } else if (confirm !== password) {
      next.confirm = 'Mật khẩu xác nhận không khớp.'
    }
    if (!agree) next.agree = 'Vui lòng đồng ý với điều khoản.'
    return next
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      const first = (Object.keys(nextErrors) as RegisterField[])[0]
      document.getElementById(first === 'agree' ? 'terms' : first)?.focus()
      return
    }
    setFieldErrors({})
    setLoading(true)
    try {
      await authService.register({
        username: email,
        email,
        password,
        fullName,
        phone,
      })
      navigate('/')
    } catch (err) {
      setError(errorMessage(err, 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <img className="auth-hero__bg" src={heroImage} alt="" />
        <div className="auth-hero__shade" />
        <div className="auth-hero__content">
          <Logo />
          <div className="auth-hero__quote">Bắt đầu hành trình điện ảnh của bạn.</div>
          <p className="muted" style={{ marginTop: 10, maxWidth: 380 }}>
            Tạo tài khoản miễn phí, đặt vé nhanh hơn và nhận ưu đãi dành riêng cho thành viên.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <h1 className="auth-title">Tạo tài khoản</h1>
          <p className="auth-sub">Chỉ mất chưa đến một phút.</p>

          {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="fullName">Họ và tên</label>
              <div className={`input-wrap${fieldErrors.fullName ? ' input-wrap--error' : ''}`}>
                <Icon name="user" size={17} />
                <input
                  id="fullName"
                  className="input"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value)
                    clearFieldError('fullName')
                  }}
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  required
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                />
              </div>
              <FieldError id="fullName-error" message={fieldErrors.fullName} />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <div className={`input-wrap${fieldErrors.email ? ' input-wrap--error' : ''}`}>
                <Icon name="mail" size={17} />
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    clearFieldError('email')
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
              </div>
              <FieldError id="email-error" message={fieldErrors.email} />
            </div>

            <div className="field">
              <label htmlFor="phone">Số điện thoại</label>
              <div className={`input-wrap${fieldErrors.phone ? ' input-wrap--error' : ''}`}>
                <Icon name="phone" size={17} />
                <input
                  id="phone"
                  className="input"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value)
                    clearFieldError('phone')
                  }}
                  placeholder="090 123 4567"
                  autoComplete="tel"
                  required
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                />
              </div>
              <FieldError id="phone-error" message={fieldErrors.phone} />
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
                    clearFieldError('confirm')
                  }}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                  minLength={6}
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

            <div className="field">
              <label htmlFor="confirm">Xác nhận mật khẩu</label>
              <div className={`input-wrap${fieldErrors.confirm ? ' input-wrap--error' : ''}`}>
                <Icon name="lock" size={17} />
                <input
                  id="confirm"
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(event) => {
                    setConfirm(event.target.value)
                    clearFieldError('confirm')
                  }}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  required
                  aria-invalid={Boolean(fieldErrors.confirm)}
                  aria-describedby={fieldErrors.confirm ? 'confirm-error' : undefined}
                />
              </div>
              <FieldError id="confirm-error" message={fieldErrors.confirm} />
            </div>

            <div className="field">
              <label className={`checkbox${fieldErrors.agree ? ' checkbox--error' : ''}`}>
                <input
                  id="terms"
                  type="checkbox"
                  checked={agree}
                  onChange={(event) => {
                    setAgree(event.target.checked)
                    clearFieldError('agree')
                  }}
                  aria-invalid={Boolean(fieldErrors.agree)}
                  aria-describedby={fieldErrors.agree ? 'terms-error' : undefined}
                />
                <span>
                  Tôi đồng ý với <a href="#terms" className="btn-link">điều khoản</a> và{' '}
                  <a href="#privacy" className="btn-link">chính sách bảo mật</a>.
                </span>
              </label>
              <FieldError id="terms-error" message={fieldErrors.agree} />
            </div>

            <button type="submit" className="btn btn-gradient btn-block btn-lg" disabled={loading}>
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              {!loading && <Icon name="arrow-right" size={17} />}
            </button>
          </form>

          <p className="auth-foot">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
