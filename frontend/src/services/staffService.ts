import api from '../api/axios'
import type {
  Booking,
  ShiftSummary,
  Showtime,
  ShowtimeSeat,
  StaffSale,
  StaffSalePayload,
  TicketValidation,
} from '../types/Admin'

interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

export const staffService = {
  getShowtimes: async (params: { date?: string; cinemaId?: number }): Promise<Showtime[]> => {
    const res = await api.get<Envelope<Showtime[]>>('/staff/showtimes', { params })
    return res.data.data
  },
  getSeats: async (showtimeId: number): Promise<ShowtimeSeat[]> => {
    const res = await api.get<Envelope<ShowtimeSeat[]>>(`/staff/showtimes/${showtimeId}/seats`)
    return res.data.data
  },
  createSale: async (payload: StaffSalePayload): Promise<StaffSale> => {
    const res = await api.post<Envelope<StaffSale>>('/staff/sales', payload)
    return res.data.data
  },
  createPayosSale: async (payload: StaffSalePayload): Promise<StaffSale> => {
    const res = await api.post<Envelope<StaffSale>>('/staff/sales/payos', payload)
    return res.data.data
  },
  searchBookings: async (q?: string): Promise<Booking[]> => {
    const res = await api.get<Envelope<Booking[]>>('/staff/bookings', { params: { q } })
    return res.data.data
  },
  getBooking: async (code: string): Promise<Booking> => {
    const res = await api.get<Envelope<Booking>>(`/staff/bookings/${code}`)
    return res.data.data
  },
  cancelBooking: async (code: string): Promise<Booking> => {
    const res = await api.post<Envelope<Booking>>(`/staff/bookings/${code}/cancel`)
    return res.data.data
  },
  validateTicket: async (code: string): Promise<TicketValidation> => {
    const res = await api.post<Envelope<TicketValidation>>('/staff/tickets/validate', { code })
    return res.data.data
  },
  getShiftSummary: async (date?: string): Promise<ShiftSummary> => {
    const res = await api.get<Envelope<ShiftSummary>>('/staff/shift-summary', { params: { date } })
    return res.data.data
  },
}
