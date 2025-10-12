import React from 'react'
import { render, screen } from '@testing-library/react'
import FormStatus from '../components/FormStatus'

describe('FormStatus', () => {
  it('renders idle state message', () => {
    render(<FormStatus state="idle" />)
    expect(screen.getByText(/please fill out all required fields/i)).toBeInTheDocument()
    expect(screen.getByText(/please fill out all required fields/i)).toHaveClass('status-idle')
  })

  it('renders warning state message', () => {
    render(<FormStatus state="warning" />)
    expect(screen.getByText(/please correct the errors below/i)).toBeInTheDocument()
    expect(screen.getByText(/please correct the errors below/i)).toHaveClass('status-warning')
  })

  it('renders failure state message', () => {
    render(<FormStatus state="failure" />)
    expect(screen.getByText(/registration failed/i)).toBeInTheDocument()
    expect(screen.getByText(/registration failed/i)).toHaveClass('status-failure')
  })

  it('renders success state message', () => {
    render(<FormStatus state="success" />)
    expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
    expect(screen.getByText(/registration successful/i)).toHaveClass('status-success')
  })

  it('renders nothing for unknown state', () => {
    const { container } = render(<FormStatus state={'unknown' as 'idle' | 'warning' | 'failure' | 'success'} />)
    expect(container.firstChild).toBeNull()
  })
})