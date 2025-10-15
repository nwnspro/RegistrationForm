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
const { POST } = await import('../app/api/register/route')

// Helper function to create a mock NextRequest
const createMockRequest = (body: object): NextRequest => {
  return {
    json: vi.fn().mockResolvedValue(body)
  } as unknown as NextRequest
}

// Import bcrypt at the top to manage mocks
import bcrypt from 'bcryptjs'

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
    // Reset bcrypt mock to default behavior
    bcrypt.hash = vi.fn().mockResolvedValue('hashed_password_123')
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
    // Mock insert to fail with unique constraint violation error
    mockSingle.mockResolvedValue({
      data: null,
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint'
      }
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

  describe('Content Validation', () => {
    it('rejects empty first name', async () => {
      const request = createMockRequest({
        firstName: '   ',
        lastName: 'Doe',
        email: 'john@gmail.com',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe("First name can't be empty")
      expect(responseData.error.field).toBe('firstName')
    })

    it('rejects empty last name', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: '   ',
        email: 'john@gmail.com',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe("Last name can't be empty")
      expect(responseData.error.field).toBe('lastName')
    })

    it('rejects invalid email format (no @ sign)', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: '12345678',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Please put a valid email')
      expect(responseData.error.field).toBe('email')
    })

    it('rejects invalid email format (no domain)', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Please put a valid email')
      expect(responseData.error.field).toBe('email')
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
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Must be a Gmail address')
      expect(responseData.error.field).toBe('email')
    })

    it('rejects empty password', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@gmail.com',
        password: ''
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe("Password can't be empty")
      expect(responseData.error.field).toBe('password')
    })

    it('rejects password that is too short', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@gmail.com',
        password: 'Pass1!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Password must be 8-30 characters')
      expect(responseData.error.field).toBe('password')
    })

    it('rejects password that is too long', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@gmail.com',
        password: 'Password123!'.repeat(4) // 48 characters
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Password must be 8-30 characters')
      expect(responseData.error.field).toBe('password')
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
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Password needs uppercase, lowercase, number and symbol')
      expect(responseData.error.field).toBe('password')
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
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Password needs uppercase, lowercase, number and symbol')
      expect(responseData.error.field).toBe('password')
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
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Password needs uppercase, lowercase, number and symbol')
      expect(responseData.error.field).toBe('password')
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
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Password needs uppercase, lowercase, number and symbol')
      expect(responseData.error.field).toBe('password')
    })
  })

  it('handles JSON parsing errors gracefully', async () => {
    const request = {
      json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON'))
    } as unknown as NextRequest

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData.success).toBe(false)
    expect(responseData.error.message).toBe('Internal server error')
    expect(responseData.error.field).toBe('general')
  })

  it('handles bcrypt errors gracefully', async () => {
    // Mock bcrypt to throw an error for this test only
    bcrypt.hash = vi.fn().mockRejectedValue(new Error('bcrypt error'))

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
    expect(responseData.error.message).toBe('Internal server error')
    expect(responseData.error.field).toBe('general')

    // bcrypt will be reset automatically by beforeEach for the next test
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

  describe('Case-insensitive email handling', () => {
    it('rejects TEST@gmail.com as already registered', async () => {
      const request = createMockRequest({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'TEST@gmail.com',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Email address is already registered')
      expect(responseData.error.field).toBe('email')
    })

    it('rejects TeSt@Gmail.com as already registered', async () => {
      const request = createMockRequest({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'TeSt@Gmail.com',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Email address is already registered')
      expect(responseData.error.field).toBe('email')
    })

    it('rejects TEST@GMAIL.COM as already registered', async () => {
      const request = createMockRequest({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'TEST@GMAIL.COM',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Email address is already registered')
      expect(responseData.error.field).toBe('email')
    })
  })

  describe('Whitespace handling', () => {
    it('rejects whitespace-only first name', async () => {
      const request = createMockRequest({
        firstName: '   ',
        lastName: 'Doe',
        email: 'john@gmail.com',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe("First name can't be empty")
      expect(responseData.error.field).toBe('firstName')
    })

    it('rejects whitespace-only last name', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: '   ',
        email: 'john@gmail.com',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe("Last name can't be empty")
      expect(responseData.error.field).toBe('lastName')
    })

    it('trims leading and trailing spaces from first name', async () => {
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
        firstName: '  John  ',
        lastName: 'Doe',
        email: 'john@gmail.com',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@gmail.com',
        password_hash: 'hashed_password_123'
      })
    })

    it('trims leading and trailing spaces from last name', async () => {
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
        lastName: '  Doe  ',
        email: 'john@gmail.com',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@gmail.com',
        password_hash: 'hashed_password_123'
      })
    })

    it('normalizes email to lowercase', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })
      mockSingle.mockResolvedValue({
        data: {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@gmail.com',
          created_at: new Date().toISOString()
        },
        error: null
      })

      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'John.Doe@Gmail.COM',
        password: 'Password123!'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@gmail.com',
        password_hash: 'hashed_password_123'
      })
    })

    it('preserves password exactly as provided (no trimming)', async () => {
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

      // Use the bcrypt mock that's already set up
      bcrypt.hash = vi.fn().mockResolvedValue('hashed_PaSsWoRd123!')

      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@gmail.com',
        password: 'PaSsWoRd123!'
      })

      await POST(request)

      // Verify bcrypt received the exact password (case-preserved, not trimmed)
      expect(bcrypt.hash).toHaveBeenCalledWith('PaSsWoRd123!', 12)
    })
  })
})
