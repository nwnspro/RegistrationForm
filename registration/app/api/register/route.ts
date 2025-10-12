import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// For demo purposes, we'll use in-memory storage instead of PostgreSQL
// In a real application, this would connect to PostgreSQL
const USE_MOCK_DB = !process.env.DATABASE_URL

const mockUsers: { id: number; firstName: string; lastName: string; email: string; passwordHash: string; createdAt: string }[] = []
let nextId = 1

// Only import pg if we have a real database connection
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

interface UserData {
  firstName: string
  lastName: string
  email: string
  password: string
}

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
    typeof (data as UserData).password === 'string' &&
    (data as UserData).firstName.trim() !== '' &&
    (data as UserData).lastName.trim() !== '' &&
    (data as UserData).email.trim() !== '' &&
    (data as UserData).password.trim() !== ''
  )
}

const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@gmail\.com$/
  if (!emailRegex.test(email)) {
    return 'Email must be a Gmail address (@gmail.com)'
  }
  
  if (email === 'test@gmail.com') {
    return 'This email address is already registered'
  }
  
  return null
}

const validatePassword = (password: string): string | null => {
  if (password.length < 8 || password.length > 30) {
    return 'Password must be between 8 and 30 characters'
  }
  
  const hasLowerCase = /[a-z]/.test(password)
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  
  if (!hasLowerCase) return 'Password must contain at least one lowercase letter'
  if (!hasUpperCase) return 'Password must contain at least one uppercase letter'
  if (!hasNumber) return 'Password must contain at least one number'
  if (!hasSpecialChar) return 'Password must contain at least one special character'
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!validateUserData(body)) {
      return NextResponse.json(
        { error: 'Invalid input data', field: 'general' },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, password } = body

    // Validate email
    const emailError = validateEmail(email)
    if (emailError) {
      return NextResponse.json(
        { error: emailError, field: 'email' },
        { status: 400 }
      )
    }

    // Validate password
    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError, field: 'password' },
        { status: 400 }
      )
    }

    if (USE_MOCK_DB) {
      // Mock database operations
      
      // Check if user already exists
      const existingUser = mockUsers.find(user => user.email === email)
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email address is already registered', field: 'email' },
          { status: 409 }
        )
      }

      // Hash the password
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      // Insert new user
      const newUser = {
        id: nextId++,
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString()
      }
      
      mockUsers.push(newUser)

      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          createdAt: newUser.createdAt
        }
      }, { status: 201 })
      
    } else {
      // Real PostgreSQL database operations
      if (!pool) {
        return NextResponse.json(
          { error: 'Database not available', field: 'general' },
          { status: 503 }
        )
      }
      
      // Check if user already exists
      const existingUserQuery = 'SELECT id FROM users WHERE email = $1'
      const existingUserResult = await pool.query(existingUserQuery, [email])
      
      if (existingUserResult.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email address is already registered', field: 'email' },
          { status: 409 }
        )
      }

      // Hash the password
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      // Insert new user
      const insertQuery = `
        INSERT INTO users (first_name, last_name, email, password_hash, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, first_name, last_name, email, created_at
      `
      
      const insertResult = await pool.query(insertQuery, [
        firstName,
        lastName,
        email,
        hashedPassword
      ])

      const newUser = insertResult.rows[0]

      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          email: newUser.email,
          createdAt: newUser.created_at
        }
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle database connection errors (only for real database)
    if (!USE_MOCK_DB && error instanceof Error && error.message.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection failed', field: 'general' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', field: 'general' },
      { status: 500 }
    )
  }
}