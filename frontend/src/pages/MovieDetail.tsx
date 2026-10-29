import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMovie, useMovies } from '../hooks/useMovies'
import { useShowtimes } from '../hooks/useShowtimes'
import { formatDuration, formatVnd } from '../utils/format'
import { formatTime } from '../utils/consoleFormat'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { MovieCard } from '../components/ui/MovieCard'
import { SectionHeader } from '../components/ui/SectionHeader'

export function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { movie, loading } = useMovie(id)
  const { movies } = useMovies()
  const { showtimes } = useShowtimes(movie?.id)
  const [expanded, setExpanded] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)

  if (loading) {
    return (
      <div className="container">
        <div className="loading-screen">
          <span className="spinner" />
          Đang tải thông tin phim...
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="container">
        <EmptyState
          icon="film"
          title="Không tìm thấy phim"
          description="Phim có thể đã ngừng chiếu hoặc đường dẫn không đúng."
          action={
            <Link to="/movies" className="btn btn-primary btn-sm">
              Về danh sách phim
            </Link>
          }
        />
      </div>
    )
  }

  const slots = showtimes.slice(0, 4)
  const related = movies.filter((item) => item.id !== movie.id).slice(0, 5)

  return (
    <div className="container">
      <section className="detail-hero">
        <img className="detail-hero__bg" src={movie.backdropUrl} alt="" />
        <div className="detail-hero__shade" />
        <button
          type="button"
          className="page-bar__back"
          style={{ position: 'absolute', zIndex: 3, top: 16, left: 18 }}
          aria-label="Quay lại"
          onClick={() => navigate(-1)}
        >
          <Icon name="chevron-left" size={20} />
        </button>
        <div className="detail-hero__inner">
          <img className="detail-hero__poster" src={movie.posterUrl} alt={movie.title} />
          <div>
            <div className="home-hero__badges">
              <span className="badge badge-accent">{movie.match}% AI Match</span>
              <span className="badge badge-warning">
                <Icon name="star" size={10} filled /> {movie.rating.toFixed(1)}
              </span>
              <span className="badge badge-primary">{movie.ageRating}+</span>
            </div>
            <h1 className="detail-title">{movie.title}</h1>
            <div className="detail-meta">
              <span>{movie.genre}</span>
              <span className="meta-dot" />
              <span>{formatDuration(movie.durationMinutes)}</span>
              <span className="meta-dot" />
              <span>{movie.language}</span>
            </div>
            <div className="pill-row">
              {movie.formats.map((format) => (
                <span key={format} className="badge badge-muted">
                  {format}
                </span>
              ))}
            </div>
            <div className="detail-actions">
              <Link to={`/showtimes?movieId=${movie.id}`} className="btn btn-accent">
                <Icon name="ticket" size={17} />
                Đặt vé
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => setTrailerOpen(true)}>
                <Icon name="play" size={16} />
                Xem trailer
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="detail-body section">
        <div>
          <section className="detail-section">
            <h2>Nội dung phim</h2>
            <p className={`detail-desc ${expanded ? '' : 'is-clamped'}`}>{movie.description}</p>
            <button type="button" className="btn-link" style={{ marginTop: 8 }} onClick={() => setExpanded((value) => !value)}>
              {expanded ? 'Thu gọn' : 'Đọc thêm'}
            </button>
          </section>

          <section className="detail-section">
            <h2>Official Trailer</h2>
            <button type="button" className="trailer-frame" onClick={() => setTrailerOpen(true)} aria-label="Xem trailer">
              <img src={movie.backdropUrl} alt="" />
              <span className="trailer-frame__play">
                <Icon name="play" size={22} filled />
              </span>
            </button>
          </section>

          <section className="detail-section">
            <h2>Diễn viên</h2>
            <div className="cast-list">
              {movie.cast.map((member) => (
                <div key={member.name} className="cast-item">
                  <img src={member.avatar} alt={member.name} loading="lazy" />
                  <span>{member.name}</span>
                  <small>{member.role}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h2>Thông tin</h2>
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <span>Ngày khởi chiếu</span>
                <strong>{movie.releaseDate}</strong>
              </div>
              <div className="detail-info-item">
                <span>Thời lượng</span>
                <strong>{formatDuration(movie.durationMinutes)}</strong>
              </div>
              <div className="detail-info-item">
                <span>Độ tuổi</span>
                <strong>{movie.ageRating}+</strong>
              </div>
              <div className="detail-info-item">
                <span>Ngôn ngữ</span>
                <strong>{movie.language}</strong>
              </div>
            </div>
          </section>
        </div>

        <aside className="booking-side">
          <div className="surface card-pad">
            <div className="row between" style={{ marginBottom: 14 }}>
              <h3 className="h3">Suất chiếu hôm nay</h3>
              <span className="badge badge-success">Còn vé</span>
            </div>
            <div className="row gap-6" style={{ marginBottom: 14, color: 'var(--muted)', fontSize: 12 }}>
              <Icon name="location" size={14} />
              {slots[0]?.cinemaName ?? 'Cinex'}
            </div>
            <div className="showtime-slots" style={{ marginBottom: 16 }}>
              {slots.length === 0 && (
                <p className="muted" style={{ fontSize: 13 }}>
                  Chưa có suất chiếu cho phim này.
                </p>
              )}
              {slots.map((slot, index) => (
                <button
                  key={slot.id}
                  type="button"
                  className={`slot ${index === 0 ? 'is-active' : ''}`}
                  onClick={() => navigate(`/seats/${slot.id}`)}
                >
                  <strong>{formatTime(slot.startTime)}</strong>
                  <span>{formatVnd(Number(slot.basePrice))}</span>
                </button>
              ))}
            </div>
            <Link to={`/showtimes?movieId=${movie.id}`} className="btn btn-primary btn-block">
              Chọn suất chiếu khác
            </Link>
            <div className="secure-note" style={{ marginTop: 14 }}>
              <Icon name="shield" size={15} />
              Thanh toán an toàn, ghế được giữ ngay khi thanh toán xong.
            </div>
          </div>
        </aside>
      </div>

      <section className="section">
        <SectionHeader title="Phim tương tự" action="Xem tất cả" actionTo="/movies" />
        <div className="h-scroll">
          {related.map((item) => (
            <MovieCard key={item.id} movie={item} showMatch={false} />
          ))}
        </div>
      </section>

      {trailerOpen && (
        <div className="modal-backdrop" onClick={() => setTrailerOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal__close" onClick={() => setTrailerOpen(false)} aria-label="Đóng">
              <Icon name="close" size={20} />
            </button>
            <div className="trailer-frame" style={{ borderRadius: 16 }}>
              <iframe
                src={movie.trailerUrl}
                title={`Trailer ${movie.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 0 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
