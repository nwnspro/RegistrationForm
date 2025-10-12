interface FormStatusProps {
  state: 'idle' | 'warning' | 'failure' | 'success'
}

export default function FormStatus({ state }: FormStatusProps) {
  if (state === 'idle') {
    return null
  }

  if (state === 'warning') {
    return (
      <div className="status-message status-warning">
        Please correct the errors below and try again.
      </div>
    )
  }

  if (state === 'failure') {
    return (
      <div className="status-message status-failure">
        Registration failed. Please try again.
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="status-message status-success">
        Registration successful! Welcome!
      </div>
    )
  }

  return null
}