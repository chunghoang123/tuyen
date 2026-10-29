import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMovies } from '../hooks/useMovies'
import { cinemas, quickGenres } from '../data/mockData'
import { authService } from '../services/authService'
import { formatDuration } from '../utils/format'
import { Avatar } from '../components/ui/Avatar'
import { Icon } from '../components/ui/Icon'
import { MovieCard } from '../components/ui/MovieCard'
import { SectionHeader } from '../components/ui/SectionHeader'

export function Home() {
  const { movies } = useMovies()
  const session = authService.getUser()
  const greetingName = session ? session.fullName || session.username : 'Khách'
  const [heroIndex, setHeroIndex] = useState(0)
  const featured = useMemo(() => movies.filter((movie) => movie.status === 'NOW_SHOWING').slice(0, 3), [movies])
  const hero = featured[heroIndex % Math.max(featured.length, 1)] ?? movies[0]

  useEffect(() => {
    if (featured.length < 2) return
    const timer = window.setInterval(() => setHeroIndex((current) => (current + 1) % featured.length), 8000)
    return () => window.clearInterval(timer)
  }, [featured.length])

  if (!hero) return null

  return (
    <div className="container">
      <div className="greeting">
        <div className="greeting__left">
          <Avatar alt={greetingName} />
          <div>
            <div className="greeting__hello">Chào buổi tối,</div>
            <div className="greeting__name">{greetingName}</div>
          </div>
        </div>
        <Link to="/history" className="header-icon" aria-label="Thông báo">
          <Icon name="bell" size={19} />
        </Link>
      </div>

      <section className="home-hero" aria-label="Phim nổi bật">
        <img className="home-hero__bg" src={hero.backdropUrl} alt="" />
        <div className="home-hero__shade" />
        <div className="home-hero__content">
          <div className="home-hero__badges">
            <span className="badge badge-accent">{hero.match}% AI Match</span>
            <span className="badge badge-warning">
              <Icon name="star" size={10} filled /> {hero.rating.toFixed(1)}
            </span>
            <span className="badge badge-muted">{hero.formats[0]}</span>
          </div>
          <h1 className="home-hero__title">{hero.title}</h1>
          <div className="home-hero__meta">
            <span>{hero.genre}</span>
            <span className="meta-dot" />
            <span>{formatDuration(hero.durationMinutes)}</span>
            <span className="meta-dot" />
            <span>{hero.ageRating}+</span>
          </div>
          <p className="home-hero__desc">{hero.description}</p>
          <div className="home-hero__actions">
            <Link to={`/showtimes?movieId=${hero.id}`} className="btn btn-accent">
              <Icon name="ticket" size={17} />
              Đặt vé ngay
            </Link>
            <Link to={`/movies/${hero.id}`} className="btn btn-ghost">
              <Icon name="info" size={17} />
              Chi tiết
            </Link>
          </div>
          <div className="home-hero__dots">
            {featured.map((movie, index) => (
              <button
                key={movie.id}
                type="button"
                className={`home-hero__dot ${index === heroIndex % featured.length ? 'is-active' : ''}`}
                aria-label={`Xem ${movie.title}`}
                onClick={() => setHeroIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="quick-cats section-tight" role="tablist" aria-label="Thể loại">
        {quickGenres.map((genre, index) => (
          <button key={genre} type="button" className={`chip ${index === 0 ? 'is-active' : ''}`}>
            {genre}
          </button>
        ))}
      </div>

      <div className="home-desktop-grid section">
        <section>
          <SectionHeader title="Phim thịnh hành" action="Xem tất cả" actionTo="/movies" />
          <div className="trending-grid">
            {movies.slice(0, 5).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Phim hot gần bạn" action="Đổi vị trí" actionTo="/search" />
          <div className="nearby-list">
            {movies.slice(1, 4).map((movie, index) => {
              const cinema = cinemas[index % cinemas.length]
              return (
                <Link key={movie.id} to={`/movies/${movie.id}`} className="nearby-card">
                  <img className="nearby-card__poster" src={movie.posterUrl} alt={movie.title} loading="lazy" />
                  <div className="nearby-card__body">
                    <div className="nearby-card__title">{movie.title}</div>
                    <div className="nearby-card__meta">
                      <Icon name="location" size={12} />
                      {cinema.name} · {cinema.distance}
                    </div>
                    <div className="nearby-card__time">
                      <Icon name="clock" size={12} />
                      {index === 0 ? '19:30' : index === 1 ? '21:15' : '20:00'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      <section className="promo-banner section">
        <span className="eyebrow">Cinex Rewards</span>
        <h3>Xem phim nhiều hơn, nhận ưu đãi lớn hơn</h3>
        <p>Tích điểm mỗi lần đặt vé và đổi quà tặng, combo bắp nước cùng nhiều ưu đãi độc quyền.</p>
        <Link to="/profile" className="btn btn-accent btn-sm" style={{ marginTop: 14 }}>
          Khám phá ưu đãi
          <Icon name="arrow-right" size={15} />
        </Link>
      </section>
    </div>
  )
}
