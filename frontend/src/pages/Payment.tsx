import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { bookingService, type PayosPayment } from '../services/bookingService'
import type { Booking } from '../types/Admin'
import { formatVnd } from '../utils/format'
import { errorMessage, formatTime } from '../utils/consoleFormat'
import { Icon } from '../components/ui/Icon'
import { PageBar } from '../components/ui/PageBar'
import { QrImage } from '../components/ui/QrImage'

const POLL_INTERVAL = 3000
const MAX_POLLS = 200

export function Payment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [link, setLink] = useState<PayosPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState(0)
  const polling = useRef(false)

  const bookingCode = searchParams.get('code') ?? sessionStorage.getItem('pendingBookingCode') ?? ''

  const goToTicket = useCallback(
    (code: string) => {
      sessionStorage.removeItem('pendingBookingCode')
      navigate(`/ticket/${code}?paid=1`, { replace: true })
    },
    [navigate],
  )

  useEffect(() => {
    if (!bookingCode) {
      setLoading(false)
      return
    }
    let cancelled = false
    bookingService
      .getBooking(bookingCode)
      .then((data) => {
        if (cancelled) return
        setBooking(data)
        if (data.status === 'CONFIRMED') {
          goToTicket(data.bookingCode)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Không tải được thông tin đơn đặt vé'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [bookingCode, goToTicket])

  // Đếm ngược thời hạn thanh toán của đơn
  useEffect(() => {
    if (!booking?.expiresAt) {
      setRemaining(0)
      return
    }
    const tick = () => {
      const diff = new Date(booking.expiresAt as string).getTime() - Date.now()
      setRemaining(Math.max(0, Math.floor(diff / 1000)))
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [booking?.expiresAt])

  const pollStatus = useCallback(async () => {
    if (polling.current) return
    polling.current = true
    try {
      for (let i = 0; i < MAX_POLLS; i += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL))
        try {
          const data = await bookingService.syncPayosPayment(bookingCode)
          setBooking(data)
          if (data.status === 'CONFIRMED') {
            goToTicket(data.bookingCode)
            return
          }
          if (data.status === 'EXPIRED' || data.status === 'CANCELLED') {
            setError('Đơn đặt vé đã hết hạn hoặc bị hủy. Vui lòng chọn lại ghế.')
            return
          }
        } catch {
          // Bỏ qua lỗi mạng tạm thời và tiếp tục kiểm tra
        }
      }
    } finally {
      polling.current = false
    }
  }, [bookingCode, goToTicket])

  const handlePay = async () => {
    setCreating(true)
    setError('')
    try {
      const payment = await bookingService.createPayosPayment(bookingCode)
      setLink(payment)
      void pollStatus()
    } catch (err) {
      setError(errorMessage(err, 'Không tạo được mã thanh toán PayOS'))
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-screen">
          <span className="spinner" />
          Đang tải thông tin thanh toán...
        </div>
      </div>
    )
  }

  if (!bookingCode || !booking) {
    return (
      <div className="container">
        <PageBar title="Thanh toán" backTo="/movies" />
        <div className="empty-state">
          <Icon name="card" size={40} />
          <strong>Chưa có giao dịch nào</strong>
          <p>{error || 'Hãy chọn ghế và xác nhận đặt vé trước khi thanh toán.'}</p>
          <Link to="/movies" className="btn btn-primary btn-sm">
            Chọn phim
          </Link>
        </div>
      </div>
    )
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const showtime = booking.showtime

  return (
    <div className="container">
      <PageBar title="Thanh toán" backTo="/booking/confirm" />

      <div className="checkout-layout">
        <div className="stack gap-16">
          <div className="movie-mini">
            <img src={showtime.posterUrl} alt={showtime.movieTitle} />
            <div>
              <span className="eyebrow">Thanh toán an toàn</span>
              <div className="movie-mini__title">{showtime.movieTitle}</div>
              <div className="meta-row" style={{ marginTop: 5 }}>
                <span>{showtime.cinemaName}</span>
                <span className="meta-dot" />
                <span>{showtime.auditoriumName}</span>
              </div>
              <div className="meta-row" style={{ marginTop: 3 }}>
                <Icon name="calendar" size={12} />
                {formatTime(showtime.startTime)} · Mã đơn {booking.bookingCode}
              </div>
            </div>
          </div>

          <section>
            <h2 className="h3" style={{ marginBottom: 12 }}>
              Phương thức thanh toán
            </h2>
            <div className="pay-method is-active" style={{ cursor: 'default' }}>
              <span className="pay-method__icon" style={{ color: '#22d3ee' }}>
                <Icon name="qr" size={22} />
              </span>
              <span>
                <span className="pay-method__name">PayOS</span>
                <span className="pay-method__desc">Quét mã QR hoặc mở cổng thanh toán PayOS</span>
              </span>
              <span className="pay-method__radio" />
            </div>

            {link && (
              <div className="surface card-pad" style={{ marginTop: 14, textAlign: 'center' }}>
                {link.qrCode ? (
                  <>
                    <QrImage value={link.qrCode} size={220} alt="QR thanh toán PayOS" />
                    <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
                      Mở ứng dụng ngân hàng và quét mã để thanh toán{' '}
                      <strong style={{ color: 'var(--text)' }}>{formatVnd(Number(link.amount))}</strong>.
                    </p>
                  </>
                ) : (
                  <p className="muted" style={{ fontSize: 13 }}>
                    Mã thanh toán đã được tạo trước đó. Mở cổng PayOS bên dưới để quét mã QR và hoàn tất.
                  </p>
                )}
                <a
                  className="btn btn-outline btn-block"
                  href={link.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginTop: 10 }}
                >
                  <Icon name="globe" size={15} />
                  Mở trang thanh toán PayOS
                </a>
                <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                  Đang chờ PayOS xác nhận thanh toán... Trang sẽ tự chuyển khi nhận được tiền.
                </p>
              </div>
            )}

            {remaining > 0 && (
              <p className="form-hint" style={{ marginTop: 10 }}>
                Ghế chỉ được giữ sau khi thanh toán thành công. Vui lòng hoàn tất trong{' '}
                {minutes}:{seconds.toString().padStart(2, '0')} phút.
              </p>
            )}
          </section>

          <div className="secure-note">
            <Icon name="shield" size={16} />
            Thông tin thanh toán của bạn được mã hóa theo chuẩn PCI DSS.
          </div>
        </div>

        <aside className="checkout-aside">
          <div className="surface card-pad">
            <h2 className="h3" style={{ marginBottom: 12 }}>
              Chi tiết thanh toán
            </h2>
            <div className="summary-line">
              <span>Mã đơn</span>
              <strong>{booking.bookingCode}</strong>
            </div>
            <div className="summary-line">
              <span>Ghế</span>
              <strong>{booking.seats.map((seat) => seat.seatCode).join(', ')}</strong>
            </div>
            <div className="summary-line">
              <span>Suất chiếu</span>
              <strong>{formatTime(showtime.startTime)}</strong>
            </div>
            <div className="summary-line">
              <span>Rạp</span>
              <strong>{showtime.cinemaName}</strong>
            </div>
            <div className="summary-line is-total">
              <span>Tổng cộng</span>
              <strong>{formatVnd(Number(booking.totalAmount))}</strong>
            </div>

            {error && (
              <p className="form-error" style={{ marginTop: 10 }}>
                {error}
              </p>
            )}

            {!link ? (
              <button
                type="button"
                className="btn btn-gradient btn-block btn-lg"
                style={{ marginTop: 14 }}
                disabled={creating || booking.status !== 'PENDING'}
                onClick={() => void handlePay()}
              >
                {creating ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Đang tạo mã thanh toán...
                  </>
                ) : (
                  <>
                    <Icon name="qr" size={16} />
                    Thanh toán {formatVnd(Number(booking.totalAmount))}
                  </>
                )}
              </button>
            ) : (
              <Link to={`/ticket/${booking.bookingCode}`} className="btn btn-ghost btn-block" style={{ marginTop: 14 }}>
                <Icon name="ticket" size={16} />
                Xem vé của tôi
              </Link>
            )}
            <p className="form-hint" style={{ marginTop: 10, textAlign: 'center' }}>
              Bằng việc thanh toán, bạn đồng ý với điều khoản của Cinex.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
