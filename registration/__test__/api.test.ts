import { vi, beforeEach, describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

// Create mocks before importing
const mockQuery = vi.fn()

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password_123')
  }
}))

// Mock pg pool
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: mockQuery
  }))
}))

// Import the route handler after mocks are set up
const { POST } = await import('../app/api/register/route')

// Helper function to create a mock NextRequest
const createMockRequest = (body: object): NextRequest => {
  return {
    json: vi.fn().mockResolvedValue(body)
  } as unknown as NextRequest
}

describe('POST /api/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully registers a new user', async () => {
    // Mock database responses
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // Check existing user - none found
      .mockResolvedValueOnce({ 
        rows: [{ 
          id: 1, 
          first_name: 'John', 
          last_name: 'Doe', 
          email: 'john@gmail.com',
          created_at: new Date().toISOString()
        }] 
      }) // Insert new user

    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      password: 'Password123!'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(201)
    expect(responseData.success).toBe(true)
    expect(responseData.message).toBe('User registered successfully')
    expect(responseData.user).toEqual({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      createdAt: expect.any(String)
    })
  })

  it('rejects invalid input data', async () => {
    const request = createMockRequest({
      firstName: '',
      lastName: 'Doe',
      email: 'john@gmail.com',
      password: 'Password123!'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Invalid input data')
    expect(responseData.field).toBe('general')
  })

  it('rejects non-Gmail email addresses', async () => {
    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@yahoo.com',
      password: 'Password123!'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Email must be a Gmail address (@gmail.com)')
    expect(responseData.field).toBe('email')
  })

  it('rejects test@gmail.com as already registered', async () => {
    const request = createMockRequest({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@gmail.com',
      password: 'Password123!'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('This email address is already registered')
    expect(responseData.field).toBe('email')
  })

  it('rejects password that is too short', async () => {
    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      password: '1234567'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Password must be between 8 and 30 characters')
    expect(responseData.field).toBe('password')
  })

  it('rejects password that is too long', async () => {
    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      password: 'a'.repeat(31)
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Password must be between 8 and 30 characters')
    expect(responseData.field).toBe('password')
  })

  it('rejects password without lowercase letter', async () => {
    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      password: 'PASSWORD123!'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Password must contain at least one lowercase letter')
    expect(responseData.field).toBe('password')
  })

  it('rejects password without uppercase letter', async () => {
    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      password: 'password123!'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Password must contain at least one uppercase letter')
    expect(responseData.field).toBe('password')
  })

  it('rejects password without number', async () => {
    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      password: 'Password!'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Password must contain at least one number')
    expect(responseData.field).toBe('password')
  })

  it('rejects password without special character', async () => {
    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      password: 'Password123'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Password must contain at least one special character')
    expect(responseData.field).toBe('password')
  })

  it('rejects when email already exists in database', async () => {
    // First register a user
    const firstRequest = createMockRequest({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'existing@gmail.com',
      password: 'Password123!'
    })
    await POST(firstRequest)

    // Try to register with same email
    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'existing@gmail.com',
      password: 'Password123!'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(409)
    expect(responseData.error).toBe('Email address is already registered')
    expect(responseData.field).toBe('email')
  })

  it('handles bcrypt errors gracefully', async () => {
    // Mock bcrypt to throw an error
    const bcrypt = await import('bcryptjs')
    const originalHash = bcrypt.default.hash
    bcrypt.default.hash = vi.fn().mockRejectedValue(new Error('Bcrypt error'))

    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'unique.bcrypt.test@gmail.com', // Use unique email to avoid conflicts
      password: 'Password123!'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData.error).toBe('Internal server error')
    expect(responseData.field).toBe('general')

    // Restore original function
    bcrypt.default.hash = originalHash
  })

  it('handles unexpected errors gracefully', async () => {
    // Mock an unexpected error by making JSON parsing fail
    const request = {
      json: vi.fn().mockRejectedValue(new Error('Unexpected error'))
    } as unknown as NextRequest

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData.error).toBe('Internal server error')
    expect(responseData.field).toBe('general')
  })

  it('handles malformed JSON', async () => {
    const request = {
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
    } as unknown as NextRequest

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData.error).toBe('Internal server error')
    expect(responseData.field).toBe('general')
  })
})