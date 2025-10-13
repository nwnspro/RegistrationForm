/**
 * User Registration API Route
 *
 * This API supports two database modes:
 * 1. Mock Database (USE_MOCK_DB=true): In-memory storage for development/testing
 * 2. PostgreSQL (USE_MOCK_DB=false): Production-ready persistent storage
 *
 * Mode is automatically determined by DATABASE_URL environment variable presence.
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Determine database mode based on environment configuration
const USE_MOCK_DB = !process.env.DATABASE_URL

// Mock database for development/testing (in-memory storage)
interface MockUser {
  id: number
  firstName: string
  lastName: string
  email: string
  passwordHash: string
  createdAt: string
}

const mockUsers: MockUser[] = []
let nextId = 1

// PostgreSQL connection pool (only initialized if DATABASE_URL is set)
let pool: import('pg').Pool | null = null
if (!USE_MOCK_DB) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('pg')
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'registration_db',
      password: process.env.DB_PASSWORD || 'password',
      port: parseInt(process.env.DB_PORT || '5432'),
    })
  } catch {
    // pg not available, will use mock database
  }
}

// Request body structure
interface UserData {
  firstName: string
  lastName: string
  email: string
  password: string
}

// User object returned in successful responses
interface UserResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  createdAt: string
}

// API response interfaces
interface ApiSuccessResponse {
  success: true
  message: string
  data: {
    user: UserResponse
  }
}

interface ApiErrorResponse {
  success: false
  error: {
    message: string
    field: string
  }
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse

/**
 * Type guard to validate incoming request body structure
 */
const validateUserData = (data: unknown): data is UserData => {
  return (
    data !== null &&
    typeof data === 'object' &&
    'firstName' in data &&
    'lastName' in data &&
    'email' in data &&
    'password' in data &&
    typeof (data as UserData).firstName === 'string' &&
    typeof (data as UserData).lastName === 'string' &&
    typeof (data as UserData).email === 'string' &&
    typeof (data as UserData).password === 'string'
  )
}

/**
 * POST /api/register
 * Registers a new user with email and password
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json()

    // Validate request body structure
    if (!validateUserData(body)) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: {
            message: 'Invalid input data',
            field: 'general',
          },
        },
        { status: 400 }
      )
    }

    // Data normalization: trim and lowercase where appropriate
    const firstName = body.firstName.trim()
    const lastName = body.lastName.trim()
    const email = body.email.trim().toLowerCase() // Email normalization for consistency
    const password = body.password // Do NOT trim password - preserve exact user input

    if (USE_MOCK_DB) {
      // Mock database operations (development/testing mode)

      // Check for duplicate email (using normalized email)
      const existingUser = mockUsers.find(user => user.email === email)
      if (existingUser) {
        return NextResponse.json<ApiErrorResponse>(
          {
            success: false,
            error: {
              message: 'Email address is already registered',
              field: 'email',
            },
          },
          { status: 409 }
        )
      }

      // Hash password using bcrypt (industry-standard for password security)
      const saltRounds = 12 // Higher rounds = more secure but slower
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      // Create new user with normalized data
      const newUser: MockUser = {
        id: nextId++,
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
      }

      mockUsers.push(newUser)

      return NextResponse.json<ApiSuccessResponse>(
        {
          success: true,
          message: 'User registered successfully',
          data: {
            user: {
              id: newUser.id,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              email: newUser.email,
              createdAt: newUser.createdAt,
            },
          },
        },
        { status: 201 }
      )
    } else {
      // PostgreSQL database operations (production mode)

      if (!pool) {
        return NextResponse.json<ApiErrorResponse>(
          {
            success: false,
            error: {
              message: 'Database not available',
              field: 'general',
            },
          },
          { status: 503 }
        )
      }

      // Check for duplicate email using parameterized query (prevents SQL injection)
      const existingUserQuery = 'SELECT id FROM users WHERE email = $1'
      const existingUserResult = await pool.query(existingUserQuery, [email])

      if (existingUserResult.rows.length > 0) {
        return NextResponse.json<ApiErrorResponse>(
          {
            success: false,
            error: {
              message: 'Email address is already registered',
              field: 'email',
            },
          },
          { status: 409 }
        )
      }

      // Hash password using bcrypt (industry-standard for password security)
      const saltRounds = 12 // Higher rounds = more secure but slower
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      // Insert new user with parameterized query (prevents SQL injection)
      const insertQuery = `
        INSERT INTO users (first_name, last_name, email, password_hash, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, first_name, last_name, email, created_at
      `

      const insertResult = await pool.query(insertQuery, [
        firstName,
        lastName,
        email,
        hashedPassword,
      ])

      const newUser = insertResult.rows[0]

      return NextResponse.json<ApiSuccessResponse>(
        {
          success: true,
          message: 'User registered successfully',
          data: {
            user: {
              id: newUser.id,
              firstName: newUser.first_name,
              lastName: newUser.last_name,
              email: newUser.email,
              createdAt: newUser.created_at,
            },
          },
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Registration error:', error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: {
            message: 'Invalid JSON in request body',
            field: 'general',
          },
        },
        { status: 400 }
      )
    }

    // Handle database connection errors (PostgreSQL mode only)
    if (!USE_MOCK_DB && error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json<ApiErrorResponse>(
          {
            success: false,
            error: {
              message: 'Database connection failed',
              field: 'general',
            },
          },
          { status: 503 }
        )
      }
    }

    // Handle bcrypt errors
    if (error instanceof Error && error.message.includes('bcrypt')) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: {
            message: 'Password encryption failed',
            field: 'general',
          },
        },
        { status: 500 }
      )
    }

    // Generic fallback for unexpected errors
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: {
          message: 'Internal server error',
          field: 'general',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/register
 * Returns 405 Method Not Allowed
 */
export async function GET(): Promise<NextResponse<ApiErrorResponse>> {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        message: 'Method not allowed. Use POST to register.',
        field: 'general',
      },
    },
    { status: 405 }
  )
}
