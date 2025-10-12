import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import RegistrationForm from '../components/RegistrationForm'

global.fetch = vi.fn()

describe('RegistrationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(<RegistrationForm />)
    
    expect(screen.getByPlaceholderText(/your full name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/your email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/create password/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders tab interface with Sign Up and Log In tabs', () => {
    render(<RegistrationForm />)
    
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    expect(screen.getByText(/create an account or login/i)).toBeInTheDocument()
  })

  it('shows login placeholder when Log In tab is clicked', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    const loginTab = screen.getByRole('button', { name: /log in/i })
    await user.click(loginTab)
    
    expect(screen.getByText(/login functionality coming soon/i)).toBeInTheDocument()
  })

  it('shows idle state message initially', () => {
    render(<RegistrationForm />)
    expect(screen.getByText(/please fill out all required fields/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<RegistrationForm />)
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument()
    })

    expect(screen.getByText(/please correct the errors below/i)).toBeInTheDocument()
  })

  it('validates email format - must be Gmail', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    const emailInput = screen.getByPlaceholderText(/your email/i)
    await user.type(emailInput, 'test@yahoo.com')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email must be a gmail address/i)).toBeInTheDocument()
    })
  })

  it('validates email uniqueness - test@gmail.com is already registered', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    const emailInput = screen.getByPlaceholderText(/your email/i)
    await user.type(emailInput, 'test@gmail.com')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/this email address is already registered/i)).toBeInTheDocument()
    })
  })

  it('validates password length', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    const passwordInput = screen.getByPlaceholderText(/create password/i)
    
    // Test too short
    await user.type(passwordInput, '1234567')
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/password must be between 8 and 30 characters/i)).toBeInTheDocument()
    })

    // Test too long
    await user.clear(passwordInput)
    await user.type(passwordInput, 'a'.repeat(31))
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/password must be between 8 and 30 characters/i)).toBeInTheDocument()
    })
  })

  it('validates password complexity - lowercase requirement', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    const passwordInput = screen.getByPlaceholderText(/create password/i)
    await user.type(passwordInput, 'PASSWORD123!')
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one lowercase letter/i)).toBeInTheDocument()
    })
  })

  it('validates password complexity - uppercase requirement', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    const passwordInput = screen.getByPlaceholderText(/create password/i)
    await user.type(passwordInput, 'password123!')
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument()
    })
  })

  it('validates password complexity - number requirement', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    const passwordInput = screen.getByPlaceholderText(/create password/i)
    await user.type(passwordInput, 'Password!')
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument()
    })
  })

  it('validates password complexity - special character requirement', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    const passwordInput = screen.getByPlaceholderText(/create password/i)
    await user.type(passwordInput, 'Password123')
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one special character/i)).toBeInTheDocument()
    })
  })

  it('validates password confirmation', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    const passwordInput = screen.getByPlaceholderText(/create password/i)
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm password/i)
    
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123@')
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('accepts valid password', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    const passwordInput = screen.getByPlaceholderText(/create password/i)
    await user.type(passwordInput, 'Password123!')
    
    // This should not show any password error
    fireEvent.blur(passwordInput)
    
    expect(screen.queryByText(/password must contain/i)).not.toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    const passwordInput = screen.getByPlaceholderText(/create password/i) as HTMLInputElement
    const toggleButton = passwordInput.parentElement?.querySelector('.password-toggle')
    
    expect(passwordInput.type).toBe('password')
    
    if (toggleButton) {
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('text')
      
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    }
  })

  it('clears errors when user starts typing', async () => {
    const user = userEvent.setup()
    render(<RegistrationForm />)
    
    // Trigger validation errors
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument()
    })

    // Start typing in full name field
    const fullNameInput = screen.getByPlaceholderText(/your full name/i)
    await user.type(fullNameInput, 'John Doe')
    
    expect(screen.queryByText('Full name is required')).not.toBeInTheDocument()
  })

  it('submits form successfully with valid data', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    } as Response)

    render(<RegistrationForm />)
    
    await user.type(screen.getByPlaceholderText(/your full name/i), 'John Doe')
    await user.type(screen.getByPlaceholderText(/your email/i), 'john@gmail.com')
    await user.type(screen.getByPlaceholderText(/create password/i), 'Password123!')
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'Password123!')
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@gmail.com',
        password: 'Password123!'
      }),
    })
  })

  it('handles single name as both first and last name', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    } as Response)

    render(<RegistrationForm />)
    
    await user.type(screen.getByPlaceholderText(/your full name/i), 'John')
    await user.type(screen.getByPlaceholderText(/your email/i), 'john@gmail.com')
    await user.type(screen.getByPlaceholderText(/create password/i), 'Password123!')
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'Password123!')
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'John',
        email: 'john@gmail.com',
        password: 'Password123!'
      }),
    })
  })

  it('shows failure state when API returns error', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Registration failed' })
    } as Response)

    render(<RegistrationForm />)
    
    await user.type(screen.getByPlaceholderText(/your full name/i), 'John Doe')
    await user.type(screen.getByPlaceholderText(/your email/i), 'john@gmail.com')
    await user.type(screen.getByPlaceholderText(/create password/i), 'Password123!')
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'Password123!')
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument()
    })
  })

  it('shows failure state when network error occurs', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<RegistrationForm />)
    
    await user.type(screen.getByPlaceholderText(/your full name/i), 'John Doe')
    await user.type(screen.getByPlaceholderText(/your email/i), 'john@gmail.com')
    await user.type(screen.getByPlaceholderText(/create password/i), 'Password123!')
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'Password123!')
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument()
    })
  })

  it('disables submit button and shows loading state during submission', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)
    
    // Create a promise that we can control
    let resolvePromise: (value: Response) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockFetch.mockReturnValueOnce(promise as Promise<Response>)

    render(<RegistrationForm />)
    
    await user.type(screen.getByPlaceholderText(/your full name/i), 'John Doe')
    await user.type(screen.getByPlaceholderText(/your email/i), 'john@gmail.com')
    await user.type(screen.getByPlaceholderText(/create password/i), 'Password123!')
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'Password123!')
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    // Check loading state
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
    
    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true })
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled()
    })
  })

  it('clears form data after successful submission', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    } as Response)

    render(<RegistrationForm />)
    
    const fullNameInput = screen.getByPlaceholderText(/your full name/i) as HTMLInputElement
    const emailInput = screen.getByPlaceholderText(/your email/i) as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText(/create password/i) as HTMLInputElement
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm password/i) as HTMLInputElement
    
    await user.type(fullNameInput, 'John Doe')
    await user.type(emailInput, 'john@gmail.com')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123!')
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
    })

    // Check that form is cleared
    expect(fullNameInput.value).toBe('')
    expect(emailInput.value).toBe('')
    expect(passwordInput.value).toBe('')
    expect(confirmPasswordInput.value).toBe('')
  })
})