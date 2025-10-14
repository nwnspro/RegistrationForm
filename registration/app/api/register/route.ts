/**
 * User Registration API Route
 * Using Supabase client for database operations
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/db"; // or '@/lib/supabase' depending on where you put it

// Request body structure
interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// User object returned in successful responses
interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

// API response interfaces
interface ApiSuccessResponse {
  success: true;
  message: string;
  data: {
    user: UserResponse;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    field: string;
  };
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

/**
 * Type guard to validate incoming request body structure
 */
const validateUserData = (data: unknown): data is UserData => {
  return (
    data !== null &&
    typeof data === "object" &&
    "firstName" in data &&
    "lastName" in data &&
    "email" in data &&
    "password" in data &&
    typeof (data as UserData).firstName === "string" &&
    typeof (data as UserData).lastName === "string" &&
    typeof (data as UserData).email === "string" &&
    typeof (data as UserData).password === "string"
  );
};

/**
 * POST /api/register
 * Registers a new user with email and password
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  console.log(`\n📥 [${requestId}] New registration request`);

  try {
    const body = await request.json();
    console.log(`📋 [${requestId}] Request body:`, {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password ? "***" + body.password.slice(-3) : undefined,
    });

    // Validate request body structure
    if (!validateUserData(body)) {
      console.log(`❌ [${requestId}] Validation failed: Invalid input data`);

      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: {
            message: "Invalid input data",
            field: "general",
          },
        },
        { status: 400 }
      );
    }

    // Data normalization
    const firstName = body.firstName.trim();
    const lastName = body.lastName.trim();
    const email = body.email.trim().toLowerCase();
    const password = body.password;

    console.log(`🔄 [${requestId}] Normalized data - Email: ${email}`);
    console.log(`🗄️  [${requestId}] Database mode: Supabase`);

    // Check for duplicate email
    console.log(`🔍 [${requestId}] Checking for duplicate email...`);
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle(); // Use maybeSingle() instead of single() - doesn't throw error if no match

    if (existingUser) {
      console.log(`⚠️  [${requestId}] Duplicate email found: ${email}`);

      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: {
            message: "Email address is already registered",
            field: "email",
          },
        },
        { status: 409 }
      );
    }

    // Hash password
    console.log(`🔐 [${requestId}] Hashing password...`);
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(`✅ [${requestId}] Password hashed successfully`);

    // Insert new user
    console.log(`💾 [${requestId}] Inserting user into Supabase...`);
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        password_hash: hashedPassword,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`❌ [${requestId}] Insert error:`, insertError);
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: {
            message: "Failed to create user",
            field: "general",
          },
        },
        { status: 500 }
      );
    }

    console.log(`✅ [${requestId}] User inserted successfully!`);
    console.log(
      `👤 [${requestId}] New user ID: ${newUser.id}, Email: ${newUser.email}`
    );

    return NextResponse.json<ApiSuccessResponse>(
      {
        success: true,
        message: "User registered successfully",
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
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: {
            message: "Invalid JSON in request body",
            field: "general",
          },
        },
        { status: 400 }
      );
    }

    // Handle bcrypt errors
    if (error instanceof Error && error.message.includes("bcrypt")) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: {
            message: "Password encryption failed",
            field: "general",
          },
        },
        { status: 500 }
      );
    }

    // Generic fallback
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: {
          message: "Internal server error",
          field: "general",
        },
      },
      { status: 500 }
    );
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
        message: "Method not allowed. Use POST to register.",
        field: "general",
      },
    },
    { status: 405 }
  );
}
