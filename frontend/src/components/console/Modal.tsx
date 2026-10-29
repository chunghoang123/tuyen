import { useEffect, type ReactNode } from 'react'
import { Icon } from '../ui/Icon'

interface ModalProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /**
   * Cho phép đóng bằng nút X, phím Escape hoặc bấm ra ngoài.
   * Đặt false với modal đang chờ thanh toán để buộc người dùng xử lý xong.
   */
  dismissible?: boolean
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = 'md',
  dismissible = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, dismissible, onClose])

  if (!open) return null

  return (
    <div
      className="console-modal-backdrop"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose()
      }}
    >
      <div className={`console-modal console-modal--${size}`} role="dialog" aria-modal="true">
        <div className="console-modal__head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {dismissible && (
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
        <div className="console-modal__body">{children}</div>
        {footer && <div className="console-modal__foot">{footer}</div>}
      </div>
    </div>
  )
}
