import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/authService'
import type { User } from '../types/User'
import { Avatar } from '../components/ui/Avatar'
import { FieldError } from '../components/ui/FieldError'
import { Icon } from '../components/ui/Icon'
import { PageBar } from '../components/ui/PageBar'
import { errorMessage, formatDate } from '../utils/consoleFormat'

const roleLabels: Record<string, string> = {
  ROLE_ADMIN: 'Quản trị viên',
  ROLE_STAFF: 'Nhân viên rạp',
  ROLE_CUSTOMER: 'Thành viên',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9+\s.-]{8,15}$/

type ProfileField = 'fullName' | 'email' | 'phone'
type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword'

interface ProfileForm {
  fullName: string
  email: string
  phone: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const emptyPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

function normalizeRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) =>
    typeof item === 'string' ? item : (item as { name?: string })?.name ?? String(item)
  )
}
function toProfileForm(user: User): ProfileForm {
  return {
    fullName: user.fullName ?? '',
    email: user.email,
    phone: user.phone ?? '',
  }
}

function focusField(id: string) {
  document.getElementById(id)?.focus()
}

export function Profile() {
  const token = authService.getToken()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [loadError, setLoadError] = useState('')

  const [editing, setEditing] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileForm>({ fullName: '', email: '', phone: '' })
  const [profileErrors, setProfileErrors] = useState<Partial<Record<ProfileField, string>>>({})
  const [profileError, setProfileError] = useState('')
  const [profileNotice, setProfileNotice] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPasswordForm)
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<PasswordField, string>>>({})
  const [passwordError, setPasswordError] = useState('')
  const [passwordNotice, setPasswordNotice] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!token) return
    let active = true
    setLoading(true)
    authService
      .me()
      .then((data) => {
        if (!active) return
        const normalized = { ...data, roles: normalizeRoles(data.roles) }
        setUser(normalized)
        setProfileForm(toProfileForm(normalized))
        setLoadError('')
      })
      .catch((err) => {
        if (!active) return
        setLoadError(errorMessage(err, 'Không tải được thông tin tài khoản.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token])

  const startEditing = () => {
    if (!user) return
    setProfileForm(toProfileForm(user))
    setProfileErrors({})
    setProfileError('')
    setProfileNotice('')
    setEditing(true)
  }

  const cancelEditing = () => {
    if (user) setProfileForm(toProfileForm(user))
    setProfileErrors({})
    setProfileError('')
    setEditing(false)
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form: ProfileForm = {
      fullName: profileForm.fullName.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
    }
    const errors: Partial<Record<ProfileField, string>> = {}
    if (form.fullName.length > 100) {
      errors.fullName = 'Họ tên tối đa 100 ký tự.'
    }
    if (!form.email) {
      errors.email = 'Vui lòng nhập email.'
    } else if (!EMAIL_PATTERN.test(form.email)) {
      errors.email = 'Email không hợp lệ.'
    }
    if (form.phone && !PHONE_PATTERN.test(form.phone)) {
      errors.phone = 'Số điện thoại không hợp lệ.'
    }

    setProfileErrors(errors)
    if (Object.keys(errors).length > 0) {
      const first = (Object.keys(errors) as ProfileField[])[0]
      focusField(`profile-${first}`)
      return
    }

    setSavingProfile(true)
    setProfileError('')
    setProfileNotice('')
    try {
      const updated = await authService.updateProfile({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
      })
      setUser(updated)
      setProfileForm(toProfileForm(updated))
      setEditing(false)
      setProfileNotice('Đã cập nhật thông tin cá nhân.')
    } catch (err) {
      setProfileError(errorMessage(err, 'Không lưu được thông tin. Vui lòng thử lại.'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors: Partial<Record<PasswordField, string>> = {}
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.'
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự.'
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.'
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới.'
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = 'Mật khẩu nhập lại không khớp.'
    }

    setPasswordErrors(errors)
    if (Object.keys(errors).length > 0) {
      const first = (Object.keys(errors) as PasswordField[])[0]
      focusField(`pwd-${first}`)
      return
    }

    setSavingPassword(true)
    setPasswordError('')
    setPasswordNotice('')
    try {
      const message = await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm(emptyPasswordForm)
      setPasswordNotice(message || 'Đổi mật khẩu thành công.')
    } catch (err) {
      setPasswordError(errorMessage(err, 'Không đổi được mật khẩu. Vui lòng thử lại.'))
    } finally {
      setSavingPassword(false)
    }
  }

  if (!token) {
    return (
      <div className="container">
        <PageBar title="Tài khoản" backTo="/" />
        <div className="empty-state">
          <Icon name="user" size={40} />
          <strong>Bạn chưa đăng nhập</strong>
          <p>Đăng nhập để xem và cập nhật thông tin tài khoản Cinex.</p>
          <Link to="/login" className="btn btn-primary btn-sm">
            Đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  if (loading && !user) {
    return (
      <div className="container">
        <PageBar title="Tài khoản" backTo="/" />
        <div className="empty-state">
          <p>Đang tải thông tin tài khoản...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <PageBar title="Tài khoản" backTo="/" />
        <div className="empty-state">
          <Icon name="alert" size={40} />
          <strong>Không tải được hồ sơ</strong>
          <p>{loadError || 'Phiên đăng nhập đã hết hạn.'}</p>
          <Link to="/login" className="btn btn-primary btn-sm">
            Đăng nhập lại
          </Link>
        </div>
      </div>
    )
  }

  const displayName = user.fullName?.trim() || user.username
  const consolePath = authService.hasRole('ROLE_ADMIN') ? '/admin' : '/staff/pos'

  return (
    <div className="container">
      <PageBar title="Tài khoản" backTo="/" />

      <div className="profile-layout">
        <aside>
          <div className="surface card-pad">
            <div className="profile-head">
              <Avatar src={user.avatarUrl} alt={displayName} size="lg" />
              <div className="profile-name">{displayName}</div>
              <div className="profile-email">@{user.username}</div>
              {user.roles.length > 0 && (
                <div className="row center wrap gap-6" style={{ marginTop: 4 }}>
                  {user.roles.map((role) => (
                    <span key={role} className="badge badge-accent">
                      {roleLabels[role] ?? role}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <hr className="divider" style={{ margin: '16px 0' }} />

            <div className="stat-grid" style={{ marginTop: 0 }}>
              <div className="stat-card">
                <span>Thành viên từ</span>
                <strong>{formatDate(user.createdAt)}</strong>
              </div>
              <div className="stat-card">
                <span>Trạng thái</span>
                <strong>{user.active ? 'Hoạt động' : 'Tạm khóa'}</strong>
              </div>
            </div>
          </div>

          <nav className="menu-list" aria-label="Lối tắt tài khoản">
            <Link to="/history" className="menu-item">
              <Icon name="ticket" size={17} />
              <span className="grow">Vé của tôi</span>
              <Icon name="chevron-right" size={16} className="menu-item__chevron" />
            </Link>
            <Link to="/movies" className="menu-item">
              <Icon name="film" size={17} />
              <span className="grow">Khám phá phim</span>
              <Icon name="chevron-right" size={16} className="menu-item__chevron" />
            </Link>
            {authService.isStaffOrAdmin() && (
              <Link to={consolePath} className="menu-item">
                <Icon name="dashboard" size={17} />
                <span className="grow">Vào Cinex Console</span>
                <Icon name="chevron-right" size={16} className="menu-item__chevron" />
              </Link>
            )}
          </nav>
        </aside>

        <div className="stack gap-16">
          <section className="surface card-pad">
            <div className="profile-section-head">
              <div>
                <h2 className="h3">Thông tin cá nhân</h2>
                <p className="muted">Họ tên, email và số điện thoại dùng khi đặt vé.</p>
              </div>
              {!editing && (
                <button type="button" className="btn btn-outline btn-sm" onClick={startEditing}>
                  <Icon name="edit" size={14} />
                  Chỉnh sửa
                </button>
              )}
            </div>

            {profileNotice && <div className="form-success" style={{ marginBottom: 14 }}>{profileNotice}</div>}

            {editing ? (
              <form className="profile-form" onSubmit={handleProfileSubmit} noValidate>
                <div className="field">
                  <label htmlFor="profile-fullName">Họ tên</label>
                  <div className={`input-wrap${profileErrors.fullName ? ' input-wrap--error' : ''}`}>
                    <Icon name="user" size={17} />
                    <input
                      id="profile-fullName"
                      className="input"
                      value={profileForm.fullName}
                      onChange={(event) => {
                        setProfileForm((form) => ({ ...form, fullName: event.target.value }))
                        setProfileErrors((errors) => ({ ...errors, fullName: undefined }))
                      }}
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                      maxLength={100}
                      aria-invalid={Boolean(profileErrors.fullName)}
                      aria-describedby={profileErrors.fullName ? 'profile-fullName-error' : undefined}
                    />
                  </div>
                  <FieldError id="profile-fullName-error" message={profileErrors.fullName} />
                </div>

                <div className="field">
                  <label htmlFor="profile-email">Email</label>
                  <div className={`input-wrap${profileErrors.email ? ' input-wrap--error' : ''}`}>
                    <Icon name="mail" size={17} />
                    <input
                      id="profile-email"
                      className="input"
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => {
                        setProfileForm((form) => ({ ...form, email: event.target.value }))
                        setProfileErrors((errors) => ({ ...errors, email: undefined }))
                      }}
                      placeholder="ban@cinex.vn"
                      autoComplete="email"
                      maxLength={100}
                      aria-invalid={Boolean(profileErrors.email)}
                      aria-describedby={profileErrors.email ? 'profile-email-error' : undefined}
                    />
                  </div>
                  <FieldError id="profile-email-error" message={profileErrors.email} />
                </div>

                <div className="field">
                  <label htmlFor="profile-phone">Số điện thoại</label>
                  <div className={`input-wrap${profileErrors.phone ? ' input-wrap--error' : ''}`}>
                    <Icon name="phone" size={17} />
                    <input
                      id="profile-phone"
                      className="input"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(event) => {
                        setProfileForm((form) => ({ ...form, phone: event.target.value }))
                        setProfileErrors((errors) => ({ ...errors, phone: undefined }))
                      }}
                      placeholder="09xx xxx xxx"
                      autoComplete="tel"
                      maxLength={15}
                      aria-invalid={Boolean(profileErrors.phone)}
                      aria-describedby={profileErrors.phone ? 'profile-phone-error' : undefined}
                    />
                  </div>
                  <FieldError id="profile-phone-error" message={profileErrors.phone} />
                </div>

                {profileError && <div className="form-error">{profileError}</div>}

                <div className="profile-actions">
                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={cancelEditing}
                    disabled={savingProfile}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="profile-info__row">
                  <Icon name="user" size={16} />
                  <span className="profile-info__label">Tên đăng nhập</span>
                  <span className="profile-info__value">{user.username}</span>
                </div>
                <div className="profile-info__row">
                  <Icon name="mail" size={16} />
                  <span className="profile-info__label">Email</span>
                  <span className="profile-info__value">{user.email}</span>
                </div>
                <div className="profile-info__row">
                  <Icon name="phone" size={16} />
                  <span className="profile-info__label">Số điện thoại</span>
                  <span className="profile-info__value">{user.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="profile-info__row">
                  <Icon name="calendar" size={16} />
                  <span className="profile-info__label">Ngày tham gia</span>
                  <span className="profile-info__value">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            )}
          </section>

          <section className="surface card-pad">
            <div className="profile-section-head">
              <div>
                <h2 className="h3">Đổi mật khẩu</h2>
                <p className="muted">Dùng mật khẩu riêng cho Cinex và thay đổi định kỳ.</p>
              </div>
              <Icon name="shield" size={18} />
            </div>

            {passwordNotice && <div className="form-success" style={{ marginBottom: 14 }}>{passwordNotice}</div>}

            <form className="profile-form" onSubmit={handlePasswordSubmit} noValidate>
              <div className="field">
                <label htmlFor="pwd-currentPassword">Mật khẩu hiện tại</label>
                <div className={`input-wrap${passwordErrors.currentPassword ? ' input-wrap--error' : ''}`}>
                  <Icon name="lock" size={17} />
                  <input
                    id="pwd-currentPassword"
                    className="input"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => {
                      setPasswordForm((form) => ({ ...form, currentPassword: event.target.value }))
                      setPasswordErrors((errors) => ({ ...errors, currentPassword: undefined }))
                    }}
                    placeholder="Nhập mật khẩu đang dùng"
                    autoComplete="current-password"
                    aria-invalid={Boolean(passwordErrors.currentPassword)}
                    aria-describedby={passwordErrors.currentPassword ? 'pwd-currentPassword-error' : undefined}
                  />
                </div>
                <FieldError id="pwd-currentPassword-error" message={passwordErrors.currentPassword} />
              </div>

              <div className="field">
                <label htmlFor="pwd-newPassword">Mật khẩu mới</label>
                <div className={`input-wrap${passwordErrors.newPassword ? ' input-wrap--error' : ''}`}>
                  <Icon name="lock" size={17} />
                  <input
                    id="pwd-newPassword"
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(event) => {
                      setPasswordForm((form) => ({ ...form, newPassword: event.target.value }))
                      setPasswordErrors((errors) => ({ ...errors, newPassword: undefined }))
                    }}
                    placeholder="Tối thiểu 6 ký tự"
                    autoComplete="new-password"
                    aria-invalid={Boolean(passwordErrors.newPassword)}
                    aria-describedby={passwordErrors.newPassword ? 'pwd-newPassword-error' : undefined}
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
                <FieldError id="pwd-newPassword-error" message={passwordErrors.newPassword} />
              </div>

              <div className="field">
                <label htmlFor="pwd-confirmPassword">Nhập lại mật khẩu mới</label>
                <div className={`input-wrap${passwordErrors.confirmPassword ? ' input-wrap--error' : ''}`}>
                  <Icon name="lock" size={17} />
                  <input
                    id="pwd-confirmPassword"
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(event) => {
                      setPasswordForm((form) => ({ ...form, confirmPassword: event.target.value }))
                      setPasswordErrors((errors) => ({ ...errors, confirmPassword: undefined }))
                    }}
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                    aria-invalid={Boolean(passwordErrors.confirmPassword)}
                    aria-describedby={passwordErrors.confirmPassword ? 'pwd-confirmPassword-error' : undefined}
                  />
                </div>
                <FieldError id="pwd-confirmPassword-error" message={passwordErrors.confirmPassword} />
              </div>

              {passwordError && <div className="form-error">{passwordError}</div>}

              <div className="profile-actions">
                <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                  {savingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
