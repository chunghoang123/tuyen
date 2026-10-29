import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../ui/Icon'

interface Message {
  id: number
  role: 'ai' | 'user'
  text: string
  time: string
}

const suggestions = [
  'Phim nào đang chiếu tối nay?',
  'Gợi ý phim sci-fi hay',
  'Rạp nào gần tôi nhất?',
  'Cách đổi điểm Cinex?',
]

const initialMessages: Message[] = [
  {
    id: 1,
    role: 'ai',
    text: 'Xin chào! Mình là Cinex AI. Mình có thể gợi ý phim, tìm suất chiếu và giải đáp thắc mắc về đặt vé cho bạn. Bạn muốn xem gì hôm nay?',
    time: '20:12',
  },
]

function now() {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date())
}

function replyFor(text: string): string {
  const value = text.toLowerCase()
  if (value.includes('sci-fi') || value.includes('viễn tưởng')) {
    return 'Nếu bạn thích sci-fi, mình gợi ý Dune: Part Two (98% match), Blade Runner 2049 và Interstellar. Cả ba đều đang có suất chiếu tối nay tại Cinex Landmark 81.'
  }
  if (value.includes('gần') || value.includes('rạp')) {
    return 'Rạp gần bạn nhất là Cinex Landmark 81 (1.2 km), tiếp theo là Cinex Galaxy Nguyễn Du (2.5 km). Bạn muốn mình xem suất chiếu tại rạp nào?'
  }
  if (value.includes('điểm') || value.includes('reward')) {
    return 'Bạn có 1.280 điểm Cinex. 1.000 điểm có thể đổi một combo bắp nước, 2.500 điểm đổi vé 2D. Điểm được cộng sau mỗi giao dịch thành công.'
  }
  if (value.includes('tối nay') || value.includes('suất')) {
    return 'Tối nay có các suất nổi bật: Dune: Part Two 19:00 (IMAX), Spider-Man 20:15 (2D), The Batman 21:30 (IMAX). Bạn muốn đặt suất nào?'
  }
  return 'Mình đã ghi nhận yêu cầu của bạn. Bạn có thể cho mình biết thể loại phim, rạp hoặc khung giờ bạn thích để mình gợi ý chính xác hơn nhé.'
}

export function openChat() {
  window.dispatchEvent(new CustomEvent('cinex:open-chat'))
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('cinex:open-chat', handler)
    return () => window.removeEventListener('cinex:open-chat', handler)
  }, [])

  useEffect(() => {
    if (open) {
      bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [open, messages, typing])

  const send = (text: string) => {
    const value = text.trim()
    if (!value || typing) return
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text: value, time: now() }])
    setInput('')
    setTyping(true)
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'ai', text: replyFor(value), time: now() },
      ])
      setTyping(false)
    }, 850)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    send(input)
  }

  return (
    <>
      {open && (
        <div className="chat-widget__panel" role="dialog" aria-label="Cinex AI">
          <div className="chat-head">
            <span className="chat-head__avatar">
              <Icon name="sparkles" size={21} />
            </span>
            <div>
              <div className="chat-head__name">Cinex AI Companion</div>
              <div className="chat-head__status">Đang trực tuyến</div>
            </div>
            <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
              Beta
            </span>
            <button type="button" className="input-action" onClick={() => setOpen(false)} aria-label="Đóng chat">
              <Icon name="close" size={17} />
            </button>
          </div>

          <div className="chat-body" ref={bodyRef}>
            {messages.map((message) => (
              <div key={message.id} className={`chat-msg ${message.role === 'ai' ? 'is-ai' : 'is-user'}`}>
                {message.text}
                <div className="chat-time">{message.time}</div>
              </div>
            ))}
            {typing && (
              <div className="chat-msg is-ai">
                <span className="muted">Cinex AI đang nhập...</span>
              </div>
            )}
          </div>

          <div className="chat-suggestions">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" className="chip" onClick={() => send(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <form className="chat-compose" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Hỏi Cinex AI bất cứ điều gì..."
              aria-label="Tin nhắn"
            />
            <button type="submit" aria-label="Gửi tin nhắn" disabled={!input.trim() || typing}>
              <Icon name="send" size={17} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chat-widget__bubble"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Đóng Cinex AI' : 'Mở Cinex AI'}
      >
        <Icon name={open ? 'close' : 'chat'} size={24} />
      </button>
    </>
  )
}
