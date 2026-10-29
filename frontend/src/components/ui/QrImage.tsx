import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QrImageProps {
  value: string
  size?: number
  alt?: string
  className?: string
}

/**
 * Mã QR thật (dùng cho PayOS / vé điện tử), khác với QrCode trang trí.
 */
export function QrImage({ value, size = 200, alt = 'Mã QR', className }: QrImageProps) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!value) {
      setSrc('')
      return
    }
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setSrc(url)
      })
      .catch(() => {
        if (!cancelled) setSrc('')
      })
    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!src) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          background: 'rgba(148, 163, 184, 0.15)',
        }}
      />
    )
  }

  return <img src={src} width={size} height={size} alt={alt} className={className} style={{ borderRadius: 12 }} />
}
