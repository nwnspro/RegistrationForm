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
const { POST, GET } = await import('../app/api/register/route')

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

  it('successfully registers a new user with mock database', async () => {
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
    expect(responseData.data.user).toEqual({
      id: expect.any(Number),
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      createdAt: expect.any(String)
    })
  })

  it('normalizes email to lowercase', async () => {
    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'Jane@Gmail.com',
      password: 'Password123!'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(201)
    expect(responseData.data.user.email).toBe('jane@gmail.com')
  })

  it('rejects duplicate email in mock database', async () => {
    const requestData = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'duplicate@gmail.com',
      password: 'Password123!'
    }

    // First registration
    await POST(createMockRequest(requestData))

    // Try to register again with same email
    const response = await POST(createMockRequest(requestData))
    const responseData = await response.json()

    expect(response.status).toBe(409)
    expect(responseData.success).toBe(false)
    expect(responseData.error.message).toBe('Email address is already registered')
    expect(responseData.error.field).toBe('email')
  })

  it('rejects invalid input data (missing fields)', async () => {
    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      // Missing email and password
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.success).toBe(false)
    expect(responseData.error.message).toBe('Invalid input data')
    expect(responseData.error.field).toBe('general')
  })

  it('handles JSON parsing errors gracefully', async () => {
    const request = {
      json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON'))
    } as unknown as NextRequest

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.success).toBe(false)
    expect(responseData.error.message).toBe('Invalid JSON in request body')
    expect(responseData.error.field).toBe('general')
  })

  it('handles bcrypt errors gracefully', async () => {
    // Mock bcrypt to throw an error
    const bcrypt = await import('bcryptjs')
    const originalHash = bcrypt.default.hash
    bcrypt.default.hash = vi.fn().mockRejectedValue(new Error('bcrypt error'))

    const request = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'unique.bcrypt.test@gmail.com',
      password: 'Password123!'
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData.success).toBe(false)
    expect(responseData.error.message).toBe('Password encryption failed')
    expect(responseData.error.field).toBe('general')

    // Restore original function
    bcrypt.default.hash = originalHash
  })

  it('handles unexpected errors gracefully', async () => {
    const request = {
      json: vi.fn().mockRejectedValue(new Error('Unexpected error'))
    } as unknown as NextRequest

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData.success).toBe(false)
    expect(responseData.error.message).toBe('Internal server error')
    expect(responseData.error.field).toBe('general')
  })
})

describe('GET /api/register', () => {
  it('returns 405 Method Not Allowed', async () => {
    const response = await GET()
    const responseData = await response.json()

    expect(response.status).toBe(405)
    expect(responseData.success).toBe(false)
    expect(responseData.error.message).toBe('Method not allowed. Use POST to register.')
    expect(responseData.error.field).toBe('general')
  })
})
