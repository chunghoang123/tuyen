import api from '../api/axios'
import type { Booking, Showtime, ShowtimeSeat } from '../types/Admin'

interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

export interface HoldPayload {
  showtimeId: number
  seatIds: number[]
  snackAmount?: number
  snackNote?: string
}

export interface PayosPayment {
  bookingCode: string
  checkoutUrl: string
  qrCode: string | null
  paymentLinkId: string
  amount: number
  expiresAt?: string
}

/** Ghế khách đang chọn, lưu tạm giữa trang chọn ghế và trang xác nhận. */
export interface SeatDraft {
  showtimeId: number
  seatIds: number[]
  seatCodes: string[]
  seatAmount: number
}

/** Dữ liệu ghế/đơn đặt vé phía khách hàng (dùng API thật). */
export const bookingService = {
  getShowtime: async (showtimeId: number): Promise<Showtime> => {
    const res = await api.get<Envelope<Showtime>>(`/showtimes/${showtimeId}`)
    return res.data.data
  },
  getShowtimes: async (params?: { movieId?: number; from?: string; to?: string }): Promise<Showtime[]> => {
    const res = await api.get<Envelope<Showtime[]>>('/showtimes', { params })
    return res.data.data
  },
  getSeats: async (showtimeId: number): Promise<ShowtimeSeat[]> => {
    const res = await api.get<Envelope<ShowtimeSeat[]>>(`/showtimes/${showtimeId}/seats`)
    return res.data.data
  },
  createHold: async (payload: HoldPayload): Promise<Booking> => {
    const res = await api.post<Envelope<Booking>>('/bookings/holds', payload)
    return res.data.data
  },
  getBooking: async (bookingCode: string): Promise<Booking> => {
    const res = await api.get<Envelope<Booking>>(`/bookings/${bookingCode}`)
    return res.data.data
  },
  getMyBookings: async (): Promise<Booking[]> => {
    const res = await api.get<Envelope<Booking[]>>('/bookings/my')
    return res.data.data
  },
  createPayosPayment: async (bookingCode: string): Promise<PayosPayment> => {
    const res = await api.post<Envelope<PayosPayment>>(`/bookings/${bookingCode}/payos`)
    return res.data.data
  },
  /** Đồng bộ trạng thái thanh toán với PayOS (dự phòng khi webhook chậm). */
  syncPayosPayment: async (bookingCode: string): Promise<Booking> => {
    const res = await api.post<Envelope<Booking>>(`/bookings/${bookingCode}/payos/sync`)
    return res.data.data
  },
}
