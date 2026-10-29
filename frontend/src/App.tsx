import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { BottomNav } from './components/layout/BottomNav'
import { Home } from './pages/Home'
import { MovieList } from './pages/MovieList'
import { MovieDetail } from './pages/MovieDetail'
import { ShowtimeList } from './pages/ShowtimeList'
import { SeatSelection } from './pages/SeatSelection'
import { BookingConfirm } from './pages/BookingConfirm'
import { Payment } from './pages/Payment'
import { PaymentReturn } from './pages/PaymentReturn'
import { TicketView } from './pages/TicketView'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { BookingHistory } from './pages/BookingHistory'
import { Profile } from './pages/Profile'
import { Search } from './pages/Search'
import { ChatWidget } from './components/chat/ChatWidget'
import { AdminLayout } from './components/console/AdminLayout'
import { StaffLayout } from './components/console/StaffLayout'
import { ProtectedRoute } from './components/console/ProtectedRoute'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminMoviesPage } from './pages/admin/AdminMoviesPage'
import { AdminCinemasPage } from './pages/admin/AdminCinemasPage'
import { AdminShowtimesPage } from './pages/admin/AdminShowtimesPage'
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { StaffPosPage } from './pages/staff/StaffPosPage'
import { StaffBookingsPage } from './pages/staff/StaffBookingsPage'
import { StaffValidatePage } from './pages/staff/StaffValidatePage'
import { StaffShiftPage } from './pages/staff/StaffShiftPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function Shell() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isConsole = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff')

  return (
    <div className={isConsole ? 'console-root' : 'app-shell'}>
      <ScrollToTop />
      {!isConsole && <Header />}
      <main className={isConsole ? '' : isAuthPage ? '' : 'page'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<MovieList />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/showtimes" element={<ShowtimeList />} />
          <Route path="/seats/:showtimeId" element={<SeatSelection />} />
          <Route path="/booking/confirm" element={<BookingConfirm />} />
          <Route path="/booking/payment" element={<Payment />} />
          <Route path="/payment/return" element={<PaymentReturn />} />
          <Route path="/payment/cancel" element={<PaymentReturn cancelled />} />
          <Route path="/ticket/:bookingId" element={<TicketView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/history" element={<BookingHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />


          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ROLE_ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="movies" element={<AdminMoviesPage />} />
            <Route path="cinemas" element={<AdminCinemasPage />} />
            <Route path="showtimes" element={<AdminShowtimesPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>

          <Route
            path="/staff"
            element={
              <ProtectedRoute roles={['ROLE_STAFF', 'ROLE_ADMIN']}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/staff/pos" replace />} />
            <Route path="pos" element={<StaffPosPage />} />
            <Route path="bookings" element={<StaffBookingsPage />} />
            <Route path="validate" element={<StaffValidatePage />} />
            <Route path="shift" element={<StaffShiftPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isConsole && !isAuthPage && <Footer />}
      {!isConsole && !isAuthPage && <BottomNav />}
      {!isConsole && <ChatWidget />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}

export default App
