import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMovies } from '../hooks/useMovies'
import { useShowtimes } from '../hooks/useShowtimes'
import type { Showtime } from '../types/Admin'
import { buildDates, formatDuration, formatVnd, localDateKey, todayLabel } from '../utils/format'
import { formatTime } from '../utils/consoleFormat'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { PageBar } from '../components/ui/PageBar'

export function ShowtimeList() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { movies } = useMovies()
  const dates = useMemo(() => buildDates(7), [])
  const [dateIndex, setDateIndex] = useState(0)
  const [cinemaId, setCinemaId] = useState<number | null>(null)

  const movieIdParam = searchParams.get('movieId')
  const selectedMovie = movieIdParam
    ? movies.find((item) => String(item.id) === movieIdParam) ?? null
    : null

  const { showtimes, loading } = useShowtimes(selectedMovie?.id)
  const activeDate = dates[dateIndex]

  const cinemas = useMemo(() => {
    const map = new Map<number, string>()
    showtimes.forEach((item) => map.set(item.cinemaId, item.cinemaName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [showtimes])

  const byDate = useMemo(
    () => showtimes.filter((item) => localDateKey(item.startTime) === activeDate.key),
    [showtimes, activeDate.key],
  )

  const visible = useMemo(
    () => byDate.filter((item) => cinemaId === null || item.cinemaId === cinemaId),
    [byDate, cinemaId],
  )

  if (loading) {
    return (
      <div className="container">
        <div className="loading-screen">
          <span className="spinner" />
          Đang tải lịch chiếu...
        </div>
      </div>
    )
  }

  if (!showtimes.length) {
    return (
      <div className="container">
        <EmptyState icon="calendar" title="Chưa có lịch chiếu" description="Vui lòng thử lại sau." />
      </div>
    )
  }

  const dateTabs = (
    <>
      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 className="h3">Chọn ngày</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {activeDate.weekday}, {activeDate.day}/{activeDate.month} · {todayLabel()}
        </span>
      </div>
      <div className="date-tabs" style={{ marginBottom: 16 }}>
        {dates.map((date, index) => (
          <button
            key={date.key}
            type="button"
            className={`date-tab ${index === dateIndex ? 'is-active' : ''}`}
            onClick={() => setDateIndex(index)}
          >
            <span>{date.weekday}</span>
            <strong>{date.day}</strong>
          </button>
        ))}
      </div>
    </>
  )

  const cinemaFilters = (
    <>
      <div className="row between" style={{ margin: '8px 0 10px' }}>
        <h2 className="h3">Chọn rạp</h2>
        <button type="button" className="btn-link" onClick={() => setCinemaId(null)}>
          Tất cả rạp
        </button>
      </div>
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        {cinemas.map((cinema) => (
          <button
            key={cinema.id}
            type="button"
            className={`chip ${cinemaId === cinema.id ? 'is-active' : ''}`}
            onClick={() => setCinemaId(cinemaId === cinema.id ? null : cinema.id)}
          >
            {cinema.name}
          </button>
        ))}
      </div>
    </>
  )

  const renderSlots = (slots: Showtime[]) => (
    <div className="showtime-slots">
      {slots.length === 0 && (
        <p className="muted" style={{ fontSize: 13 }}>
          Không có suất chiếu phù hợp.
        </p>
      )}
      {slots.map((slot) => (
        <button
          key={slot.id}
          type="button"
          className="slot"
          onClick={() => navigate(`/seats/${slot.id}?movieId=${slot.movieId}`)}
        >
          <strong>{formatTime(slot.startTime)}</strong>
          <span>{formatVnd(Number(slot.basePrice))}</span>
        </button>
      ))}
    </div>
  )

  // Chi tiết lịch chiếu của một phim cụ thể (được gọi từ trang phim).
  if (selectedMovie) {
    const movie = selectedMovie
    const slots = visible.filter((item) => item.movieId === movie.id)
    const slotsByCinema = cinemas.map((cinema) => ({
      cinema,
      slots: slots.filter((item) => item.cinemaId === cinema.id),
    }))

    return (
      <div className="container">
        <PageBar
          title="Lịch chiếu"
          backTo={`/movies/${movie.id}`}
          actions={
            <Link to={`/movies/${movie.id}`} className="header-icon" aria-label="Thông tin phim">
              <Icon name="info" size={19} />
            </Link>
          }
        />

        <div className="showtime-layout">
          <aside>
            <div className="showtime-summary">
              <img src={movie.posterUrl} alt={movie.title} />
              <div>
                <span className="eyebrow">Đang chiếu</span>
                <h2 className="h3" style={{ margin: '4px 0 6px' }}>
                  {movie.title}
                </h2>
                <div className="meta-row">
                  <span>{movie.genre}</span>
                  <span className="meta-dot" />
                  <span>{formatDuration(movie.durationMinutes)}</span>
                </div>
                <div className="pill-row" style={{ marginTop: 8 }}>
                  {movie.formats.map((format) => (
                    <span key={format} className="badge badge-muted">
                      {format}
                    </span>
                  ))}
                </div>
                <div className="row gap-6" style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12 }}>
                  <Icon name="calendar" size={14} />
                  {activeDate.weekday}, {activeDate.label}
                </div>
              </div>
            </div>
          </aside>

          <section>
            {dateTabs}
            {cinemaFilters}

            {slotsByCinema.map(({ cinema, slots: cinemaSlots }) =>
              cinemaSlots.length === 0 ? null : (
                <div key={cinema.id} className="cinema-block">
                  <div className="cinema-block__head">
                    <div>
                      <div className="cinema-block__name">{cinema.name}</div>
                      <div className="cinema-block__addr">
                        {cinemaSlots.length} suất chiếu · {cinemaSlots[0].auditoriumName}
                      </div>
                    </div>
                    <span className="badge badge-success">Còn vé</span>
                  </div>
                  {renderSlots(cinemaSlots)}
                </div>
              ),
            )}
            {slots.length === 0 && (
              <p className="muted">Không có suất chiếu cho phim này trong ngày đã chọn.</p>
            )}
          </section>
        </div>
      </div>
    )
  }

  // Tổng hợp lịch chiếu của tất cả phim đang chiếu.
  const visibleMovies = movies.filter((item) => item.status === 'NOW_SHOWING')

  return (
    <div className="container">
      <PageBar title="Lịch chiếu" backTo="/" />
      {dateTabs}
      {cinemaFilters}

      <div className="showtime-all">
        {visibleMovies.map((movie) => {
          const slots = visible.filter((item) => item.movieId === movie.id)
          if (slots.length === 0) return null
          return (
            <div key={movie.id} className="showtime-movie">
              <div className="showtime-movie__info">
                <img src={movie.posterUrl} alt={movie.title} />
                <div>
                  <h3 className="h3" style={{ margin: '0 0 4px' }}>
                    {movie.title}
                  </h3>
                  <div className="meta-row">
                    <span>{movie.genre}</span>
                    <span className="meta-dot" />
                    <span>{formatDuration(movie.durationMinutes)}</span>
                  </div>
                  <div className="pill-row" style={{ marginTop: 6 }}>
                    {movie.formats.map((format) => (
                      <span key={format} className="badge badge-muted">
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {renderSlots(slots)}
            </div>
          )
        })}
      </div>

      {visible.length === 0 && (
        <EmptyState
          icon="calendar"
          title="Không có suất chiếu"
          description="Không có suất chiếu phù hợp với ngày và rạp đã chọn."
        />
      )}
    </div>
  )
}
