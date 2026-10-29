import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { bookingService } from '../services/bookingService'
import { errorMessage } from '../utils/consoleFormat'
import { Icon } from '../components/ui/Icon'
import { PageBar } from '../components/ui/PageBar'

/**
 * Trang PayOS chuyển về sau khi khách thanh toán (return) hoặc hủy (cancel).
 * Trạng thái thật vẫn lấy từ backend, không tin tham số trên URL.
 */
export function PaymentReturn({ cancelled = false }: { cancelled?: boolean }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  const bookingCode = searchParams.get('code') ?? sessionStorage.getItem('pendingBookingCode') ?? ''
  const orderCode = searchParams.get('orderCode')

  useEffect(() => {
    if (cancelled || !bookingCode) {
      setChecking(false)
      return
    }
    let attempts = 0
    let cancelledRequest = false

    const check = async () => {
      try {
        const booking = await bookingService.syncPayosPayment(bookingCode)
        if (cancelledRequest) return
        if (booking.status === 'CONFIRMED') {
          sessionStorage.removeItem('pendingBookingCode')
          navigate(`/ticket/${booking.bookingCode}?paid=1`, { replace: true })
          return
        }
        if (booking.status === 'EXPIRED' || booking.status === 'CANCELLED') {
          setError('Đơn đặt vé đã hết hạn hoặc bị hủy.')
          setChecking(false)
          return
        }
        attempts += 1
        if (attempts >= 40) {
          setError('Chưa nhận được xác nhận thanh toán từ PayOS. Vui lòng kiểm tra lại trong "Vé của tôi".')
          setChecking(false)
          return
        }
        window.setTimeout(check, 3000)
      } catch (err) {
        if (!cancelledRequest) {
          setError(errorMessage(err, 'Không kiểm tra được trạng thái thanh toán'))
          setChecking(false)
        }
      }
    }

    void check()
    return () => {
      cancelledRequest = true
    }
  }, [bookingCode, cancelled, navigate])

  return (
    <div className="container">
      <PageBar title={cancelled ? 'Đã hủy thanh toán' : 'Kết quả thanh toán'} backTo="/movies" />

      <div className="empty-state">
        {checking ? (
          <>
            <span className="spinner" />
            <strong>Đang xác nhận thanh toán...</strong>
            <p>Vui lòng không đóng trang này.</p>
          </>
        ) : (
          <>
            <Icon name={cancelled ? 'close' : 'ticket'} size={40} />
            <strong>{cancelled ? 'Bạn đã hủy thanh toán' : error ? 'Chưa xác nhận được thanh toán' : 'Đang chờ xác nhận'}</strong>
            <p>
              {error ||
                (cancelled
                  ? 'Ghế sẽ được mở lại sau ít phút nếu bạn không hoàn tất thanh toán.'
                  : 'Nếu đã thanh toán, vé sẽ xuất hiện trong mục "Vé của tôi".')}
            </p>
            {orderCode && <p className="muted">Mã giao dịch PayOS: {orderCode}</p>}
            <div className="row gap-10" style={{ justifyContent: 'center' }}>
              <Link to="/history" className="btn btn-primary btn-sm">
                Xem vé của tôi
              </Link>
              <Link to="/movies" className="btn btn-ghost btn-sm">
                Về trang phim
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
