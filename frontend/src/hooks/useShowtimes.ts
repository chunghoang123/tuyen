import { useEffect, useState } from 'react'
import { bookingService } from '../services/bookingService'
import type { Showtime } from '../types/Admin'

/** Lấy lịch chiếu thật từ backend (mặc định 7 ngày tới). */
export function useShowtimes(movieId?: number) {
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    bookingService
      .getShowtimes({ movieId })
      .then((data) => {
        if (!cancelled) setShowtimes(data)
      })
      .catch(() => {
        if (!cancelled) {
          setShowtimes([])
          setError('Không tải được lịch chiếu')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [movieId])

  return { showtimes, loading, error }
}
