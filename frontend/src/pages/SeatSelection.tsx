import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { bookingService, type SeatDraft } from '../services/bookingService'
import { authService } from '../services/authService'
import type { Showtime, ShowtimeSeat } from '../types/Admin'
import { formatDuration, formatVnd } from '../utils/format'
import { errorMessage, formatDateLong, formatTime } from '../utils/consoleFormat'
import { Icon } from '../components/ui/Icon'
import { PageBar } from '../components/ui/PageBar'

const MAX_SEATS = 8

function rowLabel(rowNumber: number) {
  return rowNumber >= 1 && rowNumber <= 26 ? String.fromCharCode(64 + rowNumber) : `R${rowNumber}`
}

export function SeatSelection() {
  const { showtimeId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const numericShowtimeId = Number(showtimeId)

  const [showtime, setShowtime] = useState<Showtime | null>(null)
  const [seats, setSeats] = useState<ShowtimeSeat[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!Number.isFinite(numericShowtimeId)) {
      setError('Suất chiếu không hợp lệ')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([
      bookingService.getShowtime(numericShowtimeId),
      bookingService.getSeats(numericShowtimeId),
    ])
      .then(([showtimeData, seatData]) => {
        if (cancelled) return
        setShowtime(showtimeData)
        setSeats(seatData)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Không tải được sơ đồ ghế'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [numericShowtimeId, reloadKey])

  const rows = useMemo(() => {
    const map = new Map<number, ShowtimeSeat[]>()
    seats.forEach((seat) => {
      const list = map.get(seat.rowNumber) ?? []
      list.push(seat)
      map.set(seat.rowNumber, list)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([rowNumber, items]) => ({
        rowNumber,
        label: rowLabel(rowNumber),
        seats: items.sort((a, b) => a.columnNumber - b.columnNumber),
      }))
  }, [seats])

  const selectedSeats = useMemo(
    () => seats.filter((seat) => selected.includes(seat.id)),
    [seats, selected],
  )
  const total = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0)
  const selectedLabels = selectedSeats.map((seat) => seat.seatCode)

  const toggleSeat = (seat: ShowtimeSeat) => {
    if (seat.status !== 'AVAILABLE') return
    setSelected((current) => {
      if (current.includes(seat.id)) return current.filter((id) => id !== seat.id)
      if (current.length >= MAX_SEATS) return current
      return [...current, seat.id]
    })
  }

  const handleContinue = () => {
    if (selectedSeats.length === 0) return
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    const draft: SeatDraft = {
      showtimeId: numericShowtimeId,
      seatIds: selectedSeats.map((seat) => seat.id),
      seatCodes: selectedLabels,
      seatAmount: total,
    }
    sessionStorage.setItem('seatHoldDraft', JSON.stringify(draft))
    navigate('/booking/confirm')
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-screen">
          <span className="spinner" />
          Đang tải sơ đồ ghế...
        </div>
      </div>
    )
  }

  if (!showtime || error) {
    return (
      <div className="container">
        <PageBar title="Chọn ghế" backTo="/showtimes" />
        <div className="empty-state">
          <Icon name="seat" size={40} />
          <strong>Không tải được suất chiếu</strong>
          <p>{error || 'Suất chiếu có thể đã bị hủy hoặc không tồn tại.'}</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setReloadKey((v) => v + 1)}>
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container seat-page">
      <PageBar
        title="Chọn ghế"
        backTo={`/showtimes?movieId=${showtime.movieId}`}
        actions={
          <span className="badge badge-muted">
            {formatTime(showtime.startTime)} · {showtime.auditoriumName}
          </span>
        }
      />

      <div className="seat-layout">
        <div className="surface card-pad">
          <div className="movie-mini" style={{ marginBottom: 16 }}>
            <img src={showtime.posterUrl} alt={showtime.movieTitle} />
            <div>
              <span className="eyebrow">Đang chiếu</span>
              <div className="movie-mini__title">{showtime.movieTitle}</div>
              <div className="meta-row" style={{ marginTop: 5 }}>
                <span>{showtime.cinemaName}</span>
                <span className="meta-dot" />
                <span>{showtime.auditoriumName}</span>
              </div>
              <div className="meta-row" style={{ marginTop: 3 }}>
                <Icon name="clock" size={12} />
                {formatTime(showtime.startTime)} · {formatDuration(showtime.durationMinutes)}
              </div>
              <div className="meta-row" style={{ marginTop: 3 }}>
                <Icon name="calendar" size={12} />
                {formatDateLong(showtime.startTime)}
              </div>
            </div>
          </div>

          <div className="screen-wrap">
            <div className="screen-curve" />
            <span className="screen-label">Màn hình</span>
          </div>

          <div className="seat-map" aria-label="Sơ đồ ghế">
            {rows.map((row) => (
              <div key={row.rowNumber} className="seat-row">
                <span className="seat-row__label">{row.label}</span>
                {row.seats.map((seat) => {
                  const isSelected = selected.includes(seat.id)
                  const isCouple = seat.seatType === 'COUPLE'
                  const isVip = seat.seatType === 'VIP'
                  const disabled = seat.status !== 'AVAILABLE'
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      title={`${seat.seatCode} · ${formatVnd(Number(seat.price))}`}
                      className={`seat ${isVip ? 'is-vip' : ''} ${isCouple ? 'is-couple' : ''} ${
                        disabled ? 'is-booked' : ''
                      } ${isSelected ? 'is-selected' : ''}`}
                      disabled={disabled}
                      onClick={() => toggleSeat(seat)}
                      aria-label={`Ghế ${seat.seatCode}`}
                    >
                      {seat.columnNumber}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="seat-legend">
            <span className="seat-legend__item">
              <span className="seat-legend__swatch" /> Thường
            </span>
            <span className="seat-legend__item">
              <span className="seat-legend__swatch is-vip" /> VIP
            </span>
            <span className="seat-legend__item">
              <span className="seat-legend__swatch is-selected" /> Đang chọn
            </span>
            <span className="seat-legend__item">
              <span className="seat-legend__swatch is-booked" /> Đã đặt / đang giữ
            </span>
          </div>

          <button
            type="button"
            className="btn-link"
            style={{ marginTop: 12 }}
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Làm mới sơ đồ ghế
          </button>
        </div>

        <aside>
          <div className="seat-summary surface card-pad">
            <div className="seat-summary__row">
              <div>
                <div className="seat-summary__label">Ghế đã chọn</div>
                <div className="seat-summary__seats">
                  {selectedLabels.length > 0 ? selectedLabels.join(', ') : 'Chưa chọn ghế'}
                </div>
              </div>
              <span className="badge badge-accent">
                {selected.length}/{MAX_SEATS}
              </span>
            </div>

            <div className="summary-line">
              <span>Suất chiếu</span>
              <strong>{formatTime(showtime.startTime)}</strong>
            </div>
            <div className="summary-line">
              <span>Rạp</span>
              <strong>{showtime.cinemaName}</strong>
            </div>
            <div className="summary-line">
              <span>Phòng</span>
              <strong>{showtime.auditoriumName}</strong>
            </div>
            <div className="summary-line is-total">
              <span>Tạm tính</span>
              <strong>{formatVnd(total)}</strong>
            </div>

            <button
              type="button"
              className="btn btn-gradient btn-block btn-lg"
              disabled={selected.length === 0}
              onClick={handleContinue}
              style={{ marginTop: 14 }}
            >
              Tiếp tục
              <Icon name="arrow-right" size={17} />
            </button>
            <p className="form-hint" style={{ marginTop: 10, textAlign: 'center' }}>
              Ghế chỉ được giữ sau khi thanh toán thành công.
            </p>
          </div>
        </aside>
      </div>

      <div className="seat-mobile-bar">
        <div className="seat-mobile-bar__info">
          <div className="seat-summary__label">Tạm tính</div>
          <div className="seat-summary__value">{formatVnd(total)}</div>
          <div className="seat-summary__seats">
            {selectedLabels.length > 0 ? selectedLabels.join(', ') : 'Chưa chọn ghế'}
          </div>
        </div>
        <button type="button" className="btn btn-gradient" disabled={selected.length === 0} onClick={handleContinue}>
          Tiếp tục
          <Icon name="arrow-right" size={17} />
        </button>
      </div>
    </div>
  )
}
