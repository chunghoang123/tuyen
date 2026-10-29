import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { bookingService } from '../services/bookingService'
import type { Booking } from '../types/Admin'
import { formatVnd } from '../utils/format'
import { errorMessage, formatDateLong, formatTime } from '../utils/consoleFormat'
import { Icon } from '../components/ui/Icon'
import { PageBar } from '../components/ui/PageBar'
import { QrImage } from '../components/ui/QrImage'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  CONFIRMED: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
}

export function TicketView() {
  const { bookingId } = useParams()
  const [searchParams] = useSearchParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const justPaid = searchParams.get('paid') === '1'

  useEffect(() => {
    const code = bookingId ?? sessionStorage.getItem('pendingBookingCode') ?? ''
    if (!code) {
      setLoading(false)
      setError('Không tìm thấy mã đơn đặt vé')
      return
    }
    let cancelled = false
    bookingService
      .getBooking(code)
      .then((data) => {
        if (!cancelled) setBooking(data)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Không tìm thấy vé'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [bookingId])

  if (loading) {
    return (
      <div className="container">
        <div className="loading-screen">
          <span className="spinner" />
          Đang tải vé...
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container">
        <PageBar title="Vé của tôi" backTo="/history" />
        <div className="empty-state">
          <Icon name="ticket" size={40} />
          <strong>Không tìm thấy vé</strong>
          <p>{error || 'Vé có thể đã bị hủy hoặc mã vé không đúng.'}</p>
          <Link to="/history" className="btn btn-primary btn-sm">
            Xem vé của tôi
          </Link>
        </div>
      </div>
    )
  }

  const showtime = booking.showtime
  const seats = booking.seats.map((seat) => seat.seatCode)
  const total = Number(booking.totalAmount)
  const code = booking.ticketCode ?? booking.bookingCode
  const isPaid = booking.status === 'CONFIRMED'
  const statusLabel = STATUS_LABEL[booking.status] ?? booking.status

  const qrValue = booking.ticketCode
    ? `CINEX|${booking.ticketCode}|${booking.bookingCode}`
    : booking.bookingCode

  const handleShare = async () => {
    const text = `Vé Cinex ${code} - ${showtime.movieTitle} - ${formatTime(showtime.startTime)} - Ghế ${seats.join(', ')}`
    if (navigator.share) {
      await navigator.share({ title: 'Vé Cinex', text })
    } else {
      await navigator.clipboard?.writeText(text)
    }
  }

  const handleDownload = () => {
    const text = [
      'CINEX E-TICKET',
      `Mã vé: ${code}`,
      `Mã đơn: ${booking.bookingCode}`,
      `Phim: ${showtime.movieTitle}`,
      `Rạp: ${showtime.cinemaName}`,
      `Phòng: ${showtime.auditoriumName}`,
      `Ngày: ${formatDateLong(showtime.startTime)}`,
      `Suất chiếu: ${formatTime(showtime.startTime)}`,
      `Ghế: ${seats.join(', ')}`,
      `Tổng tiền: ${formatVnd(total)}`,
      `Trạng thái: ${statusLabel}`,
    ].join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${code}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <PageBar title="Vé của tôi" backTo="/history" />

      {justPaid && isPaid && (
        <div className="surface card-pad" style={{ marginBottom: 16, borderColor: 'var(--success)' }}>
          <div className="row gap-10">
            <Icon name="check" size={18} />
            <strong>Đặt vé thành công!</strong>
            <span className="muted">Vé của bạn đã được phát hành.</span>
          </div>
        </div>
      )}

      <div className="ticket-wrap">
        <div className="eticket">
          <div className="eticket__top">
            <div className="eticket__brand">
              <span className="brand">
                <span className="brand__mark">
                  <Icon name="film" size={18} />
                </span>
                <span>
                  Cine<em>x</em>
                </span>
              </span>
              <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>{statusLabel}</span>
            </div>
            <span className="eyebrow">E-Ticket · {booking.bookingCode}</span>
            <h1 className="eticket__title">{showtime.movieTitle}</h1>
            <div className="eticket__grid">
              <div>
                <span>Rạp</span>
                <strong>{showtime.cinemaName}</strong>
              </div>
              <div>
                <span>Phòng chiếu</span>
                <strong>{showtime.auditoriumName}</strong>
              </div>
              <div>
                <span>Ngày</span>
                <strong>{formatDateLong(showtime.startTime)}</strong>
              </div>
              <div>
                <span>Giờ</span>
                <strong>{formatTime(showtime.startTime)}</strong>
              </div>
            </div>
          </div>

          <div className="eticket__seat">
            <span>Ghế</span>
            <strong>{seats.join(' · ')}</strong>
          </div>

          <div className="qr-box">
            <QrImage value={qrValue} size={150} alt="QR vé Cinex" />
          </div>

          <div className="eticket__foot">
            Quét mã QR tại quầy để nhận vé. Vui lòng có mặt trước 15 phút.
          </div>

          <span className="eticket__notch left" />
          <span className="eticket__notch right" />
        </div>

        <aside className="ticket-actions">
          <div className="surface card-pad">
            <h2 className="h3" style={{ marginBottom: 12 }}>
              Thông tin vé
            </h2>
            <div className="summary-line">
              <span>Mã vé</span>
              <strong>{code}</strong>
            </div>
            <div className="summary-line">
              <span>Mã đơn</span>
              <strong>{booking.bookingCode}</strong>
            </div>
            <div className="summary-line">
              <span>Ghế</span>
              <strong>{seats.join(', ')}</strong>
            </div>
            <div className="summary-line">
              <span>Tổng tiền</span>
              <strong>{formatVnd(total)}</strong>
            </div>
            <div className="summary-line">
              <span>Trạng thái</span>
              <strong style={{ color: isPaid ? 'var(--success)' : 'var(--warning)' }}>{statusLabel}</strong>
            </div>

            {booking.status === 'PENDING' && (
              <Link to={`/booking/payment?code=${booking.bookingCode}`} className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
                <Icon name="qr" size={16} />
                Tiếp tục thanh toán
              </Link>
            )}

            <div className="stack gap-10" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-primary btn-block" onClick={handleDownload}>
                <Icon name="download" size={16} />
                Tải vé
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => void handleShare()}>
                <Icon name="share" size={16} />
                Chia sẻ
              </button>
              <button type="button" className="btn btn-outline btn-block" onClick={() => window.print()}>
                <Icon name="ticket" size={16} />
                In vé
              </button>
            </div>
          </div>

          <Link to="/history" className="btn btn-ghost btn-block">
            Xem tất cả vé
          </Link>
          <Link to="/" className="btn btn-outline btn-block">
            Về trang chủ
          </Link>
        </aside>
      </div>
    </div>
  )
}
