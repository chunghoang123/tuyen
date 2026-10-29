export interface Cinema {
  id: number
  name: string
  address: string
  phone: string
  active: boolean
  createdAt?: string
}

export interface CinemaPayload {
  name: string
  address?: string
  phone?: string
}

export interface Auditorium {
  id: number
  name: string
  totalRows: number
  columnsPerRow: number
  cinemaId: number
  cinemaName: string
  active: boolean
  seatCount: number
}

export interface AuditoriumPayload {
  name: string
  totalRows: number
  columnsPerRow: number
}

export interface Seat {
  id: number
  seatCode: string
  seatType: string
  rowNumber: number
  columnNumber: number
  active: boolean
}

export interface Showtime {
  id: number
  movieId: number
  movieTitle: string
  posterUrl: string
  durationMinutes: number
  cinemaId: number
  cinemaName: string
  auditoriumId: number
  auditoriumName: string
  startTime: string
  endTime: string
  basePrice: number
  status: string
  active: boolean
  availableSeats: number
  totalSeats: number
}

export interface ShowtimePayload {
  movieId: number
  auditoriumId: number
  startTime: string
  basePrice: number
}

export interface ShowtimeSeat {
  id: number
  seatId: number
  seatCode: string
  seatType: string
  rowNumber: number
  columnNumber: number
  status: 'AVAILABLE' | 'HELD' | 'BOOKED'
  price: number
}

export interface BookingSeat {
  showtimeSeatId: number
  seatId: number
  seatCode: string
  seatType: string
  price: number
}

export interface BookingShowtime {
  id: number
  movieId: number
  movieTitle: string
  posterUrl: string
  cinemaId: number
  cinemaName: string
  auditoriumName: string
  startTime: string
  endTime: string
}

export interface Booking {
  id: number
  bookingCode: string
  customerName: string
  customerPhone: string
  channel: 'ONLINE' | 'COUNTER'
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED'
  seatAmount: number
  snackAmount: number
  snackNote?: string
  totalAmount: number
  paymentMethod?: string
  paymentStatus?: string
  ticketCode?: string
  ticketStatus?: string
  createdAt: string
  expiresAt?: string
  paidAt?: string
  showtime: BookingShowtime
  seats: BookingSeat[]
}

export interface AdminUser {
  id: number
  username: string
  email: string
  fullName: string
  phone: string
  roles: string[]
  active: boolean
  createdAt?: string
}

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  fullName?: string
  phone?: string
  roles: string[]
}

export interface DailyRevenue {
  date: string
  revenue: number
}

export interface TopMovie {
  movieId: number
  title: string
  tickets: number
  revenue: number
}

export interface AdminDashboard {
  revenueToday: number
  ticketsToday: number
  bookingsToday: number
  customers: number
  showtimesToday: number
  revenueLast7Days: DailyRevenue[]
  topMovies: TopMovie[]
  recentBookings: Booking[]
}

export interface StaffSalePayload {
  showtimeId: number
  seatIds: number[]
  customerName?: string
  customerPhone?: string
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'PAYOS'
  snackAmount?: number
  snackNote?: string
}

export interface StaffSale {
  booking: Booking
  ticketCode: string | null
  qrCode: string
  checkoutUrl?: string
  paymentLinkId?: string
}

export interface ShiftSummary {
  date: string
  totalRevenue: number
  ticketCount: number
  transactionCount: number
  cashRevenue: number
  cardRevenue: number
  recentSales: Booking[]
}

export interface TicketValidation {
  valid: boolean
  message: string
  ticketCode: string
  ticketStatus?: string
  scannedAt?: string
  booking?: Booking
}
