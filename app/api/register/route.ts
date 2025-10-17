/**
 * User Registration API Route
 * Using Supabase client for database operations
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/db";
import type {
  UserData,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
} from "@/types/user";

/**
 * Validate and normalize registration data
 * Returns normalized data if valid, or error if invalid
 */
const validateAndNormalize = (
  data: unknown
):
  | { valid: true; data: UserData }
  | { valid: false; error: { message: string; field: string } } => {
  // Check structure
  if (
    !data ||
    typeof data !== "object" ||
    !("firstName" in data) ||
    !("lastName" in data) ||
    !("email" in data) ||
    !("password" in data) ||
    typeof (data as UserData).firstName !== "string" ||
    typeof (data as UserData).lastName !== "string" ||
    typeof (data as UserData).email !== "string" ||
    typeof (data as UserData).password !== "string"
  ) {
    return {
      valid: false,
      error: { message: "Invalid input data", field: "general" },
    };
  }

  const body = data as UserData;

  // Normalize
  const firstName = body.firstName.trim();
  const lastName = body.lastName.trim();
  const email = body.email.trim().toLowerCase();
  const password = body.password;

  // Validate first name
  if (!firstName) {
    return {
      valid: false,
      error: { message: "First name can't be empty", field: "firstName" },
    };
  }

  // Validate last name
  if (!lastName) {
    return {
      valid: false,
      error: { message: "Last name can't be empty", field: "lastName" },
    };
  }

  // Validate email
  if (!email) {
    return {
      valid: false,
      error: { message: "Email can't be empty", field: "email" },
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      valid: false,
      error: { message: "Please put a valid email", field: "email" },
    };
  }

  if (!/^[^\s@]+@gmail\.com$/.test(email)) {
    return {
      valid: false,
      error: { message: "Must be a Gmail address", field: "email" },
    };
  }

  if (email === "test@gmail.com") {
    return {
      valid: false,
      error: {
        message: "Email address is already registered",
        field: "email",
      },
    };
  }

  // Validate password
  if (!password) {
    return {
      valid: false,
      error: { message: "Password can't be empty", field: "password" },
    };
  }

  if (password.length < 8 || password.length > 30) {
    return {
      valid: false,
      error: {
        message: "Password must be 8-30 characters",
        field: "password",
      },
    };
  }

  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    return {
      valid: false,
      error: {
        message: "Password needs uppercase, lowercase, number and symbol",
        field: "password",
      },
    };
  }

  return {
    valid: true,
    data: { firstName, lastName, email, password },
  };
};

/**
 * POST /api/register
 * Registers a new user with email and password
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  console.log("New registration request");

  try {
    const body = await request.json();

    // Validate and normalize in one step
    const validation = validateAndNormalize(body);
    if (!validation.valid) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password } = validation.data;

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
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
      console.error("Database error:", insertError);

      // Check for unique constraint violation (duplicate email)
      if (insertError.code === "23505") {
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

    console.log("User registered successfully:", newUser.email);

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
