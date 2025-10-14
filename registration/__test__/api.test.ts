import { vi, beforeEach, describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

// Create mocks before importing
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockEq = vi.fn()
const mockMaybeSingle = vi.fn()
const mockSingle = vi.fn()

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password_123')
  }
}))

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: (...args: unknown[]) => {
        mockSelect(...args)
        return {
          eq: (...args: unknown[]) => {
            mockEq(...args)
            return {
              maybeSingle: mockMaybeSingle
            }
          }
        }
      },
      insert: (data: unknown) => {
        mockInsert(data)
        return {
          select: () => ({
            single: mockSingle
          })
        }
      }
    }))
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
    // Reset mocks to default behavior
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSingle.mockResolvedValue({
      data: {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@gmail.com',
        created_at: new Date().toISOString()
      },
      error: null
    })
  })

  it('successfully registers a new user with mock database', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSingle.mockResolvedValue({
      data: {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@gmail.com',
        created_at: new Date().toISOString()
      },
      error: null
    })

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
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSingle.mockResolvedValue({
      data: {
        id: 2,
        first_name: 'John',
        last_name: 'Doe',
        email: 'jane@gmail.com',
        created_at: new Date().toISOString()
      },
      error: null
    })

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
    // Mock duplicate email check to return existing user
    mockMaybeSingle.mockResolvedValue({
      data: { id: 1 },
      error: null
    })

    const requestData = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'duplicate@gmail.com',
      password: 'Password123!'
    }

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
