import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'
import { openChat } from '../chat/ChatWidget'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__inner">
          <div>
            <Logo />
            <p style={{ marginTop: 12, maxWidth: 280 }}>
              Trải nghiệm điện ảnh đỉnh cao với hệ thống đặt vé trực tuyến nhanh chóng, tiện lợi và an toàn.
            </p>
            <div className="row gap-8" style={{ marginTop: 14 }}>
              <span className="badge badge-accent">IMAX</span>
              <span className="badge badge-primary">4DX</span>
              <span className="badge badge-muted">Dolby Atmos</span>
            </div>
          </div>

          <div>
            <h4>Khám phá</h4>
            <Link to="/movies">Phim đang chiếu</Link>
            <Link to="/movies">Phim sắp chiếu</Link>
            <Link to="/showtimes">Lịch chiếu</Link>
            <button type="button" className="footer-link" onClick={openChat}>
              Trợ lý AI
            </button>
          </div>

          <div>
            <h4>Hỗ trợ</h4>
            <a href="#faq">Câu hỏi thường gặp</a>
            <a href="#terms">Điều khoản sử dụng</a>
            <a href="#privacy">Chính sách bảo mật</a>
            <a href="#contact">Liên hệ</a>
          </div>

          <div>
            <h4>Liên hệ</h4>
            <p>1900 1234</p>
            <p>hello@cinex.vn</p>
            <p>TP. Hồ Chí Minh, Việt Nam</p>
            <div className="row gap-8" style={{ marginTop: 10 }}>
              <span className="header-icon" style={{ width: 34, height: 34 }}>
                <Icon name="globe" size={16} />
              </span>
              <span className="header-icon" style={{ width: 34, height: 34 }}>
                <Icon name="share" size={16} />
              </span>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© 2026 Cinex. Tất cả quyền được bảo lưu.</span>
          <span>Thiết kế bởi Cinex Team</span>
        </div>
      </div>
    </footer>
  )
}
