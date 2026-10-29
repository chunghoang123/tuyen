import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingService } from '../services/bookingService'
import { authService } from '../services/authService'
import type { Booking } from '../types/Admin'
import { formatVnd } from '../utils/format'
import { errorMessage, formatTime } from '../utils/consoleFormat'
import { Icon } from '../components/ui/Icon'
import { PageBar } from '../components/ui/PageBar'
import { openChat } from '../components/chat/ChatWidget'

const tabs = [
  { value: 'UPCOMING', label: 'Sắp chiếu' },
  { value: 'COMPLETED', label: 'Đã xem' },
] as const

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  CONFIRMED: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
}

export function BookingHistory() {
  const [tab, setTab] = useState<'UPCOMING' | 'COMPLETED'>('UPCOMING')
  const [items, setItems] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const authenticated = authService.isAuthenticated()

  useEffect(() => {
    if (!authenticated) {
      setLoading(false)
      return
    }
    let cancelled = false
    bookingService
      .getMyBookings()
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Không tải được danh sách vé'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authenticated])

  const { upcoming, completed } = useMemo(() => {
    const now = Date.now()
    const upcomingItems = items.filter(
      (booking) =>
        booking.status === 'PENDING' ||
        (booking.status === 'CONFIRMED' && new Date(booking.showtime.startTime).getTime() >= now),
    )
    return {
      upcoming: upcomingItems,
      completed: items.filter((booking) => !upcomingItems.includes(booking)),
    }
  }, [items])

  const visible = tab === 'UPCOMING' ? upcoming : completed

  if (!authenticated) {
    return (
      <div className="container">
        <PageBar title="Vé của tôi" backTo="/" />
        <div className="empty-state">
          <Icon name="ticket" size={40} />
          <strong>Đăng nhập để xem vé</strong>
          <p>Bạn cần đăng nhập để xem lịch sử và vé điện tử đã đặt.</p>
          <Link to="/login" state={{ from: '/history' }} className="btn btn-primary btn-sm">
            Đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <PageBar title="Vé của tôi" backTo="/" />

      <div className="history-layout">
        <div>
          <div className="tabs" style={{ marginBottom: 16 }}>
            {tabs.map((item) => (
              <button
                key={item.value}
                type="button"
                className={tab === item.value ? 'is-active' : ''}
                onClick={() => setTab(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-screen">
              <span className="spinner" />
              Đang tải vé...
            </div>
          ) : error ? (
            <div className="empty-state">
              <Icon name="alert" size={40} />
              <strong>Không tải được vé</strong>
              <p>{error}</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <Icon name="ticket" size={40} />
              <strong>Chưa có vé nào</strong>
              <p>Đặt vé đầu tiên của bạn để bắt đầu hành trình điện ảnh.</p>
              <Link to="/movies" className="btn btn-primary btn-sm">
                Khám phá phim
              </Link>
            </div>
          ) : (
            <div>
              {visible.map((booking) => {
                const showtime = booking.showtime
                const seats = booking.seats.map((seat) => seat.seatCode)
                const canViewTicket = booking.status === 'CONFIRMED'
                const badgeClass =
                  booking.status === 'CONFIRMED'
                    ? 'badge-success'
                    : booking.status === 'PENDING'
                      ? 'badge-warning'
                      : 'badge-muted'
                return (
                  <div key={booking.id} className="booking-item">
                    <img src={showtime.posterUrl} alt={showtime.movieTitle} loading="lazy" />
                    <div className="booking-item__body">
                      <div className="row between gap-8">
                        <div className="booking-item__title">{showtime.movieTitle}</div>
                        <span className={`badge ${badgeClass}`}>
                          {STATUS_LABEL[booking.status] ?? booking.status}
                        </span>
                      </div>
                      <div className="booking-item__meta">
                        {showtime.cinemaName} · {showtime.auditoriumName}
                      </div>
                      <div className="booking-item__meta">
                        <Icon name="calendar" size={12} /> {formatTime(showtime.startTime)} · Ghế{' '}
                        {seats.join(', ')}
                      </div>
                      <div className="row between gap-8" style={{ marginTop: 4 }}>
                        <span className="booking-item__meta">Mã: {booking.bookingCode}</span>
                        <strong style={{ fontSize: 13 }}>{formatVnd(Number(booking.totalAmount))}</strong>
                      </div>
                      <div className="booking-item__actions">
                        {booking.status === 'PENDING' ? (
                          <Link
                            to={`/booking/payment?code=${booking.bookingCode}`}
                            className="btn btn-accent btn-sm"
                          >
                            <Icon name="qr" size={14} />
                            Thanh toán
                          </Link>
                        ) : canViewTicket ? (
                          <Link to={`/ticket/${booking.bookingCode}`} className="btn btn-accent btn-sm">
                            <Icon name="qr" size={14} />
                            Xem vé
                          </Link>
                        ) : (
                          <Link to={`/movies/${showtime.movieId}`} className="btn btn-ghost btn-sm">
                            Đặt lại
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <aside className="hide-mobile">
          <div className="promo-banner">
            <span className="eyebrow">Cinex Rewards</span>
            <h3>Bạn có 1.280 điểm</h3>
            <p>Đổi điểm lấy combo bắp nước và vé xem phim miễn phí.</p>
            <Link to="/profile" className="btn btn-accent btn-sm" style={{ marginTop: 14 }}>
              Xem ưu đãi
            </Link>
          </div>

          <div className="surface card-pad" style={{ marginTop: 16 }}>
            <h3 className="h3" style={{ marginBottom: 10 }}>
              Cần hỗ trợ?
            </h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
              Liên hệ Cinex qua hotline 1900 1234 hoặc chat với trợ lý AI.
            </p>
            <button type="button" className="btn btn-ghost btn-block btn-sm" onClick={openChat}>
              <Icon name="chat" size={15} />
              Chat với Cinex AI
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
