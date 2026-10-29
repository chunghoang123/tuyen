import { Icon } from './Icon'

interface FieldErrorProps {
  id: string
  message?: string
}

export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p className="field-error" id={id} title={message} aria-live="polite">
      {message && (
        <>
          <Icon name="alert" size={12} />
          <span>{message}</span>
        </>
      )}
    </p>
  )
}
